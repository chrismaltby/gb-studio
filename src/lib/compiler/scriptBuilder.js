import {
  commandIndex as cmd,
  ACTOR_SET_ACTIVE,
  ACTOR_MOVE_TO,
  ACTOR_SET_DIRECTION,
  ACTOR_SET_FRAME,
  ACTOR_SET_FRAME_TO_VALUE,
  ACTOR_SET_FLIP,
  ACTOR_PUSH,
  ACTOR_SET_COLLISIONS,
  TEXT,
  TEXT_MULTI,
  SET_TRUE,
  SET_FALSE,
  IF_TRUE,
  SWITCH_SCENE,
  WAIT,
  END,
  SET_VALUE,
  LOAD_VECTORS,
  COPY_VALUE,
  SET_RANDOM_VALUE,
  MATH_ADD_VALUE,
  MATH_SUB_VALUE,
  MATH_MUL_VALUE,
  MATH_DIV_VALUE,
  MATH_MOD_VALUE,
  MUSIC_PLAY,
  MUSIC_STOP,
  CAMERA_MOVE_TO,
  CAMERA_LOCK,
  CAMERA_SHAKE,
  CHOICE,
  INC_VALUE,
  DEC_VALUE,
  TEXT_SET_ANIM_SPEED,
  ACTOR_SET_POSITION,
  ACTOR_SET_POSITION_RELATIVE,
  ACTOR_MOVE_RELATIVE,
  OVERLAY_MOVE_TO,
  OVERLAY_SHOW,
  OVERLAY_HIDE,
  LOAD_DATA,
  SAVE_DATA,
  CLEAR_DATA,
  FADE_IN,
  FADE_OUT,
  RESET_VARIABLES,
  ACTOR_INVOKE,
  ACTOR_GET_POSITION,
  ACTOR_SET_POSITION_TO_VALUE,
  ACTOR_MOVE_TO_VALUE,
  ACTOR_EMOTE,
  ACTOR_SHOW,
  ACTOR_HIDE,
  PLAYER_SET_SPRITE,
  SHOW_SPRITES,
  HIDE_SPRITES,
  ACTOR_SET_MOVE_SPEED,
  ACTOR_SET_ANIM_SPEED,
  SCENE_PUSH_STATE,
  SCENE_STATE_RESET,
  SCENE_POP_ALL_STATE,
  SCENE_POP_STATE,
  IF_VALUE,
  IF_VALUE_COMPARE,
  IF_INPUT,
  IF_ACTOR_AT_POSITION,
  IF_ACTOR_DIRECTION,
  IF_SAVED_DATA,
  AWAIT_INPUT,
  NEXT_FRAME,
  JUMP,
  SET_INPUT_SCRIPT,
  REMOVE_INPUT_SCRIPT,
  VARIABLE_ADD_FLAGS,
  VARIABLE_CLEAR_FLAGS,
  SOUND_START_TONE,
  SOUND_STOP_TONE,
  SOUND_PLAY_BEEP,
  SOUND_PLAY_CRASH,
  SET_TIMER_SCRIPT,
  TIMER_RESTART,
  TIMER_DISABLE,
  TEXT_WITH_AVATAR,
  MENU
} from "../events/scriptCommands";
import {
  getActorIndex,
  getVariableIndex,
  getSpriteIndex,
  getMusicIndex,
  compileConditional
} from "../events/helpers";
import {
  dirDec,
  operatorDec,
  inputDec,
  moveSpeedDec,
  animSpeedDec,
  combineMultipleChoiceText
} from "./helpers";
import { hi, lo } from "../helpers/8bit";

class ScriptBuilder {
  constructor(output, options) {
    this.output = output;
    this.options = options;
  }

  actorSetActive = id => {
    const output = this.output;
    const { scene, entity } = this.options;
    const index = id === "$self$"
      ? getActorIndex(entity.id, scene)
      : getActorIndex(id, scene);
    output.push(cmd(ACTOR_SET_ACTIVE));
    output.push(index);
  };

  actorMoveTo = (x = 0, y = 0) => {
    const output = this.output;
    output.push(cmd(ACTOR_MOVE_TO));
    output.push(x);
    output.push(y);
  };

