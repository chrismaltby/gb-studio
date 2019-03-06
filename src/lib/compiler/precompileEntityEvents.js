import {
  EVENT_END,
  EVENT_TEXT,
  EVENT_IF_FLAG,
  EVENT_SET_FLAG,
  EVENT_CLEAR_FLAG,
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
  EVENT_ACTOR_EMOTION,
  EVENT_SHOW_SPRITES,
  EVENT_HIDE_SPRITES,
  EVENT_SHOW_PLAYER,
  EVENT_HIDE_PLAYER,
  EVENT_RETURN_TO_TITLE,
  EVENT_OVERLAY_SHOW,
  EVENT_OVERLAY_HIDE,
  EVENT_OVERLAY_SET_POSITION,
  EVENT_OVERLAY_MOVE_TO,
  EVENT_AWAIT_INPUT
} from "./eventTypes";
import { hi, lo } from "../helpers/8bit";
import { dirDec, inputDec } from "./helpers";

const STRING_NOT_FOUND = "STRING_NOT_FOUND";
const FLAG_NOT_FOUND = "FLAG_NOT_FOUND";

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
  IF_FLAG: 0x03,
  // script_cmd_unless_flag: 0x04,
  SET_FLAG: 0x05,
  CLEAR_FLAG: 0x06,
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
  START_BATTLE: 0x13,
  SHOW_PLAYER: 0x14,
  HIDE_PLAYER: 0x15,
  ACTOR_EMOTION: 0x16,
  CAMERA_SHAKE: 0x17,
  RETURN_TO_TITLE: 0x18,
  OVERLAY_SHOW: 0x19,
  OVERLAY_HIDE: 0x1a,
  OVERLAY_SET_POSITION: 0x1b,
  OVERLAY_MOVE_TO: 0x1c,
  AWAIT_INPUT: 0x1d
};

const getActorIndex = (actorId, scene) => {
  return scene.actors.findIndex(a => a.id === actorId) + 1;
};

const getFlagIndex = (flag, flags) => {
  const flagIndex = flags.indexOf(flag);
  if (flagIndex === -1) {
    // throw new CompileEventsError(FLAG_NOT_FOUND, { flag });
    return 0;
  }
  return flagIndex;
};

const precompileEntityScript = (
  input = [],
  { output = [], strings, scene, scenes, images, flags, branch = false } = {}
) => {
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
    } else if (command === EVENT_IF_FLAG) {
      output.push(CMD_LOOKUP.IF_FLAG);
      const flagIndex = getFlagIndex(input[i].args.flag, flags);
      output.push(hi(flagIndex));
      output.push(lo(flagIndex));

      const truePtrIndex = output.length;
      output.push("PTR_PLACEHOLDER1");
      output.push("PTR_PLACEHOLDER2");
      precompileEntityScript(input[i].false, {
        output,
        strings,
        scene,
        scenes,
        images,
        flags,
        branch: true
      });

      output.push(CMD_LOOKUP.JUMP);
      const endPtrIndex = output.length;
      output.push("PTR_PLACEHOLDER1");
      output.push("PTR_PLACEHOLDER2");

      const truePointer = output.length;
      output[truePtrIndex] = truePointer >> 8;
      output[truePtrIndex + 1] = truePointer & 0xff;

      precompileEntityScript(input[i].true, {
        output,
        strings,
        scene,
        scenes,
        images,
        flags,
        branch: true
      });

      const endIfPointer = output.length;
      output[endPtrIndex] = endIfPointer >> 8;
      output[endPtrIndex + 1] = endIfPointer & 0xff;
    } else if (command === EVENT_SET_FLAG) {
      const flagIndex = getFlagIndex(input[i].args.flag, flags);
      output.push(CMD_LOOKUP.SET_FLAG);
      output.push(hi(flagIndex));
      output.push(lo(flagIndex));
    } else if (command === EVENT_CLEAR_FLAG) {
      const flagIndex = getFlagIndex(input[i].args.flag, flags);
      output.push(CMD_LOOKUP.CLEAR_FLAG);
      output.push(hi(flagIndex));
      output.push(lo(flagIndex));
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
    } else if (command === EVENT_ACTOR_EMOTION) {
      const actorIndex = getActorIndex(input[i].args.actorId, scene);
      output.push(CMD_LOOKUP.ACTOR_EMOTION);
      output.push(actorIndex);
      output.push(input[i].args.emotionId || 0);
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
      }
    } else if (command === EVENT_SHOW_SPRITES) {
      output.push(CMD_LOOKUP.SHOW_SPRITES);
    } else if (command === EVENT_HIDE_SPRITES) {
      output.push(CMD_LOOKUP.HIDE_SPRITES);
    } else if (command === EVENT_SHOW_PLAYER) {
      output.push(CMD_LOOKUP.SHOW_PLAYER);
    } else if (command === EVENT_HIDE_PLAYER) {
      output.push(CMD_LOOKUP.HIDE_PLAYER);
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
    } else if (command === EVENT_OVERLAY_SET_POSITION) {
      output.push(CMD_LOOKUP.OVERLAY_SET_POSITION);
      output.push(input[i].args.x || 0);
      output.push(input[i].args.y || 0);
    } else if (command === EVENT_OVERLAY_MOVE_TO) {
      output.push(CMD_LOOKUP.OVERLAY_MOVE_TO);
      output.push(input[i].args.x || 0);
      output.push(input[i].args.y || 0);
    } else if (command === EVENT_AWAIT_INPUT) {
      output.push(CMD_LOOKUP.AWAIT_INPUT);
      output.push(inputDec(input[i].args.input));
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

export { CMD_LOOKUP, STRING_NOT_FOUND, FLAG_NOT_FOUND };
