import {
  getActor,
  getSpriteIndex,
  getMusicIndex,
  compileConditional,
  getSpriteOffset,
  getSprite,
  getSpriteSceneIndex,
} from "../events/helpers";
import {
  dirDec,
  operatorDec,
  inputDec,
  moveSpeedDec,
  animSpeedDec,
  collisionMaskDec,
  paletteMaskDec,
  collisionGroupDec,
  actorRelativeDec,
  moveTypeDec,
  heightDec,
  actorFramesPerDir,
  spriteTypeDec,
  textSpeedDec,
} from "./helpers";
import { hi, lo } from "../helpers/8bit";
import trimlines from "../helpers/trimlines";
import { SPRITE_TYPE_ACTOR } from "../../consts";
import { is16BitCType } from "../helpers/engineFields";
import { nextVariable } from "../helpers/variables";
import { ScriptEvent } from "../../store/features/entities/entitiesTypes";
import { Dictionary } from "@reduxjs/toolkit";
import { spriteSheetSymbol } from "./compileData2";

type ScriptOutput = string[];

interface ScriptBuilderEntity {
  id: string;
}

interface ScriptBuilderScene {
  id: string;
  actors: ScriptBuilderEntity[];
}

interface ScriptBuilderOptions {
  scene: ScriptBuilderScene;
  variables: string[];
  avatars: ScriptBuilderEntity[];
  entity?: ScriptBuilderEntity;
  compileEvents: (events: ScriptEvent[]) => void;
}

type ScriptBuilderMoveType = "horizontal" | "vertical" | "diagonal";

type ScriptBuilderComparisonOperator = "EQ" | "GT";

type ScriptBuilderPathFunction = () => void;

// - Helpers --------------

const getActorIndex = (actorId: string, scene: ScriptBuilderScene) => {
  return scene.actors.findIndex((a) => a.id === actorId) + 1;
};

const getVariableIndex = (variable: string, variables: string[]) => {
  return variables.findIndex((v) => v === variable);
};

const toValidLabel = (label: string): string => {
  return label.replace(/[^A-Za-z0-9]/g, "_");
};

// ------------------------

class ScriptBuilder {
  byteSize: number;
  output: ScriptOutput;
  options: ScriptBuilderOptions;
  dependencies: string[];
  nextLabel: number;
  actorIndex: number;
  stack: number[];
  stackPtr: number;
  labelStackSize: Dictionary<number>;

  constructor(
    output: ScriptOutput,
    options: Partial<ScriptBuilderOptions> & Pick<ScriptBuilderOptions, "scene">
  ) {
    this.byteSize = 0;
    this.output = output;
    this.options = {
      ...options,
      variables: options.variables || [],
      avatars: options.avatars || [],
      compileEvents: options.compileEvents || ((_e) => {}),
    };
    this.dependencies = [];
    this.nextLabel = 1;
    this.actorIndex = options.entity
      ? getActorIndex(options.entity.id, options.scene)
      : 0;
    this.stack = [];
    this.stackPtr = 0;
    this.labelStackSize = {};
  }

  toScriptString = (name: string) => {
    this._assertStackNeutral();
    return `.include "vm.inc"
${
  this.dependencies.length > 0
    ? `\n.globl ${this.dependencies.join(", ")}\n`
    : ""
}
.area _CODE_255

___bank_${name} = 255
.globl ___bank_${name}

_${name}::
${this.output.join("\n")}
`;
  };

  private _addDependency = (symbol: string) => {
    const dataSymbol = `_${symbol}`;
    if (!this.dependencies.includes(dataSymbol)) {
      this.dependencies.push(dataSymbol);
    }
  };

  private _addBankedFnDependency = (symbol: string) => {
    const bankSymbol = `b_${symbol}`;
    const dataSymbol = `_${symbol}`;
    if (!this.dependencies.includes(bankSymbol)) {
      this.dependencies.push(bankSymbol);
    }
    if (!this.dependencies.includes(dataSymbol)) {
      this.dependencies.push(dataSymbol);
    }
  };

