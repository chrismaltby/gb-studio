import {
  commandIndex as cmd,
  ACTOR_SET_ACTIVE,
  ACTOR_MOVE_TO,
  ACTOR_SET_DIRECTION,
  ACTOR_SET_FRAME,
  ACTOR_SET_FLIP,
  ACTOR_PUSH,
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
  HIDE_SPRITES
} from "../events/scriptCommands";
import {
  getActorIndex,
  getVariableIndex,
  getSpriteIndex,
  getMusicIndex,
  compileConditional
} from "../events/helpers";
import { dirDec, combineMultipleChoiceText } from "./helpers";
import { hi, lo } from "../helpers/8bit";

class ScriptBuilder {
  constructor(output, options) {
    this.output = output;
    this.options = options;
  }

  setActiveActor = id => {
    const output = this.output;
    const { scene } = this.options;
    const index = getActorIndex(id, scene);
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
    this.loadVectors(variableX, variableY);
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
    this.loadVectors(variableX, variableY);
    output.push(cmd(ACTOR_SET_POSITION_TO_VALUE));
  };

  actorGetPosition = (variableX, variableY) => {
    const output = this.output;
    this.loadVectors(variableX, variableY);
    output.push(cmd(ACTOR_GET_POSITION));
  };

  actorSetDirection = (direction = "down") => {
    const output = this.output;
    output.push(cmd(ACTOR_SET_DIRECTION));
    output.push(dirDec(direction));
  };

  actorSetFrame = (frame = 0) => {
    const output = this.output;
    output.push(cmd(ACTOR_SET_FRAME));
    output.push(frame || 0);
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
    // @todo change this in engine to use active actor like other commands
    output.push(emoteId);
  };

  actorInvoke = () => {
    const output = this.output;
    output.push(cmd(ACTOR_INVOKE));
  };

  actorShow = () => {
    const output = this.output;
    // @todo change this in engine to use active actor like other commands
    output.push(cmd(ACTOR_SHOW));
  };

  actorHide = () => {
    const output = this.output;
    // @todo change this in engine to use active actor like other commands
    output.push(cmd(ACTOR_HIDE));
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

  showSprites = () => {
    const output = this.output;
    output.push(cmd(SHOW_SPRITES));
  };

  hideSprites = () => {
    const output = this.output;
    output.push(cmd(HIDE_SPRITES));
  };

  // Text

  displayText = (text = " ") => {
    const output = this.output;
    const { strings } = this.options;
    let stringIndex = strings.indexOf(text);
    if (stringIndex === -1) {
      strings.push(text);
      stringIndex = strings.length - 1;
    }
    output.push(cmd(TEXT));
    output.push(hi(stringIndex));
    output.push(lo(stringIndex));
  };

  displayChoice = (variable, args) => {
    const output = this.output;
    const { strings, variables } = this.options;
    const choiceText = combineMultipleChoiceText(args);
    let stringIndex = strings.indexOf(choiceText);
    if (stringIndex === -1) {
      strings.push(choiceText);
      stringIndex = strings.length - 1;
    }
    const variableIndex = getVariableIndex(variable, variables);
    output.push(cmd(CHOICE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
    output.push(hi(stringIndex));
    output.push(lo(stringIndex));
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

  setVariableToTrue = variable => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = getVariableIndex(variable, variables);
    output.push(cmd(SET_TRUE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
  };

  setVariableToFalse = variable => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = getVariableIndex(variable, variables);
    output.push(cmd(SET_FALSE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
  };

  setVariableToValue = (variable, value) => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = getVariableIndex(variable, variables);
    output.push(cmd(SET_VALUE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
    output.push(value);
  };

  copyVariable = (variableA, variableB) => {
    const output = this.output;
    this.loadVectors(variableA, variableB);
    output.push(cmd(COPY_VALUE));
  };

  setVariableToRandom = (variable, min, range) => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = getVariableIndex(variable, variables);
    output.push(cmd(SET_RANDOM_VALUE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
    output.push(min);
    output.push(range);
  };

  variablesAdd = (variableA, variableB) => {
    const output = this.output;
    this.loadVectors(variableA, variableB);
    output.push(cmd(MATH_ADD_VALUE));
  };

  variablesSub = (variableA, variableB) => {
    const output = this.output;
    this.loadVectors(variableA, variableB);
    output.push(cmd(MATH_SUB_VALUE));
  };

  variablesMul = (variableA, variableB) => {
    const output = this.output;
    this.loadVectors(variableA, variableB);
    output.push(cmd(MATH_MUL_VALUE));
  };

  variablesDiv = (variableA, variableB) => {
    const output = this.output;
    this.loadVectors(variableA, variableB);
    output.push(cmd(MATH_DIV_VALUE));
  };

  variablesMod = (variableA, variableB) => {
    const output = this.output;
    this.loadVectors(variableA, variableB);
    output.push(cmd(MATH_MOD_VALUE));
  };

  loadVectors = (variableX, variableY) => {
    const output = this.output;
    const { variables } = this.options;
    const indexX = getVariableIndex(variableX, variables);
    const indexY = getVariableIndex(variableY, variables);
    output.push(cmd(LOAD_VECTORS));
    output.push(hi(indexX));
    output.push(lo(indexX));
    output.push(hi(indexY));
    output.push(lo(indexY));
  };

  variableInc = variable => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = getVariableIndex(variable, variables);
    output.push(cmd(INC_VALUE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
  };

  variableDec = variable => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = getVariableIndex(variable, variables);
    output.push(cmd(DEC_VALUE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
  };

  variablesReset = () => {
    const output = this.output;
    output.push(cmd(RESET_VARIABLES));
  };

  // Scenes

  switchScene = (sceneId, x = 0, y = 0, direction = "down", fadeSpeed = 2) => {
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

  ifTrue = (variable, truePath = [], falsePath = []) => {
    const output = this.output;
    const { variables } = this.options;
    output.push(cmd(IF_TRUE));
    const variableIndex = getVariableIndex(variable, variables);
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
    compileConditional(truePath, falsePath, {
      ...this.options,
      output
    });
  };

  // Input

  setInputScript = (input, script) => {
    const output = this.output;
    output.push(cmd(END));
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
    const speedFlag = ((1 << speed) - 1) | (speed > 0 ? 32 : 0);
    output.push(speedFlag);
  };

  cameraLock = (speed = 0) => {
    const output = this.output;
    const speedFlag = ((1 << speed) - 1) | (speed > 0 ? 32 : 0);
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

  playMusic = (musicId, loop = false) => {
    const output = this.output;
    const { music } = this.options;
    const musicIndex = getMusicIndex(musicId, music);
    if (musicIndex >= 0) {
      output.push(cmd(MUSIC_PLAY));
      output.push(musicIndex);
      output.push(loop ? 1 : 0); // Loop track
    }
  };

  stopMusic = () => {
    const output = this.output;
    output.push(cmd(MUSIC_STOP));
  };

  // Data

  loadData = () => {
    const output = this.output;
    output.push(cmd(LOAD_DATA));
  };

  saveData = () => {
    const output = this.output;
    output.push(cmd(SAVE_DATA));
  };

  clearData = () => {
    const output = this.output;
    output.push(cmd(CLEAR_DATA));
  };

  // Timing

  wait = frames => {
    const output = this.output;
    output.push(cmd(WAIT));
    output.push(frames);
  };

  endScript = () => {
    const output = this.output;
    output.push(cmd(END));
  };
}

export default ScriptBuilder;