  actorMoveRelative = (x = 0, y = 0) => {
    const output = this.output;
    output.push(cmd(ACTOR_MOVE_RELATIVE));
    output.push(Math.abs(x));
    output.push(x < 0 ? 1 : 0);
    output.push(Math.abs(y));
    output.push(y < 0 ? 1 : 0);
  };

  actorMoveToVariables = (variableX, variableY) => {
    const output = this.output;
    this.vectorsLoad(variableX, variableY);
    output.push(cmd(ACTOR_MOVE_TO_VALUE));
  };

  actorSetPosition = (x = 0, y = 0) => {
    const output = this.output;
    output.push(cmd(ACTOR_SET_POSITION));
    output.push(x);
    output.push(y);
  };

  actorSetPositionRelative = (x = 0, y = 0) => {
    const output = this.output;
    output.push(cmd(ACTOR_SET_POSITION_RELATIVE));
    output.push(Math.abs(x));
    output.push(x < 0 ? 1 : 0);
    output.push(Math.abs(y));
    output.push(y < 0 ? 1 : 0);
  };

  actorSetPositionToVariables = (variableX, variableY) => {
    const output = this.output;
    this.vectorsLoad(variableX, variableY);
    output.push(cmd(ACTOR_SET_POSITION_TO_VALUE));
  };

  actorGetPosition = (variableX, variableY) => {
    const output = this.output;
    this.vectorsLoad(variableX, variableY);
    output.push(cmd(ACTOR_GET_POSITION));
  };

  actorSetDirection = (direction = "down") => {
    const output = this.output;
    output.push(cmd(ACTOR_SET_DIRECTION));
    output.push(dirDec(direction));
  };

  actorSetMovementSpeed = (speed = 1) => {
    const output = this.output;
    output.push(cmd(ACTOR_SET_MOVE_SPEED));
    output.push(moveSpeedDec(speed));
  };

  actorSetAnimationSpeed = (speed = 3) => {
    const output = this.output;
    output.push(cmd(ACTOR_SET_ANIM_SPEED));
    output.push(animSpeedDec(speed));
  };

  actorSetFrame = (frame = 0) => {
    const output = this.output;
    output.push(cmd(ACTOR_SET_FRAME));
    output.push(frame || 0);
  };