  private _addBankedDataDependency = (symbol: string) => {
    const bankSymbol = `___bank_${symbol}`;
    const dataSymbol = `_${symbol}`;
    if (!this.dependencies.includes(bankSymbol)) {
      this.dependencies.push(bankSymbol);
    }
    if (!this.dependencies.includes(dataSymbol)) {
      this.dependencies.push(dataSymbol);
    }
  };

  private _addCmd = (cmd: string, ...args: Array<string | number>) => {
    this.output.push(this._prettyFormatCmd(cmd, args));
  };

  private _prettyFormatCmd = (cmd: string, args: Array<string | number>) => {
    if (args.length > 0) {
      return `        ${cmd.padEnd(
        Math.max(16, cmd.length + 1),
        " "
      )}${args.join(", ")}`;
    } else {
      return `        ${cmd}`;
    }
  };

  private _assertStackNeutral = (expected: number = 0) => {
    if (this.stackPtr !== expected) {
      const diff = this.stackPtr - expected;
      if (this.stackPtr > expected) {
        throw new Error(`Script was not stack neutral! Stack grew by ${diff}`);
      } else if (this.stackPtr < expected) {
        throw new Error(
          `Script was not stack neutral! Stack shrank by ${-diff}`
        );
      }
    }
  };

  private _assertLabelStackNeutral = (label: string) => {
    if (!this.labelStackSize[label]) {
      this.labelStackSize[label] = this.stackPtr;
    } else {
      if (this.stackPtr !== this.labelStackSize[label]) {
        throw new Error(
          `Jump to label with different stack size. First call size=${this.labelStackSize[label]}, this call size=${this.stackPtr}`
        );
      }
    }
  };

  private _getNextLabel = (): string => {
    const label = this.nextLabel++;
    return String(label);
  };

  _invoke = (fn: string, popNum: number, numArgs: number) => {
    this._addBankedFnDependency(fn);
    this._addCmd(
      "VM_INVOKE",
      `b_${fn}`,
      `_${fn}`,
      popNum,
      numArgs > 0 ? `.ARG${numArgs - 1}` : "0"
    );
    this.stackPtr -= popNum;
  };

  _stackPush = (value: number) => {
    this.stack[this.stackPtr++] = value;
    this._addCmd("VM_PUSH", value);
  };

  _stackPop = (num: number) => {
    this.stackPtr -= num;
    this._addCmd("VM_POP", num);
  };

  _set = (location: string, value: string | number) => {
    this._addCmd("VM_SET", location, value);
  };

  _setConst = (location: string, value: string | number) => {
    this._addCmd("VM_SET_CONST", location, value);
  };

  _string = (str: string) => {
    this._addCmd(`.asciz "${str.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`);
  };

  _label = (label: string) => {
    const _label = toValidLabel(label);
    this._assertLabelStackNeutral(_label);
    this.output.push(`${_label}$:`);
  };

  _jump = (label: string) => {
    const _label = toValidLabel(label);
    this._assertLabelStackNeutral(_label);
    this._addCmd("VM_JUMP", `${_label}$`);
  };

  _if = (
    operator: ScriptBuilderComparisonOperator,
    valueA: string | number,
    valueB: string | number,
    label: string,
    popNum: number
  ) => {
    this._addCmd(
      `VM_IF .${operator}`,
      `${valueA}, ${valueB}, ${label}$, ${popNum}`
    );
    this.stackPtr -= popNum;
  };

  _actorMoveTo = (addr: string) => {
    this._addCmd("VM_ACTOR_MOVE_TO", addr);
  };

  _loadText = (numInputs: number) => {
    this._addCmd("VM_LOAD_TEXT", `${numInputs}`);
  };

  _displayText = (avatar?: number) => {
    if (avatar) {
      const avatarSymbol = spriteSheetSymbol(avatar);
      this._addBankedDataDependency(avatarSymbol);
      this._addCmd("VM_LOAD_TEXT", `b_${avatarSymbol}`, avatarSymbol);
    } else {
      this._addCmd("VM_DISPLAY_TEXT", 0, 0);
    }
  };

