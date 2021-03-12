import ScriptBuilder from "./scriptBuilder2";
// import { isVariableField, isPropertyField } from "../helpers/eventSystem";

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
    const events = require("../events").default;
    for (let i = 0; i < subInput.length; i++) {
      const command = subInput[i].command;
      if (subInput[i].args && subInput[i].args.__comment) {
        // Skip commented events
        // eslint-disable-next-line no-continue
        continue;
      }
      if (events[command]) {
        if (init && !hasInit && !events[command].allowedBeforeInitFade) {
          // Found an event that cannot happen before init fade in
          scriptBuilder.nextFrameAwait();
          scriptBuilder.fadeIn();
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

  if (loop && input.length > 1) {
    scriptBuilder.labelDefine(loopId);
  }

  compileEventsWithScriptBuilder(scriptBuilder, input, branch);

  try {
    if (!branch) {
      if (loop && input.length > 1) {
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

      scriptBuilder.scriptEnd();

      if (scriptBuilder.byteSize > 16383) {
        warnings(
          `This script is too big for 1 bank, was ${
            output.length
          } bytes, must be under 16384.
          ${JSON.stringify(location)}
          `
        );
        warnings(
          "Try splitting this script across multiple actors with *Actor invoke*."
        );
      }
    }

    return scriptBuilder.toScriptString(scriptName, lock);
  } catch (e) {
    throw new Error(
      `Compiling failed with error "${e}". ${JSON.stringify(location)}`
    );
  }

  return "";
};

export default compileEntityEvents;

export { STRING_NOT_FOUND, VARIABLE_NOT_FOUND };
