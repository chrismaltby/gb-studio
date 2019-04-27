import {
  EVENT_END,
  EVENT_TEXT,
  EVENT_IF_TRUE,
  EVENT_IF_FALSE,
  EVENT_IF_VALUE,
  EVENT_SET_TRUE,
  EVENT_SET_FALSE,
  EVENT_RESET_VARIABLES,
  EVENT_LOOP,
  EVENT_FADE_IN,
  EVENT_FADE_OUT,
  EVENT_CAMERA_MOVE_TO,
  EVENT_CAMERA_LOCK,
  EVENT_SWITCH_SCENE,
  EVENT_START_BATTLE,
  EVENT_ACTOR_SET_POSITION,
  EVENT_ACTOR_SET_DIRECTION,
  EVENT_ACTOR_MOVE_TO,
  EVENT_WAIT,
  EVENT_CAMERA_SHAKE,
  EVENT_ACTOR_EMOTE,
  EVENT_SHOW_SPRITES,
  EVENT_HIDE_SPRITES,
  EVENT_ACTOR_SHOW,
  EVENT_ACTOR_HIDE,
  EVENT_PLAYER_SET_SPRITE,
  EVENT_RETURN_TO_TITLE,
  EVENT_OVERLAY_SHOW,
  EVENT_OVERLAY_HIDE,
  EVENT_OVERLAY_MOVE_TO,
  EVENT_AWAIT_INPUT,
  EVENT_MUSIC_PLAY,
  EVENT_MUSIC_STOP,
  EVENT_STOP,
  EVENT_INC_VALUE,
  EVENT_DEC_VALUE,
  EVENT_SET_VALUE,
  EVENT_IF_INPUT,
  EVENT_CHOICE,
  EVENT_ACTOR_PUSH,
  EVENT_IF_ACTOR_AT_POSITION,
  EVENT_IF_ACTOR_DIRECTION,
  EVENT_LOAD_DATA,
  EVENT_SAVE_DATA,
  EVENT_CLEAR_DATA,
  EVENT_IF_SAVED_DATA,
  EVENT_SET_RANDOM_VALUE
} from "./eventTypes";
import { hi, lo } from "../helpers/8bit";
import {
  dirDec,
  inputDec,
  operatorDec,
  combineMultipleChoiceText
} from "./helpers";

const STRING_NOT_FOUND = "STRING_NOT_FOUND";
const VARIABLE_NOT_FOUND = "VARIABLE_NOT_FOUND";

class CompileEventsError extends Error {
  constructor(message, data) {
    super(message);
    this.data = data;
    this.name = "CompileEventsError";
  }
}

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
  SET_RANDOM_VALUE: 0x2f
};

const getActorIndex = (actorId, scene) => {
  return scene.actors.findIndex(a => a.id === actorId) + 1;
};

const getMusicIndex = (musicId, music) => {
  const musicIndex = music.findIndex(track => track.id === musicId);
  if (musicIndex === -1) {
    return 0;
  }
  return musicIndex;
};

const getSpriteIndex = (spriteId, sprites) => {
  const spriteIndex = sprites.findIndex(sprite => sprite.id === spriteId);
  if (spriteIndex === -1) {
    return 0;
  }
  return spriteIndex;
};

const getVariableIndex = (variable, variables) => {
  const variableIndex = variables.indexOf(String(variable));
  if (variableIndex === -1) {
    throw new CompileEventsError(VARIABLE_NOT_FOUND, { variable });
    return 0;
  }
  return variableIndex;
};

const compileConditional = (truePath, falsePath, options) => {
  const { output } = options;

  const truePtrIndex = output.length;
  output.push("PTR_PLACEHOLDER1");
  output.push("PTR_PLACEHOLDER2");
  precompileEntityScript(falsePath, {
    ...options,
    output,
    branch: true
  });

  output.push(CMD_LOOKUP.JUMP);
  const endPtrIndex = output.length;
  output.push("PTR_PLACEHOLDER1");
  output.push("PTR_PLACEHOLDER2");

  const truePointer = output.length;
  output[truePtrIndex] = truePointer >> 8;
  output[truePtrIndex + 1] = truePointer & 0xff;

  precompileEntityScript(truePath, {
    ...options,
    branch: true
  });

  const endIfPointer = output.length;
  output[endPtrIndex] = endIfPointer >> 8;
  output[endPtrIndex + 1] = endIfPointer & 0xff;
};

