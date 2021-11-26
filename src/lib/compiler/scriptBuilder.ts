import { animSpeedDec, inputDec, textSpeedDec } from "./helpers";
import { decHex, decOct, hexDec } from "../helpers/8bit";
import trimlines from "../helpers/trimlines";
import { is16BitCType } from "../helpers/engineFields";
import {
  globalVariableName,
  localVariableName,
  tempVariableName,
} from "../helpers/variables";
import {
  ActorDirection,
  CustomEvent,
  Palette,
  ScriptEvent,
  Variable,
} from "store/features/entities/entitiesTypes";
import { Dictionary } from "@reduxjs/toolkit";
import { EngineFieldSchema } from "store/features/engine/engineState";
import {
  initialState as initialSettingsState,
  SettingsState,
} from "store/features/settings/settingsState";
import { FunctionSymbol, OperatorSymbol } from "../rpn/types";
import tokenize from "../rpn/tokenizer";
import shuntingYard from "../rpn/shuntingYard";
import { PrecompiledFontData } from "./compileFonts";
import { encodeString } from "../helpers/encodings";
import { PrecompiledMusicTrack } from "./compileMusic";
import { emoteSymbol, spriteSheetSymbol } from "./compileData2";
import { DMG_PALETTE } from "../../consts";
import {
  isPropertyField,
  isVariableField,
  isActorField,
  mapEvents,
} from "../helpers/eventSystem";
import compileEntityEvents from "./compileEntityEvents";
import { toCSymbol } from "../helpers/cGeneration";
import {
  isUnionPropertyValue,
  isUnionVariableValue,
} from "store/features/entities/entitiesHelpers";
import { lexText } from "lib/fonts/lexText";

type ScriptOutput = string[];

interface ScriptBuilderEntity {
  id: string;
}

interface ScriptBuilderScene {
  id: string;
  actors: ScriptBuilderEntity[];
  triggers: ScriptBuilderEntity[];
  projectiles: ScriptBuilderProjectile[];
}

interface ScriptBuilderProjectile {
  hash: string;
  spriteSheetId: string;
  collisionGroup: string;
  collisionMask: string[];
}

type ScriptBuilderEntityType = "scene" | "actor" | "trigger";

type ScriptBuilderStackVariable = string | number;

interface ScriptBuilderFunctionArgLookup {
  actor: Dictionary<string>;
  variable: Dictionary<string>;
}

interface ScriptBuilderOptions {
  scene: ScriptBuilderScene;
  sceneIndex: number;
  entityIndex: number;
  entityType: ScriptBuilderEntityType;
  variablesLookup: VariablesLookup;
  variableAliasLookup: Dictionary<string>;
  scenes: ScriptBuilderScene[];
  sprites: ScriptBuilderEntity[];
  statesOrder: string[];
  stateReferences: string[];
  fonts: PrecompiledFontData[];
  defaultFontId: string;
  music: PrecompiledMusicTrack[];
  avatars: ScriptBuilderEntity[];
  emotes: ScriptBuilderEntity[];
  palettes: Palette[];
  customEvents: CustomEvent[];
  entity?: ScriptBuilderEntity;
  engineFields: Dictionary<EngineFieldSchema>;
  settings: SettingsState;
  additionalScripts: Dictionary<{
    symbol: string;
    compiledScript: string;
  }>;
  symbols: Dictionary<string>;
  argLookup: ScriptBuilderFunctionArgLookup;
  compileEvents: (self: ScriptBuilder, events: ScriptEvent[]) => void;
}

type ScriptBuilderMoveType = "horizontal" | "vertical" | "diagonal";

type ScriptBuilderComparisonOperator =
  | ".EQ"
  | ".NE"
  | ".GT"
  | ".GTE"
  | ".LT"
  | ".LTE"
  | ".AND"
  | ".OR";

type ScriptBuilderOverlayWaitFlag =
  | ".UI_WAIT_WINDOW"
  | ".UI_WAIT_TEXT"
  | ".UI_WAIT_BTN_A"
  | ".UI_WAIT_BTN_B"
  | ".UI_WAIT_BTN_ANY";

type ScriptBuilderPaletteType = ".PALETTE_BKG" | ".PALETTE_SPRITE";

type ScriptBuilderChoiceFlag = ".UI_MENU_LAST_0" | ".UI_MENU_CANCEL_B";

type ScriptBuilderAxis = "x" | "y";

type ScriptBuilderRPNOperation =
  | ".ADD"
  | ".SUB"
  | ".MUL"
  | ".DIV"
  | ".MOD"
  | ".B_AND"
  | ".B_OR"
  | ".B_XOR"
  | ".B_NOT"
  | ".ABS"
  | ".MIN"
  | ".MAX"
  | ScriptBuilderComparisonOperator;

type ScriptBuilderOverlayMoveSpeed =
  | number
  | ".OVERLAY_IN_SPEED"
  | ".OVERLAY_OUT_SPEED"
  | ".OVERLAY_SPEED_INSTANT";

type ScriptBuilderUIColor = 0 | ".UI_COLOR_WHITE" | ".UI_COLOR_BLACK";

type ScriptBuilderUnionValue =
  | {
      type: "number";
      value: number;
    }
  | {
      type: "property";
      value: string;
    }
  | {
      type: "direction";
      value: string;
    }
  | {
      type: "variable";
      value: string;
    };

type ScriptBuilderPathFunction = () => void;

type VariablesLookup = { [name: string]: Variable | undefined };

// - Helpers --------------

const getActorIndex = (actorId: string, scene: ScriptBuilderScene) => {
  return (scene.actors || []).findIndex((a) => a.id === actorId) + 1;
};

const getPalette = (
  palettes: Palette[],
  id: string,
  fallbackId: string
): Palette => {
  if (id === "dmg") {
    return DMG_PALETTE as Palette;
  }
  return (
    palettes.find((p) => p.id === id) ||
    palettes.find((p) => p.id === fallbackId) ||
    (DMG_PALETTE as Palette)
  );
};

export const getVariableId = (
  variable: string,
  entity?: ScriptBuilderEntity
) => {
  if (isVariableLocal(variable)) {
    if (entity) {
      return `${entity.id}__${variable}`;
    }
  } else if (isVariableTemp(variable)) {
    return variable;
  }
  return String(parseInt(variable || "0"));
};

export const toVariableNumber = (variable: string) => {
  return variable.replace(/[^0-9]/g, "");
};

export const isVariableLocal = (variable: string) => {
  return ["L0", "L1", "L2", "L3", "L4", "L5"].indexOf(variable) > -1;
};

export const isVariableTemp = (variable: string) => {
  return ["T0", "T1"].indexOf(variable) > -1;
};

const toValidLabel = (label: string): string => {
  return label.replace(/[^A-Za-z0-9]/g, "_");
};

const buildOverlayWaitCondition = (flags: ScriptBuilderOverlayWaitFlag[]) => {
  return unionFlags(flags, ".UI_WAIT_NONE");
};

const unionFlags = (flags: string[], defaultValue = "0") => {
  if (flags.length === 0) {
    return defaultValue;
  }
  if (flags.length === 1) {
    return flags[0];
  }
  return `^/(${flags.join(" | ")})/`;
};

const toASMVar = (symbol: string) => {
  return symbol.toUpperCase().replace(/[^A-Z0-9]/g, "_");
};

const toASMDir = (direction: string) => {
  if (direction === "left") {
    return ".DIR_LEFT";
  } else if (direction === "right") {
    return ".DIR_RIGHT";
  } else if (direction === "up") {
    return ".DIR_UP";
  } else if (direction === "down") {
    return ".DIR_DOWN";
  }
  return ".DIR_DOWN";
};

const toASMMoveFlags = (moveType: string, useCollisions: boolean) => {
  return unionFlags(
    ([] as string[]).concat(
      useCollisions ? ".ACTOR_ATTR_CHECK_COLL" : [],
      moveType === "horizontal" ? ".ACTOR_ATTR_H_FIRST" : [],
      moveType === "diagonal" ? ".ACTOR_ATTR_DIAGONAL" : []
    )
  );
};

const toASMCameraLock = (axis: ScriptBuilderAxis[]) => {
  return unionFlags(
    ([] as string[]).concat(
      axis.includes("x") ? ".CAMERA_LOCK_X" : [],
      axis.includes("y") ? ".CAMERA_LOCK_Y" : []
    )
  );
};

const dirToAngle = (direction: string) => {
  if (direction === "left") {
    return 192;
  } else if (direction === "right") {
    return 64;
  } else if (direction === "up") {
    return 0;
  } else if (direction === "down") {
    return 128;
  }
  return 0;
};

const toScriptOperator = (
  operator: OperatorSymbol
): ScriptBuilderRPNOperation => {
  switch (operator) {
    case "+":
      return ".ADD";
    case "-":
    case "u":
      return ".SUB";
    case "/":
      return ".DIV";
    case "*":
      return ".MUL";
    case "%":
      return ".MOD";
    case "&":
      return ".B_AND";
    case "|":
      return ".B_OR";
    case "^":
      return ".B_XOR";
    case "~":
      return ".B_NOT";
    case "==":
      return ".EQ";
    case "!=":
      return ".NE";
    case "<":
      return ".LT";
    case "<=":
      return ".LTE";
    case ">":
      return ".GT";
    case ">=":
      return ".GTE";
    case "&&":
      return ".AND";
    case "||":
      return ".OR";
  }
  assertUnreachable(operator);
};

const funToScriptOperator = (
  fun: FunctionSymbol
): ScriptBuilderRPNOperation => {
  switch (fun) {
    case "min":
      return ".MIN";
    case "max":
      return ".MAX";
    case "abs":
      return ".ABS";
  }
  assertUnreachable(fun);
};

const textCodeSetSpeed = (speed: number): string => {
  return `\\001\\${decOct(speed + 1)}`;
};

const textCodeSetFont = (fontIndex: number): string => {
  return `\\002\\${decOct(fontIndex + 1)}`;
};

const textCodeGoto = (x: number, y: number): string => {
  return `\\003\\${decOct(x)}\\${decOct(y)}`;
};

const textCodeGotoRel = (x: number, y: number): string => {
  return `\\004\\${decOct(x)}\\${decOct(y)}`;
};

const assertUnreachable = (_x: never): never => {
  throw new Error("Didn't expect to get here");
};

export const toProjectileHash = ({
  spriteSheetId,
  spriteStateId,
  speed,
  animSpeed,
  lifeTime,
  initialOffset,
  collisionGroup,
  collisionMask,
}: {
  spriteSheetId: string;
  spriteStateId: string;
  speed: number;
  animSpeed: number;
  lifeTime: number;
  initialOffset: number;
  collisionGroup: string;
  collisionMask: string[];
}) =>
  JSON.stringify({
    spriteSheetId,
    spriteStateId,
    speed,
    animSpeed,
    lifeTime,
    initialOffset,
    collisionGroup,
    collisionMask: [...collisionMask].sort(),
  });

const MAX_DIALOGUE_LINES = 5;
const CAMERA_LOCK_X = 0x1;
const CAMERA_LOCK_Y = 0x2;
const CAMERA_LOCK_XY = 0x3;
const CAMERA_UNLOCK = 0x0;

// ------------------------

class ScriptBuilder {
  byteSize: number;
  output: ScriptOutput;
  options: ScriptBuilderOptions;
  dependencies: string[];
  nextLabel: number;
  actorIndex: number;
  stackPtr: number;
  labelStackSize: Dictionary<number>;
  includeActor: boolean;
  includeParams: number[];
  headers: string[];

  constructor(
    output: ScriptOutput,
    options: Partial<ScriptBuilderOptions> & Pick<ScriptBuilderOptions, "scene">
  ) {
    this.byteSize = 0;
    this.output = output;
    this.options = {
      ...options,
      sceneIndex: options.sceneIndex || 0,
      entityIndex: options.entityIndex || 0,
      entityType: options.entityType || "scene",
      variablesLookup: options.variablesLookup || {},
      variableAliasLookup: options.variableAliasLookup || {},
      engineFields: options.engineFields || {},
      scenes: options.scenes || [],
      sprites: options.sprites || [],
      statesOrder: options.statesOrder || [],
      stateReferences: options.stateReferences || [],
      fonts: options.fonts || [],
      defaultFontId: options.defaultFontId || "",
      music: options.music || [],
      avatars: options.avatars || [],
      emotes: options.emotes || [],
      palettes: options.palettes || [],
      customEvents: options.customEvents || [],
      additionalScripts: options.additionalScripts || {},
      symbols: options.symbols || {},
      argLookup: options.argLookup || { actor: {}, variable: {} },
      compileEvents: options.compileEvents || ((_self, _e) => {}),
      settings: options.settings || initialSettingsState,
    };
    this.dependencies = [];
    this.nextLabel = 1;
    this.actorIndex = options.entity
      ? getActorIndex(options.entity.id, options.scene)
      : 0;
    this.stackPtr = 0;
    this.labelStackSize = {};
    this.includeActor = false;
    this.includeParams = [];
    this.headers = ["vm.i", "data/game_globals.i"];
  }

  // --------------------------------------------------------------------------
  // Private methods