  actorSetFrameToVariable = variable => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = this.getVariableIndex(variable, variables);
    output.push(cmd(ACTOR_SET_FRAME_TO_VALUE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
  };

  actorSetFlip = flip => {
    const output = this.output;
    output.push(cmd(ACTOR_SET_FLIP));
    output.push(flip ? 1 : 0);
  };

  actorPush = (continueUntilCollision = false) => {
    const output = this.output;
    output.push(cmd(ACTOR_PUSH));
    output.push(continueUntilCollision ? 1 : 0);
  };

  actorEmote = (emoteId = 0) => {
    const output = this.output;
    output.push(cmd(ACTOR_EMOTE));
    output.push(emoteId);
  };

  actorInvoke = () => {
    const output = this.output;
    output.push(cmd(ACTOR_INVOKE));
  };

  actorShow = () => {
    const output = this.output;
    output.push(cmd(ACTOR_SHOW));
  };

  actorHide = () => {
    const output = this.output;
    output.push(cmd(ACTOR_HIDE));
  };

  actorSetCollisions = enabled => {
    const output = this.output;
    output.push(cmd(ACTOR_SET_COLLISIONS));
    output.push(enabled ? 1 : 0);
  };

  // Player

  playerSetSprite = spriteSheetId => {
    const output = this.output;
    const { sprites } = this.options;
    const spriteIndex = getSpriteIndex(spriteSheetId, sprites);
    output.push(cmd(PLAYER_SET_SPRITE));
    output.push(spriteIndex);
  };

  // Sprites

  spritesShow = () => {
    const output = this.output;
    output.push(cmd(SHOW_SPRITES));
  };

  spritesHide = () => {
    const output = this.output;
    output.push(cmd(HIDE_SPRITES));
  };

  // Text

  textDialogue = (inputText = " ", avatarId) => {
    const output = this.output;
    const { strings, avatars, variables, event } = this.options;
    const text = this.replaceVariables(inputText, variables, event);
    let stringIndex = strings.indexOf(text);
    if (stringIndex === -1) {
      strings.push(text);
      stringIndex = strings.length - 1;
    }
    if (avatarId) {
      const avatarIndex = getSpriteIndex(avatarId, avatars);
      output.push(cmd(TEXT_WITH_AVATAR));
      output.push(hi(stringIndex));
      output.push(lo(stringIndex));
      output.push(avatarIndex);
    } else {
      output.push(cmd(TEXT));
      output.push(hi(stringIndex));
      output.push(lo(stringIndex));
    }
  };

  textChoice = (setVariable, args) => {
    const output = this.output;
    const { strings, variables, event } = this.options;
    const choiceText = combineMultipleChoiceText(args);
    const text = this.replaceVariables(choiceText, variables, event);
    let stringIndex = strings.indexOf(text);
    if (stringIndex === -1) {
      strings.push(text);
      stringIndex = strings.length - 1;
    }
    const variableIndex = this.getVariableIndex(setVariable, variables);
    output.push(cmd(CHOICE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
    output.push(hi(stringIndex));
    output.push(lo(stringIndex));
  };

  textMenu = (
    setVariable,
    options,
    layout = "menu",
    cancelOnLastOption = false,
    cancelOnB = false
  ) => {
    const output = this.output;
    const { strings, variables, event } = this.options;
    const menuText = options
      .map((option, index) => option || `Item ${index + 1}`)
      .join("\n");
    const text = this.replaceVariables(menuText, variables, event);
    let stringIndex = strings.indexOf(text);
    if (stringIndex === -1) {
      strings.push(text);
      stringIndex = strings.length - 1;
    }
    const variableIndex = this.getVariableIndex(setVariable, variables);
    output.push(cmd(MENU));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
    output.push(hi(stringIndex));
    output.push(lo(stringIndex));
    output.push(layout === "menu" ? 1 : 0);
    output.push((cancelOnLastOption ? 1 : 0) | (cancelOnB ? 2 : 0));
  };

  textSetOpenInstant = () => {
    const output = this.output;
    output.push(cmd(TEXT_MULTI));
    output.push(1);
  };

  textRestoreOpenSpeed = () => {
    const output = this.output;
    output.push(cmd(TEXT_MULTI));
    output.push(3);
  };

  textSetCloseInstant = () => {
    const output = this.output;
    output.push(cmd(TEXT_MULTI));
    output.push(0);
  };

  textRestoreCloseSpeed = () => {
    const output = this.output;
    output.push(cmd(TEXT_MULTI));
    output.push(2);
  };

  textSetAnimSpeed = (speedIn, speedOut, textSpeed = 1) => {
    const output = this.output;
    output.push(cmd(TEXT_SET_ANIM_SPEED));
    output.push(speedIn);
    output.push(speedOut);
    output.push(textSpeed);
  };

  // Variables

  getVariableIndex = (variable = "0", variables) => {
    if (["L0", "L1", "L2", "L3"].indexOf(variable) > -1) {
      const { entity } = this.options;
      return getVariableIndex(`${entity.id}__${variable}`, variables);
    }
    return getVariableIndex(variable, variables);
  };

  variableSetToTrue = variable => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = this.getVariableIndex(variable, variables);
    output.push(cmd(SET_TRUE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
  };

  variableSetToFalse = variable => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = this.getVariableIndex(variable, variables);
    output.push(cmd(SET_FALSE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
  };

  variableSetToValue = (variable, value) => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = this.getVariableIndex(variable, variables);
    output.push(cmd(SET_VALUE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
    output.push(value);
  };

  variableCopy = (setVariable, otherVariable) => {
    const output = this.output;
    this.vectorsLoad(setVariable, otherVariable);
    output.push(cmd(COPY_VALUE));
  };

  variableSetToRandom = (variable, min, range) => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = this.getVariableIndex(variable, variables);
    output.push(cmd(SET_RANDOM_VALUE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
    output.push(min);
    output.push(range);
  };

  variablesAdd = (setVariable, otherVariable) => {
    const output = this.output;
    this.vectorsLoad(setVariable, otherVariable);
    output.push(cmd(MATH_ADD_VALUE));
  };

  variablesSub = (setVariable, otherVariable) => {
    const output = this.output;
    this.vectorsLoad(setVariable, otherVariable);
    output.push(cmd(MATH_SUB_VALUE));
  };

  variablesMul = (setVariable, otherVariable) => {
    const output = this.output;
    this.vectorsLoad(setVariable, otherVariable);
    output.push(cmd(MATH_MUL_VALUE));
  };

  variablesDiv = (setVariable, otherVariable) => {
    const output = this.output;
    this.vectorsLoad(setVariable, otherVariable);
    output.push(cmd(MATH_DIV_VALUE));
  };

  variablesMod = (setVariable, otherVariable) => {
    const output = this.output;
    this.vectorsLoad(setVariable, otherVariable);
    output.push(cmd(MATH_MOD_VALUE));
  };

  vectorsLoad = (variableX, variableY) => {
    const output = this.output;
    const { variables } = this.options;
    const indexX = this.getVariableIndex(variableX, variables);
    const indexY = this.getVariableIndex(variableY, variables);
    output.push(cmd(LOAD_VECTORS));
    output.push(hi(indexX));
    output.push(lo(indexX));
    output.push(hi(indexY));
    output.push(lo(indexY));
  };

  variableInc = variable => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = this.getVariableIndex(variable, variables);
    output.push(cmd(INC_VALUE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
  };

  variableDec = variable => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = this.getVariableIndex(variable, variables);
    output.push(cmd(DEC_VALUE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
  };

  variablesReset = () => {
    const output = this.output;
    output.push(cmd(RESET_VARIABLES));
  };

  variableAddFlags = (setVariable, flags) => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = this.getVariableIndex(setVariable, variables);
    output.push(cmd(VARIABLE_ADD_FLAGS));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
    output.push(flags);
  };

  variableClearFlags = (setVariable, flags) => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = this.getVariableIndex(setVariable, variables);
    output.push(cmd(VARIABLE_CLEAR_FLAGS));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
    output.push(flags);
  };

  // Scenes

  sceneSwitch = (sceneId, x = 0, y = 0, direction = "down", fadeSpeed = 2) => {
    const output = this.output;
    const { scenes } = this.options;
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex > -1) {
      output.push(cmd(SWITCH_SCENE));
      output.push(hi(sceneIndex));
      output.push(lo(sceneIndex));
      output.push(x);
      output.push(y);
      output.push(dirDec(direction));
      output.push(fadeSpeed);
    }
  };

  scenePushState = () => {
    const output = this.output;
    output.push(cmd(SCENE_PUSH_STATE));
  };

  scenePopState = (fadeSpeed = 2) => {
    const output = this.output;
    output.push(cmd(SCENE_POP_STATE));
    output.push(fadeSpeed);
  };

  scenePopAllState = (fadeSpeed = 2) => {
    const output = this.output;
    output.push(cmd(SCENE_POP_ALL_STATE));
    output.push(fadeSpeed);
  };

  sceneResetState = () => {
    const output = this.output;
    output.push(cmd(SCENE_STATE_RESET));
  };

  // Overlays

  overlayShow = (color = "white", x = 0, y = 0) => {
    const output = this.output;
    output.push(cmd(OVERLAY_SHOW));
    output.push(color === "white" ? 1 : 0);
    output.push(x);
    output.push(y);
  };

  overlayHide = () => {
    const output = this.output;
    output.push(cmd(OVERLAY_HIDE));
  };

  overlayMoveTo = (x = 0, y = 18, speed = 0) => {
    const output = this.output;
    output.push(cmd(OVERLAY_MOVE_TO));
    output.push(x);
    output.push(y);
    output.push(speed);
  };

  // Control Flow

  ifVariableTrue = (variable, truePath = [], falsePath = []) => {
    const output = this.output;
    const { variables } = this.options;
    output.push(cmd(IF_TRUE));
    const variableIndex = this.getVariableIndex(variable, variables);
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
    compileConditional(truePath, falsePath, {
      ...this.options,
      output
    });
  };

  ifVariableValue = (
    variable,
    operator,
    comparator,
    truePath = [],
    falsePath = []
  ) => {
    const output = this.output;
    const { variables } = this.options;
    output.push(cmd(IF_VALUE));
    const variableIndex = this.getVariableIndex(variable, variables);
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
    output.push(operatorDec(operator));
    output.push(comparator || 0);
    compileConditional(truePath, falsePath, {
      ...this.options,
      output
    });
  };

  caseVariableValue = (variable, cases = {}, falsePath = []) => {
    const output = this.output;
    const { variables, compileEvents } = this.options;
    const variableIndex = this.getVariableIndex(variable, variables);
    const caseKeys = Object.keys(cases);
    const numCases = caseKeys.length;
    const caseStartPtrs = [];
    const caseBreakPtrs = [];

    if (numCases === 0) {
      // If no cases defined run default path
      if (typeof falsePath === "function") {
        falsePath();
      } else if (falsePath) {
        compileEvents(falsePath);
      }
    } else {
      // Loop through cases and build IF_VALUE commands
      for (let i = 0; i < numCases; i++) {
        output.push(cmd(IF_VALUE));
        output.push(hi(variableIndex));
        output.push(lo(variableIndex));
        output.push(operatorDec("=="));
        output.push(caseKeys[i] || 0);
        caseStartPtrs[i] = output.length;
        output.push("PTR_PLACEHOLDER1");
        output.push("PTR_PLACEHOLDER2");
      }

      // Default path
      if (typeof falsePath === "function") {
        falsePath();
      } else if (falsePath) {
        compileEvents(falsePath);
      }

      // Set placeholder for jump to end of case statement
      output.push(cmd(JUMP));
      const endPtrIndex = output.length;
      output.push("PTR_PLACEHOLDER1");
      output.push("PTR_PLACEHOLDER2");

      // Loop through cases to build branches
      for (let i = 0; i < numCases; i++) {
        const truePointer = output.length;
        const truePtrIndex = caseStartPtrs[i];
        output[truePtrIndex] = truePointer >> 8;
        output[truePtrIndex + 1] = truePointer & 0xff;

        const truePath = cases[caseKeys[i]] || [];
        if (typeof truePath === "function") {
          truePath();
        } else if (truePath) {
          compileEvents(truePath);
        }

        // Store placeholders for breaks to end of case statement
        output.push(cmd(JUMP));
        caseBreakPtrs[i] = output.length;
        output.push("PTR_PLACEHOLDER1");
        output.push("PTR_PLACEHOLDER2");
      }

      // Fill default path break placeholder
      const endIfPointer = output.length;
      output[endPtrIndex] = endIfPointer >> 8;
      output[endPtrIndex + 1] = endIfPointer & 0xff;

      // Fill case paths break placeholders
      for (let i = 0; i < numCases; i++) {
        const breakPtrIndex = caseBreakPtrs[i];
        output[breakPtrIndex] = endIfPointer >> 8;
        output[breakPtrIndex + 1] = endIfPointer & 0xff;
      }
    }
  };

  ifVariableCompare = (
    variableA,
    operator,
    variableB,
    truePath = [],
    falsePath = []
  ) => {
    const output = this.output;
    this.vectorsLoad(variableA, variableB);
    output.push(cmd(IF_VALUE_COMPARE));
    output.push(operatorDec(operator));
    compileConditional(truePath, falsePath, {
      ...this.options,
      output
    });
  };

  ifInput = (input, truePath = [], falsePath = []) => {
    const output = this.output;
    output.push(cmd(IF_INPUT));
    output.push(inputDec(input));
    compileConditional(truePath, falsePath, {
      ...this.options,
      output
    });
  };

  ifActorAtPosition = (x, y, truePath = [], falsePath = []) => {
    const output = this.output;
    output.push(cmd(IF_ACTOR_AT_POSITION));
    output.push(x || 0);
    output.push(y || 0);
    compileConditional(truePath, falsePath, {
      ...this.options,
      output
    });
  };

  ifActorDirection = (direction, truePath = [], falsePath = []) => {
    const output = this.output;
    output.push(cmd(IF_ACTOR_DIRECTION));
    output.push(dirDec(direction));
    compileConditional(truePath, falsePath, {
      ...this.options,
      output
    });
  };

  ifDataSaved = (truePath = [], falsePath = []) => {
    const output = this.output;
    output.push(cmd(IF_SAVED_DATA));
    compileConditional(truePath, falsePath, {
      ...this.options,
      output
    });
  };

  // Goto

  labelDefine = name => {
    const { labels } = this.options;
    const output = this.output;
    const ptr = output.length;
    labels[name] = ptr;
    for (let i = 0; i < output.length; i++) {
      if (output[i] === `goto: ${name}`) {
        output[i] = cmd(JUMP);
        output[i + 1] = ptr >> 8;
        output[i + 2] = ptr & 0xff;
      }
    }
  };

  labelGoto = name => {
    const { labels } = this.options;
    const output = this.output;
    if (labels[name] !== undefined) {
      const ptr = labels[name];
      output.push(cmd(JUMP));
      output.push(ptr >> 8);
      output.push(ptr & 0xff);
    } else {
      output.push(`goto: ${name}`);
      output.push(0);
      output.push(0);
    }
  };

  // Input

  inputAwait = input => {
    const output = this.output;
    output.push(cmd(AWAIT_INPUT));
    output.push(inputDec(input));
  };

  inputScriptSet = (input, script) => {
    const output = this.output;
    const { compileEvents, banked } = this.options;

    const subScript = [];
    if (typeof script === "function") {
      this.output = subScript;
      script();
      this.output = output;
    } else {
      compileEvents(script, subScript, false);
    }
    const bankPtr = banked.push(subScript);

    output.push(cmd(SET_INPUT_SCRIPT));
    output.push(inputDec(input));
    output.push(bankPtr.bank);
    output.push(hi(bankPtr.offset));
    output.push(lo(bankPtr.offset));
  };

  inputScriptRemove = input => {
    const output = this.output;
    output.push(cmd(REMOVE_INPUT_SCRIPT));
    output.push(inputDec(input));
  };

  // Camera

  cameraMoveTo = (x = 0, y = 0, speed = 0) => {
    const output = this.output;
    const { scene } = this.options;
    output.push(cmd(CAMERA_MOVE_TO));
    // Limit camera move to be within scene bounds
    const camX = Math.min(x, scene.width - 20);
    const camY = Math.min(y, scene.height - 18);
    output.push(camX);
    output.push(camY);
    // Direct speed in binary, first bits 0000 to 1111 are "&" compared with binary time
    // Speed 0 = 0 instant, Speed 1 = 32 0x20 move every frame, Speed 2 = 33 0x21
    const speedFlag = speed > 0 ? 32 + (1 << (speed - 1)) - 1 : 0;
    output.push(speedFlag);
  };

  cameraLock = (speed = 0) => {
    const output = this.output;
    const speedFlag = speed > 0 ? 32 + (1 << (speed - 1)) - 1 : 0;
    output.push(cmd(CAMERA_LOCK));
    output.push(speedFlag);
  };

  cameraShake = frames => {
    const output = this.output;
    output.push(cmd(CAMERA_SHAKE));
    output.push(frames);
  };

  // Screen

  fadeIn = (speed = 1) => {
    const output = this.output;
    output.push(cmd(FADE_IN));
    output.push(speed);
  };

  fadeOut = (speed = 1) => {
    const output = this.output;
    output.push(cmd(FADE_OUT));
    output.push(speed);
  };

  // Music

  musicPlay = (musicId, loop = false) => {
    const output = this.output;
    const { music } = this.options;
    const musicIndex = getMusicIndex(musicId, music);
    if (musicIndex >= 0) {
      output.push(cmd(MUSIC_PLAY));
      output.push(musicIndex);
      output.push(loop ? 1 : 0); // Loop track
    }
  };

  musicStop = () => {
    const output = this.output;
    output.push(cmd(MUSIC_STOP));
  };

  // Sound

  soundStartTone = (period = 1600) => {
    const output = this.output;

    // start playing tone
    output.push(cmd(SOUND_START_TONE));
    output.push(hi(period));
    output.push(lo(period));
  };

  soundStopTone = () => {
    const output = this.output;
    output.push(cmd(SOUND_STOP_TONE));
  };

  soundPlayBeep = (pitch = 4) => {
    const output = this.output;

    pitch = pitch - 1;
    if (pitch < 0) {
      pitch = 0;
    }
    if (pitch >= 8) {
      pitch = 7;
    }

    output.push(cmd(SOUND_PLAY_BEEP));
    output.push(pitch & 0x07);
  };

  soundPlayCrash = () => {
    const output = this.output;
    output.push(cmd(SOUND_PLAY_CRASH));
  };

  // Data

  dataLoad = () => {
    const output = this.output;
    output.push(cmd(LOAD_DATA));
  };

  dataSave = () => {
    const output = this.output;
    output.push(cmd(SAVE_DATA));
  };

  dataClear = () => {
    const output = this.output;
    output.push(cmd(CLEAR_DATA));
  };

  // Timing

  nextFrameAwait = () => {
    const output = this.output;
    output.push(cmd(NEXT_FRAME));
  };

  wait = frames => {
    const output = this.output;
    output.push(cmd(WAIT));
    output.push(frames);
  };

  scriptEnd = () => {
    const output = this.output;
    output.push(cmd(END));
  };

  // Timer Script

  timerScriptSet = (duration = 10.0, script) => {
    const output = this.output;
    const { compileEvents, banked } = this.options;

    // convert the duration from seconds to timer ticks
    const TIMER_CYCLES = 16;
    let durationTicks = ((60 * duration) / TIMER_CYCLES + 0.5) | 0;
    if (durationTicks <= 0) {
      durationTicks = 1;
    }
    if (durationTicks >= 256) {
      durationTicks = 255;
    }

    // compile event script
    const subScript = [];
    if (typeof script === "function") {
      this.output = subScript;
      script();
      this.output = output;
    } else {
      compileEvents(script, subScript, false);
    }
    const bankPtr = banked.push(subScript);

    output.push(cmd(SET_TIMER_SCRIPT));
    output.push(durationTicks);
    output.push(bankPtr.bank);
    output.push(hi(bankPtr.offset));
    output.push(lo(bankPtr.offset));
  };

  timerRestart = () => {
    const output = this.output;
    output.push(cmd(TIMER_RESTART));
  };

  timerDisable = () => {
    const output = this.output;
    output.push(cmd(TIMER_DISABLE));
  };

  // Helpers

  getSprite = (name, plugin = "") => {
    const { sprites } = this.options;
    const searchName = name.toUpperCase();
    const searchPlugin = plugin.toUpperCase();
    const sprite = sprites.find(s => {
      return (
        (searchName === s.name.toUpperCase() ||
          searchName === s.filename.toUpperCase()) &&
        (!plugin || searchPlugin === s.plugin.toUpperCase())
      );
    });
    if (sprite) {
      return sprite.id;
    }
    throw new Error(`Sprite ${name} not found`);
  };

  getActor = name => {
    if (name === "player") {
      return name;
    }
    const { scene } = this.options;
    const searchName = name.toUpperCase();
    const actor = scene.actors.find(
      (a, i) =>
        (a.name && searchName === a.name.toUpperCase()) ||
        searchName === `ACTOR ${i + 1}`
    );
    if (actor) {
      return actor.id;
    }
    throw new Error(`Actor ${name} not found`);
  };

  replaceVariables = (string, variables, event) => {
    const getVariableSymbol = index => `$${String(index).padStart(2, "0")}$`;
    
    return string
    // Replace Global variables
    .replace(/\$([0-9]+)\$/g, (match, globalVariable) => {
      const index = this.getVariableIndex(globalVariable, variables);
      return getVariableSymbol(index);
    })
    // Replace Local variables
    .replace(/\$(L[0-9])\$/g, (match, localVariable) => {
      const index = this.getVariableIndex(localVariable, variables);
      return getVariableSymbol(index);
    })
    // Replace Custom Event variables
    .replace(/\$V([0-9])\$/g, (match, customVariable) => {
      const mappedVariable = event.args[`$variable[${customVariable}]$`];
      const index = this.getVariableIndex(mappedVariable, variables);
      return getVariableSymbol(index);
    });
  };
}

export default ScriptBuilder;
