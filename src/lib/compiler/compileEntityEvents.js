import { EVENT_FADE_IN } from "./eventTypes";
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
    init,
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

  let globalHasInit = false;

  const compileEventsWithScriptBuilder = (
    scriptBuilder,
    subInput = [],
    isBranch = false
  ) => {
    let hasInit = false;

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
        if (
          init &&
          !hasInit &&
          !globalHasInit &&
          events[command].waitUntilAfterInitFade
        ) {
          // Found an event that cannot happen before init fade in
          if (i > 0 || isBranch) {
            // Force await the next frame if not the first command
            // at top level so that actors update before fade in occurs
            scriptBuilder.nextFrameAwait();
          }
          if (command !== EVENT_FADE_IN) {
            scriptBuilder.fadeIn();
          }
          hasInit = true;
          globalHasInit = true;
        }
        try {
          events[command].compile(
            { ...subInput[i].args, ...subInput[i].children },
            {
              ...options,
              ...scriptBuilder,
              event: subInput[i],
            }
          );
          if (!isBranch && !hasInit && globalHasInit) {
            // A branch caused a fade in, but hasn't faded in globally yet
            // Need to force fade in case one path of branch didn't already fade
            scriptBuilder.nextFrameAwait();
            scriptBuilder.fadeIn();
            hasInit = true;
          }
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
    scriptBuilder.labelDefine(loopId);
  }

  compileEventsWithScriptBuilder(scriptBuilder, input, branch);

  try {
    if (!branch) {
      if (loop && input.length > 0) {
        scriptBuilder.nextFrameAwait();
        scriptBuilder.labelGoto(loopId);
      }

      if (init && !globalHasInit) {
        // No part of script caused a fade in so do this
        // before ending the script
        scriptBuilder.nextFrameAwait();
        scriptBuilder.fadeIn();
        globalHasInit = true;
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
