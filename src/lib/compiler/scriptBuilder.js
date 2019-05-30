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
  CAMERA_SHAKE
} from "../events/scriptCommands";
import {
  getActorIndex,
  getVariableIndex,
  getMusicIndex,
  compileConditional
} from "../events/helpers";
import { dirDec } from "./helpers";
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

  actorSetDirection = (direction = "down") => {
    const output = this.output;
    output.push(cmd(ACTOR_SET_DIRECTION));
    output.push(dirDec(direction));
  };

  actorSetFrame = frame => {
    const output = this.output;
    output.push(cmd(ACTOR_SET_FRAME));
    output.push(frame);
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
