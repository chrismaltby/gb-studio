import type { ScriptEventDenormalized } from "shared/lib/entities/entitiesTypes";
import ScriptBuilder, {
  ScriptBuilderEntity,
  ScriptBuilderEntityType,
  ScriptBuilderOptions,
  ScriptOutput,
} from "./scriptBuilder";
import { PrecompiledScene } from "./compileData2";
import { ScriptEventHandlersLookup } from "lib/project/loadScriptEvents";

const STRING_NOT_FOUND = "STRING_NOT_FOUND";
const VARIABLE_NOT_FOUND = "VARIABLE_NOT_FOUND";

type CompileEntityEventsOptions = Partial<ScriptBuilderOptions> & {
  scriptEventHandlersLookup: ScriptEventHandlersLookup;
  output: ScriptOutput;
  branch: boolean;
  loop: boolean;
  lock: boolean;
  isFunction: boolean;
  scene: PrecompiledScene;
  sceneIndex: number;
  entity?: ScriptBuilderEntity;
  entityType: string;
  entityIndex: number;
  warnings: (msg: string) => void;
};

const compileEntityEvents = (
  scriptSymbolName: string,
  input: ScriptEventDenormalized[] = [],
  options: CompileEntityEventsOptions
) => {
  const {
    output = [],
    branch = false,
    scene,
    sceneIndex,
    entity,
    entityType,
    entityIndex,
    warnings,
    loop,
    lock,
    isFunction,
  } = options;

  const location = {
    ...(scene && {
      scene: scene.name || `Scene ${sceneIndex + 1}`,
    }),
    ...(entityType && {
      scriptType: entityType,
    }),
    ...(entityType === "actor" && {
      actor: entity?.name || `Actor ${entityIndex + 1}`,
    }),
    ...(entityType === "trigger" && {
      actor: entity?.name || `Trigger ${entityIndex + 1}`,
    }),
  };

  const compileEventsWithScriptBuilder = (
    scriptBuilder: ScriptBuilder,
    subInput: ScriptEventDenormalized[] = []
  ) => {
    const scriptEventHandlersLookup = options.scriptEventHandlersLookup;

    for (let i = 0; i < subInput.length; i++) {
      const command = subInput[i].command;
      if (subInput[i].args?.__comment) {
        // Skip commented events
        // eslint-disable-next-line no-continue
        continue;
      }
      if (scriptEventHandlersLookup[command]) {
        try {
          scriptEventHandlersLookup[command]?.compile(
            { ...subInput[i].args, ...subInput[i].children },
            {
              ...options,
              ...scriptBuilder,
              scriptSymbolName,
              event: subInput[i],
            }
          );
        } catch (e) {
          console.error(e);
          throw new Error(
            `Compiling "${command}" failed with error "${e}". ${JSON.stringify(
              location
            )}`
          );
        }
      } else if (command === "INTERNAL_SET_CONTEXT") {
        const args = subInput[i].args ?? {};
        scriptBuilder.options.entity = args.entity as ScriptBuilderEntity;
        scriptBuilder.options.entityType =
          args.entityType as ScriptBuilderEntityType;
      } else if (command === "INTERNAL_IF_PARAM") {
        const args = subInput[i].args;
        scriptBuilder.ifParamValue(
          args?.parameter as number,
          args?.value as number,
          subInput[i]?.children?.true
        );
      } else if (command !== "EVENT_END") {
        warnings(
          `No compiler for command "${command}". Are you missing a plugin? ${JSON.stringify(
            location
          )}`
        );
      }
    }
  };

  const helpers = {
    ...options,
    compileEvents: (
      scriptBuilder: ScriptBuilder,
      childInput: ScriptEventDenormalized[]
    ) => {
      compileEventsWithScriptBuilder(scriptBuilder, childInput);
    },
  };

  const scriptBuilder = new ScriptBuilder(output, helpers);

  const loopId = loop ? scriptBuilder.getNextLabel() : "";

  if (loop && input.length > 0) {
    scriptBuilder._label(loopId);
  }

  compileEventsWithScriptBuilder(scriptBuilder, input);

  try {
    if (!branch) {
      scriptBuilder._packLocals();
      if (loop && input.length > 0 && output.length > 1) {
        scriptBuilder.idle();
        scriptBuilder._jump(loopId);
      }
      if (isFunction) {
        scriptBuilder.unreserveLocals();
        scriptBuilder.returnFar();
      } else {
        scriptBuilder.scriptEnd();
      }
    }

    return scriptBuilder.toScriptString(scriptSymbolName, lock);
  } catch (e) {
    throw new Error(
      `Compiling failed with error "${e}". ${JSON.stringify(location)}`
    );
  }
};

export default compileEntityEvents;

export { STRING_NOT_FOUND, VARIABLE_NOT_FOUND };