  _overlayMoveTo = (x: number, y: number, speed: number) => {
    this._addCmd("VM_OVERLAY_MOVE_TO", x, y, speed);
  };

  _stop = () => {
    this._assertStackNeutral();
    this._addCmd("VM_STOP");
  };

  actorSetActive = (id: string) => {
    const output = this.output;
    const { scene, entity } = this.options;
    const newIndex =
      id === "$self$" && entity
        ? getActorIndex(entity.id, scene)
        : getActorIndex(id, scene);
    if (newIndex !== this.actorIndex) {
      this.actorIndex = newIndex;
      this._stackPush(this.actorIndex);
      this._set("ACTOR", ".ARG0");
      this._invoke("vm_actor_activate", 1, 1);
    }
  };

  actorMoveTo = (
    x: number,
    y: number,
    useCollisions: boolean,
    moveType: ScriptBuilderMoveType
  ) => {
    const stackPtr = this.stackPtr;
    this._setConst("^/ACTOR + 1/", x);
    this._setConst("^/ACTOR + 2/", y);
    this._setConst("^/ACTOR + 3/", useCollisions ? 1 : 0);
    this._setConst("^/ACTOR + 4/", moveTypeDec(moveType));
    this._actorMoveTo("ACTOR");
    this._assertStackNeutral(stackPtr);
  };

  // Timing

  nextFrameAwait = () => {
    const stackPtr = this.stackPtr;
    this._stackPush(1);
    this._invoke("wait_frames", 1, 1);
    this._assertStackNeutral(stackPtr);
  };

  wait = (frames: number) => {
    const stackPtr = this.stackPtr;
    this._stackPush(frames);
    this._invoke("wait_frames", 1, 1);
    this._assertStackNeutral(stackPtr);
  };

  // Text

  textDialogue = (inputText = " ", avatarId?: string) => {
    const { avatars } = this.options;
    let text = inputText;
    const maxPerLine = avatarId ? 16 : 18;
    text = trimlines(text, maxPerLine);

    this._loadText(0);
    this._string(text);
    this._overlayMoveTo(0, 12, 1);

    if (avatarId) {
      const avatarIndex = getSpriteIndex(avatarId, avatars);
      this._displayText(avatarIndex);
    } else {
      this._displayText();
    }
  };

  // Control Flow

  ifVariableTrue = (
    variable: string,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const { variables, compileEvents } = this.options;
    const variableIndex = getVariableIndex(variable, variables);
    const trueLabel = this._getNextLabel();
    const endLabel = this._getNextLabel();
    this._stackPush(1);
    this._if("EQ", variableIndex, ".ARG0", trueLabel, 1);
    this._compilePath(falsePath);
    this._jump(endLabel);
    this._label(trueLabel);
    this._compilePath(truePath);
    this._label(endLabel);
  };

  _compilePath = (path: ScriptEvent[] | ScriptBuilderPathFunction = []) => {
    const { compileEvents } = this.options;
    if (typeof path === "function") {
      path();
    } else if (path) {
      compileEvents(path);
    }
  };

  scriptEnd = () => {
    this._stop();
  };

  // Goto

  labelDefine = (name: string) => {
    this._label("_" + name);
  };

  labelGoto = (name: string) => {
    this._jump("_" + name);
  };

