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

  const compileEventsWithScriptBuilder = (scriptBuilder, subInput = []) => {
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
        // @todo - move this to compileData
        // if (command === "EVENT_PLAYER_SET_SPRITE") {
        //   if (input[i].args && input[i].args.spriteSheetId) {
        //     const sprite = options.sprites.find(
        //       (s) => s.id === input[i].args.spriteSheetId
        //     );
        //     if (sprite && sprite.numFrames > 6) {
        //       warnings(
        //         `Used "Set Player Sprite Sheet" event with a sprite sheet containing more than 6 frames. This may cause graphics corruption. ${JSON.stringify(
        //           {
        //             ...location,
        //             filename: sprite.filename,
        //           }
        //         )}`
        //       );
        //     }
        //   }
        // }
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
      } else if (command !== "EVENT_END") {
        warnings(
          `No compiler for command "${command}". Are you missing a plugin? ${JSON.stringify(
            location
          )}`
        );
      }
    }
  }

  const helpers = {
    ...options,
    compileEvents: (scriptBuilder, childInput) => {
      compileEventsWithScriptBuilder(scriptBuilder, childInput);
    }
  };

  const scriptBuilder = new ScriptBuilder(output, helpers);

  const loopId = loop ? scriptBuilder.getNextLabel() : "";

  if (loop && input.length > 1) {
    scriptBuilder.labelDefine(loopId);
  }

  compileEventsWithScriptBuilder(scriptBuilder, input);
  
  try {
    if (!branch) {
      if (loop && input.length > 1) {
        scriptBuilder.nextFrameAwait();
        scriptBuilder.labelGoto(loopId);
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

    return scriptBuilder.toScriptString(scriptName);
  } catch (e) {
    throw new Error(
      `Compiling failed with error "${e}". ${JSON.stringify(
        location
      )}`
    );
  }

  return "";

};

export default compileEntityEvents;

export { STRING_NOT_FOUND, VARIABLE_NOT_FOUND };