  private _includeHeader = (filename: string) => {
    if (!this.headers.includes(filename)) {
      this.headers.push(filename);
    }
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

  private _addComment = (comment: string) => {
    this.output.push(`        ; ${comment}`);
  };

  private _addNL = () => {
    this.output.push(``);
  };

  private _addCmd = (
    cmd: string,
    ...args: Array<ScriptBuilderStackVariable>
  ) => {
    this.output.push(this._padCmd(cmd, args.join(", "), 8, 24));
  };

  private _prettyFormatCmd = (
    cmd: string,
    args: Array<ScriptBuilderStackVariable>
  ) => {
    if (args.length > 0) {
      return `        ${cmd.padEnd(
        Math.max(24, cmd.length + 1),
        " "
      )}${args.join(", ")}`;
    } else {
      return `        ${cmd}`;
    }
  };

  private _padCmd = (
    cmd: string,
    args: string,
    nPadStart: number,
    nPadCmd: number
  ) => {
    const startPadding = "".padStart(nPadStart);
    if (args.length > 0) {
      return `${startPadding}${cmd.padEnd(
        Math.max(nPadCmd, cmd.length + 1),
        " "
      )}${args}`;
    } else {
      return `${startPadding}${cmd}`;
    }
  };

  private _assertStackNeutral = (expected = 0) => {
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

  private _stackPushEvaluatedExpression = (expression: string) => {
    const tokens = tokenize(expression);
    const rpnTokens = shuntingYard(tokens);
    if (rpnTokens.length > 0) {
      let rpn = this._rpn();
      let token = rpnTokens.shift();
      while (token) {
        if (token.type === "VAL") {
          rpn = rpn.int16(token.value);
        } else if (token.type === "VAR") {
          const ref = this.getVariableAlias(token.symbol.replace(/\$/g, ""));
          rpn = rpn.ref(ref);
        } else if (token.type === "FUN") {
          const op = funToScriptOperator(token.function);
          rpn = rpn.operator(op);
        } else if (token.type === "OP") {
          const op = toScriptOperator(token.operator);
          rpn = rpn.operator(op);
        }
        token = rpnTokens.shift();
      }
      rpn.stop();
    } else {
      this._stackPushConst(0);
    }
  };

  private _expressionToHumanReadable = (expression: string) => {
    return expression
      .replace(/\s+/g, "")
      .replace(/\n/g, "")
      .replace(/(\$L[0-9]\$|\$T[0-1]\$|\$[0-9]+\$)/g, (symbol) => {
        return this.getVariableAlias(symbol.replace(/\$/g, ""));
      });
  };

  private _getFontIndex = (fontId: string) => {
    const { fonts } = this.options;
    const index = fonts.findIndex((f) => f.id === fontId);
    if (index === -1) {
      return 0;
    }
    return index;
  };

  // --------------------------------------------------------------------------
  // Low Level GB Studio Assembly Operations

  _vmLock = () => {
    this._addCmd("VM_LOCK");
  };

  _vmUnlock = () => {
    this._addCmd("VM_UNLOCK");
  };

  _raiseException = (exception: string, numArgs: number) => {
    this._addCmd("VM_RAISE", exception, numArgs);
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

  _stackPushConst = (value: number | string, comment?: string) => {
    this.stackPtr++;
    this._addCmd("VM_PUSH_CONST", value + (comment ? ` ; ${comment}` : ""));
  };

  _stackPush = (location: ScriptBuilderStackVariable) => {
    this.stackPtr++;
    this._addCmd("VM_PUSH_VALUE", location);
  };

  _stackPushInd = (location: ScriptBuilderStackVariable) => {
    this.stackPtr++;
    this._addCmd("VM_PUSH_VALUE_IND", location);
  };

  _stackPop = (num: number) => {
    this.stackPtr -= num;
    this._addCmd("VM_POP", num);
  };

  _set = (
    location: ScriptBuilderStackVariable,
    value: ScriptBuilderStackVariable
  ) => {
    this._addCmd("VM_SET", location, value);
  };

  _setConst = (
    location: ScriptBuilderStackVariable,
    value: ScriptBuilderStackVariable
  ) => {
    this._addCmd("VM_SET_CONST", location, value);
  };

  _setInd = (
    location: ScriptBuilderStackVariable,
    value: ScriptBuilderStackVariable
  ) => {
    this._addCmd("VM_SET_INDIRECT", location, value);
  };

  _setVariable = (variable: string, value: ScriptBuilderStackVariable) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isArg(variableAlias)) {
      this._setInd(this._stackOffset(variableAlias), value);
    } else {
      this._set(variableAlias, value);
    }
  };

  _setToVariable = (location: ScriptBuilderStackVariable, variable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isArg(variableAlias)) {
      this._stackPushInd(this._stackOffset(variableAlias));
      this._set(location, ".ARG0");
      this._stackPop(1);
    } else {
      this._set(location, variableAlias);
    }
  };

  _setVariableToVariable = (variableA: string, variableB: string) => {
    const variableAliasA = this.getVariableAlias(variableA);
    const variableAliasB = this.getVariableAlias(variableB);

    let dest = variableAliasB;

    if (this._isArg(variableAliasB)) {
      this._stackPushInd(this._stackOffset(variableAliasB));
      dest = ".ARG0";
    }

    if (this._isArg(variableAliasA)) {
      this._setInd(this._stackOffset(variableAliasA), dest);
    } else {
      this._set(variableAliasA, dest);
    }

    if (this._isArg(variableAliasB)) {
      this._stackPop(1);
    }
  };