  /*

  actorMoveTo = (x = 0, y = 0, useCollisions = false, moveType) => {
    const output = this.output;
    output.push(cmd(ACTOR_MOVE_TO));
    output.push(x);
    output.push(y);
    output.push(useCollisions ? 1 : 0);
    output.push(moveTypeDec(moveType));
  };

  actorMoveRelative = (x = 0, y = 0, useCollisions = false, moveType) => {
    const output = this.output;
    output.push(cmd(ACTOR_MOVE_RELATIVE));
    output.push(Math.abs(x));
    output.push(x < 0 ? 1 : 0);
    output.push(Math.abs(y));
    output.push(y < 0 ? 1 : 0);
    output.push(useCollisions ? 1 : 0);
    output.push(moveTypeDec(moveType));
  };

  actorMoveToVariables = (
    variableX,
    variableY,
    useCollisions = false,
    moveType
  ) => {
    const output = this.output;
    this.vectorsLoad(variableX, variableY);
    output.push(cmd(ACTOR_MOVE_TO_VALUE));
    output.push(useCollisions ? 1 : 0);
    output.push(moveTypeDec(moveType));
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

  actorSetFrameToVariable = (variable) => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = this.getVariableIndex(variable, variables);
    output.push(cmd(ACTOR_SET_FRAME_TO_VALUE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
  };

  actorSetFlip = (flip) => {
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

  actorStopUpdate = () => {
    const output = this.output;
    output.push(cmd(ACTOR_STOP_UPDATE));
  };

  actorSetCollisions = (enabled) => {
    const output = this.output;
    output.push(cmd(ACTOR_SET_COLLISIONS));
    output.push(enabled ? 1 : 0);
  };

  actorSetAnimate = (enabled) => {
    const output = this.output;
    output.push(cmd(ACTOR_SET_ANIMATE));
    output.push(enabled ? 1 : 0);
  };

  actorSetSprite = (spriteSheetId) => {
    const output = this.output;
    const { sprites, scene } = this.options;
    const spriteOffset = getSpriteOffset(spriteSheetId, sprites, scene);
    const sprite = getSprite(spriteSheetId, sprites);
    output.push(cmd(ACTOR_SET_SPRITE));
    output.push(spriteOffset);
    output.push(sprite.frames);
  };

  // Player

  playerSetSprite = (spriteSheetId, persist) => {
    const output = this.output;
    const { sprites } = this.options;
    const spriteIndex = getSpriteIndex(spriteSheetId, sprites);
    output.push(cmd(PLAYER_SET_SPRITE));
    output.push(hi(spriteIndex));
    output.push(lo(spriteIndex));
    output.push(persist ? 1 : 0);
  };

  playerBounce = (height) => {
    const output = this.output;
    output.push(cmd(PLAYER_BOUNCE));
    output.push(heightDec(height));
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

  // Weapons

  weaponAttack = (
    spriteSheetId,
    offset = 10,
    collisionGroup,
    collisionMask
  ) => {
    const output = this.output;
    const { sprites, scene } = this.options;
    const spriteSceneIndex = getSpriteSceneIndex(spriteSheetId, sprites, scene);

    output.push(cmd(WEAPON_ATTACK));
    output.push(spriteSceneIndex);
    output.push(offset);
    output.push(
      (collisionMaskDec(collisionMask) << 4) + collisionGroupDec(collisionGroup)
    );
  };

  launchProjectile = (
    spriteSheetId,
    x,
    y,
    dirVariable,
    speed,
    collisionGroup,
    collisionMask
  ) => {
    const output = this.output;
    const { sprites, variables, scene } = this.options;
    const spriteSceneIndex = getSpriteSceneIndex(spriteSheetId, sprites, scene);
    const dirVariableIndex = this.getVariableIndex(dirVariable, variables);

    output.push(cmd(LAUNCH_PROJECTILE));
    output.push(spriteSceneIndex);
    output.push(hi(dirVariableIndex));
    output.push(lo(dirVariableIndex));
    output.push(moveSpeedDec(speed));
    output.push(
      (collisionMaskDec(collisionMask) << 4) + collisionGroupDec(collisionGroup)
    );
  };

  // Palette

  paletteSetBackground = (eventId, mask) => {
    const output = this.output;
    const { eventPaletteIndexes } = this.options;
    const paletteIndex = eventPaletteIndexes[eventId] || 0;
    output.push(cmd(PALETTE_SET_BACKGROUND));
    output.push(paletteMaskDec(mask));
    output.push(hi(paletteIndex));
    output.push(lo(paletteIndex));
  };

  paletteSetActor = (eventId) => {
    const output = this.output;
    const { eventPaletteIndexes } = this.options;
    const paletteIndex = eventPaletteIndexes[eventId] || 0;
    output.push(cmd(PALETTE_SET_ACTOR));
    output.push(hi(paletteIndex));
    output.push(lo(paletteIndex));
  };

  paletteSetUI = (eventId) => {
    const output = this.output;
    const { eventPaletteIndexes } = this.options;
    const paletteIndex = eventPaletteIndexes[eventId] || 0;
    output.push(cmd(PALETTE_SET_UI));
    output.push(hi(paletteIndex));
    output.push(lo(paletteIndex));
  };

  // Text

  textDialogue = (inputText = " ", avatarId) => {
    const output = this.output;
    const { strings, avatars, variables, event } = this.options;
    let text = this.replaceVariables(inputText, variables, event);

    const maxPerLine = avatarId ? 16 : 18;
    text = trimlines(text, maxPerLine);

    let stringIndex = strings.indexOf(text);
    if (stringIndex === -1) {
      strings.push(text);
      stringIndex = strings.length - 1;
    }
    if (avatarId) {
      const avatarIndex = getSpriteIndex(avatarId, avatars);
      output.push(cmd(TEXT_WITH_AVATAR));
      output.push(`__REPLACE:STRING_BANK:${stringIndex}`);
      output.push(`__REPLACE:STRING_HI:${stringIndex}`);
      output.push(`__REPLACE:STRING_LO:${stringIndex}`);
      output.push(avatarIndex);
    } else {
      output.push(cmd(TEXT));
      output.push(`__REPLACE:STRING_BANK:${stringIndex}`);
      output.push(`__REPLACE:STRING_HI:${stringIndex}`);
      output.push(`__REPLACE:STRING_LO:${stringIndex}`);
    }
  };

  textChoice = (setVariable, args) => {
    const output = this.output;
    const { strings, variables, event } = this.options;

    const trueText = trimlines(args.trueText || "", 17, 1) || "Choice A";
    const falseText = trimlines(args.falseText || "", 17, 1) || "Choice B";
    const choiceText = `${trueText}\n${falseText}`;

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
    output.push(`__REPLACE:STRING_BANK:${stringIndex}`);
    output.push(`__REPLACE:STRING_HI:${stringIndex}`);
    output.push(`__REPLACE:STRING_LO:${stringIndex}`);
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
      .map(
        (option, index) => trimlines(option || "", 6, 1) || `Item ${index + 1}`
      )
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
    output.push(`__REPLACE:STRING_BANK:${stringIndex}`);
    output.push(`__REPLACE:STRING_HI:${stringIndex}`);
    output.push(`__REPLACE:STRING_LO:${stringIndex}`);
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

  textSetAnimSpeed = (
    speedIn,
    speedOut,
    textSpeed = 1,
    allowFastForward = true
  ) => {
    const output = this.output;
    output.push(cmd(TEXT_SET_ANIM_SPEED));
    output.push(speedIn);
    output.push(speedOut);
    output.push(textSpeedDec(textSpeed));
    output.push(allowFastForward ? 1 : 0);
  };

  // Variables

  getVariableIndex = (variable = "0", variables) => {
    if (["L0", "L1", "L2", "L3", "L4", "L5"].indexOf(variable) > -1) {
      const { entity } = this.options;
      return getVariableIndex(`${entity.id}__${variable}`, variables);
    }
    return getVariableIndex(variable, variables);
  };

  variableSetToTrue = (variable) => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = this.getVariableIndex(variable, variables);
    output.push(cmd(SET_TRUE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
  };

  variableSetToFalse = (variable) => {
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
  */