const precompileEntityScript = (input = [], options = {}) => {
  const {
    output = [],
    strings,
    scene,
    scenes,
    music,
    sprites,
    backgrounds,
    variables,
    entityType,
    entityIndex,
    branch = false
  } = options;

  for (let i = 0; i < input.length; i++) {
    const command = input[i].command;

    if (command === EVENT_TEXT) {
      const text = input[i].args.text || " "; // Replace empty strings with single space
      const stringIndex = strings.indexOf(text);
      if (stringIndex === -1) {
        throw new CompileEventsError(STRING_NOT_FOUND, input[i].args);
      }
      output.push(CMD_LOOKUP.TEXT);
      output.push(hi(stringIndex));
      output.push(lo(stringIndex));
    } else if (command === EVENT_CHOICE) {
      const text = combineMultipleChoiceText(input[i].args);
      const stringIndex = strings.indexOf(text);
      if (stringIndex === -1) {
        throw new CompileEventsError(STRING_NOT_FOUND, input[i].args);
      }
      const variableIndex = getVariableIndex(input[i].args.variable, variables);
      output.push(CMD_LOOKUP.CHOICE);
      output.push(hi(variableIndex));
      output.push(lo(variableIndex));
      output.push(hi(stringIndex));
      output.push(lo(stringIndex));
    } else if (command === EVENT_IF_TRUE) {
      output.push(CMD_LOOKUP.IF_TRUE);
      const variableIndex = getVariableIndex(input[i].args.variable, variables);
      output.push(hi(variableIndex));
      output.push(lo(variableIndex));
      compileConditional(input[i].true, input[i].false, {
        ...options,
        output
      });
    } else if (command === EVENT_IF_FALSE) {
      output.push(CMD_LOOKUP.IF_TRUE);
      const variableIndex = getVariableIndex(input[i].args.variable, variables);
      output.push(hi(variableIndex));
      output.push(lo(variableIndex));
      compileConditional(input[i].false, input[i].true, {
        ...options,
        output
      });
    } else if (command === EVENT_IF_VALUE) {
      output.push(CMD_LOOKUP.IF_VALUE);
      const variableIndex = getVariableIndex(input[i].args.variable, variables);
      output.push(hi(variableIndex));
      output.push(lo(variableIndex));
      output.push(operatorDec(input[i].args.operator));
      output.push(input[i].args.comparator || 0);
      compileConditional(input[i].true, input[i].false, {
        ...options,
        output
      });
    } else if (command === EVENT_IF_INPUT) {
      output.push(CMD_LOOKUP.IF_INPUT);
      output.push(inputDec(input[i].args.input));
      compileConditional(input[i].true, input[i].false, {
        ...options,
        output
      });
    } else if (command === EVENT_IF_ACTOR_AT_POSITION) {
      const actorIndex = getActorIndex(input[i].args.actorId, scene);
      output.push(CMD_LOOKUP.IF_ACTOR_AT_POSITION);
      output.push(actorIndex);
      output.push(input[i].args.x || 0);
      output.push(input[i].args.y || 0);
      compileConditional(input[i].true, input[i].false, {
        ...options,
        output
      });
    } else if (command === EVENT_IF_ACTOR_DIRECTION) {
      const actorIndex = getActorIndex(input[i].args.actorId, scene);
      output.push(CMD_LOOKUP.IF_ACTOR_DIRECTION);
      output.push(actorIndex);
      output.push(dirDec(input[i].args.direction));
      compileConditional(input[i].true, input[i].false, {
        ...options,
        output
      });
    } else if (command === EVENT_SET_TRUE) {
      const variableIndex = getVariableIndex(input[i].args.variable, variables);
      output.push(CMD_LOOKUP.SET_TRUE);
      output.push(hi(variableIndex));
      output.push(lo(variableIndex));
    } else if (command === EVENT_SET_FALSE) {
      const variableIndex = getVariableIndex(input[i].args.variable, variables);
      output.push(CMD_LOOKUP.SET_FALSE);
      output.push(hi(variableIndex));
      output.push(lo(variableIndex));
    } else if (command === EVENT_INC_VALUE) {
      const variableIndex = getVariableIndex(input[i].args.variable, variables);
      output.push(CMD_LOOKUP.INC_VALUE);
      output.push(hi(variableIndex));
      output.push(lo(variableIndex));
    } else if (command === EVENT_DEC_VALUE) {
      const variableIndex = getVariableIndex(input[i].args.variable, variables);
      output.push(CMD_LOOKUP.DEC_VALUE);
      output.push(hi(variableIndex));
      output.push(lo(variableIndex));
    } else if (command === EVENT_SET_VALUE) {
      const variableIndex = getVariableIndex(input[i].args.variable, variables);
      output.push(CMD_LOOKUP.SET_VALUE);
      output.push(hi(variableIndex));
      output.push(lo(variableIndex));
      output.push(input[i].args.value || 0);
    } else if (command === EVENT_SET_RANDOM_VALUE) {
      const variableIndex = getVariableIndex(input[i].args.variable, variables);
      output.push(CMD_LOOKUP.SET_RANDOM_VALUE);
      output.push(hi(variableIndex));
      output.push(lo(variableIndex));
      output.push(input[i].args.maxValue || 0);
    } else if (command === EVENT_FADE_IN) {
      output.push(CMD_LOOKUP.FADE_IN);
      let speed = input[i].args.speed || 1;
      let speedFlag = (1 << speed) - 1;
      output.push(speed);
    } else if (command === EVENT_FADE_OUT) {
      output.push(CMD_LOOKUP.FADE_OUT);
      let speed = input[i].args.speed || 1;
      let speedFlag = (1 << speed) - 1;
      output.push(speed);
    } else if (command === EVENT_CAMERA_MOVE_TO) {
      output.push(CMD_LOOKUP.CAMERA_MOVE_TO);
      output.push(input[i].args.x);
      output.push(input[i].args.y);
      let speed = input[i].args.speed || 0;
      let speedFlag = ((1 << speed) - 1) | (speed > 0 ? 32 : 0);
      output.push(speedFlag);
    } else if (command === EVENT_CAMERA_LOCK) {
      output.push(CMD_LOOKUP.CAMERA_LOCK);
      let speed = input[i].args.speed || 0;
      let speedFlag = ((1 << speed) - 1) | (speed > 0 ? 32 : 0);
      output.push(speedFlag);
    } else if (command === EVENT_START_BATTLE) {
      let encounterIndex = parseInt(input[i].args.encounter, 10);
      if (encounterIndex > -1) {
        output.push(CMD_LOOKUP.START_BATTLE);
        output.push(encounterIndex);
      }
    } else if (command === EVENT_ACTOR_SET_POSITION) {
      const actorIndex = getActorIndex(input[i].args.actorId, scene);
      output.push(CMD_LOOKUP.ACTOR_SET_ACTIVE);
      output.push(actorIndex);
      output.push(CMD_LOOKUP.ACTOR_SET_POSITION);
      output.push(input[i].args.x || 0);
      output.push(input[i].args.y || 0);
    } else if (command === EVENT_ACTOR_SET_DIRECTION) {
      const actorIndex = getActorIndex(input[i].args.actorId, scene);
      output.push(CMD_LOOKUP.ACTOR_SET_ACTIVE);
      output.push(actorIndex);
      output.push(CMD_LOOKUP.ACTOR_SET_DIRECTION);
      output.push(dirDec(input[i].args.direction));
    } else if (command === EVENT_ACTOR_MOVE_TO) {
      const actorIndex = getActorIndex(input[i].args.actorId, scene);
      output.push(CMD_LOOKUP.ACTOR_SET_ACTIVE);
      output.push(actorIndex);
      output.push(CMD_LOOKUP.ACTOR_MOVE_TO);
      output.push(input[i].args.x || 0);
      output.push(input[i].args.y || 0);
    } else if (command === EVENT_WAIT) {
      let seconds =
        typeof input[i].args.time === "number" ? input[i].args.time : 0.5;
      while (seconds > 0) {
        let time = Math.min(seconds, 1);
        output.push(CMD_LOOKUP.WAIT);
        output.push(Math.ceil(60 * time));
        seconds -= time;
      }
    } else if (command === EVENT_CAMERA_SHAKE) {
      let seconds =
        typeof input[i].args.time === "number" ? input[i].args.time : 0.5;
      while (seconds > 0) {
        let time = Math.min(seconds, 1);
        output.push(CMD_LOOKUP.CAMERA_SHAKE);
        output.push(Math.ceil(60 * time));
        seconds -= time;
      }
    } else if (command === EVENT_ACTOR_EMOTE) {
      const actorIndex = getActorIndex(input[i].args.actorId, scene);
      output.push(CMD_LOOKUP.ACTOR_EMOTE);
      output.push(actorIndex);
      output.push(input[i].args.emoteId || 0);
    } else if (command === EVENT_SWITCH_SCENE) {
      let sceneIndex = scenes.findIndex(s => s.id === input[i].args.sceneId);
      if (sceneIndex > -1) {
        output.push(CMD_LOOKUP.SWITCH_SCENE);
        output.push(hi(sceneIndex));
        output.push(lo(sceneIndex));
        output.push(input[i].args.x || 0);
        output.push(input[i].args.y || 0);
        output.push(dirDec(input[i].args.direction));
        output.push(input[i].args.fadeSpeed || 2);
        output.push(CMD_LOOKUP.END);
      }
    } else if (command === EVENT_SHOW_SPRITES) {
      output.push(CMD_LOOKUP.SHOW_SPRITES);
    } else if (command === EVENT_HIDE_SPRITES) {
      output.push(CMD_LOOKUP.HIDE_SPRITES);
    } else if (command === EVENT_ACTOR_SHOW) {
      const actorIndex = getActorIndex(input[i].args.actorId, scene);
      output.push(CMD_LOOKUP.ACTOR_SHOW);
      output.push(actorIndex);
    } else if (command === EVENT_ACTOR_HIDE) {
      const actorIndex = getActorIndex(input[i].args.actorId, scene);
      output.push(CMD_LOOKUP.ACTOR_HIDE);
      output.push(actorIndex);
    } else if (command === EVENT_ACTOR_PUSH) {
      if (entityType === "actor" && entityIndex !== undefined) {
        output.push(CMD_LOOKUP.ACTOR_SET_ACTIVE);
        output.push(entityIndex + 1);
        output.push(CMD_LOOKUP.ACTOR_PUSH);
        output.push(input[i].args.continue ? 1 : 0); // Continue until collision
      }
    } else if (command === EVENT_PLAYER_SET_SPRITE) {
      const spriteIndex = getSpriteIndex(input[i].args.spriteSheetId, sprites);
      output.push(CMD_LOOKUP.PLAYER_SET_SPRITE);
      output.push(spriteIndex);
    } else if (command === EVENT_RETURN_TO_TITLE) {
      output.push(CMD_LOOKUP.RETURN_TO_TITLE);
    } else if (command === EVENT_END) {
      // output.push(CMD_LOOKUP.END);
    } else if (command === EVENT_OVERLAY_SHOW) {
      output.push(CMD_LOOKUP.OVERLAY_SHOW);
      output.push(input[i].args.color === "white" ? 1 : 0);
      output.push(input[i].args.x || 0);
      output.push(input[i].args.y || 0);
    } else if (command === EVENT_OVERLAY_HIDE) {
      output.push(CMD_LOOKUP.OVERLAY_HIDE);
    } else if (command === EVENT_OVERLAY_MOVE_TO) {
      output.push(CMD_LOOKUP.OVERLAY_MOVE_TO);
      output.push(input[i].args.x || 0);
      output.push(input[i].args.y || 0);
      let speed = input[i].args.speed || 0;
      output.push(speed);
    } else if (command === EVENT_AWAIT_INPUT) {
      output.push(CMD_LOOKUP.AWAIT_INPUT);
      output.push(inputDec(input[i].args.input));
    } else if (command === EVENT_MUSIC_PLAY) {
      const musicIndex = getMusicIndex(input[i].args.musicId, music);
      output.push(CMD_LOOKUP.MUSIC_PLAY);
      output.push(musicIndex);
      output.push(input[i].args.loop ? 1 : 0); // Loop track
    } else if (command === EVENT_MUSIC_STOP) {
      output.push(CMD_LOOKUP.MUSIC_STOP);
    } else if (command === EVENT_RESET_VARIABLES) {
      output.push(CMD_LOOKUP.RESET_VARIABLES);
    } else if (command === EVENT_LOOP) {
      const startPtrIndex = output.length;
      precompileEntityScript(input[i].true, {
        ...options,
        output,
        branch: true
      });
      output.push(CMD_LOOKUP.NEXT_FRAME);
      output.push(CMD_LOOKUP.JUMP);
      output.push(startPtrIndex >> 8);
      output.push(startPtrIndex & 0xff);
    } else if (command === EVENT_STOP) {
      output.push(CMD_LOOKUP.END);
    } else if (command === EVENT_LOAD_DATA) {
      output.push(CMD_LOOKUP.LOAD_DATA);
    } else if (command === EVENT_SAVE_DATA) {
      output.push(CMD_LOOKUP.SAVE_DATA);
    } else if (command === EVENT_CLEAR_DATA) {
      output.push(CMD_LOOKUP.CLEAR_DATA);
    } else if (command === EVENT_IF_SAVED_DATA) {
      output.push(CMD_LOOKUP.IF_SAVED_DATA);
      compileConditional(input[i].true, input[i].false, {
        ...options,
        output
      });
    }

    for (var oi = 0; oi < output.length; oi++) {
      if (output[oi] < 0) {
        console.log("OUTPUT FAILED");
        console.log(command);
        console.log(input[i]);
        throw "OUTPUT FAILED";
      }
    }
  }

  if (!branch) {
    output.push(CMD_LOOKUP.END);
  }

  return output;
};

export default precompileEntityScript;

export { CMD_LOOKUP, STRING_NOT_FOUND, VARIABLE_NOT_FOUND };
