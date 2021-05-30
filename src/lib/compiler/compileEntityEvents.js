import ScriptBuilder from "./scriptBuilder";
import { isVariableField, isPropertyField } from "../helpers/eventSystem";

const STRING_NOT_FOUND = "STRING_NOT_FOUND";
const VARIABLE_NOT_FOUND = "VARIABLE_NOT_FOUND";

// @todo
// Maybe have list of script commands
// Mark which ones can appear in ui dropdowns
// and what the args are for each (to build forms)
// and what the command code is?

const compileEntityEvents = (input = [], options = {}) => {
  const events = require("../events").default;
  
  const {
    output = [],
    branch = false,
    scene,
    sceneIndex,
    entity,
    entityType,
    entityIndex,
    warnings,
    loop
  } = options;
  const helpers = {
    ...options,
    isVariableField,
    isPropertyField,
    compileEvents: (childInput, eventOutput = null, eventBranch = true) =>
      compileEntityEvents(childInput, {
        ...options,
        output: eventOutput || output,
        branch: eventBranch,
        labels: eventBranch ? options.labels : {}
      }),
  };
  const location = Object.assign(
    {},
    scene && {
      scene: scene.name || `Scene ${sceneIndex + 1}`,
    },
    entityType && {
      scriptType: entityType,
    },
    entityType === "actor" && {
      actor: entity.name || `Actor ${entityIndex + 1}`,
    },
    entityType === "trigger" && {
      actor: entity.name || `Trigger ${entityIndex + 1}`,
    }
  );

  const scriptBuilder = new ScriptBuilder(output, helpers);

  const loopId = `loop_${Math.random()}`;

  if(loop && input.length > 1) {
    scriptBuilder.labelDefine(loopId);
  }

  for (let i = 0; i < input.length; i++) {
    const command = input[i].command;
    if (input[i].args && input[i].args.__comment) {
      // Skip commented events
      // eslint-disable-next-line no-continue
      continue;
    }
    if (events[command]) {
      if (command === "EVENT_PLAYER_SET_SPRITE") {
        if (input[i].args && input[i].args.spriteSheetId) {
          const sprite = options.sprites.find(
            (s) => s.id === input[i].args.spriteSheetId
          );
          if (sprite && sprite.numFrames > 6) {
            warnings(
              `Used "Set Player Sprite Sheet" event with a sprite sheet containing more than 6 frames. This may cause graphics corruption. ${JSON.stringify({
                ...location,
                filename: sprite.filename
              })}`
            );
          }
        }
      }      
      try {
        events[command].compile(
          { ...input[i].args, ...input[i].children },
          {
            ...helpers,
            ...scriptBuilder,
            event: input[i],
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

  if (!branch) {

    if(loop && input.length > 1) {
      scriptBuilder.nextFrameAwait();
      scriptBuilder.labelGoto(loopId);    
    }
    output.push(0); // End script

    if (output.length > 16383) {
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

    for (let oi = 0; oi < output.length; oi++) {
      if (typeof output[oi] === "string" || output[oi] < 0) {
        const intCmd = Number(output[oi]);
        if (Number.isInteger(intCmd) && intCmd >= 0) {
          // If string was equivent to position integer then replace it
          // in output otherwise
          output[oi] = intCmd;
        } else if (
          !(
            typeof output[oi] === "string" &&
            output[oi].startsWith("__REPLACE:")
          )
        ) {
          let reason = "";
          if (String(output[oi]).startsWith("goto:")) {
            reason = "Did you remember to define a label in the script?";
          }

          throw new Error(
            `Found invalid command "${output[oi]}". ${reason} ${JSON.stringify(
              location
            )}`
          );
        }
      }
    }
  }

  return output;
};

export default compileEntityEvents;

export { STRING_NOT_FOUND, VARIABLE_NOT_FOUND };