  //   variableSetToProperty = (variable, property) => {
  //     const output = this.output;
  //     const { variables, scene, entity } = this.options;
  //     const variableIndex = this.getVariableIndex(variable, variables);
  //     const actorValue = property && property.replace(/:.*/, "");
  //     const propertyValue = property && property.replace(/.*:/, "");
  //     const actorIndex =
  //       actorValue === "$self$"
  //         ? getActorIndex(entity.id, scene)
  //         : getActorIndex(actorValue, scene);
  //     const properties = [
  //       "xpos",
  //       "ypos",
  //       "direction",
  //       "moveSpeed",
  //       "animSpeed",
  //       "frame",
  //     ];
  //     const propertyIndex = properties.indexOf(propertyValue);
  //     output.push(cmd(SET_PROPERTY));
  //     output.push(hi(variableIndex));
  //     output.push(lo(variableIndex));
  //     output.push(Math.max(0, propertyIndex));
  //     output.push(actorIndex);
  //   };

  /*
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

  variablesAdd = (setVariable, otherVariable, clamp) => {
    const output = this.output;
    this.vectorsLoad(setVariable, otherVariable);
    output.push(cmd(MATH_ADD_VALUE));
    output.push(clamp ? 1 : 0);
  };

  variablesSub = (setVariable, otherVariable, clamp) => {
    const output = this.output;
    this.vectorsLoad(setVariable, otherVariable);
    output.push(cmd(MATH_SUB_VALUE));
    output.push(clamp ? 1 : 0);
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

  variableInc = (variable) => {
    const output = this.output;
    const { variables } = this.options;
    const variableIndex = this.getVariableIndex(variable, variables);
    output.push(cmd(INC_VALUE));
    output.push(hi(variableIndex));
    output.push(lo(variableIndex));
  };

  variableDec = (variable) => {
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

  temporaryEntityVariable = (index) => {
    const { entity } = this.options;
    return `${entity.id}__${index}`;
  };

  variableFromUnion = (unionValue, defaultVariable) => {
    if (unionValue.type === "variable") {
      return unionValue.value;
    }
    this.variableSetToUnionValue(defaultVariable, unionValue);
    return defaultVariable;
  };

  variableSetToUnionValue = (variable, unionValue) => {
    if (unionValue.type === "number") {
      this.variableSetToValue(variable, unionValue.value);
      return variable;
    }
    if (unionValue.type === "direction") {
      this.variableSetToValue(variable, dirDec(unionValue.value));
      return variable;
    }
    if (unionValue.type === "property") {
      this.variableSetToProperty(variable, unionValue.value);
      return variable;
    }
    if (unionValue.type === "variable") {
      this.variableCopy(variable, unionValue.value);
      return variable;
    }
    throw new Error(`Union type "${unionValue.type}" unknown.`);
  };

  // Engine Fields

  engineFieldSetToValue = (key, value) => {
    const output = this.output;
    const { engineFields } = this.options;
    const engineField = engineFields[key];
    if (engineField !== undefined) {
      const cType = engineField.field.cType;
      let newValue = value;
      if (newValue === "" || newValue === undefined) {
        newValue = engineField.field.defaultValue || 0;
      }
      if (newValue === true) {
        newValue = 1;
      }
      if (newValue === false) {
        newValue = 0;
      }
      if (is16BitCType(cType)) {
        if (newValue < 0) {
          // Convert negative to two's complement
          newValue = 0xffff & ~(-newValue - 1);
        }
        output.push(cmd(ENGINE_FIELD_UPDATE_WORD));
        output.push(hi(engineField.offset));
        output.push(lo(engineField.offset));
        output.push(hi(newValue));
        output.push(lo(newValue));
      } else {
        if (newValue < 0) {
          // Convert negative to two's complement
          newValue = 0xff & ~(-newValue - 1);
        }
        output.push(cmd(ENGINE_FIELD_UPDATE));
        output.push(hi(engineField.offset));
        output.push(lo(engineField.offset));
        output.push(newValue);
      }
    }
  };

  engineFieldSetToVariable = (key, variable) => {
    const output = this.output;
    const { engineFields, variables } = this.options;
    const engineField = engineFields[key];
    if (engineField !== undefined) {
      const cType = engineField.field.cType;
      if (is16BitCType(cType)) {
        const loVariable = nextVariable(variable);
        const hiIndex = this.getVariableIndex(variable, variables);
        const loIndex = this.getVariableIndex(loVariable, variables);
        output.push(cmd(ENGINE_FIELD_UPDATE_VAR_WORD));
        output.push(hi(engineField.offset));
        output.push(lo(engineField.offset));
        output.push(hi(hiIndex));
        output.push(lo(hiIndex));
        output.push(hi(loIndex));
        output.push(lo(loIndex));
      } else {
        const variableIndex = this.getVariableIndex(variable, variables);
        output.push(cmd(ENGINE_FIELD_UPDATE_VAR));
        output.push(hi(engineField.offset));
        output.push(lo(engineField.offset));
        output.push(hi(variableIndex));
        output.push(lo(variableIndex));
      }
    }
  };

  engineFieldStoreInVariable = (key, variable) => {
    const output = this.output;
    const { engineFields, variables } = this.options;
    const engineField = engineFields[key];
    if (engineField !== undefined) {
      const cType = engineField.field.cType;
      if (is16BitCType(cType)) {
        const loVariable = nextVariable(variable);
        const hiIndex = this.getVariableIndex(variable, variables);
        const loIndex = this.getVariableIndex(loVariable, variables);
        output.push(cmd(ENGINE_FIELD_STORE_WORD));
        output.push(hi(engineField.offset));
        output.push(lo(engineField.offset));
        output.push(hi(loIndex));
        output.push(lo(loIndex));
        output.push(hi(hiIndex));
        output.push(lo(hiIndex));
      } else {
        const variableIndex = this.getVariableIndex(variable, variables);
        output.push(cmd(ENGINE_FIELD_STORE));
        output.push(hi(engineField.offset));
        output.push(lo(engineField.offset));
        output.push(hi(variableIndex));
        output.push(lo(variableIndex));
      }
    }
  };

  // Scenes

  sceneSwitch = (sceneId, x = 0, y = 0, direction = "down", fadeSpeed = 2) => {
    const output = this.output;
    const { scenes } = this.options;
    const sceneIndex = scenes.findIndex((s) => s.id === sceneId);
    if (sceneIndex > -1) {
      output.push(cmd(SWITCH_SCENE));
      output.push(hi(sceneIndex));
      output.push(lo(sceneIndex));
      output.push(x);
      output.push(y);
      output.push(dirDec(direction));
      output.push(fadeSpeed);
      this.scriptEnd();
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
      output,
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
      output,
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
      output,
    });
  };

  ifInput = (input, truePath = [], falsePath = []) => {
    const output = this.output;
    output.push(cmd(IF_INPUT));
    output.push(inputDec(input));
    compileConditional(truePath, falsePath, {
      ...this.options,
      output,
    });
  };

  ifActorAtPosition = (x, y, truePath = [], falsePath = []) => {
    const output = this.output;
    output.push(cmd(IF_ACTOR_AT_POSITION));
    output.push(x || 0);
    output.push(y || 0);
    compileConditional(truePath, falsePath, {
      ...this.options,
      output,
    });
  };

  ifActorDirection = (direction, truePath = [], falsePath = []) => {
    const output = this.output;
    output.push(cmd(IF_ACTOR_DIRECTION));
    output.push(dirDec(direction));
    compileConditional(truePath, falsePath, {
      ...this.options,
      output,
    });
  };

  ifActorRelativeToActor = (
    operation,
    otherId,
    truePath = [],
    falsePath = []
  ) => {
    const output = this.output;
    const { scene, entity } = this.options;
    const otherIndex =
      otherId === "$self$"
        ? getActorIndex(entity.id, scene)
        : getActorIndex(otherId, scene);
    output.push(cmd(IF_ACTOR_RELATIVE_TO_ACTOR));
    output.push(actorRelativeDec(operation));
    output.push(otherIndex);
    compileConditional(truePath, falsePath, {
      ...this.options,
      output,
    });
  };

  ifDataSaved = (truePath = [], falsePath = []) => {
    const output = this.output;
    output.push(cmd(IF_SAVED_DATA));
    compileConditional(truePath, falsePath, {
      ...this.options,
      output,
    });
  };

  // Goto

  labelDefine = (name) => {
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

  labelGoto = (name) => {
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

  inputAwait = (input) => {
    const output = this.output;
    output.push(cmd(AWAIT_INPUT));
    output.push(inputDec(input));
  };

  inputScriptSet = (input, persist, script) => {
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
    output.push(persist ? 1 : 0);
    output.push(bankPtr.bank);
    output.push(hi(bankPtr.offset));
    output.push(lo(bankPtr.offset));
  };

  inputScriptRemove = (input) => {
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

  cameraShake = (shouldShakeX, shouldShakeY, frames) => {
    const output = this.output;
    output.push(cmd(CAMERA_SHAKE));
    output.push(shouldShakeX ? 1 : 0);
    output.push(shouldShakeY ? 1 : 0);
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

  soundStartTone = (period = 1600, toneFrames = 30) => {
    const output = this.output;

    // start playing tone
    output.push(cmd(SOUND_START_TONE));
    output.push(hi(period));
    output.push(lo(period));
    output.push(lo(toneFrames));
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

  wait = (frames) => {
    const output = this.output;
    output.push(cmd(WAIT));
    output.push(frames);
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

  // Device

  ifColorSupported = (truePath = [], falsePath = []) => {
    const output = this.output;
    output.push(cmd(IF_COLOR_SUPPORTED));
    compileConditional(truePath, falsePath, {
      ...this.options,
      output,
    });
  };

  // Helpers

  getSprite = (name, plugin = "") => {
    const { sprites } = this.options;
    const searchName = name.toUpperCase();
    const searchPlugin = plugin.toUpperCase();
    const sprite = sprites.find((s) => {
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

  getActor = (name) => {
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

  getActorById = (id) => {
    const output = this.output;
    const { scene, entity } = this.options;
    return id === "$self$" ? getActor(entity.id, scene) : getActor(id, scene);
  };

  replaceVariables = (string, variables, event) => {
    const getVariableSymbol = (index) => `$${String(index).padStart(2, "0")}$`;
    const getVariableCharSymbol = (index) =>
      `#${String(index).padStart(2, "0")}#`;

    return (
      string
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
        // Replace Temp variables
        .replace(/\$(T[0-9])\$/g, (match, tempVariable) => {
          const index = this.getVariableIndex(tempVariable, variables);
          return getVariableSymbol(index);
        })
        // Replace Custom Event variables
        .replace(/\$V([0-9])\$/g, (match, customVariable) => {
          const mappedVariable = event.args[`$variable[${customVariable}]$`];
          const index = this.getVariableIndex(mappedVariable, variables);
          return getVariableSymbol(index);
        })
        // Replace Global variable characters
        .replace(/#([0-9]+)#/g, (match, globalVariable) => {
          const index = this.getVariableIndex(globalVariable, variables);
          return getVariableCharSymbol(index);
        })
        // Replace Local variable characters
        .replace(/#(L[0-9])#/g, (match, localVariable) => {
          const index = this.getVariableIndex(localVariable, variables);
          return getVariableCharSymbol(index);
        })
        // Replace Temp variable characters
        .replace(/#(T[0-9])#/g, (match, tempVariable) => {
          const index = this.getVariableIndex(tempVariable, variables);
          return getVariableCharSymbol(index);
        })
        // Replace Custom Event variable characters
        .replace(/#V([0-9])#/g, (match, customVariable) => {
          const mappedVariable = event.args[`$variable[${customVariable}]$`];
          const index = this.getVariableIndex(mappedVariable, variables);
          return getVariableCharSymbol(index);
        })
    );

  };
*/
}

export default ScriptBuilder;
