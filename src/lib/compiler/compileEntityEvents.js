import ScriptBuilder from "./scriptBuilder";
import events from "../events";

const STRING_NOT_FOUND = "STRING_NOT_FOUND";
const VARIABLE_NOT_FOUND = "VARIABLE_NOT_FOUND";

// @todo
// Maybe have list of script commands
// Mark which ones can appear in ui dropdowns
// and what the args are for each (to build forms)
// and what the command code is?

const CMD_LOOKUP = {
  END: 0x00, // done
  TEXT: 0x01, // - done
  JUMP: 0x02,
  IF_TRUE: 0x03,
  // script_cmd_unless_variable: 0x04,
  SET_TRUE: 0x05,
  SET_FALSE: 0x06,
  ACTOR_SET_DIRECTION: 0x07,
  ACTOR_SET_ACTIVE: 0x08,
  CAMERA_MOVE_TO: 0x09,
  CAMERA_LOCK: 0x0a,
  WAIT: 0x0b,
  FADE_OUT: 0x0c,
  FADE_IN: 0x0d,
  SWITCH_SCENE: 0x0e,
  ACTOR_SET_POSITION: 0x0f,
  ACTOR_MOVE_TO: 0x10,
  SHOW_SPRITES: 0x11,
  HIDE_SPRITES: 0x12,
  PLAYER_SET_SPRITE: 0x13,
  ACTOR_SHOW: 0x14,
  ACTOR_HIDE: 0x15,
  ACTOR_EMOTE: 0x16,
  CAMERA_SHAKE: 0x17,
  RETURN_TO_TITLE: 0x18,
  OVERLAY_SHOW: 0x19,
  OVERLAY_HIDE: 0x1a,
  OVERLAY_SET_POSITION: 0x1b,
  OVERLAY_MOVE_TO: 0x1c,
  AWAIT_INPUT: 0x1d,
  MUSIC_PLAY: 0x1e,
  MUSIC_STOP: 0x1f,
  RESET_VARIABLES: 0x20,
  NEXT_FRAME: 0x21,
  INC_VALUE: 0x22,
  DEC_VALUE: 0x23,
  SET_VALUE: 0x24,
  IF_VALUE: 0x25,
  IF_INPUT: 0x26,
  CHOICE: 0x27,
  ACTOR_PUSH: 0x28,
  IF_ACTOR_AT_POSITION: 0x29,
  LOAD_DATA: 0x2a,
  SAVE_DATA: 0x2b,
  CLEAR_DATA: 0x2c,
  IF_SAVED_DATA: 0x2d,
  IF_ACTOR_DIRECTION: 0x2e,
  SET_RANDOM_VALUE: 0x2f,
  ACTOR_GET_POSITION: 0x30,
  ACTOR_SET_POSITION_TO_VALUE: 0x31,
  ACTOR_MOVE_TO_VALUE: 0x32,
  ACTOR_MOVE_RELATIVE: 0x33,
  ACTOR_SET_POSITION_RELATIVE: 0x34,
  MATH_ADD: 0x35,
  MATH_SUB: 0x36,
  MATH_MUL: 0x37,
  MATH_DIV: 0x38,
  MATH_MOD: 0x39,
  MATH_ADD_VALUE: 0x3a,
  MATH_SUB_VALUE: 0x3b,
  MATH_MUL_VALUE: 0x3c,
  MATH_DIV_VALUE: 0x3d,
  MATH_MOD_VALUE: 0x3e,
  COPY_VALUE: 0x3f,
  IF_VALUE_COMPARE: 0x40,
  LOAD_VECTORS: 0x41,
  ACTOR_SET_MOVE_SPEED: 0x42,
  ACTOR_SET_ANIM_SPEED: 0x43,
  TEXT_SET_ANIM_SPEED: 0x44,
  SCENE_PUSH_STATE: 0x45,
  SCENE_POP_STATE: 0x46,
  ACTOR_INVOKE: 0x47,
  STACK_PUSH: 0x48,
  STACK_POP: 0x49,
  SCENE_STATE_RESET: 0x4a,
  SCENE_POP_ALL_STATE: 0x4b,
  SET_INPUT_SCRIPT: 0x4c,
  REMOVE_INPUT_SCRIPT: 0x4d,
  ACTOR_SET_FRAME: 0x4e,
  ACTOR_SET_FLIP: 0x4f,
  TEXT_MULTI: 0x50
};

const compileEntityEvents = (input = [], options = {}) => {
  const {
    output = [],
    branch = false,
    scene,
    sceneIndex,
    entity,
    entityType,
    entityIndex
  } = options;
  const helpers = {
    ...options,
    compileEvents: (childInput, eventOutput = null, eventBranch = true) =>
      compileEntityEvents(childInput, {
        ...options,
        output: eventOutput || output,
        branch: eventBranch
      })
  };
  const location = Object.assign(
    {},
    scene && {
      scene: scene.name || `Scene ${sceneIndex + 1}`
    },
    entityType && {
      scriptType: entityType
    },
    entityType === "actor" && {
      actor: entity.name || `Actor ${entityIndex + 1}`
    },
    entityType === "trigger" && {
      actor: entity.name || `Trigger ${entityIndex + 1}`
    }
  );

  const scriptBuilder = new ScriptBuilder(output, helpers);

  for (let i = 0; i < input.length; i++) {
    const command = input[i].command;
    if (events[command]) {
      try {
        events[command].compile(
          { ...input[i].args, ...input[i].children },
          {
            ...helpers,
            ...scriptBuilder,
            event: input[i]
          }
        );
      } catch (e) {
        throw new Error(
          `Compiling "${command}" failed with error "${e}". ${JSON.stringify(
            location
          )}`
        );
      }
    } else if (command !== "EVENT_END") {
      throw new Error(
        `No compiler for command "${command}". Are you missing a plugin? ${JSON.stringify(
          location
        )}`
      );
    }
  }

  if (!branch) {
    output.push(CMD_LOOKUP.END);

    for (let oi = 0; oi < output.length; oi++) {
      if (typeof output[oi] === "string" || output[oi] < 0) {
        const intCmd = Number(output[oi]);
        if (Number.isInteger(intCmd) && intCmd >= 0) {
          // If string was equivent to position integer then replace it
          // in output otherwise
          output[oi] = intCmd;
        } else {
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

export { CMD_LOOKUP, STRING_NOT_FOUND, VARIABLE_NOT_FOUND };