  _setVariableConst = (variable: string, value: ScriptBuilderStackVariable) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isArg(variableAlias)) {
      this._stackPushConst(value);
      this._setInd(this._stackOffset(variableAlias), ".ARG0");
      this._stackPop(1);
    } else {
      this._setConst(variableAlias, value);
    }
  };

  _getInd = (
    location: ScriptBuilderStackVariable,
    value: ScriptBuilderStackVariable
  ) => {
    this._addCmd("VM_GET_INDIRECT", location, value);
  };

  _setMemInt8 = (cVariable: string, location: ScriptBuilderStackVariable) => {
    this._addDependency(cVariable);
    this._addCmd("VM_SET_INT8", `_${cVariable}`, location);
  };

  _setMemInt16 = (cVariable: string, location: ScriptBuilderStackVariable) => {
    this._addDependency(cVariable);
    this._addCmd("VM_SET_INT16", `_${cVariable}`, location);
  };

  _setMemInt8ToVariable = (cVariable: string, variable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    this._addDependency(cVariable);
    if (this._isArg(variableAlias)) {
      this._stackPushInd(this._stackOffset(variableAlias));
      this._setMemInt8(cVariable, ".ARG0");
      this._stackPop(1);
    } else {
      this._setMemInt8(cVariable, variableAlias);
    }
  };

  _setMemInt16ToVariable = (cVariable: string, variable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    this._addDependency(cVariable);
    if (this._isArg(variableAlias)) {
      this._stackPushInd(this._stackOffset(variableAlias));
      this._setMemInt16(cVariable, ".ARG0");
      this._stackPop(1);
    } else {
      this._setMemInt16(cVariable, variableAlias);
    }
  };

  _setConstMemInt8 = (cVariable: string, value: number) => {
    this._addDependency(cVariable);
    this._addCmd("VM_SET_CONST_INT8", `_${cVariable}`, value);
  };

  _setConstMemInt16 = (cVariable: string, value: number) => {
    this._addDependency(cVariable);
    this._addCmd("VM_SET_CONST_INT16", `_${cVariable}`, value);
  };

  _getMemUInt8 = (location: ScriptBuilderStackVariable, cVariable: string) => {
    this._addCmd("VM_GET_UINT8", location, `_${cVariable}`);
  };

  _getMemInt8 = (location: ScriptBuilderStackVariable, cVariable: string) => {
    this._addCmd(
      "VM_GET_INT8",
      location,
      cVariable.startsWith("^") ? cVariable : `_${cVariable}`
    );
  };

  _getMemInt16 = (location: ScriptBuilderStackVariable, cVariable: string) => {
    this._addCmd(
      "VM_GET_INT16",
      location,
      cVariable.startsWith("^") ? cVariable : `_${cVariable}`
    );
  };

  _setVariableMemInt8 = (variable: string, cVariable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isArg(variableAlias)) {
      this._stackPushConst(0);
      this._getMemInt8(".ARG0", cVariable);
      this._setInd(this._stackOffset(variableAlias), ".ARG0");
      this._stackPop(1);
    } else {
      this._getMemInt8(variableAlias, cVariable);
    }
  };

  _setVariableMemInt16 = (variable: string, cVariable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isArg(variableAlias)) {
      this._stackPushConst(0);
      this._getMemInt16(".ARG0", cVariable);
      this._setInd(this._stackOffset(variableAlias), ".ARG0");
      this._stackPop(1);
    } else {
      this._getMemInt16(variableAlias, cVariable);
    }
  };

  _memSet = (
    dest: ScriptBuilderStackVariable,
    value: number,
    count: ScriptBuilderStackVariable
  ) => {
    this._addCmd("VM_MEMSET", dest, value, count);
  };

  _memCpy = (
    dest: ScriptBuilderStackVariable,
    source: ScriptBuilderStackVariable,
    count: ScriptBuilderStackVariable
  ) => {
    this._addCmd("VM_MEMCPY", dest, source, count);
  };

  _getThreadLocal = (dest: ScriptBuilderStackVariable, local: number) => {
    this._addCmd("VM_GET_TLOCAL", dest, local);
  };

  _string = (str: string) => {
    this._addCmd(`.asciz "${str}"`);
  };

  _importFarPtrData = (farPtr: string) => {
    this._includeHeader("macro.i");
    this._addBankedDataDependency(farPtr);
    this._addCmd(`    IMPORT_FAR_PTR_DATA`, `_${farPtr}`);
  };

  _saveSlot = (slot: number) => {
    this._addCmd(`    .SAVE_SLOT ${slot}`);
  };

  _pollLoaded = (location: ScriptBuilderStackVariable) => {
    this._addCmd("VM_POLL_LOADED", location);
  };

  _sioSetMode = (
    mode: ".SIO_MODE_MASTER" | ".SIO_MODE_SLAVE" | ".SIO_MODE_NONE"
  ) => {
    this._addCmd("VM_SIO_SET_MODE", mode);
  };

  _sioExchange = (
    sendVariable: string,
    receiveVariable: string,
    packetSize: number
  ) => {
    this._addCmd("VM_SIO_EXCHANGE", sendVariable, receiveVariable, packetSize);
  };

  _sioExchangeVariables = (
    variableA: string,
    variableB: string,
    packetSize: number
  ) => {
    const variableAliasA = this.getVariableAlias(variableA);
    const variableAliasB = this.getVariableAlias(variableB);

    let pop = 0;
    let dest = variableAliasB;

    if (this._isArg(variableAliasB)) {
      pop++;
      this._stackPushConst(0);
      dest = this._isArg(variableAliasA) ? ".ARG1" : ".ARG0";
    }

    if (this._isArg(variableAliasA)) {
      pop++;
      this._stackPushInd(this._stackOffset(variableAliasA));
      this._sioExchange(".ARG0", dest, packetSize);
    } else {
      this._sioExchange(variableAliasA, dest, packetSize);
    }

    if (this._isArg(variableAliasB)) {
      this._setInd(this._stackOffset(variableAliasB), dest);
    }

    if (pop > 0) {
      this._stackPop(pop);
    }
  };

  _dw = (...data: Array<ScriptBuilderStackVariable>) => {
    this._addCmd(`.dw ${data.join(", ")}`);
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

  _randomize = () => {
    this._addCmd("VM_RANDOMIZE");
  };

  _rand = (
    location: ScriptBuilderStackVariable,
    min: number,
    range: number
  ) => {
    this._addCmd("VM_RAND", location, min, range);
  };

  _randVariable = (variable: string, min: number, range: number) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isArg(variableAlias)) {
      this._stackPushConst(0);
      this._addCmd("VM_RAND", ".ARG0", min, range);
      this._setInd(this._stackOffset(variableAlias), ".ARG0");
      this._stackPop(1);
    } else {
      this._addCmd("VM_RAND", variableAlias, min, range);
    }
  };

  _rpn = () => {
    const output: string[] = [];
    const stack: number[] = [];

    const rpnCmd = (
      cmd: string,
      ...args: Array<ScriptBuilderStackVariable>
    ) => {
      output.push(this._padCmd(cmd, args.join(", "), 12, 12));
    };

    const rpn = {
      ref: (variable: ScriptBuilderStackVariable) => {
        rpnCmd(".R_REF ", variable);
        stack.push(0);
        return rpn;
      },
      refInd: (variable: ScriptBuilderStackVariable) => {
        rpnCmd(".R_REF_IND ", variable);
        stack.push(0);
        return rpn;
      },
      refVariable: (variable: string) => {
        const variableAlias = this.getVariableAlias(variable);
        if (this._isArg(variableAlias)) {
          return rpn.refInd(this._stackOffset(variableAlias));
        } else {
          return rpn.ref(variableAlias);
        }
      },
      int8: (value: number) => {
        rpnCmd(".R_INT8", value);
        stack.push(0);
        return rpn;
      },
      int16: (value: number) => {
        rpnCmd(".R_INT16", value);
        stack.push(0);
        return rpn;
      },
      operator: (op: ScriptBuilderRPNOperation) => {
        rpnCmd(".R_OPERATOR", op);
        if (op !== ".ABS") {
          stack.pop();
        }
        return rpn;
      },
      stop: () => {
        rpnCmd(".R_STOP");
        this._addCmd("VM_RPN");
        output.forEach((cmd: string) => {
          this.output.push(cmd);
        });
        stack.forEach((_value: number) => {
          this.stackPtr++;
        });
      },
    };

    return rpn;
  };

  _if = (
    operator: ScriptBuilderComparisonOperator,
    variableA: ScriptBuilderStackVariable,
    variableB: ScriptBuilderStackVariable,
    label: string,
    popNum: number
  ) => {
    this._addCmd(
      `VM_IF ${operator}`,
      `${variableA}, ${variableB}, ${label}$, ${popNum}`
    );
    this.stackPtr -= popNum;
  };

  _ifConst = (
    operator: ScriptBuilderComparisonOperator,
    variable: ScriptBuilderStackVariable,
    value: ScriptBuilderStackVariable,
    label: string,
    popNum: number
  ) => {
    this._addCmd(
      `VM_IF_CONST ${operator}`,
      `${variable}, ${value}, ${label}$, ${popNum}`
    );
    this.stackPtr -= popNum;
  };

  _ifVariableConst = (
    operator: ScriptBuilderComparisonOperator,
    variable: string,
    value: ScriptBuilderStackVariable,
    label: string,
    popNum: number
  ) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isArg(variableAlias)) {
      this._stackPushInd(this._stackOffset(variableAlias));
      this._ifConst(operator, ".ARG0", value, label, popNum + 1);
    } else {
      this._ifConst(operator, variableAlias, value, label, popNum);
    }
  };

  _ifVariableCmpVariable = (
    operator: ScriptBuilderComparisonOperator,
    variableA: string,
    variableB: string,
    label: string,
    popNum: number
  ) => {
    const variableAliasA = this.getVariableAlias(variableA);
    const variableAliasB = this.getVariableAlias(variableB);

    let dest = variableAliasB;
    let pop = popNum;

    if (this._isArg(variableAliasB)) {
      this._stackPushInd(this._stackOffset(variableAliasB));
      dest = this._isArg(variableAliasA) ? ".ARG1" : ".ARG0";
      pop += 1;
    }

    if (this._isArg(variableAliasA)) {
      this._stackPushInd(this._stackOffset(variableAliasA));
      this._if(operator, ".ARG0", dest, label, pop + 1);
    } else {
      this._if(operator, variableAliasA, dest, label, pop);
    }
  };

  _actorActivate = (addr: string) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_ACTIVATE", addr);
  };

  _actorDeactivate = (addr: string) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_DEACTIVATE", addr);
  };

  _actorMoveTo = (addr: string) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_MOVE_TO", addr);
  };

  _actorGetPosition = (addr: string) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_GET_POS", addr);
  };

  _actorSetPosition = (addr: string) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_SET_POS", addr);
  };

  _actorGetDirection = (addr: string, dest: string) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_GET_DIR", addr, dest);
  };

  _actorGetAngle = (addr: string, dest: string) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_GET_ANGLE", addr, dest);
  };

  _actorGetDirectionToVariable = (addr: string, variable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isArg(variableAlias)) {
      this._stackPushConst(0);
      this._actorGetDirection("^/(ACTOR - 1)/", ".ARG0");
      this._setInd(this._stackOffset(variableAlias), ".ARG0");
      this._stackPop(1);
    } else {
      this._actorGetDirection(addr, variableAlias);
    }
  };

  _actorSetDirection = (addr: string, asmDir: string) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_SET_DIR", addr, asmDir);
  };

  _actorSetHidden = (addr: string, hidden: boolean) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_SET_HIDDEN", addr, hidden ? 1 : 0);
  };

  _actorSetBounds = (
    addr: string,
    left: number,
    right: number,
    top: number,
    bottom: number
  ) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_SET_BOUNDS", addr, left, right, top, bottom);
  };

  _actorSetAnimTick = (addr: string, tick: number) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_SET_ANIM_TICK", addr, tick);
  };

  _actorSetAnimFrame = (addr: string) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_SET_ANIM_FRAME", addr);
  };

  _actorGetAnimFrame = (addr: string) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_GET_ANIM_FRAME", addr);
  };

  _actorSetMoveSpeed = (addr: string, speed: number) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_SET_MOVE_SPEED", addr, speed);
  };

  _actorSetCollisionsEnabled = (addr: string, enabled: boolean) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_SET_COLL_ENABLED", addr, enabled ? 1 : 0);
  };

  _actorSetSpritesheet = (addr: string, symbol: string) => {
    this.includeActor = true;
    this._addCmd(
      "VM_ACTOR_SET_SPRITESHEET",
      addr,
      `___bank_${symbol}`,
      `_${symbol}`
    );
  };

  _actorSetAnimState = (addr: string, state: string) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_SET_ANIM_SET", addr, state);
  };

  _actorEmote = (addr: string, symbol: string) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_EMOTE", addr, `___bank_${symbol}`, `_${symbol}`);
  };

  _actorTerminateUpdate = (addr: string) => {
    this._addCmd("VM_ACTOR_TERMINATE_UPDATE", addr);
  };

  _projectileLaunch = (index: number, addr: string) => {
    this._addCmd("VM_PROJECTILE_LAUNCH", index, addr);
  };

  _loadText = (numInputs: number) => {
    this._addCmd("VM_LOAD_TEXT", `${numInputs}`);
  };

  _loadStructuredText = (
    inputText: string,
    avatarIndex?: number,
    scrollHeight?: number
  ) => {
    const { fonts, defaultFontId } = this.options;
    let font = fonts.find((f) => f.id === defaultFontId);

    if (!font) {
      font = fonts[0];
    }

    if (!font) {
      this._loadText(0);
      this._string("UNABLE TO LOAD FONT");
      return;
    }

    const textTokens = lexText(inputText);

    let text = "";
    const indirectVars: string[] = [];
    const usedVariableAliases: string[] = [];

    textTokens.forEach((token) => {
      if (token.type === "text") {
        text += encodeString(token.value, font?.mapping);
      } else if (token.type === "font") {
        const newFont = fonts.find((f) => f.id === token.fontId);
        if (newFont) {
          const fontIndex = this._getFontIndex(token.fontId);
          font = newFont;
          text += textCodeSetFont(fontIndex);
        }
      } else if (token.type === "variable" || token.type === "char") {
        const variable = token.variableId;
        if (variable.match(/^V[0-9]$/)) {
          const key = variable.replace(/V/, "");
          const arg = this.options.argLookup.variable[key];
          if (!arg) {
            throw new Error("Cant find arg");
          }
          indirectVars.unshift(arg);
          usedVariableAliases.push(`.ARG${indirectVars.length - 1}`);
        } else {
          usedVariableAliases.push(
            this.getVariableAlias(variable.replace(/^0/g, ""))
          );
        }
        if (token.type === "variable") {
          text += "%d";
        } else {
          text += "%d"; // @todo Should be %c but seems to be broken right now
        }
      } else if (token.type === "speed") {
        text += textCodeSetSpeed(token.speed);
      }
    });

    // Replace newlines with scroll code if larger than max dialogue size
    if (scrollHeight) {
      let numNewlines = 0;
      text = text.replace(/\\n/g, (newline) => {
        numNewlines++;
        if (numNewlines > scrollHeight - 1) {
          return "\\r";
        }
        return newline;
      });
    }

    if (indirectVars.length > 0) {
      for (const indirectVar of indirectVars) {
        this._stackPushInd(this._stackOffset(indirectVar));
      }
    }

    this._loadText(usedVariableAliases.length);

    if (usedVariableAliases.length > 0) {
      this._dw(...usedVariableAliases);
    }

    // Add avatar
    if (avatarIndex !== undefined) {
      const { fonts } = this.options;
      const avatarFontSize = 16;
      const fontIndex = fonts.length + Math.floor(avatarIndex / avatarFontSize);
      const baseCharCode = ((avatarIndex * 4) % (avatarFontSize * 4)) + 64;
      text = `${textCodeSetSpeed(0)}${textCodeSetFont(
        fontIndex
      )}${String.fromCharCode(baseCharCode)}${String.fromCharCode(
        baseCharCode + 1
      )}\\n${String.fromCharCode(baseCharCode + 2)}${String.fromCharCode(
        baseCharCode + 3
      )}${textCodeSetSpeed(2)}${textCodeGotoRel(1, -1)}${textCodeSetFont(
        0
      )}${text}`;
    }

    this._string(text);

    if (indirectVars.length > 0) {
      this._stackPop(indirectVars.length);
    }
  };

  _displayText = () => {
    this._addCmd("VM_DISPLAY_TEXT");
  };

  _choice = (
    variable: ScriptBuilderStackVariable,
    options: ScriptBuilderChoiceFlag[],
    numItems: number
  ) => {
    this._addCmd("VM_CHOICE", variable, unionFlags(options), numItems);
  };

  _menuItem = (
    x: number,
    y: number,
    left: number,
    right: number,
    up: number,
    down: number
  ) => {
    this._addCmd("    .MENUITEM", x, y, left, right, up, down);
  };

  _overlayShow = (x: number, y: number, color: number) => {
    this._addCmd("VM_OVERLAY_SHOW", x, y, color, 0);
  };

  _overlayClear = (
    x: number,
    y: number,
    width: number,
    height: number,
    color: ScriptBuilderUIColor,
    drawFrame: boolean
  ) => {
    this._addCmd(
      "VM_OVERLAY_CLEAR",
      x,
      y,
      width,
      height,
      color,
      unionFlags([".UI_AUTO_SCROLL"].concat(drawFrame ? ".UI_DRAW_FRAME" : []))
    );
  };

  _overlayHide = () => {
    this._addCmd("VM_OVERLAY_HIDE");
  };

  _overlayMoveTo = (
    x: number,
    y: number,
    speed: ScriptBuilderOverlayMoveSpeed
  ) => {
    this._addCmd("VM_OVERLAY_MOVE_TO", x, y, speed);
  };

  _overlayWait = (
    modal: boolean,
    waitFlags: ScriptBuilderOverlayWaitFlag[]
  ) => {
    this._addCmd(
      "VM_OVERLAY_WAIT",
      modal ? ".UI_MODAL" : ".UI_NONMODAL",
      buildOverlayWaitCondition(waitFlags)
    );
  };

  _inputWait = (mask: number) => {
    this._addCmd("VM_INPUT_WAIT", mask);
  };

  _inputContextPrepare = (symbol: string, context: number) => {
    this._addCmd(
      "VM_CONTEXT_PREPARE",
      context,
      `___bank_${symbol}`,
      `_${symbol}`
    );
  };

  _inputContextAttach = (buttonMask: number, context: number) => {
    this._addCmd("VM_INPUT_ATTACH", buttonMask, context);
  };

  _inputContextDetach = (buttonMask: number) => {
    this._addCmd("VM_INPUT_DETACH", buttonMask);
  };

  _timerContextPrepare = (symbol: string, context: number) => {
    this._addCmd(
      "VM_TIMER_PREPARE",
      context,
      `___bank_${symbol}`,
      `_${symbol}`
    );
  };

  _timerStart = (context: number, interval: number) => {
    this._addCmd("VM_TIMER_SET", context, interval);
  };

  _timerStop = (context: number) => {
    this._addCmd("VM_TIMER_STOP", context);
  };

  _timerReset = (context: number) => {
    this._addCmd("VM_TIMER_RESET", context);
  };

  _savePeek = (
    successDest: ScriptBuilderStackVariable,
    dest: ScriptBuilderStackVariable,
    source: ScriptBuilderStackVariable,
    count: number,
    slot: number
  ) => {
    this._addCmd("VM_SAVE_PEEK", successDest, dest, source, count, slot);
  };

  _saveClear = (slot: number) => {
    this._addCmd("VM_SAVE_CLEAR", slot);
  };

  _scenePush = () => {
    this._addCmd("VM_SCENE_PUSH");
  };

  _scenePop = () => {
    this._addCmd("VM_SCENE_POP");
  };

  _scenePopAll = () => {
    this._addCmd("VM_SCENE_POP_ALL");
  };

  _sceneStackReset = () => {
    this._addCmd("VM_SCENE_STACK_RESET");
  };

  _fadeIn = (speed: number) => {
    this._addCmd("VM_FADE_IN", speed);
  };

  _fadeOut = (speed: number) => {
    this._addCmd("VM_FADE_OUT", speed);
  };

  _cameraMoveTo = (addr: string, speed: number, lock: string) => {
    this._addCmd("VM_CAMERA_MOVE_TO", addr, speed, lock);
  };

  _cameraSetPos = (addr: string) => {
    this._addCmd("VM_CAMERA_SET_POS", addr);
  };

  _musicPlay = (symbol: string, loop: boolean) => {
    this._addCmd(
      "VM_MUSIC_PLAY",
      `___bank_${symbol}`,
      `_${symbol}`,
      loop ? ".MUSIC_LOOP" : ".MUSIC_NO_LOOP"
    );
  };

  _musicStop = () => {
    this._addCmd("VM_MUSIC_STOP");
  };

  _musicRoutine = (routine: number, symbol: string) => {
    this._addCmd(
      "VM_MUSIC_ROUTINE",
      routine,
      `___bank_${symbol}`,
      `_${symbol}`
    );
  };

  _soundPlay = (
    frames: number,
    channel: number,
    a: number,
    b: number,
    c: number,
    d: number,
    e: number
  ) => {
    this._addCmd(
      "VM_SOUND_PLAY",
      frames,
      channel,
      decHex(a),
      decHex(b),
      decHex(c),
      decHex(d),
      decHex(e)
    );
  };

  _paletteLoad = (
    mask: number,
    type: ScriptBuilderPaletteType,
    commit: boolean
  ) => {
    this._addCmd(
      "VM_LOAD_PALETTE",
      mask,
      unionFlags(([] as string[]).concat(type, commit ? ".PALETTE_COMMIT" : []))
    );
  };

  _paletteDMG = (
    color1: number,
    color2: number,
    color3: number,
    color4: number
  ) => {
    this._addCmd(".DMG_PAL", color1, color2, color3, color4);
  };

  _paletteColor = (
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number,
    r3: number,
    g3: number,
    b3: number,
    r4: number,
    g4: number,
    b4: number
  ) => {
    this._addCmd(".CGB_PAL", r1, g1, b1, r2, g2, b2, r3, g3, b3, r4, g4, b4);
  };

  _callFar = (symbol: string) => {
    this._addCmd("VM_CALL_FAR", `___bank_${symbol}`, `_${symbol}`);
  };

  _returnFar = () => {
    this._addCmd("VM_RET_FAR");
  };

  _stop = () => {
    this._assertStackNeutral();
    this._addComment("Stop Script");
    this._addCmd("VM_STOP");
  };

  _isArg = (variable: ScriptBuilderStackVariable) => {
    return typeof variable === "string" && variable.startsWith(".ARG");
  };

  _stackOffset = (variable: ScriptBuilderStackVariable, wrap = true) => {
    if (!this._isArg(variable)) {
      return variable;
    }
    const calc = `[[${variable}::${this.stackPtr}]]`;

    if (wrap) {
      return `^/(${calc})/`;
    }
    return calc;
  };

  // --------------------------------------------------------------------------
  // Actors

  actorSetById = (id: string) => {
    this.includeActor = true;
    const newIndex = this.getActorIndex(id);
    if (typeof newIndex === "number") {
      this.actorIndex = newIndex;
      this._setConst("ACTOR", this.actorIndex);
    } else {
      this.actorIndex = -1;
      this._set("ACTOR", this._stackOffset(newIndex));
    }
  };

  actorPushById = (id: string) => {
    const newIndex = this.getActorIndex(id);
    if (typeof newIndex === "number") {
      this.actorIndex = newIndex;
      this._stackPushConst(this.actorIndex);
    } else {
      this.actorIndex = -1;
      this._stackPush(this._stackOffset(newIndex));
    }
  };

  actorSetActive = (id: string) => {
    this._addComment("Actor Set Active");
    this.actorSetById(id);
    this._addNL();
  };

  actorMoveTo = (
    x: number,
    y: number,
    useCollisions: boolean,
    moveType: ScriptBuilderMoveType
  ) => {
    const stackPtr = this.stackPtr;
    this._addComment("Actor Move To");
    this._setConst("^/(ACTOR + 1)/", x * 8 * 16);
    this._setConst("^/(ACTOR + 2)/", y * 8 * 16);
    this._setConst("^/(ACTOR + 3)/", toASMMoveFlags(moveType, useCollisions));
    this._actorMoveTo("ACTOR");
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorMoveToVariables = (
    variableX: string,
    variableY: string,
    useCollisions: boolean,
    moveType: ScriptBuilderMoveType
  ) => {
    const stackPtr = this.stackPtr;
    this._addComment("Actor Move To Variables");

    this._rpn() //
      .refVariable(variableX)
      .int16(8 * 16)
      .operator(".MUL")
      .refVariable(variableY)
      .int16(8 * 16)
      .operator(".MUL")
      .stop();

    this._set("^/(ACTOR + 1 - 2)/", ".ARG1");
    this._set("^/(ACTOR + 2 - 2)/", ".ARG0");
    this._stackPop(2);

    this._setConst("^/(ACTOR + 3)/", toASMMoveFlags(moveType, useCollisions));
    this._actorMoveTo("ACTOR");
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorMoveRelative = (
    x = 0,
    y = 0,
    useCollisions = false,
    moveType: ScriptBuilderMoveType
  ) => {
    const stackPtr = this.stackPtr;
    this._addComment("Actor Move Relative");
    this._actorGetPosition("ACTOR");
    this._rpn() //
      .ref("^/(ACTOR + 1)/")
      .int16(x * 8 * 16)
      .operator(".ADD")
      .ref("^/(ACTOR + 2)/")
      .int16(y * 8 * 16)
      .operator(".ADD")
      .stop();

    this._set("^/(ACTOR + 1 - 2)/", ".ARG1");
    this._set("^/(ACTOR + 2 - 2)/", ".ARG0");
    this._stackPop(2);
    this._setConst("^/(ACTOR + 3)/", toASMMoveFlags(moveType, useCollisions));
    this._actorMoveTo("ACTOR");
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorSetPosition = (x = 0, y = 0) => {
    this._addComment("Actor Set Position");
    this._setConst("^/(ACTOR + 1)/", x * 8 * 16);
    this._setConst("^/(ACTOR + 2)/", y * 8 * 16);
    this._actorSetPosition("ACTOR");
    this._addNL();
  };

  actorGetPosition = (variableX: string, variableY: string) => {
    this._addComment(`Store Position In Variables`);
    this._actorGetPosition("ACTOR");

    this._rpn() //
      .ref("^/(ACTOR + 1)/")
      .int16(8 * 16)
      .operator(".DIV")
      .ref("^/(ACTOR + 2)/")
      .int16(8 * 16)
      .operator(".DIV")
      .stop();

    this._setVariable(variableX, ".ARG1");
    this._setVariable(variableY, ".ARG0");
    this._stackPop(2);
    this._addNL();
  };

  actorGetPositionX = (variableX: string) => {
    this._addComment(`Store X Position In Variable`);
    this._actorGetPosition("ACTOR");

    this._rpn() //
      .ref("^/(ACTOR + 1)/")
      .int16(8 * 16)
      .operator(".DIV")
      .stop();

    this._setVariable(variableX, ".ARG0");
    this._stackPop(1);
    this._addNL();
  };

  actorGetPositionY = (variableY: string) => {
    this._addComment(`Store Y Position In Variable`);
    this._actorGetPosition("ACTOR");

    this._rpn() //
      .ref("^/(ACTOR + 2)/")
      .int16(8 * 16)
      .operator(".DIV")
      .stop();

    this._setVariable(variableY, ".ARG0");
    this._stackPop(1);
    this._addNL();
  };

  actorGetDirection = (variable: string) => {
    this._addComment(`Store Direction In Variable`);
    this._actorGetDirectionToVariable("ACTOR", variable);
    this._addNL();
  };

  actorGetAnimFrame = (variable: string) => {
    this._addComment(`Store Frame In Variable`);
    this._actorGetAnimFrame("ACTOR");
    this._setVariable(variable, "^/(ACTOR + 1)/");
    this._addNL();
  };

  actorPush = (continueUntilCollision = false) => {
    const stackPtr = this.stackPtr;
    const upLabel = this.getNextLabel();
    const leftLabel = this.getNextLabel();
    const rightLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();

    const offset = continueUntilCollision ? 128 * 100 : 128 * 2;

    this._addComment("Actor Push");
    this._setConst("ACTOR", 0);
    this._stackPushConst(0);
    this._actorGetDirection("^/(ACTOR - 1)/", ".ARG0");
    this._setConst("^/(ACTOR - 1)/", this.actorIndex);
    this._actorGetPosition("^/(ACTOR - 1)/");
    this._ifConst(".EQ", ".ARG0", ".DIR_UP", upLabel, 0);
    this._ifConst(".EQ", ".ARG0", ".DIR_LEFT", leftLabel, 0);
    this._ifConst(".EQ", ".ARG0", ".DIR_RIGHT", rightLabel, 0);

    // Down
    this._rpn() //
      .ref("^/(ACTOR + 2 - 1)/")
      .int16(offset)
      .operator(".ADD")
      .stop();
    this._set("^/(ACTOR + 2 - 2)/", ".ARG0");
    this._stackPop(1);
    this._jump(endLabel);

    // Up
    this._label(upLabel);
    this._rpn() //
      .ref("^/(ACTOR + 2 - 1)/")
      .int16(offset)
      .operator(".SUB")
      .int16(0)
      .operator(".MAX")
      .stop();
    this._set("^/(ACTOR + 2 - 2)/", ".ARG0");
    this._stackPop(1);
    this._jump(endLabel);

    // Left
    this._label(leftLabel);
    this._rpn() //
      .ref("^/(ACTOR + 1 - 1)/")
      .int16(offset)
      .operator(".SUB")
      .int16(0)
      .operator(".MAX")
      .stop();
    this._set("^/(ACTOR + 1 - 2)/", ".ARG0");
    this._stackPop(1);
    this._jump(endLabel);

    // Right
    this._label(rightLabel);
    this._rpn() //
      .ref("^/(ACTOR + 1 - 1)/")
      .int16(offset)
      .operator(".ADD")
      .stop();
    this._set("^/(ACTOR + 1 - 2)/", ".ARG0");
    this._stackPop(1);

    // End
    this._label(endLabel);
    this._stackPop(1);
    this._setConst("^/(ACTOR + 3)/", ".ACTOR_ATTR_CHECK_COLL");
    this._actorMoveTo("ACTOR");

    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorShow = (id: string) => {
    this._addComment("Actor Show");
    this.actorSetById(id);
    this._actorSetHidden("ACTOR", false);
    this._actorActivate("ACTOR");
    this._addNL();
  };

  actorHide = (id: string) => {
    this._addComment("Actor Hide");
    this.actorSetById(id);
    this._actorSetHidden("ACTOR", true);
    this._actorDeactivate("ACTOR");
    this._addNL();
  };

  actorSetBounds = (
    left: number,
    right: number,
    top: number,
    bottom: number
  ) => {
    this._addComment("Actor Set Bounds");
    this._actorSetBounds("ACTOR", left, right, top, bottom);
    this._addNL();
  };

  actorSetCollisions = (enabled: boolean) => {
    this._addComment("Actor Set Collisions");
    this._actorSetCollisionsEnabled("ACTOR", enabled);
    this._addNL();
  };

  actorSetDirection = (direction: ActorDirection) => {
    this._addComment("Actor Set Direction");
    this._actorSetDirection("ACTOR", toASMDir(direction));
    this._addNL();
  };

  actorSetDirectionToVariable = (variable: string) => {
    const leftLabel = this.getNextLabel();
    const rightLabel = this.getNextLabel();
    const upLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();

    this._addComment("Actor Set Direction To Variable");
    this._ifVariableConst(".EQ", variable, ".DIR_LEFT", leftLabel, 0);
    this._ifVariableConst(".EQ", variable, ".DIR_RIGHT", rightLabel, 0);
    this._ifVariableConst(".EQ", variable, ".DIR_UP", upLabel, 0);
    // Down
    this._actorSetDirection("ACTOR", ".DIR_DOWN");
    this._jump(endLabel);
    // Left
    this._label(leftLabel);
    this._actorSetDirection("ACTOR", ".DIR_LEFT");
    this._jump(endLabel);
    // Right
    this._label(rightLabel);
    this._actorSetDirection("ACTOR", ".DIR_RIGHT");
    this._jump(endLabel);
    // Up
    this._label(upLabel);
    this._actorSetDirection("ACTOR", ".DIR_UP");

    this._label(endLabel);
    this._addNL();
  };

  actorEmote = (emoteId: string) => {
    const { emotes } = this.options;
    const emoteIndex = emotes.findIndex((e) => e.id === emoteId);
    if (emoteIndex > -1) {
      this._addComment("Actor Emote");
      this._actorEmote("ACTOR", emoteSymbol(emoteIndex));
      this._addNL();
    }
  };

  actorSetSprite = (spriteSheetId: string) => {
    const { sprites } = this.options;
    const spriteIndex = sprites.findIndex((s) => s.id === spriteSheetId);
    if (spriteIndex > -1) {
      this._addComment("Actor Set Spritesheet");
      this._actorSetSpritesheet("ACTOR", spriteSheetSymbol(spriteIndex));
      this._addNL();
    }
  };

  playerSetSprite = (spriteSheetId: string) => {
    const { sprites } = this.options;
    const spriteIndex = sprites.findIndex((s) => s.id === spriteSheetId);
    if (spriteIndex > -1) {
      this._addComment("Player Set Spritesheet");
      this._setConst("ACTOR", 0);
      this._actorSetSpritesheet("ACTOR", spriteSheetSymbol(spriteIndex));
      this._addNL();
    }
  };

  actorSetState = (state: string) => {
    const { statesOrder, stateReferences } = this.options;
    const stateIndex = statesOrder.indexOf(state);
    if (stateIndex > -1) {
      this._addComment("Actor Set Animation State");
      this._actorSetAnimState("ACTOR", stateReferences[stateIndex]);
      this._addNL();
    }
  };

  actorSetMovementSpeed = (speed = 1) => {
    this._addComment("Actor Set Movement Speed");
    this._actorSetMoveSpeed("ACTOR", Math.round(speed * 16));
    this._addNL();
  };

  actorSetAnimationSpeed = (speed = 3) => {
    this._addComment("Actor Set Animation Tick");
    this._actorSetAnimTick("ACTOR", speed);
    this._addNL();
  };

  actorSetFrame = (frame = 0) => {
    this._addComment("Actor Set Animation Frame");
    this._setConst("^/(ACTOR + 1)/", frame);
    this._actorSetAnimFrame("ACTOR");
    this._addNL();
  };

  actorSetFrameToVariable = (variable: string) => {
    this._addComment("Actor Set Animation Frame To Variable");
    this._setToVariable("^/(ACTOR + 1)/", variable);
    this._actorSetAnimFrame("ACTOR");
    this._addNL();
  };

  actorSetAnimate = (_enabled: boolean) => {
    console.error("actorSetAnimate not implemented");
  };

  actorStopUpdate = () => {
    this._addComment("Actor Stop Update Script");
    this._actorTerminateUpdate("ACTOR");
    this._addNL();
  };

  playerBounce = (height: "low" | "medium" | "high") => {
    this._addComment("Player Bounce");
    let value = -0x4000;
    if (height === "low") {
      value = -0x2000;
    } else if (height === "high") {
      value = -0x6000;
    }
    this._setConstMemInt16("pl_vel_y", value);
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Weapons

  getProjectileIndex = (
    spriteSheetId: string,
    spriteStateId: string,
    speed: number,
    animSpeed: number,
    lifeTime: number,
    initialOffset: number,
    collisionGroup: string,
    collisionMask: string[]
  ) => {
    const { scene } = this.options;
    const projectileHash = toProjectileHash({
      spriteSheetId,
      spriteStateId,
      speed,
      animSpeed,
      lifeTime,
      initialOffset,
      collisionGroup,
      collisionMask,
    });
    const projectileHashes = scene.projectiles.map((p) => p.hash);
    const projectileIndex = projectileHashes.indexOf(projectileHash);
    return projectileIndex;
  };

  launchProjectileInDirection = (
    projectileIndex: number,
    x = 0,
    y = 0,
    direction: string
  ) => {
    this._addComment("Launch Projectile In Direction");
    this._actorGetPosition("ACTOR");
    this._rpn() //
      .ref("^/(ACTOR + 1)/")
      .int16(x * 16)
      .operator(".ADD")
      .ref("^/(ACTOR + 2)/")
      .int16(-y * 16)
      .operator(".ADD")
      .stop();
    this._stackPushConst(dirToAngle(direction));
    this._projectileLaunch(projectileIndex, ".ARG2");
    this._stackPop(3);
  };

  launchProjectileInAngle = (
    projectileIndex: number,
    x = 0,
    y = 0,
    angle: number
  ) => {
    this._addComment("Launch Projectile In Angle");
    this._actorGetPosition("ACTOR");
    this._rpn() //
      .ref("^/(ACTOR + 1)/")
      .int16(x * 16)
      .operator(".ADD")
      .ref("^/(ACTOR + 2)/")
      .int16(-y * 16)
      .operator(".ADD")
      .stop();
    this._stackPushConst(Math.round(angle % 256));
    this._projectileLaunch(projectileIndex, ".ARG2");
    this._stackPop(3);
  };

  launchProjectileInAngleVariable = (
    projectileIndex: number,
    x = 0,
    y = 0,
    angleVariable: string
  ) => {
    this._addComment("Launch Projectile In Angle");
    this._actorGetPosition("ACTOR");
    this._rpn() //
      .ref("^/(ACTOR + 1)/")
      .int16(x * 16)
      .operator(".ADD")
      .ref("^/(ACTOR + 2)/")
      .int16(-y * 16)
      .operator(".ADD")
      .refVariable(angleVariable)
      .stop();
    this._projectileLaunch(projectileIndex, ".ARG2");
    this._stackPop(3);
  };

  launchProjectileInSourceActorDirection = (
    projectileIndex: number,
    x = 0,
    y = 0
  ) => {
    this._addComment("Launch Projectile In Source Actor Direction");
    this._actorGetPosition("ACTOR");
    this._rpn() //
      .ref("^/(ACTOR + 1)/")
      .int16(x * 16)
      .operator(".ADD")
      .ref("^/(ACTOR + 2)/")
      .int16(-y * 16)
      .operator(".ADD")
      .stop();

    this._stackPushConst(0);
    this._actorGetAngle("^/(ACTOR - 3)/", ".ARG0");

    // this._stackPushConst(Math.round((angle % 360) * (256 / 360)));
    this._projectileLaunch(projectileIndex, ".ARG2");
    this._stackPop(3);
  };

  launchProjectileInActorDirection = (
    projectileIndex: number,
    x = 0,
    y = 0,
    actorId: string
  ) => {
    this._addComment("Launch Projectile In Actor Direction");
    this._actorGetPosition("ACTOR");
    this._rpn() //
      .ref("^/(ACTOR + 1)/")
      .int16(x * 16)
      .operator(".ADD")
      .ref("^/(ACTOR + 2)/")
      .int16(-y * 16)
      .operator(".ADD")
      .stop();

    this.actorPushById(actorId);
    this._actorGetAngle(".ARG0", ".ARG0");

    this._projectileLaunch(projectileIndex, ".ARG2");
    this._stackPop(3);
  };

  // --------------------------------------------------------------------------
  // Timing

  nextFrameAwait = () => {
    const stackPtr = this.stackPtr;
    this._addComment("Wait 1 Frame");
    this._stackPushConst(1);
    this._invoke("wait_frames", 1, 1);
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  wait = (frames: number) => {
    const stackPtr = this.stackPtr;
    this._addComment("Wait N Frames");
    this._stackPushConst(frames);
    this._invoke("wait_frames", 1, 1);
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // UI

  textDialogue = (inputText: string | string[] = " ", avatarId?: string) => {
    const input: string[] = Array.isArray(inputText) ? inputText : [inputText];

    const initialNumLines = input.map(
      (textBlock) => textBlock.split("\n").length
    );

    const maxNumLines = Math.max(2, Math.max.apply(null, initialNumLines));
    const textBoxHeight = Math.min(maxNumLines, MAX_DIALOGUE_LINES) + 2;
    const textBoxY = 18 - textBoxHeight;

    this._addComment("Text Dialogue");
    input.forEach((text, textIndex) => {
      let avatarIndex = undefined;
      if (avatarId) {
        const { avatars } = this.options;
        avatarIndex = avatars.findIndex((a) => a.id === avatarId);
        if (avatarIndex < 0) {
          avatarIndex = undefined;
        }
      }

      this._loadStructuredText(text, avatarIndex, MAX_DIALOGUE_LINES);
      this._overlayClear(0, 0, 20, textBoxHeight, ".UI_COLOR_WHITE", true);
      if (textIndex === 0) {
        this._overlayMoveTo(0, textBoxY, ".OVERLAY_IN_SPEED");
      }
      this._displayText();
      this._overlayWait(true, [
        ".UI_WAIT_WINDOW",
        ".UI_WAIT_TEXT",
        ".UI_WAIT_BTN_A",
      ]);
      if (textIndex === input.length - 1) {
        this._overlayMoveTo(0, 18, ".OVERLAY_OUT_SPEED");
        this._overlayWait(true, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);
      }
    });
    this._addNL();
  };

  textSetAnimSpeed = (
    speedIn: number,
    speedOut: number,
    textSpeed = 1,
    allowFastForward = true
  ) => {
    this._addComment("Text Set Animation Speed");
    this._setConstMemInt8("text_ff_joypad", allowFastForward ? 1 : 0);
    this._setConstMemInt8("text_draw_speed", textSpeedDec(textSpeed));
    this._setConstMemInt8("text_out_speed", speedOut);
    this._setConstMemInt8("text_in_speed", speedIn);
    this._addNL();
  };

  textChoice = (
    variable: string,
    args: { trueText: string; falseText: string }
  ) => {
    const variableAlias = this.getVariableAlias(variable);
    const trueText = trimlines(args.trueText || "", 17, 1) || "Choice A";
    const falseText = trimlines(args.falseText || "", 17, 1) || "Choice B";
    const speedInstant = textCodeSetSpeed(0);
    const gotoFirstLine = textCodeGoto(3, 2);
    const gotoSecondLine = textCodeGoto(3, 3);
    const choiceText = `${speedInstant}${gotoFirstLine}${trueText}\n${gotoSecondLine}${falseText}`;
    const numLines = choiceText.split("\n").length;

    this._addComment("Text Multiple Choice");

    let dest = variableAlias;
    if (this._isArg(variableAlias)) {
      dest = ".ARG0";
      this._stackPushConst(0);
    }

    this._loadStructuredText(choiceText);
    this._overlayClear(0, 0, 20, numLines + 2, ".UI_COLOR_WHITE", true);
    this._overlayMoveTo(0, 18 - numLines - 2, ".OVERLAY_IN_SPEED");
    this._displayText();
    this._overlayWait(true, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);
    this._choice(dest, [".UI_MENU_LAST_0", ".UI_MENU_CANCEL_B"], 2);
    this._menuItem(1, 1, 0, 0, 0, 2);
    this._menuItem(1, 2, 0, 0, 1, 0);
    this._overlayMoveTo(0, 18, ".OVERLAY_OUT_SPEED");
    this._overlayWait(true, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);

    if (this._isArg(variableAlias)) {
      this._setInd(this._stackOffset(variableAlias), ".ARG0");
      this._stackPop(1);
    }

    this._addNL();
  };

  textMenu = (
    setVariable: string,
    options: string[],
    layout = "menu",
    cancelOnLastOption = false,
    cancelOnB = false
  ) => {
    const variableAlias = this.getVariableAlias(setVariable);
    const optionsText = options.map(
      (option, index) => textCodeSetFont(0) + (option || `Item ${index + 1}`)
    );
    const height =
      layout === "menu" ? options.length : Math.min(options.length, 4);
    const menuText =
      textCodeSetSpeed(0) +
      textCodeGoto(3, 2) +
      (layout === "menu"
        ? optionsText.join("\n")
        : optionsText
            .map((text, i) => {
              if (i === 4) {
                return textCodeGoto(12, 2) + text;
              }
              return text;
            })
            .join("\n"));
    const numLines = options.length;
    const x = layout === "menu" ? 10 : 0;
    const choiceFlags: ScriptBuilderChoiceFlag[] = [];
    if (cancelOnLastOption) {
      choiceFlags.push(".UI_MENU_LAST_0");
    }
    if (cancelOnB) {
      choiceFlags.push(".UI_MENU_CANCEL_B");
    }

    this._addComment("Text Menu");

    let dest = variableAlias;
    if (this._isArg(variableAlias)) {
      dest = ".ARG0";
      this._stackPushConst(0);
    }

    this._loadStructuredText(menuText);
    this._overlayClear(0, 0, 20 - x, height + 2, ".UI_COLOR_WHITE", true);
    if (layout === "menu") {
      this._overlayMoveTo(10, 18, ".OVERLAY_SPEED_INSTANT");
    }
    this._overlayMoveTo(x, 18 - height - 2, ".OVERLAY_IN_SPEED");
    this._displayText();
    this._overlayWait(true, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);
    this._choice(dest, choiceFlags, numLines);

    const clampedMenuIndex = (index: number) => {
      if (index < 0) {
        return 0;
      }
      if (index > options.length - 1) {
        return 0;
      }
      return index + 1;
    };

    if (layout === "menu") {
      for (let i = 0; i < options.length; i++) {
        this._menuItem(
          1,
          1 + i,
          1,
          options.length,
          clampedMenuIndex(i - 1),
          clampedMenuIndex(i + 1)
        );
      }
    } else {
      for (let i = 0; i < options.length; i++) {
        this._menuItem(
          i < 4 ? 1 : 10,
          1 + (i % 4),
          clampedMenuIndex(i - 4) || 1,
          clampedMenuIndex(i + 4) || options.length,
          clampedMenuIndex(i - 1),
          clampedMenuIndex(i + 1)
        );
      }
    }

    this._overlayMoveTo(x, 18, ".OVERLAY_OUT_SPEED");
    this._overlayWait(true, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);
    if (layout === "menu") {
      this._overlayMoveTo(0, 18, ".OVERLAY_SPEED_INSTANT");
    }

    if (this._isArg(variableAlias)) {
      this._setInd(this._stackOffset(variableAlias), ".ARG0");
      this._stackPop(1);
    }

    this._addNL();
  };

  overlayShow = (color = "white", x = 0, y = 0) => {
    this._addComment("Overlay Show");
    this._overlayShow(x, y, color === "white" ? 1 : 0);
    this._addNL();
  };

  overlayHide = () => {
    this._addComment("Overlay Hide");
    this._overlayHide();
    this._addNL();
  };

  overlayMoveTo = (x = 0, y = 18, speed = 0) => {
    this._addComment("Overlay Move To");
    this._overlayMoveTo(x, y, speed);
    this._overlayWait(true, [".UI_WAIT_WINDOW"]);
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Camera

  cameraMoveTo = (x = 0, y = 0, speed = 0) => {
    this._addComment("Camera Move To");
    const xOffset = 80;
    const yOffset = 72;
    this._stackPushConst(xOffset + Math.round(x * 8));
    this._stackPushConst(yOffset + Math.round(y * 8));
    if (speed === 0) {
      this._cameraSetPos(".ARG1");
    } else {
      this._cameraMoveTo(".ARG1", speed, ".CAMERA_UNLOCK");
    }
    this._stackPop(2);
  };

  cameraMoveToVariables = (variableX: string, variableY: string, speed = 0) => {
    this._addComment("Camera Move To Variables");
    this._rpn() //
      .refVariable(variableX)
      .int16(8)
      .operator(".MUL")
      .int16(80)
      .operator(".ADD")
      .refVariable(variableY)
      .int16(8)
      .operator(".MUL")
      .int16(72)
      .operator(".ADD")
      .stop();
    if (speed === 0) {
      this._cameraSetPos(".ARG1");
    } else {
      this._cameraMoveTo(".ARG1", speed, ".CAMERA_UNLOCK");
    }
    this._stackPop(2);
  };

  cameraLock = (speed = 0, axis: ScriptBuilderAxis[]) => {
    this._addComment("Camera Lock");
    this._setConst("ACTOR", 0);
    this._actorGetPosition("ACTOR");
    this._rpn() //
      .ref("^/(ACTOR + 1)/")
      .int16(16)
      .operator(".DIV")
      .ref("^/(ACTOR + 2)/")
      .int16(16)
      .operator(".DIV")
      .stop();

    this._set("^/(ACTOR + 1 - 2)/", ".ARG1");
    this._set("^/(ACTOR + 2 - 2)/", ".ARG0");
    if (speed === 0) {
      this._cameraSetPos(".ARG1");
    }
    this._cameraMoveTo(".ARG1", speed, toASMCameraLock(axis));
    this._stackPop(2);
  };

  cameraShake = (
    shouldShakeX: boolean,
    shouldShakeY: boolean,
    frames: number
  ) => {
    this._addComment("Camera Shake");
    this._stackPushConst(frames);
    this._stackPushConst(
      unionFlags(
        ([] as string[]).concat(
          shouldShakeX ? ".CAMERA_SHAKE_X" : [],
          shouldShakeY ? ".CAMERA_SHAKE_Y" : []
        )
      )
    );
    this._invoke("camera_shake_frames", 2, 2);
  };

  // --------------------------------------------------------------------------
  // Input

  inputAwait = (input: string[]) => {
    this._addComment("Wait For Input");
    this._inputWait(inputDec(input));
    this._addNL();
  };

  inputScriptSet = (
    input: string,
    _persist: boolean,
    script: ScriptEvent[]
  ) => {
    this._addComment(`Input Script Attach`);
    const scriptRef = this._compileSubScript("input", script);
    const inputValue = inputDec(input);
    let ctx = inputValue.toString(2).padStart(8, "0").indexOf("1") + 1;
    if (ctx <= 0) {
      ctx = 1;
    }
    this._inputContextPrepare(scriptRef, ctx);
    this._inputContextAttach(inputValue, ctx);
    this._addNL();
  };

  inputScriptRemove = (input: string) => {
    this._addComment(`Input Script Remove`);
    this._inputContextDetach(inputDec(input));
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Timer

  timerScriptSet = (duration = 10.0, script: ScriptEvent[]) => {
    this._addComment(`Timer Start`);
    const scriptRef = this._compileSubScript("timer", script);
    const ctx = 1;
    const TIMER_CYCLES = 16;
    let durationTicks = ((60 * duration) / TIMER_CYCLES + 0.5) | 0;
    if (durationTicks <= 0) {
      durationTicks = 1;
    }
    if (durationTicks >= 256) {
      durationTicks = 255;
    }
    this._timerContextPrepare(scriptRef, ctx);
    this._timerStart(ctx, durationTicks);
    this._addNL();
  };

  timerRestart = () => {
    this._addComment(`Timer Restart`);
    const ctx = 1;
    this._timerReset(ctx);
  };

  timerDisable = () => {
    this._addComment(`Timer Disable`);
    const ctx = 1;
    this._timerStop(ctx);
  };

  // --------------------------------------------------------------------------
  // Call Script

  callScript = (scriptId: string, input: Dictionary<string>) => {
    const { customEvents } = this.options;
    const customEvent = customEvents.find((ce) => ce.id === scriptId);

    if (!customEvent) {
      console.warn("Script not found", scriptId);
      return;
    }

    this._addComment(`Call Script: ${customEvent.name}`);

    const argLookup: {
      actor: Dictionary<string>;
      variable: Dictionary<string>;
    } = {
      actor: {},
      variable: {},
    };

    // Push args
    const actorArgs = Object.values(customEvent.actors);
    const variableArgs = Object.values(customEvent.variables);
    const argsLen = actorArgs.length + variableArgs.length;

    let numArgs = argsLen - 1;
    const registerArg = (type: "actor" | "variable", value: string) => {
      if (!argLookup[type][value]) {
        const newArg = `.ARG${numArgs + 2}`;
        argLookup[type][value] = newArg;
        numArgs--;
      }
      return argLookup[type][value];
    };

    const getArg = (type: "actor" | "variable", value: string) => {
      if (type === "actor" && value === "player") {
        return value;
      }
      if (type === "actor" && value === "$self$") {
        return "player";
      }
      if (!argLookup[type][value]) {
        throw new Error("Unknown arg " + type + " " + value);
      }
      return argLookup[type][value];
    };

    if (actorArgs) {
      for (const actorArg of actorArgs.reverse()) {
        if (actorArg) {
          const actorValue = input?.[`$actor[${actorArg.id}]$`] || "";
          const actorIndex = this.getActorIndex(actorValue);
          const arg = registerArg("actor", actorArg.id);
          this._stackPushConst(actorIndex, `Actor ${arg}`);
        }
      }
    }

    if (variableArgs) {
      for (const variableArg of variableArgs.reverse()) {
        if (variableArg) {
          const variableValue = input?.[`$variable[${variableArg.id}]$`] || "";
          const variableAlias = this.getVariableAlias(variableValue);
          const arg = registerArg("variable", variableArg.id);
          this._stackPushConst(variableAlias, `Variable ${arg}`);
        }
      }
    }

    const script = mapEvents(
      customEvent.script,
      (event: ScriptEvent): ScriptEvent => {
        if (!event.args || event.args.__comment) return event;
        // Clone event
        const e = {
          ...event,
          args: { ...event.args },
        };
        Object.keys(e.args).forEach((arg) => {
          const argValue = e.args[arg];
          // Update variable fields
          if (isVariableField(e.command, arg, e.args)) {
            if (isUnionVariableValue(argValue) && argValue.value) {
              e.args[arg] = {
                ...argValue,
                value: getArg("variable", argValue.value),
              };
            } else if (typeof argValue === "string") {
              e.args[arg] = getArg("variable", argValue);
            }
          }
          // Update property fields
          if (isPropertyField(e.command, arg, e.args)) {
            const replacePropertyValueActor = (p: string) => {
              const actorValue = p.replace(/:.*/, "");
              if (actorValue === "player") {
                return p;
              }
              const newActorValue = getArg("actor", actorValue);
              return p.replace(/.*:/, `${newActorValue}:`);
            };
            if (isUnionPropertyValue(argValue) && argValue.value) {
              e.args[arg] = {
                ...argValue,
                value: replacePropertyValueActor(argValue.value),
              };
            } else if (typeof argValue === "string") {
              e.args[arg] = replacePropertyValueActor(argValue);
            }
          }
          // Update actor fields
          if (
            isActorField(e.command, arg, e.args) &&
            typeof argValue === "string"
          ) {
            e.args[arg] = getArg("actor", argValue); // input[`$variable[${argValue}]$`];
          }
        });

        return e;
      }
    );

    const scriptRef = this._compileSubScript(
      "custom",
      script,
      customEvent.name,
      { argLookup }
    );

    this._callFar(scriptRef);
    if (argsLen > 0) {
      this._stackPop(argsLen);
    }

    this._addNL();
  };

  returnFar = () => {
    this._returnFar();
  };

  // --------------------------------------------------------------------------
  // Scenes

  sceneSwitch = (
    sceneId: string,
    x = 0,
    y = 0,
    direction: ActorDirection = "down",
    fadeSpeed = 2
  ) => {
    this.includeActor = true;
    this._addComment("Load Scene");
    const { scenes } = this.options;
    const sceneIndex = scenes.findIndex((s) => s.id === sceneId);
    if (sceneIndex > -1) {
      this._fadeOut(fadeSpeed);
      this._setConst("ACTOR", 0);
      this._setConst("^/(ACTOR + 1)/", x * 8 * 16);
      this._setConst("^/(ACTOR + 2)/", y * 8 * 16);
      this._actorSetPosition("ACTOR");
      const asmDir = toASMDir(direction);
      if (asmDir) {
        this._actorSetDirection("ACTOR", asmDir);
      }
      this._raiseException("EXCEPTION_CHANGE_SCENE", 3);
      this._importFarPtrData(`scene_${sceneIndex}`);
      this._addNL();
    }
  };

  scenePushState = () => {
    this._addComment("Push Scene State");
    this._scenePush();
    this._addNL();
  };

  scenePopState = (fadeSpeed = 2) => {
    this._addComment("Pop Scene State");
    this._fadeOut(fadeSpeed);
    this._scenePop();
    this._addNL();
  };

  scenePopAllState = (fadeSpeed = 2) => {
    this._addComment("Pop All Scene State");
    this._fadeOut(fadeSpeed);
    this._scenePopAll();
    this._addNL();
  };

  sceneResetState = () => {
    this._addComment("Reset Scene State Stack");
    this._sceneStackReset();
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Variables

  getActorIndex = (id: string): string | number => {
    if (this._isArg(id)) {
      return id;
    }
    const { entity, entityType, scene } = this.options;

    if (id === "player" || (id === "$self$" && entityType !== "actor")) {
      return 0;
    }

    if (id === "$self$" && entity) {
      return getActorIndex(entity.id, scene);
    }

    const index = getActorIndex(id, scene);

    if (entity && index === 0) {
      return getActorIndex(entity.id, scene);
    }

    return index;
  };

  getVariableAlias = (variable = "0"): string => {
    if (this._isArg(variable)) {
      return variable;
    }

    // Lookup args if in V0-9 format
    if (variable.match(/^V[0-9]$/)) {
      const key = variable.replace(/V/, "");
      const arg = this.options.argLookup.variable[key];
      if (!arg) {
        throw new Error("Cant find arg: " + arg);
      }
      return arg;
    }

    const {
      entity,
      sceneIndex,
      entityIndex,
      entityType,
      variablesLookup,
      variableAliasLookup,
    } = this.options;

    const id = getVariableId(variable, entity);

    // If already got an alias use that
    const existingAlias = variableAliasLookup[id || "0"];
    if (existingAlias) {
      return existingAlias;
    }

    let name = "";
    if (entity && isVariableLocal(variable)) {
      const num = toVariableNumber(variable);
      const localName = localVariableName(num, entity.id, variablesLookup);
      if (entityType === "scene") {
        name = `S${sceneIndex}_${localName}`;
      } else if (entityType === "actor") {
        name = `S${sceneIndex}A${entityIndex}_${localName}`;
      } else if (entityType === "trigger") {
        name = `S${sceneIndex}T${entityIndex}_${localName}`;
      }
    } else if (isVariableTemp(variable)) {
      const num = toVariableNumber(variable);
      name = tempVariableName(num);
    } else {
      const num = toVariableNumber(variable || "0");
      name = globalVariableName(num, variablesLookup);
    }

    const alias = "VAR_" + toASMVar(name);
    let newAlias = alias;
    let counter = 1;

    // Make sure new alias is unique
    const aliases = Object.values(variableAliasLookup) as string[];
    while (aliases.includes(newAlias)) {
      newAlias = `${alias}_${counter}`;
      counter++;
    }

    // New Alias is now unique
    variableAliasLookup[id] = newAlias;

    return newAlias;
  };

  variableInc = (variable: string) => {
    this._addComment("Variable Increment By 1");
    this._rpn() //
      .refVariable(variable)
      .int8(1)
      .operator(".ADD")
      .stop();
    this._setVariable(variable, ".ARG0");
    this._stackPop(1);
    this._addNL();
  };

  variableDec = (variable: string) => {
    this._addComment("Variable Decrement By 1");
    this._rpn() //
      .refVariable(variable)
      .int8(1)
      .operator(".SUB")
      .stop();
    this._setVariable(variable, ".ARG0");
    this._stackPop(1);
    this._addNL();
  };

  variableSetToTrue = (variable: string) => {
    this._addComment("Variable Set To True");
    this._setVariableConst(variable, 1);
    this._addNL();
  };

  variableSetToFalse = (variable: string) => {
    this._addComment("Variable Set To False");
    this._setVariableConst(variable, 0);
    this._addNL();
  };

  variableSetToValue = (variable: string, value: number | string) => {
    this._addComment("Variable Set To Value");
    this._setVariableConst(variable, value);
    this._addNL();
  };

  variableCopy = (setVariable: string, otherVariable: string) => {
    this._addComment("Variable Copy");
    this._setVariableToVariable(setVariable, otherVariable);
    this._addNL();
  };

  variableSetToRandom = (variable: string, min: number, range: number) => {
    this._addComment("Variable Set To Random");
    this._randomize();
    this._randVariable(variable, min, range);
    this._addNL();
  };

  variablesOperation = (
    setVariable: string,
    operation: ScriptBuilderRPNOperation,
    otherVariable: string,
    clamp: boolean
  ) => {
    const clampLabel = clamp ? this.getNextLabel() : "";

    this._addComment(`Variables ${operation}`);
    this._rpn() //
      .refVariable(setVariable)
      .refVariable(otherVariable)
      .operator(operation)
      .stop();

    if (clamp) {
      if (operation === ".ADD") {
        this._stackPushConst(256);
        this._if(".GTE", ".ARG0", ".ARG1", clampLabel, 1);
        this._setConst("ARG0", 255);
        this.labelDefine(clampLabel);
      } else if (operation === ".SUB") {
        this._stackPushConst(0);
        this._if(".LTE", ".ARG0", ".ARG1", clampLabel, 1);
        this._setConst("ARG0", 0);
        this.labelDefine(clampLabel);
      }
    }

    this._setVariable(setVariable, ".ARG0");
    this._stackPop(1);
    this._addNL();
  };

  variableValueOperation = (
    setVariable: string,
    operation: ScriptBuilderRPNOperation,
    value: number,
    clamp: boolean
  ) => {
    const clampLabel = clamp ? this.getNextLabel() : "";

    this._addComment(`Variables ${operation} Value`);
    this._rpn() //
      .refVariable(setVariable)
      .int8(value)
      .operator(operation)
      .stop();

    if (clamp) {
      if (operation === ".ADD") {
        this._stackPushConst(256);
        this._if(".GTE", ".ARG0", ".ARG1", clampLabel, 1);
        this._setConst("ARG0", 255);
        this.labelDefine(clampLabel);
      } else if (operation === ".SUB") {
        this._stackPushConst(0);
        this._if(".LTE", ".ARG0", ".ARG1", clampLabel, 1);
        this._setConst("ARG0", 0);
        this.labelDefine(clampLabel);
      }
    }

    this._setVariable(setVariable, ".ARG0");
    this._stackPop(1);
    this._addNL();
  };

  variableRandomOperation = (
    variable: string,
    operation: ScriptBuilderRPNOperation,
    min: number,
    range: number,
    clamp: boolean
  ) => {
    const clampLabel = clamp ? this.getNextLabel() : "";

    this._addComment(`Variables ${operation} Random`);
    this._stackPushConst(0);
    this._randomize();
    this._rand(".ARG0", min, range);
    this._rpn() //
      .refVariable(variable)
      .ref(".ARG1")
      .operator(operation)
      .stop();

    if (clamp) {
      if (operation === ".ADD") {
        this._stackPushConst(256);
        this._if(".GTE", ".ARG0", ".ARG1", clampLabel, 1);
        this._setConst("ARG0", 255);
        this.labelDefine(clampLabel);
      } else if (operation === ".SUB") {
        this._stackPushConst(0);
        this._if(".LTE", ".ARG0", ".ARG1", clampLabel, 1);
        this._setConst("ARG0", 0);
        this.labelDefine(clampLabel);
      }
    }

    this._setVariable(variable, ".ARG0");
    this._stackPop(2);
    this._addNL();
  };

  variablesAdd = (
    setVariable: string,
    otherVariable: string,
    clamp: boolean
  ) => {
    this.variablesOperation(setVariable, ".ADD", otherVariable, clamp);
  };

  variablesSub = (
    setVariable: string,
    otherVariable: string,
    clamp: boolean
  ) => {
    this.variablesOperation(setVariable, ".SUB", otherVariable, clamp);
  };

  variablesMul = (setVariable: string, otherVariable: string) => {
    this.variablesOperation(setVariable, ".MUL", otherVariable, false);
  };

  variablesDiv = (setVariable: string, otherVariable: string) => {
    this.variablesOperation(setVariable, ".DIV", otherVariable, false);
  };

  variablesMod = (setVariable: string, otherVariable: string) => {
    this.variablesOperation(setVariable, ".MOD", otherVariable, false);
  };

  variableAddFlags = (variable: string, flags: number) => {
    this._addComment(`Variable Add Flags`);
    this._rpn() //
      .refVariable(variable)
      .int8(flags)
      .operator(".B_OR")
      .stop();
    this._setVariable(variable, ".ARG0");
    this._stackPop(1);
    this._addNL();
  };

  variableClearFlags = (variable: string, flags: number) => {
    this._addComment(`Variable Clear Flags`);
    this._rpn() //
      .refVariable(variable)
      .int8(-1)
      .int8(flags)
      .operator(".B_XOR")
      .operator(".B_AND")
      .stop();
    this._setVariable(variable, ".ARG0");
    this._stackPop(1);
    this._addNL();
  };

  variableEvaluateExpression = (variable: string, expression: string) => {
    this._addComment(
      `Variable ${variable} = ${this._expressionToHumanReadable(expression)}`
    );
    this._stackPushEvaluatedExpression(expression);
    this._setVariable(variable, ".ARG0");
    this._stackPop(1);
    this._addNL();
  };

  variableSetToProperty = (variable: string, property: string) => {
    const actorValue = property && property.replace(/:.*/, "");
    const propertyValue = property && property.replace(/.*:/, "");
    this.actorSetById(actorValue);
    if (propertyValue === "xpos") {
      this.actorGetPositionX(variable);
    } else if (propertyValue === "ypos") {
      this.actorGetPositionY(variable);
    } else if (propertyValue === "direction") {
      this.actorGetDirection(variable);
    } else if (propertyValue === "frame") {
      this.actorGetAnimFrame(variable);
    } else {
      throw new Error(`Unsupported property type "${propertyValue}"`);
    }
  };

  variableFromUnion = (
    unionValue: ScriptBuilderUnionValue,
    defaultVariable: string
  ) => {
    if (unionValue.type === "variable") {
      return unionValue.value;
    }
    this.variableSetToUnionValue(defaultVariable, unionValue);
    return defaultVariable;
  };

  variableSetToUnionValue = (
    variable: string,
    unionValue: ScriptBuilderUnionValue
  ) => {
    if (unionValue.type === "number") {
      this.variableSetToValue(variable, unionValue.value);
      return variable;
    }
    if (unionValue.type === "direction") {
      this.variableSetToValue(variable, toASMDir(unionValue.value));
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
    throw new Error(`Union type "${unionValue}" unknown.`);
  };

  temporaryEntityVariable = (index: number) => {
    return `T${index}`;
  };

  variablesReset = () => {
    this._addComment("Variables Reset");
    this._memSet(0, 0, "MAX_GLOBAL_VARS");
  };

  // --------------------------------------------------------------------------
  // Engine Fields

  engineFieldSetToValue = (
    key: string,
    value: ScriptBuilderStackVariable | boolean
  ) => {
    const { engineFields } = this.options;
    const engineField = engineFields[key];
    if (engineField !== undefined) {
      const cType = engineField.cType;
      let newValue = value;
      if (newValue === "" || newValue === undefined) {
        newValue = engineField.defaultValue || 0;
      }
      if (newValue === true) {
        newValue = 1;
      }
      if (newValue === false) {
        newValue = 0;
      }
      const numberValue = Number(newValue);
      this._addComment(`Engine Field Set To Value`);
      if (is16BitCType(cType)) {
        this._setConstMemInt16(key, numberValue);
      } else {
        this._setConstMemInt8(key, numberValue);
      }
      this._addNL();
    }
  };

  engineFieldSetToVariable = (key: string, variable: string) => {
    const { engineFields } = this.options;
    const engineField = engineFields[key];
    if (engineField !== undefined) {
      const cType = engineField.cType;
      this._addComment(`Engine Field Set To Variable`);
      if (is16BitCType(cType)) {
        this._setMemInt16ToVariable(key, variable);
      } else {
        this._setMemInt8ToVariable(key, variable);
      }
      this._addNL();
    }
  };

  engineFieldStoreInVariable = (key: string, variable: string) => {
    const { engineFields } = this.options;
    const engineField = engineFields[key];
    if (engineField !== undefined) {
      const cType = engineField.cType;
      this._addComment(`Engine Field Store In Variable`);
      if (is16BitCType(cType)) {
        this._setVariableMemInt16(variable, key);
      } else {
        this._setVariableMemInt8(variable, key);
      }
      this._addNL();
    }
  };

  // --------------------------------------------------------------------------
  // Screen

  fadeIn = (speed = 1) => {
    this._addComment(`Fade In`);
    this._fadeIn(speed);
    this._addNL();
  };

  fadeOut = (speed = 1) => {
    this._addComment(`Fade Out`);
    this._fadeOut(speed);
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Music

  musicPlay = (musicId: string, loop = false) => {
    this._addComment(`Music Play`);
    const { music } = this.options;
    const track = music.find((t) => t.id === musicId);
    if (track) {
      this._musicPlay(`${track.dataName}_Data`, loop);
    }
    this._addNL();
  };

  musicStop = () => {
    this._addComment(`Music Stop`);
    this._musicStop();
    this._addNL();
  };

  musicRoutineSet = (routine: number, script: ScriptEvent[]) => {
    this._addComment(`Music Routine Attach`);
    const scriptRef = this._compileSubScript("music", script);
    const routineValue = Number(routine);
    this._musicRoutine(routineValue, scriptRef);
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Sound

  soundStartTone = (period = 1600, toneFrames = 30) => {
    this._addComment("Sound Play Tone");
    this._soundPlay(
      toneFrames,
      1,
      0x00,
      (0x0 << 6) | 0x01,
      (0x0f << 4) | 0x00,
      period & 0x00ff,
      0x80 | ((period & 0x0700) >> 8)
    );
  };

  soundPlayBeep = (pitch = 4) => {
    this._addComment("Sound Play Beep");
    let pitchValue = pitch - 1;
    if (pitchValue < 0) {
      pitchValue = 0;
    }
    if (pitchValue >= 8) {
      pitchValue = 7;
    }
    pitchValue = pitchValue & 0x07;

    this._soundPlay(
      30,
      4,
      0x01,
      (0x0f << 4) | 0x02,
      0x20 | 0x08 | pitchValue,
      0x80 | 0x40,
      0x00
    );
  };

  soundPlayCrash = () => {
    this._addComment("Sound Play Crash");
    this._soundPlay(30, 4, 0x01, (0x0f << 4) | 0x02, 0x13, 0x80, 0x00);
  };

  // --------------------------------------------------------------------------
  // Palettes

  paletteSetBackground = (paletteIds: string[]) => {
    const { palettes, settings } = this.options;

    let mask = 0;
    const writePalettes: Palette[] = [];
    for (let i = 0; i < paletteIds.length; i++) {
      const paletteId = paletteIds[i];
      const defaultPaletteId = settings.defaultBackgroundPaletteIds[i];
      if (paletteId === "keep") {
        continue;
      }
      mask += 1 << i;
      writePalettes.push(getPalette(palettes, paletteId, defaultPaletteId));
    }

    if (mask === 0) {
      return;
    }

    this._paletteLoad(mask, ".PALETTE_BKG", true);

    const parseR = (hex: string) =>
      Math.floor(hexDec(hex.substring(0, 2)) * (32 / 256));
    const parseG = (hex: string) =>
      Math.floor(hexDec(hex.substring(2, 4)) * (32 / 256));
    const parseB = (hex: string) =>
      Math.max(1, Math.floor(hexDec(hex.substring(4, 6)) * (32 / 256)));

    for (const palette of writePalettes) {
      const colors = palette.colors;
      this._paletteColor(
        parseR(colors[0]),
        parseG(colors[0]),
        parseB(colors[0]),
        parseR(colors[1]),
        parseG(colors[1]),
        parseB(colors[1]),
        parseR(colors[2]),
        parseG(colors[2]),
        parseB(colors[2]),
        parseR(colors[3]),
        parseG(colors[3]),
        parseB(colors[3])
      );
    }
  };

  paletteSetSprite = (paletteIds: string[]) => {
    const { palettes, settings } = this.options;

    let mask = 0;
    const writePalettes: Palette[] = [];
    for (let i = 0; i < paletteIds.length; i++) {
      const paletteId = paletteIds[i];
      const defaultPaletteId = settings.defaultSpritePaletteIds[i];
      if (paletteId === "keep") {
        continue;
      }
      mask += 1 << i;
      writePalettes.push(getPalette(palettes, paletteId, defaultPaletteId));
    }

    if (mask === 0) {
      return;
    }

    this._paletteLoad(mask, ".PALETTE_SPRITE", true);

    const parseR = (hex: string) =>
      Math.floor(hexDec(hex.substring(0, 2)) * (32 / 256));
    const parseG = (hex: string) =>
      Math.floor(hexDec(hex.substring(2, 4)) * (32 / 256));
    const parseB = (hex: string) =>
      Math.max(1, Math.floor(hexDec(hex.substring(4, 6)) * (32 / 256)));

    for (const palette of writePalettes) {
      const colors = palette.colors;
      this._paletteColor(
        parseR(colors[0]),
        parseG(colors[0]),
        parseB(colors[0]),
        parseR(colors[0]),
        parseG(colors[0]),
        parseB(colors[0]),
        parseR(colors[1]),
        parseG(colors[1]),
        parseB(colors[1]),
        parseR(colors[3]),
        parseG(colors[3]),
        parseB(colors[3])
      );
    }
  };

  paletteSetUI = (paletteId: string) => {
    const { palettes, settings } = this.options;
    const defaultPaletteId = settings.defaultBackgroundPaletteIds[7];

    const palette = getPalette(palettes, paletteId, defaultPaletteId);

    const UI_MASK = 128;
    this._paletteLoad(UI_MASK, ".PALETTE_BKG", true);

    const parseR = (hex: string) =>
      Math.floor(hexDec(hex.substring(0, 2)) * (32 / 256));
    const parseG = (hex: string) =>
      Math.floor(hexDec(hex.substring(2, 4)) * (32 / 256));
    const parseB = (hex: string) =>
      Math.max(1, Math.floor(hexDec(hex.substring(4, 6)) * (32 / 256)));

    const colors = palette.colors;

    this._paletteColor(
      parseR(colors[0]),
      parseG(colors[0]),
      parseB(colors[0]),
      parseR(colors[1]),
      parseG(colors[1]),
      parseB(colors[1]),
      parseR(colors[2]),
      parseG(colors[2]),
      parseB(colors[2]),
      parseR(colors[3]),
      parseG(colors[3]),
      parseB(colors[3])
    );
  };

  paletteSetEmote = (paletteId: string) => {
    const { palettes, settings } = this.options;
    const defaultPaletteId = settings.defaultSpritePaletteIds[7];

    const palette = getPalette(palettes, paletteId, defaultPaletteId);

    const UI_MASK = 128;
    this._paletteLoad(UI_MASK, ".PALETTE_SPRITE", true);

    const parseR = (hex: string) =>
      Math.floor(hexDec(hex.substring(0, 2)) * (32 / 256));
    const parseG = (hex: string) =>
      Math.floor(hexDec(hex.substring(2, 4)) * (32 / 256));
    const parseB = (hex: string) =>
      Math.max(1, Math.floor(hexDec(hex.substring(4, 6)) * (32 / 256)));

    const colors = palette.colors;

    this._paletteColor(
      parseR(colors[0]),
      parseG(colors[0]),
      parseB(colors[0]),
      parseR(colors[0]),
      parseG(colors[0]),
      parseB(colors[0]),
      parseR(colors[1]),
      parseG(colors[1]),
      parseB(colors[1]),
      parseR(colors[3]),
      parseG(colors[3]),
      parseB(colors[3])
    );
  };

  // --------------------------------------------------------------------------
  // Labels

  getNextLabel = (): string => {
    const label = this.nextLabel++;
    return String(label);
  };

  labelDefine = (name: string) => {
    this._label(name);
  };

  labelGoto = (name: string) => {
    this._jump(name);
  };

  // --------------------------------------------------------------------------
  // Data

  dataLoad = (slot = 0) => {
    this._addComment(`Load Data from Slot ${slot}`);
    this._raiseException("EXCEPTION_LOAD", 1);
    this._saveSlot(slot);
    this._addNL();
  };

  dataSave = (
    slot = 0,
    onSavePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const loadedLabel = this.getNextLabel();
    this._addComment(`Save Data to Slot ${slot}`);
    this._raiseException("EXCEPTION_SAVE", 1);
    this._saveSlot(slot);
    this._stackPushConst(0);
    this._pollLoaded(".ARG0");
    this._ifConst(".EQ", ".ARG0", 1, loadedLabel, 1);
    this._addNL();
    this._compilePath(onSavePath);
    this._label(loadedLabel);
    this._addNL();
  };

  dataClear = (slot = 0) => {
    this._addComment(`Clear Data in Slot ${slot}`);
    this._saveClear(slot);
    this._addNL();
  };

  dataPeek = (slot = 0, variableSource: string, variableDest: string) => {
    const variableDestAlias = this.getVariableAlias(variableDest);
    const variableSourceAlias = this.getVariableAlias(variableSource);
    const foundLabel = this.getNextLabel();

    this._addComment(
      `Store ${variableSourceAlias} from save slot ${slot} into ${variableDestAlias}`
    );
    this._stackPushConst(0);
    this._savePeek(".ARG0", variableDestAlias, variableSourceAlias, 1, slot);
    this._ifConst(".EQ", ".ARG0", 1, foundLabel, 1);
    this._setVariableConst(variableDest, 0);
    this._label(foundLabel);
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Link Cable

  linkHost = () => {
    this._sioSetMode(".SIO_MODE_SLAVE");
  };

  linkJoin = () => {
    this._sioSetMode(".SIO_MODE_MASTER");
  };

  linkTransfer = (
    sendVariable: string,
    receiveVariable: string,
    packetSize: number
  ) => {
    this._sioExchangeVariables(sendVariable, receiveVariable, packetSize);
  };

  // --------------------------------------------------------------------------
  // Control Flow

  ifExpression = (
    expression: string,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If ${this._expressionToHumanReadable(expression)}`);
    this._stackPushEvaluatedExpression(expression);
    this._ifConst(".GT", ".ARG0", 0, trueLabel, 1);
    this._compilePath(falsePath);
    this._jump(endLabel);
    this._label(trueLabel);
    this._compilePath(truePath);
    this._label(endLabel);
    this._addNL();
  };

  ifVariableTrue = (
    variable: string,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Variable True`);
    this._ifVariableConst(".GT", variable, 0, trueLabel, 0);
    this._compilePath(falsePath);
    this._jump(endLabel);
    this._label(trueLabel);
    this._compilePath(truePath);
    this._label(endLabel);
    this._addNL();
  };

  ifVariableValue = (
    variable: string,
    operator: ScriptBuilderComparisonOperator,
    value: number,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Variable ${operator} Value`);
    this._ifVariableConst(operator, variable, value, trueLabel, 0);
    this._compilePath(falsePath);
    this._jump(endLabel);
    this._label(trueLabel);
    this._compilePath(truePath);
    this._label(endLabel);
    this._addNL();
  };

  ifVariableCompare = (
    variableA: string,
    operator: ScriptBuilderComparisonOperator,
    variableB: string,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Variable ${operator} Variable`);
    this._ifVariableCmpVariable(operator, variableA, variableB, trueLabel, 0);
    this._compilePath(falsePath);
    this._jump(endLabel);
    this._label(trueLabel);
    this._compilePath(truePath);
    this._label(endLabel);
    this._addNL();
  };

  ifVariableBitwiseValue = (
    variable: string,
    operator: ScriptBuilderRPNOperation,
    flags: number,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Variable ${operator} Value`);
    this._rpn() //
      .refVariable(variable)
      .int8(flags)
      .operator(operator)
      .stop();
    this._ifConst(".NE", ".ARG0", 0, trueLabel, 1);
    this._compilePath(falsePath);
    this._jump(endLabel);
    this._label(trueLabel);
    this._compilePath(truePath);
    this._label(endLabel);
    this._addNL();
  };

  ifParamValue = (
    parameter: number,
    value: number,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    if (!this.includeParams.includes(parameter)) {
      this.includeParams.push(parameter);
    }
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Parameter ${parameter} Equals ${value}`);
    this._stackPushConst(0);
    this._getThreadLocal(".ARG0", parameter);
    this._ifConst(".EQ", ".ARG0", value, trueLabel, 1);
    this._jump(endLabel);
    this._label(trueLabel);
    this._compilePath(truePath);
    this._stop();
    this._label(endLabel);
    this._addNL();
  };

  ifColorSupported = (truePath = [], falsePath = []) => {
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Color Supported`);
    this._stackPushConst(0);
    this._getMemUInt8(".ARG0", "_cpu");
    this._ifConst(".NE", ".ARG0", "0x11", falseLabel, 1);
    this._compilePath(truePath);
    this._jump(endLabel);
    this._label(falseLabel);
    this._compilePath(falsePath);
    this._label(endLabel);
    this._addNL();
  };

  ifActorAtPosition = (
    x: number,
    y: number,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Actor At Position`);
    this._actorGetPosition("ACTOR");
    this._rpn()
      .ref("^/(ACTOR + 1)/")
      .int16(x * 8 * 16)
      .operator(".EQ")
      .ref("^/(ACTOR + 2)/")
      .int16(y * 8 * 16)
      .operator(".EQ")
      .operator(".AND")
      .stop();
    this._ifConst(".EQ", ".ARG0", 0, falseLabel, 1);
    this._compilePath(truePath);
    this._jump(endLabel);
    this._label(falseLabel);
    this._compilePath(falsePath);
    this._label(endLabel);
    this._addNL();
  };

  ifActorDirection = (
    direction: ActorDirection,
    truePath = [],
    falsePath = []
  ) => {
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Actor Facing Direction`);
    this._stackPushConst(0);
    this._actorGetDirection("^/(ACTOR - 1)/", ".ARG0");
    this._ifConst(".NE", ".ARG0", toASMDir(direction), falseLabel, 1);
    this._compilePath(truePath);
    this._jump(endLabel);
    this._label(falseLabel);
    this._compilePath(falsePath);
    this._label(endLabel);
    this._addNL();
  };

  ifDataSaved = (
    slot = 0,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Variable True`);
    this._stackPushConst(0);
    this._savePeek(".ARG0", 0, 0, 0, slot);
    this._ifConst(".EQ", ".ARG0", 1, trueLabel, 1);
    this._compilePath(falsePath);
    this._jump(endLabel);
    this._label(trueLabel);
    this._compilePath(truePath);
    this._label(endLabel);
    this._addNL();
  };

  ifInput = (
    input: string,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Input`);
    this._stackPushConst(0);
    this._getMemInt8(".ARG0", "^/(_joypads + 1)/");
    this._rpn() //
      .ref(".ARG0")
      .int8(inputDec(input))
      .operator(".B_AND")
      .stop();
    this._ifConst(".NE", ".ARG0", 0, trueLabel, 2);
    this._compilePath(falsePath);
    this._jump(endLabel);
    this._label(trueLabel);
    this._compilePath(truePath);
    this._label(endLabel);
    this._addNL();
  };

  ifActorRelativeToActor = (
    operation: "up" | "down" | "left" | "right",
    otherId: string,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Actor Relative To Actor`);
    this._actorGetPosition("ACTOR");
    this.actorPushById(otherId);
    this._stackPushConst(0);
    this._stackPushConst(0);
    this._actorGetPosition(".ARG2");
    if (operation === "left") {
      this._rpn() //
        .ref("^/(ACTOR + 1 - 3)/") // X1
        .ref(".ARG1") // X2
        .operator(".LT")
        .stop();
    } else if (operation === "right") {
      this._rpn() //
        .ref("^/(ACTOR + 1 - 3)/") // X1
        .ref(".ARG1") // X2
        .operator(".GT")
        .stop();
    } else if (operation === "up") {
      this._rpn() //
        .ref("^/(ACTOR + 2 - 3)/") // Y1
        .ref(".ARG0") // Y2
        .operator(".LT")
        .stop();
    } else if (operation === "down") {
      this._rpn() //
        .ref("^/(ACTOR + 2 - 3)/") // Y1
        .ref(".ARG0") // Y2
        .operator(".GT")
        .stop();
    } else {
      this._stackPushConst(0);
    }
    this._ifConst(".EQ", ".ARG0", 0, falseLabel, 4);
    this._compilePath(truePath);
    this._jump(endLabel);
    this._label(falseLabel);
    this._compilePath(falsePath);
    this._label(endLabel);
    this._addNL();
  };

  caseVariableValue = (
    variable: string,
    cases: { [key: string]: ScriptEvent[] | ScriptBuilderPathFunction } = {},
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const caseKeys = Object.keys(cases);
    const numCases = caseKeys.length;

    this._addComment(`Switch Variable`);
    if (numCases === 0) {
      this._compilePath(falsePath);
    } else {
      const caseLabels = caseKeys.map(() => this.getNextLabel());
      const endLabel = this.getNextLabel();
      for (let i = 0; i < numCases; i++) {
        this._addComment(`case ${caseKeys[i]}:`);
        this._ifVariableConst(".NE", variable, caseKeys[i], caseLabels[i], 0);
        this._compilePath(cases[caseKeys[i]]);
        this._jump(endLabel);
        this._label(caseLabels[i]);
      }
      this._addComment(`default:`);
      this._compilePath(falsePath);
      this._label(endLabel);
    }
    this._addNL();
  };

  _compilePath = (path: ScriptEvent[] | ScriptBuilderPathFunction = []) => {
    const { compileEvents } = this.options;
    if (typeof path === "function") {
      path();
    } else if (path) {
      compileEvents(this, path);
    }
  };

  _getAvailableSymbol = (name: string) => {
    const { symbols } = this.options;
    if (!symbols[name]) {
      symbols[name] = name;
      return name;
    }
    let counter = 0;
    while (true) {
      const newName = `${name.replace(/_[0-9]+$/, "")}_${counter}`;
      if (!symbols[newName]) {
        symbols[newName] = newName;
        return newName;
      }
      counter++;
    }
  };

  _deregisterSymbol = (symbol: string) => {
    const { symbols } = this.options;
    delete symbols[symbol];
  };

  _compileSubScript = (
    type: "input" | "timer" | "music" | "custom",
    script: ScriptEvent[],
    name?: string,
    options?: Partial<ScriptBuilderOptions>
  ) => {
    const symbol = this._getAvailableSymbol(
      name ? `script_${toCSymbol(name)}` : `script_${type}_0`
    );
    const compiledSubScript = compileEntityEvents(symbol, script, {
      ...this.options,
      ...options,
      output: [],
      loop: false,
      lock: false,
      init: false,
      isFunction: type === "custom",
    });
    const key = compiledSubScript.replace(new RegExp(symbol, "g"), type);
    const existing = this.options.additionalScripts[key];
    if (existing) {
      this._deregisterSymbol(symbol);
      return existing.symbol;
    }
    this.options.additionalScripts[key] = {
      symbol,
      compiledScript: compiledSubScript,
    };
    return symbol;
  };

  lock = () => {
    this._vmLock();
  };

  unlock = () => {
    this._vmUnlock();
  };

  scriptEnd = () => {
    this._stop();
  };

  appendRaw = (code: string) => {
    const lines = code.split("\n");
    lines.forEach((line) => {
      this._addCmd(line);
    });
    this._addNL();
  };

  compileEvents = (path: ScriptEvent[]) => {
    const { compileEvents } = this.options;
    compileEvents(this, path);
  };

  // --------------------------------------------------------------------------
  // Export

  toScriptString = (name: string, lock: boolean) => {
    this._assertStackNeutral();
    return `${this.headers.map((header) => `.include "${header}"`).join("\n")}
${
  this.dependencies.length > 0
    ? `\n.globl ${this.dependencies.join(", ")}\n`
    : ""
}
.area _CODE_255
${this.includeActor ? "\nACTOR = -4" : ""}

___bank_${name} = 255
.globl ___bank_${name}

_${name}::
${lock ? this._padCmd("VM_LOCK", "", 8, 24) + "\n\n" : ""}${
      this.includeActor
        ? "        ; Local Actor\n" +
          this._padCmd("VM_PUSH_CONST", "0", 8, 24) +
          "\n" +
          this._padCmd("VM_PUSH_CONST", "0", 8, 24) +
          "\n" +
          this._padCmd("VM_PUSH_CONST", "0", 8, 24) +
          "\n" +
          this._padCmd("VM_PUSH_CONST", "0", 8, 24) +
          "\n\n"
        : ""
    }${this.output
      .join("\n")
      .replace(
        /\[\[(\.[A-Z0-9_]+)::([0-9]+)\]\]/g,
        (_, match1: string, match2: string) => {
          const offset = parseInt(match2, 10) + (this.includeActor ? 4 : 0);
          if (offset !== 0) {
            return `${match1} - ${
              parseInt(match2, 10) + (this.includeActor ? 4 : 0)
            }`;
          }
          return match1;
        }
      )}
`;
  };
}

export default ScriptBuilder;
