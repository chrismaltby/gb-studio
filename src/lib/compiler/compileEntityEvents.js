import ScriptBuilder from "./scriptBuilder";

const STRING_NOT_FOUND = "STRING_NOT_FOUND";
const VARIABLE_NOT_FOUND = "VARIABLE_NOT_FOUND";

const compileEntityEvents = (scriptName, input = [], options = {}) => {
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
      actor: entity.name || `Actor ${entityIndex + 1}`,
    }),
    ...(entityType === "trigger" && {
      actor: entity.name || `Trigger ${entityIndex + 1}`,
    }),
  };

  let hasInit = false;

  const compileEventsWithScriptBuilder = (
    scriptBuilder,
    subInput = [],
    isBranch = false
  ) => {
    // eslint-disable-next-line global-require
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const events = require("../events").default;
    for (let i = 0; i < subInput.length; i++) {
      const command = subInput[i].command;
      if (subInput[i].args && subInput[i].args.__comment) {
        // Skip commented events
        // eslint-disable-next-line no-continue
        continue;
      }
      if (events[command]) {
        try {
          events[command].compile(
            { ...subInput[i].args, ...subInput[i].children },
            {
              ...options,
              ...scriptBuilder,
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
        const args = subInput[i].args;
        scriptBuilder.options.entity = args.entity;
        scriptBuilder.options.entityType = args.entityType;
        scriptBuilder.options.entityId = args.entityId;
      } else if (command === "INTERNAL_IF_PARAM") {
        const args = subInput[i].args;
        scriptBuilder.ifParamValue(
          args.parameter,
          args.value,
          subInput[i].children.true
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
    compileEvents: (scriptBuilder, childInput) => {
      compileEventsWithScriptBuilder(scriptBuilder, childInput, true);
    },
  };

  const scriptBuilder = new ScriptBuilder(output, helpers);

  const loopId = loop ? scriptBuilder.getNextLabel() : "";

  if (loop && input.length > 0) {
    scriptBuilder._label(loopId);
  }

  compileEventsWithScriptBuilder(scriptBuilder, input, branch);

  try {
    if (!branch) {
      if (loop && input.length > 0) {
        scriptBuilder.nextFrameAwait();
        scriptBuilder._jump(loopId);
      }
      if (isFunction) {
        if (scriptBuilder.includeActor) {
          scriptBuilder.stackPtr += 4;
          scriptBuilder._stackPop(4);
        }
        scriptBuilder.returnFar();
      } else {
        scriptBuilder.scriptEnd();
      }
    }

    return scriptBuilder.toScriptString(scriptName, lock);
  } catch (e) {
    throw new Error(
      `Compiling failed with error "${e}". ${JSON.stringify(location)}`
    );
  }
};

export default compileEntityEvents;

export { STRING_NOT_FOUND, VARIABLE_NOT_FOUND };
