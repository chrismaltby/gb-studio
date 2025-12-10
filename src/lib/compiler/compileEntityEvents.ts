import ScriptBuilder, {
  ScriptBuilderEntity,
  ScriptBuilderEntityType,
  ScriptBuilderOptions,
  ScriptOutput,
} from "./scriptBuilder";
import { PrecompiledScene } from "./generateGBVMData";
import { ScriptEventHandlers } from "lib/scriptEventsHandlers/handlerTypes";
import { LATEST_PROJECT_VERSION } from "lib/project/migration/migrateProjectResources";
import { ScriptEvent, SpriteModeSetting } from "shared/lib/resources/types";

const STRING_NOT_FOUND = "STRING_NOT_FOUND";
const VARIABLE_NOT_FOUND = "VARIABLE_NOT_FOUND";

type ScriptLocation = {
  actor?: string | undefined;
  scriptType: "scene" | "actor" | "trigger" | "customEvent";
  scene: string;
};

type CompileEntityEventsOptions = Partial<ScriptBuilderOptions> & {
  scriptEventHandlers: ScriptEventHandlers;
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
  debugEnabled: boolean;
  warnings: (msg: string) => void;
};

const compileEntityEvents = (
  scriptSymbolName: string,
  input: ScriptEvent[] = [],
  options: CompileEntityEventsOptions,
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

  const location: ScriptLocation = {
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

  const helpers = {
    ...options,
    scriptSymbolName,
    compileEvents: (
      scriptBuilder: ScriptBuilder,
      childInput: ScriptEvent[],
    ) => {
      compileEventsWithScriptBuilder(
        scriptBuilder,
        childInput,
        location,
        warnings,
      );
    },
  };

  const scriptBuilder = new ScriptBuilder(output, helpers);

  const loopId = loop ? scriptBuilder.getNextLabel() : "";

  if (loop && input.length > 0) {
    scriptBuilder._label(loopId);
  }

  compileEventsWithScriptBuilder(scriptBuilder, input, location, warnings);

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
      `Compiling failed with error "${e}". ${JSON.stringify(location)}`,
    );
  }
};

export const compileEventsWithScriptBuilder = (
  scriptBuilder: ScriptBuilder,
  subInput: ScriptEvent[] = [],
  location: ScriptLocation,
  warnings: (msg: string) => void,
) => {
  const { scriptEventHandlers, scriptSymbolName, disabledSceneTypeIds } =
    scriptBuilder.options;

  for (let i = 0; i < subInput.length; i++) {
    const command = subInput[i].command;
    if (subInput[i].args?.__comment) {
      // Skip commented events
      // eslint-disable-next-line no-continue
      continue;
    }
    if (scriptEventHandlers[command]) {
      scriptBuilder.addDebugSymbol(scriptSymbolName, subInput[i].id);

      try {
        if (
          scriptEventHandlers[command].sceneTypes &&
          scriptEventHandlers[command].sceneTypes.every((t) =>
            disabledSceneTypeIds.includes(t),
          )
        ) {
          // Skip events where all scene types are disabled
          continue;
        }
        scriptEventHandlers[command]?.compile(
          { ...subInput[i].args, ...subInput[i].children },
          {
            LATEST_PROJECT_VERSION: LATEST_PROJECT_VERSION,
            ...scriptBuilder.options,
            ...scriptBuilder,
            scriptSymbolName,
            event: subInput[i],
          },
        );
      } catch (e) {
        console.error(e);
        throw new Error(
          `Compiling "${command}" failed with error "${e}". ${JSON.stringify(
            location,
          )}`,
        );
      }
      if (scriptEventHandlers[command]?.isConditional) {
        scriptBuilder.addDebugEndSymbol(scriptSymbolName, subInput[i].id);
      }
    } else if (command === "INTERNAL_SET_CONTEXT") {
      const args = subInput[i].args ?? {};
      scriptBuilder.options.entity = args.entity as ScriptBuilderEntity;
      scriptBuilder.options.entityType =
        args.entityType as ScriptBuilderEntityType;
      scriptBuilder.options.entityScriptKey = String(args.scriptKey);
    } else if (command === "INTERNAL_IF_PARAM") {
      const args = subInput[i].args;
      scriptBuilder.ifParamValue(
        args?.parameter as number,
        args?.value as number,
        subInput[i]?.children?.true,
      );
    } else if (command === "INTERNAL_SET_SPRITE_MODE") {
      const args = subInput[i].args;
      scriptBuilder.setSpriteMode(args?.mode as SpriteModeSetting);
    } else if (command !== "EVENT_END") {
      warnings(
        `No compiler for command "${command}". Are you missing a plugin? ${JSON.stringify(
          location,
        )}`,
      );
    }
  }
};

export default compileEntityEvents;

export { STRING_NOT_FOUND, VARIABLE_NOT_FOUND };
