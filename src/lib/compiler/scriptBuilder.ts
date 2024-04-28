import { inputDec, textSpeedDec } from "./helpers";
import { decBin, decHex, decOct, hexDec } from "shared/lib/helpers/8bit";
import trimlines from "shared/lib/helpers/trimlines";
import { is16BitCType } from "shared/lib/engineFields/engineFieldToCType";
import {
  globalVariableDefaultName,
  localVariableName,
  tempVariableName,
} from "shared/lib/variables/variableNames";
import type {
  ActorDirection,
  Palette,
  DistanceUnitType,
  Variable,
  ScriptEvent,
  CustomEvent,
  SoundData,
} from "shared/lib/entities/entitiesTypes";
import { Dictionary } from "@reduxjs/toolkit";
import type { EngineFieldSchema } from "store/features/engine/engineState";
import type { SettingsState } from "store/features/settings/settingsState";
import { FunctionSymbol, OperatorSymbol } from "shared/lib/rpn/types";
import tokenize from "shared/lib/rpn/tokenizer";
import shuntingYard from "shared/lib/rpn/shuntingYard";
import { PrecompiledFontData } from "./compileFonts";
import { PrecompiledMusicTrack } from "./compileMusic";
import {
  PrecompiledScene,
  PrecompiledSprite,
  PrecompiledEmote,
  PrecompiledTilesetData,
  PrecompiledBackground,
} from "./generateGBVMData";
import { DMG_PALETTE, defaultProjectSettings } from "consts";
import {
  isPropertyField,
  isVariableField,
  isActorField,
  isScriptValueField,
} from "shared/lib/scripts/scriptDefHelpers";
import compileEntityEvents from "./compileEntityEvents";
import {
  isUnionPropertyValue,
  isUnionVariableValue,
  isVariableCustomEvent,
  isVariableLocal,
  isVariableTemp,
  toVariableNumber,
} from "shared/lib/entities/entitiesHelpers";
import { lexText } from "shared/lib/compiler/lexText";
import type { Reference } from "components/forms/ReferencesSelect";
import { clone } from "lib/helpers/clone";
import {
  defaultVariableForContext,
  ScriptEditorContextType,
} from "shared/lib/scripts/context";
import { encodeString } from "shared/lib/helpers/fonts";
import { mapScript } from "shared/lib/scripts/walk";
import { ScriptEventHandlers } from "lib/project/loadScriptEventHandlers";
import { VariableMapData } from "lib/compiler/compileData";
import {
  isScriptValue,
  PrecompiledValueFetch,
  PrecompiledValueRPNOperation,
  ScriptValue,
  ValueOperatorType,
  ValueUnaryOperatorType,
} from "shared/lib/scriptValue/types";
import {
  mapScriptValueLeafNodes,
  optimiseScriptValue,
  precompileScriptValue,
  sortFetchOperations,
  multiplyScriptValueConst,
  addScriptValueConst,
  addScriptValueToScriptValue,
} from "shared/lib/scriptValue/helpers";

export type ScriptOutput = string[];

export interface ScriptBuilderEntity {
  id: string;
  name: string;
}

interface ScriptBuilderScene {
  id: string;
  type: string;
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

export type ScriptBuilderEntityType =
  | "scene"
  | "actor"
  | "trigger"
  | "customEvent";

type ScriptBuilderStackVariable = string | number;

type ScriptBuilderFunctionArg = {
  type: "argument";
  indirect: boolean;
  symbol: string;
};

type ScriptBuilderSimpleVariable = string | number;

type ScriptBuilderVariable =
  | ScriptBuilderSimpleVariable
  | ScriptBuilderFunctionArg;

interface ScriptBuilderFunctionArgLookup {
  actor: Map<string, ScriptBuilderFunctionArg>;
  variable: Map<string, ScriptBuilderFunctionArg>;
}

export interface ScriptBuilderOptions {
  scriptEventHandlers: ScriptEventHandlers;
  context: ScriptEditorContextType;
  scriptSymbolName: string;
  scene: PrecompiledScene;
  sceneIndex: number;
  entityIndex: number;
  entityType: ScriptBuilderEntityType;
  entityScriptKey: string;
  variablesLookup: VariablesLookup;
  variableAliasLookup: Dictionary<VariableMapData>;
  scenes: PrecompiledScene[];
  sprites: PrecompiledSprite[];
  backgrounds: PrecompiledBackground[];
  statesOrder: string[];
  stateReferences: string[];
  fonts: PrecompiledFontData[];
  defaultFontId: string;
  music: PrecompiledMusicTrack[];
  sounds: SoundData[];
  avatars: ScriptBuilderEntity[];
  emotes: PrecompiledEmote[];
  tilesets: PrecompiledTilesetData[];
  palettes: Palette[];
  customEvents: CustomEvent[];
  entity?: ScriptBuilderEntity;
  engineFields: Dictionary<EngineFieldSchema>;
  settings: SettingsState;
  additionalScripts: Dictionary<{
    symbol: string;
    compiledScript: string;
  }>;
  additionalOutput: Dictionary<{
    filename: string;
    data: string;
  }>;
  symbols: Dictionary<string>;
  argLookup: ScriptBuilderFunctionArgLookup;
  maxDepth: number;
  compiledCustomEventScriptCache: Dictionary<{
    scriptRef: string;
    argsLen: number;
  }>;
  debugEnabled: boolean;
  compiledAssetsCache: Dictionary<string>;
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
  | ".OR"
  | ".NOT";

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
  | ".ATAN2"
  | ".ISQRT"
  | ".SHL"
  | ".SHR"
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
      value: string | ScriptBuilderFunctionArg;
    };

type ScriptBuilderPathFunction = () => void;

type VariablesLookup = { [name: string]: Variable | undefined };

type ScriptBuilderLocalSymbol = {
  symbol: string;
  size: number;
  addr: number;
  firstUse: number;
  lastUse: number;
};

type SFXPriority = "low" | "medium" | "high";
type ASMSFXPriority =
  | ".SFX_PRIORITY_MINIMAL"
  | ".SFX_PRIORITY_NORMAL"
  | ".SFX_PRIORITY_HIGH";

type ScriptBuilderActorFlags =
  | ".ACTOR_FLAG_PINNED"
  | ".ACTOR_FLAG_HIDDEN"
  | ".ACTOR_FLAG_ANIM_NOLOOP"
  | ".ACTOR_FLAG_COLLISION"
  | ".ACTOR_FLAG_PERSISTENT";

type RPNHandler = {
  ref: (variable: ScriptBuilderStackVariable) => RPNHandler;
  refInd: (variable: ScriptBuilderStackVariable) => RPNHandler;
  refVariable: (variable: ScriptBuilderVariable) => RPNHandler;
  int8: (value: number | string) => RPNHandler;
  int16: (value: number | string) => RPNHandler;
  operator: (op: ScriptBuilderRPNOperation) => RPNHandler;
  stop: () => void;
};

// - Helpers --------------

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

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

const toProjectileFlags = (destroyOnHit: boolean, loopAnim: boolean) => {
  return unionFlags(
    ([] as string[]).concat(
      !destroyOnHit ? ".PROJECTILE_STRONG" : [],
      !loopAnim ? ".PROJECTILE_ANIM_ONCE" : []
    )
  );
};

const toASMSoundPriority = (priority: SFXPriority): ASMSFXPriority => {
  if (priority === "low") {
    return ".SFX_PRIORITY_MINIMAL";
  }
  if (priority === "high") {
    return ".SFX_PRIORITY_HIGH";
  }
  return ".SFX_PRIORITY_NORMAL";
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
    case "<<":
      return ".SHL";
    case ">>":
      return ".SHR";
  }
  assertUnreachable(operator);
};

const valueFunctionToScriptOperator = (
  operator: ValueOperatorType | ValueUnaryOperatorType
): ScriptBuilderRPNOperation => {
  switch (operator) {
    case "add":
      return ".ADD";
    case "sub":
      return ".SUB";
    case "div":
      return ".DIV";
    case "mul":
      return ".MUL";
    case "mod":
      return ".MOD";
    case "eq":
      return ".EQ";
    case "ne":
      return ".NE";
    case "lt":
      return ".LT";
    case "lte":
      return ".LTE";
    case "gt":
      return ".GT";
    case "gte":
      return ".GTE";
    case "min":
      return ".MIN";
    case "max":
      return ".MAX";
    case "and":
      return ".AND";
    case "or":
      return ".OR";
    case "abs":
      return ".ABS";
    case "atan2":
      return ".ATAN2";
    case "isqrt":
      return ".ISQRT";
    case "not":
      return ".NOT";
    case "shl":
      return ".SHL";
    case "shr":
      return ".SHR";
    case "bAND":
      return ".B_AND";
    case "bOR":
      return ".B_OR";
    case "bXOR":
      return ".B_XOR";
    case "bNOT":
      return ".B_NOT";
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
    case "atan2":
      return ".ATAN2";
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
const fadeSpeeds = [0x0, 0x1, 0x3, 0x7, 0xf, 0x1f, 0x3f];

// ------------------------

class ScriptBuilder {
  byteSize: number;
  output: ScriptOutput;
  options: ScriptBuilderOptions;
  dependencies: string[];
  nextLabel: number;
  labelLookup: Record<string, string>;
  localsLookup: Record<string, ScriptBuilderLocalSymbol>;
  localsSize: number;
  actorIndex: number;
  stackPtr: number;
  labelStackSize: Dictionary<number>;
  includeParams: number[];
  headers: string[];

  constructor(
    output: ScriptOutput,
    options: Partial<ScriptBuilderOptions> &
      Pick<ScriptBuilderOptions, "scene" | "scriptEventHandlers">
  ) {
    this.byteSize = 0;
    this.output = output;
    this.options = {
      ...options,
      context: options.context || "entity",
      scriptSymbolName: options.scriptSymbolName || "script_1",
      sceneIndex: options.sceneIndex || 0,
      entityIndex: options.entityIndex || 0,
      entityType: options.entityType || "scene",
      entityScriptKey: options.entityScriptKey || "script",
      variablesLookup: options.variablesLookup || {},
      variableAliasLookup: options.variableAliasLookup || {},
      engineFields: options.engineFields || {},
      scenes: options.scenes || [],
      sprites: options.sprites || [],
      backgrounds: options.backgrounds || [],
      statesOrder: options.statesOrder || [],
      stateReferences: options.stateReferences || [],
      fonts: options.fonts || [],
      defaultFontId: options.defaultFontId || "",
      music: options.music || [],
      sounds: options.sounds || [],
      avatars: options.avatars || [],
      emotes: options.emotes || [],
      tilesets: options.tilesets || [],
      palettes: options.palettes || [],
      customEvents: options.customEvents || [],
      additionalScripts: options.additionalScripts || {},
      additionalOutput: options.additionalOutput || {},
      symbols: options.symbols || {},
      argLookup: options.argLookup || { actor: new Map(), variable: new Map() },
      maxDepth: options.maxDepth ?? 5,
      debugEnabled: options.debugEnabled ?? false,
      compiledCustomEventScriptCache:
        options.compiledCustomEventScriptCache ?? {},
      compiledAssetsCache: options.compiledAssetsCache ?? {},
      compileEvents: options.compileEvents || ((_self, _e) => {}),
      settings: options.settings || defaultProjectSettings,
    };
    this.dependencies = [];
    this.nextLabel = 1;
    this.labelLookup = {};
    this.localsLookup = {};
    this.localsSize = 0;
    this.actorIndex = options.entity
      ? getActorIndex(options.entity.id, options.scene)
      : 0;
    this.stackPtr = 0;
    this.labelStackSize = {};
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
    let comment = "";
    const lastArg = args[args.length - 1];
    // Check if lastArg was a comment
    if (
      typeof lastArg === "string" &&
      (lastArg.startsWith(";") || lastArg === "")
    ) {
      comment = lastArg;
      args.pop();
    }
    this.output.push(
      this._padCmd(
        cmd,
        args.map((d) => this._offsetStackAddr(d)).join(", ") +
          (comment ? ` ${comment}` : ""),
        8,
        24
      )
    );
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

  private _stackPushEvaluatedExpression = (
    expression: string,
    resultVariable?: ScriptBuilderVariable
  ) => {
    const tokens = tokenize(expression);
    const rpnTokens = shuntingYard(tokens);
    if (rpnTokens.length > 0) {
      let rpn = this._rpn();
      let token = rpnTokens.shift();
      while (token) {
        if (token.type === "VAL") {
          rpn = rpn.int16(token.value);
        } else if (token.type === "VAR") {
          const ref = token.symbol.replace(/\$/g, "");
          const variable = ref;
          if (variable.match(/^V[0-9]$/)) {
            const key = variable;
            const arg = this.options.argLookup.variable.get(key);
            if (!arg) {
              throw new Error("Cant find arg");
            }
            rpn = rpn.refVariable(arg);
          } else {
            rpn = rpn.refVariable(ref);
          }
        } else if (token.type === "FUN") {
          const op = funToScriptOperator(token.function);
          rpn = rpn.operator(op);
        } else if (token.type === "OP") {
          const op = toScriptOperator(token.operator);
          rpn = rpn.operator(op);
        }
        token = rpnTokens.shift();
      }
      if (resultVariable !== undefined) {
        rpn.refSetVariable(resultVariable);
      }
      rpn.stop();
    } else {
      // If expression empty use value 0
      if (resultVariable !== undefined) {
        this._setVariableConst(resultVariable, 0);
      } else {
        this._stackPushConst(0);
      }
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

  _idle = () => {
    this._addCmd("VM_IDLE");
  };

  _raiseException = (exception: string, numArgs: number) => {
    this._addCmd("VM_RAISE", exception, numArgs);
  };

  _invoke = (fn: string, popNum: number, addr: string) => {
    this._addBankedFnDependency(fn);
    this._addCmd("VM_INVOKE", `b_${fn}`, `_${fn}`, popNum, addr);
    this.stackPtr -= popNum;
  };

  _stackPushConst = (value: number | string, comment?: string) => {
    this._addCmd("VM_PUSH_CONST", value, comment ? `; ${comment}` : "");
    this.stackPtr++;
  };

  _stackPush = (addr: ScriptBuilderStackVariable) => {
    this._addCmd("VM_PUSH_VALUE", addr);
    this.stackPtr++;
  };

  _stackPushInd = (addr: ScriptBuilderStackVariable) => {
    this._addCmd("VM_PUSH_VALUE_IND", addr);
    this.stackPtr++;
  };

  _stackPushReference = (
    addr: ScriptBuilderStackVariable,
    comment?: string
  ) => {
    this._addCmd("VM_PUSH_REFERENCE", addr, comment ? `; ${comment}` : "");
    this.stackPtr++;
  };

  _stackPop = (num: number) => {
    this._addCmd("VM_POP", num);
    this.stackPtr -= num;
  };

  _set = (
    addr: ScriptBuilderStackVariable,
    value: ScriptBuilderStackVariable
  ) => {
    this._addCmd("VM_SET", addr, value);
  };

  _setConst = (
    addr: ScriptBuilderStackVariable,
    value: ScriptBuilderStackVariable
  ) => {
    this._addCmd("VM_SET_CONST", addr, value);
  };

  _setInd = (
    addr: ScriptBuilderStackVariable,
    value: ScriptBuilderStackVariable
  ) => {
    this._addCmd("VM_SET_INDIRECT", addr, value);
  };

  _setVariable = (
    variable: ScriptBuilderVariable,
    value: ScriptBuilderStackVariable
  ) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isIndirectVariable(variable)) {
      this._setInd(variableAlias, value);
    } else {
      this._set(variableAlias, value);
    }
  };

  _setToVariable = (addr: ScriptBuilderStackVariable, variable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isIndirectVariable(variable)) {
      this._stackPushInd(variableAlias);
      this._set(addr, ".ARG0");
      this._stackPop(1);
    } else {
      this._set(addr, variableAlias);
    }
  };

  _setVariableToVariable = (
    variableA: ScriptBuilderVariable,
    variableB: ScriptBuilderVariable
  ) => {
    const variableAliasA = this.getVariableAlias(variableA);
    const variableAliasB = this.getVariableAlias(variableB);

    let dest = variableAliasB;

    if (this._isIndirectVariable(variableB)) {
      this._stackPushInd(variableAliasB);
      dest = ".ARG0";
    }

    if (this._isIndirectVariable(variableA)) {
      this._setInd(variableAliasA, dest);
    } else {
      this._set(variableAliasA, dest);
    }

    if (this._isIndirectVariable(variableB)) {
      this._stackPop(1);
    }
  };

  _setVariableConst = (
    variable: ScriptBuilderVariable,
    value: ScriptBuilderStackVariable
  ) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isIndirectVariable(variable)) {
      const valueTmpRef = this._declareLocal("value_tmp", 1, true);
      this._setConst(valueTmpRef, value);
      this._setInd(variableAlias, valueTmpRef);
    } else {
      this._setConst(variableAlias, value);
    }
  };

  _getInd = (
    addr: ScriptBuilderStackVariable,
    value: ScriptBuilderStackVariable
  ) => {
    this._addCmd("VM_GET_INDIRECT", addr, value);
  };

  _setMemInt8 = (cVariable: string, addr: ScriptBuilderStackVariable) => {
    this._addDependency(cVariable);
    this._addCmd("VM_SET_INT8", `_${cVariable}`, addr);
  };

  _setMemInt16 = (cVariable: string, addr: ScriptBuilderStackVariable) => {
    this._addDependency(cVariable);
    this._addCmd("VM_SET_INT16", `_${cVariable}`, addr);
  };

  _setMemInt8ToVariable = (cVariable: string, variable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    this._addDependency(cVariable);
    if (this._isIndirectVariable(variable)) {
      this._stackPushInd(variableAlias);
      this._setMemInt8(cVariable, ".ARG0");
      this._stackPop(1);
    } else {
      this._setMemInt8(cVariable, variableAlias);
    }
  };

  _setMemInt16ToVariable = (cVariable: string, variable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    this._addDependency(cVariable);
    if (this._isIndirectVariable(variable)) {
      this._stackPushInd(variableAlias);
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

  _getMemUInt8 = (addr: ScriptBuilderStackVariable, cVariable: string) => {
    this._addCmd("VM_GET_UINT8", addr, `_${cVariable}`);
  };

  _getMemInt8 = (addr: ScriptBuilderStackVariable, cVariable: string) => {
    this._addCmd(
      "VM_GET_INT8",
      addr,
      cVariable.startsWith("^") || cVariable.startsWith("_")
        ? cVariable
        : `_${cVariable}`
    );
  };

  _getMemInt16 = (addr: ScriptBuilderStackVariable, cVariable: string) => {
    this._addCmd(
      "VM_GET_INT16",
      addr,
      cVariable.startsWith("^") || cVariable.startsWith("_")
        ? cVariable
        : `_${cVariable}`
    );
  };

  _setVariableMemInt8 = (variable: string, cVariable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isIndirectVariable(variable)) {
      const valueTmpRef = this._declareLocal("value_tmp", 1, true);
      this._getMemInt8(valueTmpRef, cVariable);
      this._setInd(variableAlias, valueTmpRef);
    } else {
      this._getMemInt8(variableAlias, cVariable);
    }
  };

  _setVariableMemInt16 = (variable: string, cVariable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isIndirectVariable(variable)) {
      const valueTmpRef = this._declareLocal("value_tmp", 1, true);
      this._getMemInt16(valueTmpRef, cVariable);
      this._setInd(variableAlias, valueTmpRef);
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

  _pollLoaded = (addr: ScriptBuilderStackVariable) => {
    this._addCmd("VM_POLL_LOADED", addr);
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

    if (this._isIndirectVariable(variableB)) {
      pop++;
      this._stackPushConst(0);
      dest = this._isIndirectVariable(variableA) ? ".ARG1" : ".ARG0";
    }

    if (this._isIndirectVariable(variableA)) {
      pop++;
      this._stackPushInd(variableAliasA);
      this._sioExchange(".ARG0", dest, packetSize);
    } else {
      this._sioExchange(variableAliasA, dest, packetSize);
    }

    if (this._isIndirectVariable(variableB)) {
      this._setInd(variableAliasB, dest);
    }

    if (pop > 0) {
      this._stackPop(pop);
    }
  };

  _dw = (...data: Array<ScriptBuilderStackVariable>) => {
    this._addCmd(
      `.dw ${data.map((d) => this._rawOffsetStackAddr(d)).join(", ")}`
    );
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

  _rand = (addr: ScriptBuilderStackVariable, min: number, range: number) => {
    this._addCmd("VM_RAND", addr, min, range);
  };

  _randVariable = (variable: string, min: number, range: number) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isIndirectVariable(variable)) {
      const valueTmpRef = this._declareLocal("value_tmp", 1, true);
      this._rand(valueTmpRef, min, range);
      this._setInd(variableAlias, valueTmpRef);
    } else {
      this._rand(variableAlias, min, range);
    }
  };

  _rpn = () => {
    const output: string[] = [];
    const stack: number[] = [];

    const rpnCmd = (
      cmd: string,
      ...args: Array<ScriptBuilderStackVariable>
    ) => {
      output.push(
        this._padCmd(
          cmd,
          args.map((d) => this._offsetStackAddr(d)).join(", "),
          12,
          12
        )
      );
    };

    const rpn = {
      ref: (variable: ScriptBuilderStackVariable) => {
        rpnCmd(".R_REF", variable);
        stack.push(0);
        return rpn;
      },
      refInd: (variable: ScriptBuilderStackVariable) => {
        rpnCmd(".R_REF_IND", variable);
        stack.push(0);
        return rpn;
      },
      refVariable: (variable: ScriptBuilderVariable) => {
        const variableAlias = this.getVariableAlias(variable);
        if (this._isIndirectVariable(variable)) {
          return rpn.refInd(variableAlias);
        } else {
          return rpn.ref(variableAlias);
        }
      },
      refSet: (variable: ScriptBuilderStackVariable) => {
        rpnCmd(".R_REF_SET", variable);
        stack.pop();
        return rpn;
      },
      refSetInd: (variable: ScriptBuilderStackVariable) => {
        rpnCmd(".R_REF_SET_IND", variable);
        stack.pop();
        return rpn;
      },
      refSetVariable: (variable: ScriptBuilderVariable) => {
        const variableAlias = this.getVariableAlias(variable);
        if (this._isIndirectVariable(variable)) {
          return rpn.refSetInd(variableAlias);
        } else {
          return rpn.refSet(variableAlias);
        }
      },
      int8: (value: number | string) => {
        rpnCmd(".R_INT8", value);
        stack.push(0);
        return rpn;
      },
      int16: (value: number | string) => {
        rpnCmd(".R_INT16", value);
        stack.push(0);
        return rpn;
      },
      operator: (op: ScriptBuilderRPNOperation) => {
        rpnCmd(".R_OPERATOR", op);
        if (op !== ".ABS" && op !== ".NOT") {
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

  _performFetchOperations = (
    fetchOps: PrecompiledValueFetch[]
  ): Record<string, string> => {
    const localsLookup: Record<string, string> = {};
    const sortedFetchOps = sortFetchOperations(fetchOps);

    let currentActor = "-1";
    let currentProperty = "";
    let currentPropData = "";
    let prevLocalVar = "";
    for (const fetchOp of sortedFetchOps) {
      const localVar = this._declareLocal("local", 1, true);
      localsLookup[fetchOp.local] = localVar;
      switch (fetchOp.value.type) {
        case "rnd": {
          const min = Math.min(
            fetchOp.value.valueA?.value ?? 0,
            fetchOp.value.valueB?.value ?? 0
          );
          const max = Math.max(
            fetchOp.value.valueA?.value ?? 0,
            fetchOp.value.valueB?.value ?? 0
          );
          this._addComment(`-- Rand between ${min} and ${max} (inclusive)`);
          this._rand(localVar, min, max - min + 1);
          break;
        }
        case "property": {
          const actorValue = fetchOp.value.target || "player";
          const propertyValue = fetchOp.value.property || "xpos";

          if (
            actorValue === currentActor &&
            propertyValue === currentProperty &&
            prevLocalVar
          ) {
            // If requested prop was fetched previously, reuse local var, don't fetch again
            localsLookup[fetchOp.local] = prevLocalVar;
            delete this.localsLookup[localVar];
            continue;
          }

          this._addComment(`-- Fetch ${actorValue} ${propertyValue}`);
          if (currentActor !== actorValue) {
            this.actorSetById(actorValue);
            currentActor = actorValue;
            currentPropData = "";
          }
          if (propertyValue === "xpos") {
            const actorRef = this._declareLocal("actor", 4);
            if (currentPropData !== "pos") {
              this._actorGetPosition(actorRef);
              currentPropData = "pos";
            }
            this._rpn() //
              .ref(this._localRef(actorRef, 1))
              .int16(8 * 16)
              .operator(".DIV")
              .refSet(localVar)
              .stop();
          } else if (propertyValue === "ypos") {
            const actorRef = this._declareLocal("actor", 4);
            if (currentPropData !== "pos") {
              this._actorGetPosition(actorRef);
              currentPropData = "pos";
            }
            this._rpn() //
              .ref(this._localRef(actorRef, 2))
              .int16(8 * 16)
              .operator(".DIV")
              .refSet(localVar)
              .stop();
          } else if (propertyValue === "pxpos") {
            const actorRef = this._declareLocal("actor", 4);
            if (currentPropData !== "pos") {
              this._actorGetPosition(actorRef);
              currentPropData = "pos";
            }
            this._rpn() //
              .ref(this._localRef(actorRef, 1))
              .int16(16)
              .operator(".DIV")
              .refSet(localVar)
              .stop();
          } else if (propertyValue === "pypos") {
            const actorRef = this._declareLocal("actor", 4);
            if (currentPropData !== "pos") {
              this._actorGetPosition(actorRef);
              currentPropData = "pos";
            }
            this._rpn() //
              .ref(this._localRef(actorRef, 2))
              .int16(16)
              .operator(".DIV")
              .refSet(localVar)
              .stop();
          } else if (propertyValue === "direction") {
            const actorRef = this._declareLocal("actor", 4);
            this._actorGetDirection(actorRef, localVar);
          } else if (propertyValue === "frame") {
            const actorRef = this._declareLocal("actor", 4);
            if (currentPropData !== "frame") {
              this._actorGetAnimFrame(actorRef);
              currentPropData = "frame";
            }
            this._set(localVar, this._localRef(actorRef, 1));
          } else {
            throw new Error(`Unsupported property type "${propertyValue}"`);
          }
          currentProperty = propertyValue;
          prevLocalVar = localVar;
          break;
        }
        case "expression": {
          this._addComment(
            `-- Evaluate expression ${this._expressionToHumanReadable(
              fetchOp.value.value
            )}`
          );
          this._stackPushEvaluatedExpression(fetchOp.value.value, localVar);
          break;
        }
        default: {
          assertUnreachable(fetchOp.value);
        }
      }
    }

    return localsLookup;
  };

  _performValueRPN = (
    rpn: RPNHandler,
    rpnOps: PrecompiledValueRPNOperation[],
    localsLookup: Record<string, string>
  ) => {
    for (const rpnOp of rpnOps) {
      switch (rpnOp.type) {
        case "number": {
          rpn.int16(rpnOp.value ?? 0);
          break;
        }
        case "variable": {
          rpn.refVariable(rpnOp.value);
          break;
        }
        case "local": {
          this._markLocalUse(localsLookup[rpnOp.value]);
          rpn.ref(localsLookup[rpnOp.value]);
          break;
        }
        case "indirect": {
          rpn.refInd(rpnOp.value);
          break;
        }
        case "direction": {
          rpn.int16(toASMDir(rpnOp.value));
          break;
        }
        default: {
          const op = valueFunctionToScriptOperator(rpnOp.type);
          rpn.operator(op);
        }
      }
    }
  };

  _if = (
    operator: ScriptBuilderComparisonOperator,
    variableA: ScriptBuilderStackVariable,
    variableB: ScriptBuilderStackVariable,
    label: string,
    popNum: number
  ) => {
    this._addCmd("VM_IF", operator, variableA, variableB, `${label}$`, popNum);
    this.stackPtr -= popNum;
  };

  _ifConst = (
    operator: ScriptBuilderComparisonOperator,
    variable: ScriptBuilderStackVariable,
    value: ScriptBuilderStackVariable,
    label: string,
    popNum: number
  ) => {
    this._addCmd("VM_IF_CONST", operator, variable, value, `${label}$`, popNum);
    this.stackPtr -= popNum;
  };

  _switch = (
    variable: ScriptBuilderStackVariable,
    switchCases: [number, string][],
    popNum: number
  ) => {
    this._addCmd("VM_SWITCH", variable, switchCases.length, popNum);
    for (const switchCase of switchCases) {
      this._dw(...switchCase);
    }
    this.stackPtr -= popNum;
  };

  _switchVariable = (
    variable: string,
    switchCases: [number, string][],
    popNum: number
  ) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isIndirectVariable(variable)) {
      this._stackPushInd(variableAlias);
      this._switch(".ARG0", switchCases, popNum + 1);
    } else {
      this._switch(variableAlias, switchCases, popNum);
    }
  };

  _ifVariableConst = (
    operator: ScriptBuilderComparisonOperator,
    variable: string,
    value: ScriptBuilderStackVariable,
    label: string,
    popNum: number
  ) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isIndirectVariable(variable)) {
      this._stackPushInd(variableAlias);
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

    if (this._isIndirectVariable(variableB)) {
      this._stackPushInd(variableAliasB);
      dest = this._isIndirectVariable(variableA) ? ".ARG1" : ".ARG0";
      pop += 1;
    }

    if (this._isIndirectVariable(variableA)) {
      this._stackPushInd(variableAliasA);
      this._if(operator, ".ARG0", dest, label, pop + 1);
    } else {
      this._if(operator, variableAliasA, dest, label, pop);
    }
  };

  _actorActivate = (addr: string) => {
    this._addCmd("VM_ACTOR_ACTIVATE", addr);
  };

  _actorDeactivate = (addr: string) => {
    this._addCmd("VM_ACTOR_DEACTIVATE", addr);
  };

  _actorMoveTo = (addr: string) => {
    this._addCmd("VM_ACTOR_MOVE_TO", addr);
  };

  _actorMoveCancel = (addr: string) => {
    this._addCmd("VM_ACTOR_MOVE_CANCEL", addr);
  };

  _actorGetPosition = (addr: string) => {
    this._addCmd("VM_ACTOR_GET_POS", addr);
  };

  _actorSetPosition = (addr: string) => {
    this._addCmd("VM_ACTOR_SET_POS", addr);
  };

  _actorGetDirection = (addr: string, dest: string) => {
    this._addCmd("VM_ACTOR_GET_DIR", addr, dest);
  };

  _actorGetAngle = (addr: string, dest: string) => {
    this._addCmd("VM_ACTOR_GET_ANGLE", addr, dest);
  };

  _actorGetDirectionToVariable = (addr: string, variable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isIndirectVariable(variable)) {
      const dirDestVarRef = this._declareLocal("dir_dest_var", 1, true);
      this._actorGetDirection(addr, dirDestVarRef);
      this._setInd(variableAlias, dirDestVarRef);
    } else {
      this._actorGetDirection(addr, variableAlias);
    }
  };

  _actorSetDirection = (addr: string, asmDir: string) => {
    this._addCmd("VM_ACTOR_SET_DIR", addr, asmDir);
  };

  _actorSetHidden = (addr: string, hidden: boolean) => {
    this._addCmd("VM_ACTOR_SET_HIDDEN", addr, hidden ? 1 : 0);
  };

  _actorSetBounds = (
    addr: string,
    left: number,
    right: number,
    top: number,
    bottom: number
  ) => {
    this._addCmd("VM_ACTOR_SET_BOUNDS", addr, left, right, top, bottom);
  };

  _actorSetAnimTick = (addr: string, tick: number) => {
    this._addCmd("VM_ACTOR_SET_ANIM_TICK", addr, tick);
  };

  _actorSetAnimFrame = (addr: string) => {
    this._addCmd("VM_ACTOR_SET_ANIM_FRAME", addr);
  };

  _actorGetAnimFrame = (addr: string) => {
    this._addCmd("VM_ACTOR_GET_ANIM_FRAME", addr);
  };

  _actorSetMoveSpeed = (addr: string, speed: number) => {
    this._addCmd("VM_ACTOR_SET_MOVE_SPEED", addr, speed);
  };

  _actorSetCollisionsEnabled = (addr: string, enabled: boolean) => {
    this._addCmd("VM_ACTOR_SET_COLL_ENABLED", addr, enabled ? 1 : 0);
  };

  _actorSetSpritesheet = (addr: string, symbol: string) => {
    this._addCmd(
      "VM_ACTOR_SET_SPRITESHEET",
      addr,
      `___bank_${symbol}`,
      `_${symbol}`
    );
  };

  _actorSetAnimState = (addr: string, state: string) => {
    this._addCmd("VM_ACTOR_SET_ANIM_SET", addr, state);
  };

  _actorEmote = (addr: string, symbol: string) => {
    this._addCmd("VM_ACTOR_EMOTE", addr, `___bank_${symbol}`, `_${symbol}`);
  };

  _actorTerminateUpdate = (addr: string) => {
    this._addCmd("VM_ACTOR_TERMINATE_UPDATE", addr);
  };

  _actorSetFlags = (
    addr: string,
    flags: ScriptBuilderActorFlags[],
    mask: ScriptBuilderActorFlags[]
  ) => {
    this._addCmd(
      "VM_ACTOR_SET_FLAGS",
      addr,
      unionFlags(flags),
      unionFlags(mask)
    );
  };

  _projectileLaunch = (index: number, addr: string) => {
    this._addCmd("VM_PROJECTILE_LAUNCH", index, addr);
  };

  _spritesHide = () => {
    this._addCmd("VM_HIDE_SPRITES");
  };

  _spritesShow = () => {
    this._addCmd("VM_SHOW_SPRITES");
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
    const indirectVars: { arg: string; local: string }[] = [];
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
          const key = variable;
          const arg = this.options.argLookup.variable.get(key);
          if (!arg) {
            throw new Error("Cant find arg");
          }
          if (this._isIndirectVariable(arg)) {
            const localRef = this._declareLocal(
              `text_arg${indirectVars.length}`,
              1,
              true
            );
            indirectVars.unshift({
              local: localRef,
              arg: arg.symbol,
            });
            usedVariableAliases.push(this._rawOffsetStackAddr(localRef));
          } else {
            usedVariableAliases.push(this._rawOffsetStackAddr(arg.symbol));
          }
        } else {
          usedVariableAliases.push(
            this.getVariableAlias(variable.replace(/^0/g, ""))
          );
        }
        if (token.type === "variable") {
          text += "%d";
        } else {
          text += "%c";
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
        this._getInd(indirectVar.local, indirectVar.arg);
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

  _inputContextAttach = (
    buttonMask: number,
    context: number,
    override: boolean
  ) => {
    this._addCmd(
      "VM_INPUT_ATTACH",
      buttonMask,
      unionFlags([String(context)].concat(override ? ".OVERRIDE_DEFAULT" : []))
    );
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

  _fadeIn = (isModal: boolean) => {
    this._addCmd("VM_FADE_IN", isModal ? 1 : 0);
  };

  _fadeOut = (isModal: boolean) => {
    this._addCmd("VM_FADE_OUT", isModal ? 1 : 0);
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

  _soundPlay = (symbol: string, priority: ASMSFXPriority) => {
    this._addCmd(
      "VM_SFX_PLAY",
      `___bank_${symbol}`,
      `_${symbol}`,
      `___mute_mask_${symbol}`,
      priority
    );
  };

  _soundPlayBasic = (
    channel: number,
    frames: number,
    data: number[]
  ): string => {
    const { compiledAssetsCache } = this.options;
    let output = "";

    const channelMasks = [
      "",
      "0b11111000", // Channel 1
      "0b01111001", // Channel 2
      "0b11111010", // Channel 3
      "0b01111011", // Channel 4
    ];

    const channelStopInstructions = [
      "",
      "0x01, 0b00101000, 0x00,0xc0,      //shut ch1",
      "0x01, 0b00101001, 0x00,0xc0,      //shut ch2",
      "0x01, 0b00101010, 0x00,0xc0,      //shut ch3",
      "0x01, 0b00101011, 0x00,0xc0,      //shut ch4",
    ];

    for (let i = 0; i < frames; i += 4) {
      const len = Math.min(4, frames - i);
      const extraFrames = len * 4 - 1;
      if (i === 0) {
        output += `${decHex((extraFrames << 4) + 1)}, ${
          channelMasks[channel]
        },${data.map(decHex).join(",")},`;
      } else {
        output += `${decHex(extraFrames << 4)},`;
      }
      output += "\n";
    }

    const cachedSymbol = compiledAssetsCache[output];
    if (cachedSymbol) {
      return cachedSymbol;
    }

    const symbol = this._getAvailableSymbol("sound_legacy_0");

    const muteMask = 1 << (channel - 1);

    this.writeAsset(
      `sounds/${symbol}.c`,
      `#pragma bank 255

#include <gbdk/platform.h>
#include <stdint.h>

BANKREF(${symbol})
const uint8_t ${symbol}[] = {
${output}${channelStopInstructions[channel]}
0x01, 0b00000111,                 //stop
};
void AT(0b${decBin(muteMask)}) __mute_mask_${symbol};`
    );

    this.writeAsset(
      `${symbol}.h`,
      `#ifndef __${symbol}_INCLUDE__
#define __${symbol}_INCLUDE__

#include <gbdk/platform.h>
#include <stdint.h>

#define MUTE_MASK_${symbol} 0b${decBin(muteMask)}

BANKREF_EXTERN(${symbol})
extern const uint8_t ${symbol}[];
extern void __mute_mask_${symbol};

#endif
`
    );

    compiledAssetsCache[output] = symbol;

    return symbol;
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

  _replaceTile = (
    addr: ScriptBuilderStackVariable,
    symbol: string,
    tileIndex: ScriptBuilderStackVariable,
    numTiles: number
  ) => {
    this._addCmd(
      "VM_REPLACE_TILE",
      addr,
      `___bank_${symbol}`,
      `_${symbol}`,
      tileIndex,
      numTiles
    );
  };

  _replaceTileXY = (
    x: number,
    y: number,
    symbol: string,
    tileIndex: ScriptBuilderStackVariable
  ) => {
    this._addCmd(
      "VM_REPLACE_TILE_XY",
      x,
      y,
      `___bank_${symbol}`,
      `_${symbol}`,
      tileIndex
    );
  };

  _getTileXY = (addr: ScriptBuilderStackVariable, x: number, y: number) => {
    this._addCmd("VM_GET_TILE_XY", addr, x, y);
  };

  _callFar = (symbol: string, argsLen: number) => {
    this._addCmd("VM_CALL_FAR", `___bank_${symbol}`, `_${symbol}`);
    if (argsLen > 0) {
      // Args are popped by called script with ret_far_n
      this.stackPtr -= argsLen;
    }
  };

  _callNative = (symbol: string) => {
    this._addCmd("VM_CALL_NATIVE", `b_${symbol}`, `_${symbol}`);
  };

  _returnFar = () => {
    this._addCmd("VM_RET_FAR");
  };

  _returnFarN = (localsSize: number) => {
    this._addCmd("VM_RET_FAR_N", localsSize);
  };

  _stop = () => {
    this._assertStackNeutral();
    this._addComment("Stop Script");
    this._addCmd("VM_STOP");
  };

  _isArg = (variable: ScriptBuilderStackVariable) => {
    if (typeof variable === "string") {
      return variable.startsWith(".SCRIPT_ARG_INDIRECT");
    }
    return false;
  };

  _isFunctionArg(x: unknown): x is ScriptBuilderFunctionArg {
    return (
      isObject(x) && typeof x["type"] === "string" && x.type === "argument"
    );
  }

  _isIndirectVariable(x: ScriptBuilderVariable): boolean {
    return this._isFunctionArg(x) && x.indirect;
  }

  _declareLocal = (
    symbol: string,
    size: number,
    isTemporary = false
  ): string => {
    const asmSymbolPostfix = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    const asmSymbol = isTemporary
      ? `.LOCAL_TMP${Object.keys(this.localsLookup).length}_${asmSymbolPostfix}`
      : `.LOCAL_${asmSymbolPostfix}`;
    if (this.localsLookup[asmSymbol] === undefined) {
      this.localsSize += size;
      this.localsLookup[asmSymbol] = {
        symbol: asmSymbol,
        size,
        addr: this.localsSize,
        firstUse: this.output.length,
        lastUse: this.output.length,
      };
    } else {
      this.localsLookup[asmSymbol].lastUse = this.output.length;
    }
    return asmSymbol;
  };

  // Mark a local as being used to make sure locals required at the same time don't
  // overlap in memory after being packed by _packLocals()
  _markLocalUse = (asmSymbol: string) => {
    if (this.localsLookup[asmSymbol]) {
      this.localsLookup[asmSymbol].lastUse = this.output.length;
    }
  };

  _localRef = (symbol: string, offset: number): string => {
    return this._offsetStackAddr(symbol, offset);
  };

  _argRef = (symbol: string, offset: number): string => {
    return this._offsetStackAddr(symbol, offset);
  };

  _offsetStackAddr = (
    symbol: ScriptBuilderStackVariable,
    offset = 0
  ): string => {
    if (
      typeof symbol === "number" ||
      (symbol.indexOf(".SCRIPT_ARG_") !== 0 && symbol.indexOf(".LOCAL_") !== 0)
    ) {
      return String(symbol);
    }
    if (this.stackPtr === 0 && offset === 0) {
      return `${symbol}`;
    }
    return `^/(${symbol}${offset !== 0 ? ` + ${offset}` : ""}${
      this.stackPtr !== 0 ? ` - ${this.stackPtr}` : ""
    })/`;
  };

  _rawOffsetStackAddr = (
    symbol: ScriptBuilderStackVariable,
    offset = 0
  ): string => {
    if (
      typeof symbol === "number" ||
      (symbol.indexOf(".SCRIPT_ARG_") !== 0 && symbol.indexOf(".LOCAL_") !== 0)
    ) {
      return String(symbol);
    }
    if (this.stackPtr === 0 && offset === 0) {
      return `${symbol}`;
    }
    return `(${symbol}${offset !== 0 ? ` + ${offset}` : ""}${
      this.stackPtr !== 0 ? ` - ${this.stackPtr}` : ""
    })`;
  };

  _packLocals = () => {
    const localSymbols = Object.values(this.localsLookup);
    const packedSymbols: {
      size: number;
      firstUse: number;
      lastUse: number;
      symbols: ScriptBuilderLocalSymbol[];
    }[] = [];
    for (const localSymbol of localSymbols) {
      if (packedSymbols.length === 0) {
        // Empty list so add first symbol
        packedSymbols.push({
          size: localSymbol.size,
          firstUse: localSymbol.firstUse,
          lastUse: localSymbol.lastUse,
          symbols: [localSymbol],
        });
        continue;
      } else {
        let found = false;
        for (const packedSymbol of packedSymbols) {
          if (
            localSymbol.firstUse > packedSymbol.lastUse ||
            localSymbol.lastUse < packedSymbol.firstUse
          ) {
            // No overlap between these two vars so can share the same address
            packedSymbol.size = Math.max(packedSymbol.size, localSymbol.size);
            packedSymbol.firstUse = Math.min(
              packedSymbol.firstUse,
              localSymbol.firstUse
            );
            packedSymbol.lastUse = Math.max(
              packedSymbol.lastUse,
              localSymbol.lastUse
            );
            packedSymbol.symbols.push(localSymbol);
            found = true;
            break;
          }
        }
        if (found) {
          continue;
        } else {
          // No none overlapping addresses found
          // So start a new address
          packedSymbols.push({
            size: localSymbol.size,
            firstUse: localSymbol.firstUse,
            lastUse: localSymbol.lastUse,
            symbols: [localSymbol],
          });
        }
      }
    }

    // Convert packed vars back to localsLookup
    let packedAddr = 0;
    this.localsLookup = packedSymbols.reduce((memo, packedSymbol) => {
      packedAddr += packedSymbol.size;
      for (const localSymbol of packedSymbol.symbols) {
        memo[localSymbol.symbol] = {
          ...localSymbol,
          size: packedSymbol.size,
          addr: packedAddr,
        };
      }
      return memo;
    }, {} as Record<string, ScriptBuilderLocalSymbol>);

    return this._calcLocalsSize();
  };

  _calcLocalsSize = () => {
    const reserveMem = Object.values(this.localsLookup).reduce(
      (memo, local) => {
        return Math.max(memo, local.addr);
      },
      0
    );
    return reserveMem;
  };

  _reserve = (size: number) => {
    this._addCmd("VM_RESERVE", size);
  };

  // --------------------------------------------------------------------------
  // Actors

  setActorId = (addr: string, id: ScriptBuilderVariable) => {
    if (typeof id === "number") {
      this.actorIndex = id;
      this._setConst(addr, this.actorIndex);
    } else if (typeof id === "string") {
      const newIndex = this.getActorIndex(id);
      this.actorIndex = newIndex;
      this._setConst(addr, this.actorIndex);
    } else {
      this.actorIndex = -1;
      this._set(addr, id.symbol);
    }
  };

  actorSetById = (id: ScriptBuilderVariable) => {
    const actorRef = this._declareLocal("actor", 4);
    this.setActorId(actorRef, id);
  };

  actorPushById = (id: ScriptBuilderVariable) => {
    if (typeof id === "number") {
      this.actorIndex = id;
      this._stackPushConst(this.actorIndex);
    } else if (typeof id === "string") {
      const newIndex = this.getActorIndex(id);
      this.actorIndex = newIndex;
      this._stackPushConst(this.actorIndex);
    } else {
      this.actorIndex = -1;
      this._stackPush(id.symbol);
    }
  };

  actorSetActive = (id: ScriptBuilderVariable) => {
    this._addComment("Actor Set Active");
    this.actorSetById(id);
    this._addNL();
  };

  actorMoveTo = (
    x: number,
    y: number,
    useCollisions: boolean,
    moveType: ScriptBuilderMoveType,
    units: DistanceUnitType = "tiles"
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const stackPtr = this.stackPtr;
    this._addComment("Actor Move To");
    this._setConst(
      this._localRef(actorRef, 1),
      x * (units === "tiles" ? 8 : 1) * 16
    );
    this._setConst(
      this._localRef(actorRef, 2),
      y * (units === "tiles" ? 8 : 1) * 16
    );
    this._setConst(
      this._localRef(actorRef, 3),
      toASMMoveFlags(moveType, useCollisions)
    );
    this._actorMoveTo(actorRef);
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorMoveToVariables = (
    variableX: string,
    variableY: string,
    useCollisions: boolean,
    moveType: ScriptBuilderMoveType,
    units: DistanceUnitType = "tiles"
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const stackPtr = this.stackPtr;
    this._addComment("Actor Move To Variables");

    this._rpn() //
      .refVariable(variableX)
      .int16((units === "tiles" ? 8 : 1) * 16)
      .operator(".MUL")
      .refSet(this._localRef(actorRef, 1))
      .refVariable(variableY)
      .int16((units === "tiles" ? 8 : 1) * 16)
      .operator(".MUL")
      .refSet(this._localRef(actorRef, 2))
      .stop();

    this._setConst(
      this._localRef(actorRef, 3),
      toASMMoveFlags(moveType, useCollisions)
    );
    this._actorMoveTo(actorRef);
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorMoveToScriptValues = (
    actorId: string,
    valueX: ScriptValue,
    valueY: ScriptValue,
    useCollisions: boolean,
    moveType: ScriptBuilderMoveType,
    units: DistanceUnitType = "tiles"
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const stackPtr = this.stackPtr;
    this._addComment("Actor Move To");

    const [rpnOpsX, fetchOpsX] = precompileScriptValue(
      optimiseScriptValue(
        multiplyScriptValueConst(valueX, (units === "tiles" ? 8 : 1) * 16)
      ),
      "x"
    );
    const [rpnOpsY, fetchOpsY] = precompileScriptValue(
      optimiseScriptValue(
        multiplyScriptValueConst(valueY, (units === "tiles" ? 8 : 1) * 16)
      ),
      "y"
    );

    const localsLookup = this._performFetchOperations([
      ...fetchOpsX,
      ...fetchOpsY,
    ]);

    const rpn = this._rpn();

    this._addComment(`-- Calculate coordinate values`);

    // X Value
    this._performValueRPN(rpn, rpnOpsX, localsLookup);
    rpn.refSet(this._localRef(actorRef, 1));

    // Y Value
    this._performValueRPN(rpn, rpnOpsY, localsLookup);
    rpn.refSet(this._localRef(actorRef, 2));

    rpn.stop();
    this._setConst(
      this._localRef(actorRef, 3),
      toASMMoveFlags(moveType, useCollisions)
    );
    this._addComment(`-- Move Actor`);
    this.actorSetById(actorId);
    this._actorMoveTo(actorRef);
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorMoveRelative = (
    x = 0,
    y = 0,
    useCollisions = false,
    moveType: ScriptBuilderMoveType,
    units: DistanceUnitType = "tiles"
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const stackPtr = this.stackPtr;
    this._addComment("Actor Move Relative");
    this._actorGetPosition(actorRef);
    this._rpn() //
      .ref(this._localRef(actorRef, 1))
      .int16(x * (units === "tiles" ? 8 : 1) * 16)
      .operator(".ADD")
      .int16(0)
      .operator(".MAX")
      .refSet(this._localRef(actorRef, 1))
      .ref(this._localRef(actorRef, 2))
      .int16(y * (units === "tiles" ? 8 : 1) * 16)
      .operator(".ADD")
      .int16(0)
      .operator(".MAX")
      .refSet(this._localRef(actorRef, 2))
      .stop();

    this._setConst(
      this._localRef(actorRef, 3),
      toASMMoveFlags(moveType, useCollisions)
    );
    this._actorMoveTo(actorRef);
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorMoveRelativeByScriptValues = (
    actorId: string,
    valueX: ScriptValue,
    valueY: ScriptValue,
    useCollisions: boolean,
    moveType: ScriptBuilderMoveType,
    units: DistanceUnitType = "tiles"
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const stackPtr = this.stackPtr;
    this._addComment("Actor Move Relative");

    const [rpnOpsX, fetchOpsX] = precompileScriptValue(
      optimiseScriptValue(
        multiplyScriptValueConst(
          addScriptValueToScriptValue(
            {
              type: "property",
              target: actorId,
              property: units === "tiles" ? "xpos" : "pxpos",
            },
            valueX
          ),
          (units === "tiles" ? 8 : 1) * 16
        )
      ),
      "x"
    );
    const [rpnOpsY, fetchOpsY] = precompileScriptValue(
      optimiseScriptValue(
        multiplyScriptValueConst(
          addScriptValueToScriptValue(
            {
              type: "property",
              target: actorId,
              property: units === "tiles" ? "ypos" : "pypos",
            },
            valueY
          ),
          (units === "tiles" ? 8 : 1) * 16
        )
      ),
      "y"
    );

    const localsLookup = this._performFetchOperations([
      ...fetchOpsX,
      ...fetchOpsY,
    ]);

    const rpn = this._rpn();

    this._addComment(`-- Calculate coordinate values`);

    // X Value
    this._performValueRPN(rpn, rpnOpsX, localsLookup);
    rpn.refSet(this._localRef(actorRef, 1));

    // Y Value
    this._performValueRPN(rpn, rpnOpsY, localsLookup);
    rpn.refSet(this._localRef(actorRef, 2));

    rpn.stop();
    this._setConst(
      this._localRef(actorRef, 3),
      toASMMoveFlags(moveType, useCollisions)
    );
    this._addComment(`-- Move Actor`);
    this.actorSetById(actorId);
    this._actorMoveTo(actorRef);
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorMoveCancel = () => {
    const actorRef = this._declareLocal("actor", 4);
    this._actorMoveCancel(actorRef);
    this._addNL();
  };

  actorSetPosition = (x = 0, y = 0, units: DistanceUnitType = "tiles") => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Set Position");

    this._setConst(
      this._localRef(actorRef, 1),
      x * (units === "tiles" ? 8 : 1) * 16
    );
    this._setConst(
      this._localRef(actorRef, 2),
      y * (units === "tiles" ? 8 : 1) * 16
    );
    this._actorSetPosition(actorRef);

    this._addNL();
  };

  actorSetPositionToVariables = (
    variableX: string,
    variableY: string,
    units: DistanceUnitType = "tiles"
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const stackPtr = this.stackPtr;
    this._addComment("Actor Set Position To Variables");

    this._rpn() //
      .refVariable(variableX)
      .int16((units === "tiles" ? 8 : 1) * 16)
      .operator(".MUL")
      .refSet(this._localRef(actorRef, 1))
      .refVariable(variableY)
      .int16((units === "tiles" ? 8 : 1) * 16)
      .operator(".MUL")
      .refSet(this._localRef(actorRef, 2))
      .stop();

    this._actorSetPosition(actorRef);
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorSetPositionToScriptValues = (
    actorId: string,
    valueX: ScriptValue,
    valueY: ScriptValue,
    units: DistanceUnitType = "tiles"
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const stackPtr = this.stackPtr;
    this._addComment("Actor Set Position");

    const [rpnOpsX, fetchOpsX] = precompileScriptValue(
      optimiseScriptValue(
        multiplyScriptValueConst(valueX, (units === "tiles" ? 8 : 1) * 16)
      ),
      "x"
    );
    const [rpnOpsY, fetchOpsY] = precompileScriptValue(
      optimiseScriptValue(
        multiplyScriptValueConst(valueY, (units === "tiles" ? 8 : 1) * 16)
      ),
      "y"
    );

    const localsLookup = this._performFetchOperations([
      ...fetchOpsX,
      ...fetchOpsY,
    ]);

    const rpn = this._rpn();

    this._addComment(`-- Calculate coordinate values`);

    // X Value
    this._performValueRPN(rpn, rpnOpsX, localsLookup);
    rpn.refSet(this._localRef(actorRef, 1));

    // Y Value
    this._performValueRPN(rpn, rpnOpsY, localsLookup);
    rpn.refSet(this._localRef(actorRef, 2));

    rpn.stop();
    this._addComment(`-- Position Actor`);
    this.actorSetById(actorId);
    this._actorSetPosition(actorRef);
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorSetPositionRelative = (
    x = 0,
    y = 0,
    units: DistanceUnitType = "tiles"
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Set Position Relative");
    this._actorGetPosition(actorRef);
    this._rpn() //
      .ref(this._localRef(actorRef, 1))
      .int16(x * (units === "tiles" ? 8 : 1) * 16)
      .operator(".ADD")
      .int16(0)
      .operator(".MAX")
      .refSet(this._localRef(actorRef, 1))
      .ref(this._localRef(actorRef, 2))
      .int16(y * (units === "tiles" ? 8 : 1) * 16)
      .operator(".ADD")
      .int16(0)
      .operator(".MAX")
      .refSet(this._localRef(actorRef, 2))
      .stop();

    this._actorSetPosition(actorRef);
    this._addNL();
  };

  actorSetPositionRelativeByScriptValues = (
    actorId: string,
    valueX: ScriptValue,
    valueY: ScriptValue,
    units: DistanceUnitType = "tiles"
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const stackPtr = this.stackPtr;
    this._addComment("Actor Set Position Relative");

    const [rpnOpsX, fetchOpsX] = precompileScriptValue(
      optimiseScriptValue(
        multiplyScriptValueConst(
          addScriptValueToScriptValue(
            {
              type: "property",
              target: actorId,
              property: units === "tiles" ? "xpos" : "pxpos",
            },
            valueX
          ),
          (units === "tiles" ? 8 : 1) * 16
        )
      ),
      "x"
    );
    const [rpnOpsY, fetchOpsY] = precompileScriptValue(
      optimiseScriptValue(
        multiplyScriptValueConst(
          addScriptValueToScriptValue(
            {
              type: "property",
              target: actorId,
              property: units === "tiles" ? "ypos" : "pypos",
            },
            valueY
          ),
          (units === "tiles" ? 8 : 1) * 16
        )
      ),
      "y"
    );

    const localsLookup = this._performFetchOperations([
      ...fetchOpsX,
      ...fetchOpsY,
    ]);

    const rpn = this._rpn();

    this._addComment(`-- Calculate coordinate values`);

    // X Value
    this._performValueRPN(rpn, rpnOpsX, localsLookup);
    rpn.refSet(this._localRef(actorRef, 1));

    // Y Value
    this._performValueRPN(rpn, rpnOpsY, localsLookup);
    rpn.refSet(this._localRef(actorRef, 2));

    rpn.stop();
    this._addComment(`-- Position Actor`);
    this.actorSetById(actorId);
    this._actorSetPosition(actorRef);
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorGetPosition = (
    variableX: string,
    variableY: string,
    units: DistanceUnitType = "tiles"
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment(`Store Position In Variables`);
    this._actorGetPosition(actorRef);

    this._rpn() //
      .ref(this._localRef(actorRef, 1))
      .int16((units === "tiles" ? 8 : 1) * 16)
      .operator(".DIV")
      .refSetVariable(variableX)
      .ref(this._localRef(actorRef, 2))
      .int16((units === "tiles" ? 8 : 1) * 16)
      .operator(".DIV")
      .refSetVariable(variableY)
      .stop();

    this._addNL();
  };

  actorGetPositionX = (
    variableX: string,
    units: DistanceUnitType = "tiles"
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment(`Store X Position In Variable`);
    this._actorGetPosition(actorRef);

    this._rpn() //
      .ref(this._localRef(actorRef, 1))
      .int16((units === "tiles" ? 8 : 1) * 16)
      .operator(".DIV")
      .refSetVariable(variableX)
      .stop();

    this._addNL();
  };

  actorGetPositionY = (
    variableY: string,
    units: DistanceUnitType = "tiles"
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment(`Store Y Position In Variable`);
    this._actorGetPosition(actorRef);

    this._rpn() //
      .ref(this._localRef(actorRef, 2))
      .int16((units === "tiles" ? 8 : 1) * 16)
      .operator(".DIV")
      .refSetVariable(variableY)
      .stop();

    this._addNL();
  };

  actorGetDirection = (variable: string) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment(`Store Direction In Variable`);
    this._actorGetDirectionToVariable(actorRef, variable);
    this._addNL();
  };

  actorGetAnimFrame = (variable: string) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment(`Store Frame In Variable`);
    this._actorGetAnimFrame(actorRef);
    this._setVariable(variable, this._localRef(actorRef, 1));
    this._addNL();
  };

  actorPush = (continueUntilCollision = false) => {
    const actorRef = this._declareLocal("actor", 4);
    const pushDirectionVarRef = this._declareLocal("push_dir_var", 1, true);
    const stackPtr = this.stackPtr;
    const upLabel = this.getNextLabel();
    const leftLabel = this.getNextLabel();
    const rightLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();

    const offset = continueUntilCollision ? 128 * 100 : 128 * 2;

    this._addComment("Actor Push");
    this._setConst(actorRef, 0);
    this._actorGetDirection(actorRef, pushDirectionVarRef);
    this._setConst(actorRef, this.actorIndex);
    this._actorGetPosition(actorRef);

    // prettier-ignore
    this._ifConst(".EQ", pushDirectionVarRef, ".DIR_UP", upLabel, 0);
    // prettier-ignore
    this._ifConst(".EQ", pushDirectionVarRef, ".DIR_LEFT", leftLabel, 0);
    // prettier-ignore
    this._ifConst(".EQ", pushDirectionVarRef, ".DIR_RIGHT", rightLabel, 0);

    // Down
    this._rpn() //
      .ref(this._localRef(actorRef, 2))
      .int16(offset)
      .operator(".ADD")
      .refSet(this._localRef(actorRef, 2))
      .stop();
    this._jump(endLabel);

    // Up
    this._label(upLabel);
    this._rpn() //
      .ref(this._localRef(actorRef, 2))
      .int16(offset)
      .operator(".SUB")
      .int16(0)
      .operator(".MAX")
      .refSet(this._localRef(actorRef, 2))
      .stop();
    this._jump(endLabel);

    // Left
    this._label(leftLabel);
    this._rpn() //
      .ref(this._localRef(actorRef, 1))
      .int16(offset)
      .operator(".SUB")
      .int16(0)
      .operator(".MAX")
      .refSet(this._localRef(actorRef, 1))
      .stop();
    this._jump(endLabel);

    // Right
    this._label(rightLabel);
    this._rpn() //
      .ref(this._localRef(actorRef, 1))
      .int16(offset)
      .operator(".ADD")
      .refSet(this._localRef(actorRef, 1))
      .stop();

    // End
    this._label(endLabel);
    this._setConst(this._localRef(actorRef, 3), ".ACTOR_ATTR_CHECK_COLL");
    this._actorMoveTo(actorRef);

    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorShow = (id: string) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Show");
    this.actorSetById(id);
    this._actorSetHidden(actorRef, false);
    this._addNL();
  };

  actorHide = (id: string) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Hide");
    this.actorSetById(id);
    this._actorSetHidden(actorRef, true);
    this._addNL();
  };

  actorActivate = (id: string) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Activate");
    this.actorSetById(id);
    this._actorActivate(actorRef);
    this._addNL();
  };

  actorDeactivate = (id: string) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Deactivate");
    this.actorSetById(id);
    this._actorDeactivate(actorRef);
    this._addNL();
  };

  actorSetBounds = (
    left: number,
    right: number,
    top: number,
    bottom: number
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Set Bounds");
    this._actorSetBounds(actorRef, left, right, top, bottom);
    this._addNL();
  };

  actorSetCollisions = (enabled: boolean) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Set Collisions");
    this._actorSetCollisionsEnabled(actorRef, enabled);
    this._addNL();
  };

  actorSetDirection = (direction: ActorDirection) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Set Direction");
    this._actorSetDirection(actorRef, toASMDir(direction));
    this._addNL();
  };

  actorSetDirectionToVariable = (variable: string) => {
    const actorRef = this._declareLocal("actor", 4);

    const leftLabel = this.getNextLabel();
    const rightLabel = this.getNextLabel();
    const upLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();

    this._addComment("Actor Set Direction To Variable");
    this._ifVariableConst(".EQ", variable, ".DIR_LEFT", leftLabel, 0);
    this._ifVariableConst(".EQ", variable, ".DIR_RIGHT", rightLabel, 0);
    this._ifVariableConst(".EQ", variable, ".DIR_UP", upLabel, 0);
    // Down
    this._actorSetDirection(actorRef, ".DIR_DOWN");
    this._jump(endLabel);
    // Left
    this._label(leftLabel);
    this._actorSetDirection(actorRef, ".DIR_LEFT");
    this._jump(endLabel);
    // Right
    this._label(rightLabel);
    this._actorSetDirection(actorRef, ".DIR_RIGHT");
    this._jump(endLabel);
    // Up
    this._label(upLabel);
    this._actorSetDirection(actorRef, ".DIR_UP");

    this._label(endLabel);
    this._addNL();
  };

  actorSetDirectionToScriptValue = (actorId: string, value: ScriptValue) => {
    const actorRef = this._declareLocal("actor", 4);
    const leftLabel = this.getNextLabel();
    const rightLabel = this.getNextLabel();
    const upLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();

    this._addComment("Actor Set Direction To");
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(value)
    );
    if (rpnOps.length === 1 && rpnOps[0].type === "number") {
      this.actorSetById(actorId);
      this._actorSetDirection(actorRef, String(rpnOps[0].value || 0));
    } else if (rpnOps.length === 1 && rpnOps[0].type === "direction") {
      this.actorSetById(actorId);
      this._actorSetDirection(actorRef, toASMDir(rpnOps[0].value));
    } else {
      const localsLookup = this._performFetchOperations(fetchOps);
      this._addComment(`-- Calculate value`);
      const rpn = this._rpn();
      this._performValueRPN(rpn, rpnOps, localsLookup);
      rpn.refSet(this._localRef(actorRef, 1)).stop();
      this.actorSetById(actorId);
      const newValueRef = this._localRef(actorRef, 1);
      this._ifConst(".EQ", newValueRef, ".DIR_LEFT", leftLabel, 0);
      this._ifConst(".EQ", newValueRef, ".DIR_RIGHT", rightLabel, 0);
      this._ifConst(".EQ", newValueRef, ".DIR_UP", upLabel, 0);
      // Down
      this._actorSetDirection(actorRef, ".DIR_DOWN");
      this._jump(endLabel);
      // Left
      this._label(leftLabel);
      this._actorSetDirection(actorRef, ".DIR_LEFT");
      this._jump(endLabel);
      // Right
      this._label(rightLabel);
      this._actorSetDirection(actorRef, ".DIR_RIGHT");
      this._jump(endLabel);
      // Up
      this._label(upLabel);
      this._actorSetDirection(actorRef, ".DIR_UP");
      this._label(endLabel);
    }
    this._addNL();
  };

  actorEmote = (emoteId: string) => {
    const actorRef = this._declareLocal("actor", 4);
    const { emotes } = this.options;
    const emote = emotes.find((e) => e.id === emoteId);
    if (emote) {
      this._addComment("Actor Emote");
      this._actorEmote(actorRef, emote.symbol);
      this._addNL();
    }
  };

  actorSetSprite = (spriteSheetId: string) => {
    const actorRef = this._declareLocal("actor", 4);
    const { sprites } = this.options;
    const sprite = sprites.find((s) => s.id === spriteSheetId);
    if (sprite) {
      this._addComment("Actor Set Spritesheet");
      this._actorSetSpritesheet(actorRef, sprite.symbol);
      this._addNL();
    }
  };

  playerSetSprite = (spriteSheetId: string, persist: boolean) => {
    const actorRef = this._declareLocal("actor", 4);
    const { sprites, scene } = this.options;
    const sprite = sprites.find((s) => s.id === spriteSheetId);
    if (sprite) {
      this._addComment("Player Set Spritesheet");
      this._setConst(actorRef, 0);
      this._actorSetSpritesheet(actorRef, sprite.symbol);
      if (persist) {
        const symbol = sprite.symbol;
        this._setConst(`PLAYER_SPRITE_${scene.type}_BANK`, `___bank_${symbol}`);
        this._setConst(`PLAYER_SPRITE_${scene.type}_DATA`, `_${symbol}`);
      }
      this._addNL();
    }
  };

  actorSetState = (state: string, animLoop = true) => {
    const actorRef = this._declareLocal("actor", 4);
    const { statesOrder, stateReferences } = this.options;
    const stateIndex = statesOrder.indexOf(state);
    if (stateIndex > -1) {
      this._addComment("Actor Set Animation State");
      this._actorSetAnimState(actorRef, stateReferences[stateIndex]);
      this._actorSetFlags(
        actorRef,
        animLoop ? [] : [".ACTOR_FLAG_ANIM_NOLOOP"],
        [".ACTOR_FLAG_ANIM_NOLOOP"]
      );
      this._addNL();
    }
  };

  actorSetMovementSpeed = (speed = 1) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Set Movement Speed");
    this._actorSetMoveSpeed(actorRef, Math.round(speed * 16));
    this._addNL();
  };

  actorSetAnimationSpeed = (speed = 3) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Set Animation Tick");
    this._actorSetAnimTick(actorRef, speed);
    this._addNL();
  };

  actorSetFrame = (frame = 0) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Set Animation Frame");
    this._setConst(this._localRef(actorRef, 1), frame);
    this._actorSetAnimFrame(actorRef);
    this._addNL();
  };

  actorSetFrameToVariable = (variable: string) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Set Animation Frame To Variable");
    this._setToVariable(this._localRef(actorRef, 1), variable);
    this._actorSetAnimFrame(actorRef);
    this._addNL();
  };

  actorSetFrameToScriptValue = (actorId: string, value: ScriptValue) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Set Animation Frame To");
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(value)
    );

    const localsLookup = this._performFetchOperations(fetchOps);
    this._addComment(`-- Calculate value`);
    const rpn = this._rpn();
    this._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.refSet(this._localRef(actorRef, 1));
    rpn.stop();

    this.actorSetById(actorId);
    this._actorSetAnimFrame(actorRef);
    this._addNL();
  };

  actorSetAnimate = (_enabled: boolean) => {
    console.error("actorSetAnimate not implemented");
  };

  actorStopUpdate = () => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Stop Update Script");
    this._actorTerminateUpdate(actorRef);
    this._addNL();
  };

  actorStartUpdate = () => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Start Update Script");
    this._actorDeactivate(actorRef);
    this._actorActivate(actorRef);
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

  actorInvoke = () => {
    const { scene } = this.options;
    const actor = scene.actors[this.actorIndex];
    if (actor && actor.script.length > 0) {
      this._addComment("Invoke Actor Interact Script");
      this._callFar(`${actor.symbol}_interact`, 0);
    }
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

  _rpnProjectilePosArgs = (actorRef: string, x = 0, y = 0) => {
    this._actorGetPosition(actorRef);
    const rpn = this._rpn();
    rpn.ref(this._localRef(actorRef, 1));
    if (x) {
      rpn.int16(x * 16).operator(".ADD");
    }
    rpn.ref(this._localRef(actorRef, 2));
    if (y) {
      rpn.int16(-y * 16).operator(".ADD");
    }
    return rpn;
  };

  launchProjectileInDirection = (
    projectileIndex: number,
    x = 0,
    y = 0,
    direction: string,
    destroyOnHit = false,
    loopAnim = false
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Launch Projectile In Direction");
    const rpn = this._rpnProjectilePosArgs(actorRef, x, y);
    rpn
      .int16(dirToAngle(direction))
      .int16(toProjectileFlags(destroyOnHit, loopAnim))
      .stop();
    this._projectileLaunch(projectileIndex, ".ARG3");
    this._stackPop(4);
    this._addNL();
  };

  launchProjectileInAngle = (
    projectileIndex: number,
    x = 0,
    y = 0,
    angle: number,
    destroyOnHit = false,
    loopAnim = false
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Launch Projectile In Angle");
    const rpn = this._rpnProjectilePosArgs(actorRef, x, y);
    rpn
      .int16(Math.round(angle % 256))
      .int16(toProjectileFlags(destroyOnHit, loopAnim))
      .stop();
    this._projectileLaunch(projectileIndex, ".ARG3");
    this._stackPop(4);
    this._addNL();
  };

  launchProjectileInAngleVariable = (
    projectileIndex: number,
    x = 0,
    y = 0,
    angleVariable: string,
    destroyOnHit = false,
    loopAnim = false
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Launch Projectile In Angle");
    const rpn = this._rpnProjectilePosArgs(actorRef, x, y);
    rpn
      .refVariable(angleVariable)
      .int16(toProjectileFlags(destroyOnHit, loopAnim))
      .stop();
    this._projectileLaunch(projectileIndex, ".ARG3");
    this._stackPop(4);
    this._addNL();
  };

  launchProjectileInSourceActorDirection = (
    projectileIndex: number,
    x = 0,
    y = 0,
    destroyOnHit = false,
    loopAnim = false
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Launch Projectile In Source Actor Direction");
    const rpn = this._rpnProjectilePosArgs(actorRef, x, y);
    rpn
      .int16(0) // Save space for direction
      .int16(toProjectileFlags(destroyOnHit, loopAnim))
      .stop();
    this._actorGetAngle(actorRef, ".ARG1");
    this._projectileLaunch(projectileIndex, ".ARG3");
    this._stackPop(4);
    this._addNL();
  };

  launchProjectileInActorDirection = (
    projectileIndex: number,
    x = 0,
    y = 0,
    actorId: string,
    destroyOnHit = false,
    loopAnim = false
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Launch Projectile In Actor Direction");
    const rpn = this._rpnProjectilePosArgs(actorRef, x, y);
    rpn
      .int16(0) // Save space for direction
      .int16(toProjectileFlags(destroyOnHit, loopAnim))
      .stop();
    this.setActorId(".ARG1", actorId);
    this._actorGetAngle(".ARG1", ".ARG1");
    this._projectileLaunch(projectileIndex, ".ARG3");
    this._stackPop(4);
    this._addNL();
  };

  launchProjectileTowardsActor = (
    projectileIndex: number,
    x = 0,
    y = 0,
    otherActorId: string,
    destroyOnHit = false,
    loopAnim = false
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const otherActorRef = this._declareLocal("other_actor", 3, true);
    this._addComment("Launch Projectile Towards Actor");
    this.setActorId(otherActorRef, otherActorId);
    this._actorGetPosition(otherActorRef);
    const rpn = this._rpnProjectilePosArgs(actorRef, x, y);
    rpn
      .ref(this._localRef(otherActorRef, 2))
      .ref(this._localRef(actorRef, 2))
      .operator(".SUB")
      .int16(8 * 16)
      .operator(".DIV")
      .ref(this._localRef(otherActorRef, 1))
      .ref(this._localRef(actorRef, 1))
      .operator(".SUB")
      .int16(8 * 16)
      .operator(".DIV")
      .operator(".ATAN2")
      .int16(toProjectileFlags(destroyOnHit, loopAnim))
      .stop();
    this._projectileLaunch(projectileIndex, ".ARG3");
    this._stackPop(4);
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Timing

  idle = () => {
    this._addComment("Idle");
    this._idle();
    this._addNL();
  };

  nextFrameAwait = () => {
    this.wait(1);
  };

  wait = (frames: number) => {
    const waitArgsRef = this._declareLocal("wait_args", 1, true);
    const stackPtr = this.stackPtr;
    this._addComment("Wait N Frames");
    this._setConst(waitArgsRef, Math.round(frames));
    this._invoke("wait_frames", 0, waitArgsRef);
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
    if (this._isIndirectVariable(variable)) {
      const menuResultRef = this._declareLocal("menu_result", 1, true);
      dest = menuResultRef;
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

    if (this._isIndirectVariable(variable)) {
      this._setInd(variableAlias, dest);
    }

    this._addNL();
  };

  textMenu = (
    variable: string,
    options: string[],
    layout = "menu",
    cancelOnLastOption = false,
    cancelOnB = false
  ) => {
    const variableAlias = this.getVariableAlias(variable);
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
    if (this._isIndirectVariable(variable)) {
      const menuResultRef = this._declareLocal("menu_result", 1, true);
      dest = menuResultRef;
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

    if (this._isIndirectVariable(variable)) {
      this._setInd(variableAlias, dest);
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

  cameraMoveTo = (
    x = 0,
    y = 0,
    speed = 0,
    units: DistanceUnitType = "tiles"
  ) => {
    const cameraMoveArgsRef = this._declareLocal("camera_move_args", 2, true);
    this._addComment("Camera Move To");
    const xOffset = 80;
    const yOffset = 72;

    this._setConst(
      cameraMoveArgsRef,
      xOffset + Math.round(x * (units === "tiles" ? 8 : 1))
    );
    this._setConst(
      this._localRef(cameraMoveArgsRef, 1),
      yOffset + Math.round(y * (units === "tiles" ? 8 : 1))
    );
    if (speed === 0) {
      this._cameraSetPos(cameraMoveArgsRef);
    } else {
      this._cameraMoveTo(cameraMoveArgsRef, speed - 1, ".CAMERA_UNLOCK");
    }
    this._addNL();
  };

  cameraMoveToVariables = (
    variableX: string,
    variableY: string,
    speed = 0,
    units: DistanceUnitType = "tiles"
  ) => {
    this._addComment("Camera Move To Variables");
    if (units === "tiles") {
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
    } else {
      this._rpn() //
        .refVariable(variableX)
        .int16(80)
        .operator(".ADD")
        .refVariable(variableY)
        .int16(72)
        .operator(".ADD")
        .stop();
    }
    if (speed === 0) {
      this._cameraSetPos(".ARG1");
    } else {
      this._cameraMoveTo(".ARG1", speed, ".CAMERA_UNLOCK");
    }
    this._stackPop(2);
  };

  cameraMoveToScriptValues = (
    valueX: ScriptValue,
    valueY: ScriptValue,
    speed = 0,
    units: DistanceUnitType = "tiles"
  ) => {
    const cameraMoveArgsRef = this._declareLocal("camera_move_args", 2, true);
    const xOffset = 80;
    const yOffset = 72;

    const stackPtr = this.stackPtr;
    this._addComment("Camera Move To");

    const [rpnOpsX, fetchOpsX] = precompileScriptValue(
      optimiseScriptValue(
        addScriptValueConst(
          multiplyScriptValueConst(valueX, units === "tiles" ? 8 : 1),
          xOffset
        )
      ),
      "x"
    );
    const [rpnOpsY, fetchOpsY] = precompileScriptValue(
      optimiseScriptValue(
        addScriptValueConst(
          multiplyScriptValueConst(valueY, units === "tiles" ? 8 : 1),
          yOffset
        )
      ),
      "y"
    );

    const localsLookup = this._performFetchOperations([
      ...fetchOpsX,
      ...fetchOpsY,
    ]);

    const rpn = this._rpn();

    this._addComment(`-- Calculate coordinate values`);

    // X Value
    this._performValueRPN(rpn, rpnOpsX, localsLookup);
    rpn.refSet(this._localRef(cameraMoveArgsRef, 0));

    // Y Value
    this._performValueRPN(rpn, rpnOpsY, localsLookup);
    rpn.refSet(this._localRef(cameraMoveArgsRef, 1));

    rpn.stop();

    this._addComment(`-- Move Camera`);
    if (speed === 0) {
      this._cameraSetPos(cameraMoveArgsRef);
    } else {
      this._cameraMoveTo(cameraMoveArgsRef, speed, ".CAMERA_UNLOCK");
    }

    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  cameraLock = (speed = 0, axis: ScriptBuilderAxis[]) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Camera Lock");
    this._setConst(actorRef, 0);
    this._actorGetPosition(actorRef);
    this._rpn() //
      .ref(this._localRef(actorRef, 1))
      .int16(16)
      .operator(".DIV")
      .int16(8)
      .operator(".ADD")
      .ref(this._localRef(actorRef, 2))
      .int16(16)
      .operator(".DIV")
      .int16(8)
      .operator(".ADD")
      .stop();
    if (speed === 0) {
      this._cameraSetPos(".ARG1");
    }
    this._cameraMoveTo(".ARG1", speed, toASMCameraLock(axis));
    this._stackPop(2);
  };

  cameraShake = (
    shouldShakeX: boolean,
    shouldShakeY: boolean,
    frames: number,
    magnitude: number
  ) => {
    const cameraShakeArgsRef = this._declareLocal("camera_shake_args", 3, true);
    this._addComment("Camera Shake");
    this._setConst(cameraShakeArgsRef, frames);
    this._setConst(
      this._localRef(cameraShakeArgsRef, 1),
      unionFlags(
        ([] as string[]).concat(
          shouldShakeX ? ".CAMERA_SHAKE_X" : [],
          shouldShakeY ? ".CAMERA_SHAKE_Y" : []
        )
      )
    );
    this._setConst(this._localRef(cameraShakeArgsRef, 2), magnitude);
    this._invoke("camera_shake_frames", 0, cameraShakeArgsRef);
    this._addNL();
  };

  cameraShakeVariables = (
    shouldShakeX: boolean,
    shouldShakeY: boolean,
    frames: number,
    magnitude: string
  ) => {
    const cameraShakeArgsRef = this._declareLocal("camera_shake_args", 3, true);
    this._addComment("Camera Shake");
    this._setConst(cameraShakeArgsRef, frames);
    this._setConst(
      this._localRef(cameraShakeArgsRef, 1),
      unionFlags(
        ([] as string[]).concat(
          shouldShakeX ? ".CAMERA_SHAKE_X" : [],
          shouldShakeY ? ".CAMERA_SHAKE_Y" : []
        )
      )
    );

    this._rpn() //
      .refVariable(magnitude)
      .refSet(this._localRef(cameraShakeArgsRef, 2))
      .stop();

    this._invoke("camera_shake_frames", 0, cameraShakeArgsRef);
    this._addNL();
  };

  cameraShakeScriptValue = (
    shouldShakeX: boolean,
    shouldShakeY: boolean,
    frames: number,
    magnitude: ScriptValue
  ) => {
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(magnitude)
    );
    const localsLookup = this._performFetchOperations(fetchOps);
    const cameraShakeArgsRef = this._declareLocal("camera_shake_args", 3, true);
    this._addComment("Camera Shake");
    this._setConst(cameraShakeArgsRef, frames);
    this._setConst(
      this._localRef(cameraShakeArgsRef, 1),
      unionFlags(
        ([] as string[]).concat(
          shouldShakeX ? ".CAMERA_SHAKE_X" : [],
          shouldShakeY ? ".CAMERA_SHAKE_Y" : []
        )
      )
    );

    const rpn = this._rpn();
    this._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.refSet(this._localRef(cameraShakeArgsRef, 2)).stop();
    this._invoke("camera_shake_frames", 0, cameraShakeArgsRef);
    this._addNL();
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
    override: boolean,
    script: ScriptEvent[],
    symbol?: string
  ) => {
    this._addComment(`Input Script Attach`);
    const scriptRef = this._compileSubScript("input", script, symbol);
    const inputValue = inputDec(input);
    let ctx = inputValue.toString(2).padStart(8, "0").indexOf("1") + 1;
    if (ctx <= 0) {
      ctx = 1;
    }
    this._inputContextPrepare(scriptRef, ctx);
    this._inputContextAttach(inputValue, ctx, override);
    this._addNL();
  };

  inputScriptRemove = (input: string) => {
    this._addComment(`Input Script Remove`);
    this._inputContextDetach(inputDec(input));
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Timer

  timerScriptSet = (
    frames = 600,
    script: ScriptEvent[],
    symbol?: string,
    timer = 1
  ) => {
    this._addComment(`Timer Start`);
    const scriptRef = this._compileSubScript("timer", script, symbol);
    const TIMER_CYCLES = 16;
    let durationTicks = (frames / TIMER_CYCLES + 0.5) | 0;
    if (durationTicks <= 0) {
      durationTicks = 1;
    }
    if (durationTicks >= 256) {
      durationTicks = 255;
    }
    this._timerContextPrepare(scriptRef, timer);
    this._timerStart(timer, durationTicks);
    this._addNL();
  };

  timerRestart = (timer = 1) => {
    this._addComment(`Timer Restart`);
    this._timerReset(timer);
  };

  timerDisable = (timer = 1) => {
    this._addComment(`Timer Disable`);
    this._timerStop(timer);
  };

  // --------------------------------------------------------------------------
  // Call Script

  callScript = (scriptId: string, input: Dictionary<string | ScriptValue>) => {
    const { customEvents } = this.options;
    const customEvent = customEvents.find((ce) => ce.id === scriptId);

    if (!customEvent) {
      console.warn("Script not found", scriptId);
      return;
    }

    const compiledCustomEvent = this.compileCustomEventScript(customEvent.id);
    if (!compiledCustomEvent) {
      return;
    }

    const { scriptRef, argsLen } = compiledCustomEvent;

    this._addComment(`Call Script: ${customEvent.name}`);

    // Push args
    const actorArgs = Object.values(customEvent.actors);
    const variableArgs = Object.values(customEvent.variables);

    const constArgLookup: Record<string, string> = {};
    if (variableArgs) {
      for (const variableArg of variableArgs) {
        if (variableArg) {
          const variableValue = input?.[`$variable[${variableArg.id}]$`] || "";

          if (
            typeof variableValue !== "string" &&
            variableValue.type !== "variable" &&
            variableValue.type !== "number"
          ) {
            const [rpnOps, fetchOps] = precompileScriptValue(
              optimiseScriptValue(variableValue)
            );
            const argRef = this._declareLocal("arg", 1, true);

            if (rpnOps.length === 1 && rpnOps[0].type === "number") {
              this._setConst(argRef, rpnOps[0].value);
            } else {
              const localsLookup = this._performFetchOperations(fetchOps);
              this._addComment(`-- Calculate value`);
              const rpn = this._rpn();
              this._performValueRPN(rpn, rpnOps, localsLookup);
              rpn.refSet(argRef).stop();
            }

            constArgLookup[JSON.stringify(variableValue)] = argRef;
          } else if (variableArg.passByReference) {
            const variableValue =
              input?.[`$variable[${variableArg.id}]$`] || "";
            if (
              typeof variableValue !== "string" &&
              variableValue.type === "number"
            ) {
              const argRef = this._declareLocal("arg", 1, true);
              this._setConst(argRef, variableValue.value);
              constArgLookup[JSON.stringify(variableValue)] = argRef;
            }
          }
        }
      }
    }

    if (actorArgs) {
      for (const actorArg of clone(actorArgs).reverse()) {
        if (actorArg) {
          const actorValue = input?.[`$actor[${actorArg.id}]$`] || "";
          if (typeof actorValue === "string") {
            const actorIndex = this.getActorIndex(actorValue);
            this._stackPushConst(actorIndex, `Actor ${actorArg.id}`);
          }
        }
      }
    }

    if (variableArgs) {
      for (const variableArg of clone(variableArgs).reverse()) {
        if (variableArg) {
          const variableValue = input?.[`$variable[${variableArg.id}]$`] || "";
          if (variableArg.passByReference) {
            // Pass by Reference ----------

            if (typeof variableValue === "string") {
              const variableAlias = this.getVariableAlias(variableValue);
              this._stackPushConst(variableAlias, `Variable ${variableArg.id}`);
            } else if (variableValue && variableValue.type === "variable") {
              // Arg is a union variable
              const variableAlias = this.getVariableAlias(variableValue.value);
              if (this._isIndirectVariable(variableValue.value)) {
                this._stackPush(variableAlias);
              } else {
                // Arg union value is variable id
                this._stackPushConst(
                  variableAlias,
                  `Variable ${variableArg.id}`
                );
              }
            } else {
              // Arg is a script value
              const argRef = constArgLookup[JSON.stringify(variableValue)];
              this._stackPushReference(argRef, `Variable ${variableArg.id}`);
              this._markLocalUse(argRef);
            }

            // End of Pass by Reference ----------
          } else {
            // Pass by Value ----------

            // Arg is variable id
            if (typeof variableValue === "string") {
              const variableAlias = this.getVariableAlias(variableValue);
              this._stackPush(variableAlias);
            } else if (variableValue && variableValue.type === "number") {
              // Arg is union number
              this._stackPushConst(
                variableValue.value,
                `Variable ${variableArg.id}`
              );
            } else if (variableValue && variableValue.type === "variable") {
              // Arg is a union variable
              const variableAlias = this.getVariableAlias(variableValue.value);
              if (this._isIndirectVariable(variableValue.value)) {
                // Arg union value is indirect variable id
                this._stackPushInd(variableAlias);
              } else {
                // Arg union value is variable id
                this._stackPush(variableAlias);
              }
            } else {
              // Arg is a script value
              const argRef = constArgLookup[JSON.stringify(variableValue)];
              this._stackPush(argRef);
              this._markLocalUse(argRef);
            }

            // End of Pass by Value ----------
          }
        }
      }
    }

    this._callFar(scriptRef, argsLen);
    this._addNL();
  };

  compileReferencedAssets = (references: Reference[]) => {
    const referencedCustomEventIds = references
      .filter((r) => r.type === "script")
      .map((r) => r.id);
    for (const customEventId of referencedCustomEventIds) {
      this.compileCustomEventScript(customEventId);
    }
  };

  compileCustomEventScript = (customEventId: string) => {
    const { customEvents, compiledCustomEventScriptCache } = this.options;
    const customEvent = customEvents.find((ce) => ce.id === customEventId);

    if (!customEvent) {
      console.warn("Script not found", customEventId);
      return;
    }

    const cachedResult = compiledCustomEventScriptCache[customEventId];
    if (cachedResult) {
      return cachedResult;
    }

    const argLookup: {
      actor: Map<string, ScriptBuilderFunctionArg>;
      variable: Map<string, ScriptBuilderFunctionArg>;
    } = {
      actor: new Map(),
      variable: new Map(),
    };

    // Push args
    const actorArgs = Object.values(customEvent.actors);
    const variableArgs = Object.values(customEvent.variables);
    const argsLen = actorArgs.length + variableArgs.length;

    let numArgs = argsLen - 1;
    const registerArg = (
      type: "actor" | "variable",
      indirect: boolean,
      value: string
    ) => {
      if (!argLookup[type].get(value)) {
        const newArg = `.SCRIPT_ARG_${
          indirect ? "INDIRECT_" : ""
        }${numArgs}_${type}`.toUpperCase();
        argLookup[type].set(value, {
          type: "argument",
          indirect,
          symbol: newArg,
        });
        numArgs--;
      }
      return argLookup[type].get(value);
    };

    const getArg = (type: "actor" | "variable", value: string) => {
      if (type === "actor" && value === "player") {
        return value;
      }
      if (type === "actor" && value === "$self$") {
        return "player";
      }
      if (!argLookup[type].get(value)) {
        throw new Error("Unknown arg " + type + " " + value);
      }
      return argLookup[type].get(value);
    };

    if (actorArgs) {
      for (const actorArg of clone(actorArgs).reverse()) {
        if (actorArg) {
          registerArg("actor", false, actorArg.id);
        }
      }
    }

    if (variableArgs) {
      for (const variableArg of clone(variableArgs).reverse()) {
        if (variableArg) {
          registerArg("variable", variableArg.passByReference, variableArg.id);
        }
      }
    }

    const script = mapScript(
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
          if (
            isVariableField(
              e.command,
              arg,
              e.args,
              this.options.scriptEventHandlers
            )
          ) {
            if (
              isUnionVariableValue(argValue) &&
              argValue.value &&
              isVariableCustomEvent(argValue.value)
            ) {
              e.args[arg] = {
                ...argValue,
                value: getArg("variable", argValue.value),
              };
            } else if (
              typeof argValue === "string" &&
              isVariableCustomEvent(argValue)
            ) {
              e.args[arg] = getArg("variable", argValue);
            }
          }
          // Update property fields
          if (
            isPropertyField(
              e.command,
              arg,
              e.args,
              this.options.scriptEventHandlers
            )
          ) {
            const replacePropertyValueActor = (p: string) => {
              const actorValue = p.replace(/:.*/, "");
              if (actorValue === "player") {
                return p;
              }
              const newActorValue = getArg("actor", actorValue);
              return {
                value: newActorValue,
                property: p.replace(/.*:/, ""),
              };
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
            isActorField(
              e.command,
              arg,
              e.args,
              this.options.scriptEventHandlers
            ) &&
            typeof argValue === "string"
          ) {
            e.args[arg] = getArg("actor", argValue); // input[`$variable[${argValue}]$`];
          }
          // Update script value fields
          if (
            isScriptValueField(
              e.command,
              arg,
              e.args,
              this.options.scriptEventHandlers
            )
          ) {
            if (isScriptValue(argValue)) {
              e.args[arg] = mapScriptValueLeafNodes(argValue, (val) => {
                if (val.type === "variable") {
                  const scriptArg = argLookup["variable"].get(val.value);
                  if (scriptArg?.indirect) {
                    return {
                      type: "indirect",
                      value: scriptArg.symbol,
                    };
                  }
                } else if (val.type === "property") {
                  const scriptArg = getArg("actor", val.target);
                  if (scriptArg && typeof scriptArg === "string") {
                    return {
                      ...val,
                      value: scriptArg,
                    };
                  } else if (scriptArg && typeof scriptArg !== "string") {
                    return {
                      ...val,
                      target: scriptArg.symbol,
                      value: scriptArg,
                    };
                  }
                }
                return val;
              });
            }
          }
        });
        return e;
      }
    );

    // Generate symbol and cache it before compiling script to allow recursive function calls to work
    const symbol = this._getAvailableSymbol(
      customEvent.symbol ? customEvent.symbol : `script_custom_0`,
      false
    );
    const result = { scriptRef: symbol, argsLen };
    compiledCustomEventScriptCache[customEventId] = result;

    this._compileSubScript("custom", script, symbol, { argLookup });

    return result;
  };

  returnFar = () => {
    const argsSize =
      this.options.argLookup.variable.size + this.options.argLookup.actor.size;
    if (argsSize === 0) {
      this._returnFar();
    } else {
      this._returnFarN(argsSize);
    }
  };

  unreserveLocals = () => {
    const localsSize = this._calcLocalsSize();
    if (localsSize !== 0) {
      this._reserve(-localsSize);
    }
  };

  // --------------------------------------------------------------------------
  // Sprites

  spritesHide = () => {
    this._addComment("Hide Sprites");
    this._spritesHide();
  };

  spritesShow = () => {
    this._addComment("Show Sprites");
    this._spritesShow();
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
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Load Scene");
    const { scenes } = this.options;
    const scene = scenes.find((s) => s.id === sceneId);
    if (scene) {
      if (fadeSpeed > 0) {
        this._setConstMemInt8(
          "fade_frames_per_step",
          fadeSpeeds[fadeSpeed] ?? 0x3
        );
        this._fadeOut(true);
      }
      this._setConst(actorRef, 0);
      this._setConst(this._localRef(actorRef, 1), x * 8 * 16);
      this._setConst(this._localRef(actorRef, 2), y * 8 * 16);
      this._actorSetPosition(actorRef);
      const asmDir = toASMDir(direction);
      if (asmDir) {
        this._actorSetDirection(actorRef, asmDir);
      }
      this._raiseException("EXCEPTION_CHANGE_SCENE", 3);
      this._importFarPtrData(scene.symbol);
      this._addNL();
    }
  };

  sceneSwitchUsingScriptValues = (
    sceneId: string,
    x: ScriptValue,
    y: ScriptValue,
    direction: ActorDirection = "down",
    fadeSpeed = 2
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Load Scene");
    const { scenes } = this.options;
    const scene = scenes.find((s) => s.id === sceneId);

    if (scene) {
      if (fadeSpeed > 0) {
        this._setConstMemInt8(
          "fade_frames_per_step",
          fadeSpeeds[fadeSpeed] ?? 0x3
        );
        this._fadeOut(true);
      }

      const [rpnOpsX, fetchOpsX] = precompileScriptValue(
        optimiseScriptValue(multiplyScriptValueConst(x, 8 * 16)),
        "x"
      );
      const [rpnOpsY, fetchOpsY] = precompileScriptValue(
        optimiseScriptValue(multiplyScriptValueConst(y, 8 * 16)),
        "y"
      );

      const localsLookup = this._performFetchOperations([
        ...fetchOpsX,
        ...fetchOpsY,
      ]);

      const rpn = this._rpn();

      this._addComment(`-- Calculate coordinate values`);

      // X Value
      this._performValueRPN(rpn, rpnOpsX, localsLookup);
      rpn.refSet(this._localRef(actorRef, 1));

      // Y Value
      this._performValueRPN(rpn, rpnOpsY, localsLookup);
      rpn.refSet(this._localRef(actorRef, 2));
      rpn.stop();

      // Move
      this._setConst(actorRef, 0);
      this._actorSetPosition(actorRef);

      // Dir
      const asmDir = toASMDir(direction);
      if (asmDir) {
        this._actorSetDirection(actorRef, asmDir);
      }

      this._raiseException("EXCEPTION_CHANGE_SCENE", 3);
      this._importFarPtrData(scene.symbol);
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
    this._setConstMemInt8("fade_frames_per_step", fadeSpeeds[fadeSpeed] ?? 0x3);
    this._fadeOut(true);
    this._scenePop();
    this._addNL();
  };

  scenePopAllState = (fadeSpeed = 2) => {
    this._addComment("Pop All Scene State");
    this._setConstMemInt8("fade_frames_per_step", fadeSpeeds[fadeSpeed] ?? 0x3);
    this._fadeOut(true);
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

  getActorIndex = (id: string): number => {
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

  getVariableAlias = (variable: ScriptBuilderVariable = ""): string => {
    if (this._isFunctionArg(variable)) {
      return variable.symbol;
    }

    if (typeof variable === "string" && variable.startsWith(".LOCAL")) {
      return variable;
    }

    // Set correct default variable for missing vars based on script context
    if (variable === "") {
      variable = defaultVariableForContext(this.options.context);
    }

    if (typeof variable === "number") {
      variable = String(variable);
    }

    // Lookup args if in V0-9 format
    if (variable.match(/^V[0-9]$/)) {
      const arg = this.options.argLookup.variable.get(variable);
      if (!arg) {
        throw new Error("Cant find arg: " + arg);
      }
      return arg.symbol;
    }

    const {
      entity,
      sceneIndex,
      entityIndex,
      entityType,
      variablesLookup,
      variableAliasLookup,
      scene,
    } = this.options;

    const id = getVariableId(variable, entity);

    const namedVariable = variablesLookup[id || "0"];
    if (namedVariable && namedVariable.symbol && !isVariableLocal(variable)) {
      const symbol = namedVariable.symbol.toUpperCase();
      variableAliasLookup[id] = {
        symbol,
        name: namedVariable.name,
        id: namedVariable.id,
        isLocal: false,
        entityType: "scene",
        entityId: "",
        sceneId: "",
      };
      return symbol;
    }

    // If already got an alias use that
    const existingAlias = variableAliasLookup[id || "0"];
    if (existingAlias) {
      return existingAlias.symbol;
    }

    let name = "";
    const isLocal = isVariableLocal(variable);
    if (entity && isLocal) {
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
      name = namedVariable?.name ?? globalVariableDefaultName(num);
    }

    const alias = "VAR_" + toASMVar(name);
    let newAlias = alias;
    let counter = 1;

    // Make sure new alias is unique
    const aliases = Object.values(variableAliasLookup).map((v) => v?.symbol);
    while (aliases.includes(newAlias)) {
      newAlias = `${alias}_${counter}`;
      counter++;
    }

    // New Alias is now unique
    variableAliasLookup[id] = {
      symbol: newAlias,
      id,
      name,
      isLocal,
      entityType,
      entityId: entity?.id ?? "",
      sceneId: scene?.id ?? "",
    };

    return newAlias;
  };

  variableInc = (variable: ScriptBuilderVariable) => {
    this._addComment("Variable Increment By 1");
    this._rpn() //
      .refVariable(variable)
      .int8(1)
      .operator(".ADD")
      .refSetVariable(variable)
      .stop();
    this._addNL();
  };

  variableDec = (variable: ScriptBuilderVariable) => {
    this._addComment("Variable Decrement By 1");
    this._rpn() //
      .refVariable(variable)
      .int8(1)
      .operator(".SUB")
      .refSetVariable(variable)
      .stop();
    this._addNL();
  };

  variableAdd = (variable: ScriptBuilderVariable, value: number) => {
    this._addComment("Variable Increment By " + value);
    this._rpn() //
      .refVariable(variable)
      .int8(value)
      .operator(".ADD")
      .refSetVariable(variable)
      .stop();
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

  variableSetToScriptValue = (variable: string, value: ScriptValue) => {
    this._addComment("Variable Set To");
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(value)
    );
    if (rpnOps.length === 1 && rpnOps[0].type === "number") {
      this._setVariableConst(variable, rpnOps[0].value);
    } else if (rpnOps.length === 1 && rpnOps[0].type === "variable") {
      this._setVariableToVariable(variable, rpnOps[0].value);
    } else {
      const localsLookup = this._performFetchOperations(fetchOps);
      this._addComment(`-- Calculate value`);
      const rpn = this._rpn();
      this._performValueRPN(rpn, rpnOps, localsLookup);
      rpn.refSetVariable(variable).stop();
    }
    this._addNL();
  };

  variableCopy = (
    setVariable: ScriptBuilderVariable,
    otherVariable: ScriptBuilderVariable
  ) => {
    this._addComment("Variable Copy");
    this._setVariableToVariable(setVariable, otherVariable);
    this._addNL();
  };

  variableSetToRandom = (variable: string, min: number, range: number) => {
    this._addComment("Variable Set To Random");
    this._randVariable(variable, min, range);
    this._addNL();
  };

  seedRng = () => {
    this._addComment("Seed RNG");
    this._randomize();
    this._addNL();
  };

  variablesOperation = (
    setVariable: string,
    operation: ScriptBuilderRPNOperation,
    otherVariable: string,
    clamp: boolean
  ) => {
    this._addComment(`Variables ${operation}`);
    const rpn = this._rpn();
    if (clamp) {
      rpn.int16(0).int16(255);
    }
    rpn //
      .refVariable(setVariable)
      .refVariable(otherVariable)
      .operator(operation);
    if (clamp) {
      rpn.operator(".MIN").operator(".MAX");
    }
    rpn.refSetVariable(setVariable);
    rpn.stop();
    this._addNL();
  };

  variableValueOperation = (
    setVariable: string,
    operation: ScriptBuilderRPNOperation,
    value: number,
    clamp: boolean
  ) => {
    this._addComment(`Variables ${operation} Value`);
    const rpn = this._rpn();
    if (clamp) {
      rpn.int16(0).int16(255);
    }
    rpn //
      .refVariable(setVariable)
      .int16(value)
      .operator(operation);
    if (clamp) {
      rpn.operator(".MIN").operator(".MAX");
    }
    rpn.refSetVariable(setVariable);
    rpn.stop();
    this._addNL();
  };

  variablesScriptValueOperation = (
    setVariable: string,
    operation: ScriptBuilderRPNOperation,
    value: ScriptValue
  ) => {
    this._addComment(`Variables ${operation}`);
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(value)
    );
    const localsLookup = this._performFetchOperations(fetchOps);
    const rpn = this._rpn();
    rpn.refVariable(setVariable);
    this._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.operator(operation);
    rpn.refSetVariable(setVariable);
    rpn.stop();
    this._addNL();
  };

  variableRandomOperation = (
    variable: string,
    operation: ScriptBuilderRPNOperation,
    min: number,
    range: number,
    clamp: boolean
  ) => {
    const randRef = this._declareLocal("random_var", 1, true);
    this._addComment(`Variables ${operation} Random`);
    this._rand(randRef, min, range);
    const rpn = this._rpn();
    if (clamp) {
      rpn.int16(0).int16(255);
    }
    rpn //
      .refVariable(variable)
      .ref(randRef)
      .operator(operation);
    if (clamp) {
      rpn.operator(".MIN").operator(".MAX");
    }
    rpn.refSetVariable(variable);
    rpn.stop();
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
      .int16(flags)
      .operator(".B_OR")
      .refSetVariable(variable)
      .stop();
    this._addNL();
  };

  variableClearFlags = (variable: string, flags: number) => {
    this._addComment(`Variable Clear Flags`);
    this._rpn() //
      .refVariable(variable)
      .int16(-1)
      .int16(flags)
      .operator(".B_XOR")
      .operator(".B_AND")
      .refSetVariable(variable)
      .stop();
    this._addNL();
  };

  variableEvaluateExpression = (variable: string, expression: string) => {
    this._addComment(
      `Variable ${variable} = ${this._expressionToHumanReadable(expression)}`
    );
    this._stackPushEvaluatedExpression(expression, variable);
    this._addNL();
  };

  variableSetToProperty = (
    variable: string,
    property: string | { value: ScriptBuilderVariable; property: string }
  ) => {
    let actorValue: ScriptBuilderVariable;
    let propertyValue: string;

    if (!property) {
      return;
    }

    if (typeof property === "object") {
      actorValue = property.value;
      propertyValue = property.property;
    } else {
      actorValue = property.replace(/:.*/, "");
      propertyValue = property.replace(/.*:/, "");
    }

    this.actorSetById(actorValue);
    if (propertyValue === "xpos") {
      this.actorGetPositionX(variable);
    } else if (propertyValue === "ypos") {
      this.actorGetPositionY(variable);
    } else if (propertyValue === "pxpos") {
      this.actorGetPositionX(variable, "pixels");
    } else if (propertyValue === "pypos") {
      this.actorGetPositionY(variable, "pixels");
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

  localVariableFromUnion = (
    unionValue: ScriptBuilderUnionValue
  ): string | ScriptBuilderFunctionArg => {
    if (!unionValue) {
      // Guard undefined values
      return this.localVariableFromUnion({ type: "number", value: 0 });
    }
    if (unionValue.type === "variable") {
      return unionValue.value;
    }
    const local = this._declareLocal("union_val", 1, true);
    this.variableSetToUnionValue(this._localRef(local, 0), unionValue);
    return local;
  };

  markLocalsUsed = (...locals: string[]) => {
    locals.forEach((local) => {
      this._markLocalUse(local);
    });
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

  engineFieldSetToScriptValue = (key: string, value: ScriptValue) => {
    const { engineFields } = this.options;
    const engineField = engineFields[key];
    if (engineField !== undefined) {
      const cType = engineField.cType;
      this._addComment(`Engine Field Set To Value`);

      const [rpnOps, fetchOps] = precompileScriptValue(
        optimiseScriptValue(value)
      );

      if (rpnOps.length === 1 && rpnOps[0].type === "number") {
        // Was single number
        if (is16BitCType(cType)) {
          this._setConstMemInt16(key, rpnOps[0].value);
        } else {
          this._setConstMemInt8(key, rpnOps[0].value);
        }
      } else if (rpnOps.length === 1 && rpnOps[0].type === "variable") {
        // Was single variable
        if (is16BitCType(cType)) {
          this._setMemInt16ToVariable(key, rpnOps[0].value);
        } else {
          this._setMemInt8ToVariable(key, rpnOps[0].value);
        }
      } else {
        // Was RPN instructions
        const engineFieldValueRef = this._declareLocal(
          "engine_field_val",
          1,
          true
        );
        const localsLookup = this._performFetchOperations(fetchOps);
        this._addComment(`-- Calculate value`);
        const rpn = this._rpn();
        this._performValueRPN(rpn, rpnOps, localsLookup);
        rpn.refSetVariable(engineFieldValueRef).stop();
        if (is16BitCType(cType)) {
          this._setMemInt16ToVariable(key, engineFieldValueRef);
        } else {
          this._setMemInt8ToVariable(key, engineFieldValueRef);
        }
      }
      this._addNL();
    }
  };

  engineFieldSetToDefault = (key: string) => {
    const { engineFields } = this.options;
    const engineField = engineFields[key];
    if (engineField !== undefined) {
      const cType = engineField.cType;
      const numberValue = Number(engineField.defaultValue || 0);
      this._addComment(`Engine Field Set To Default`);
      if (is16BitCType(cType)) {
        this._setConstMemInt16(key, numberValue);
      } else {
        this._setConstMemInt8(key, numberValue);
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
    this._setConstMemInt8("fade_frames_per_step", fadeSpeeds[speed] ?? 0x3);
    this._fadeIn(true);
    this._addNL();
  };

  fadeOut = (speed = 1) => {
    this._addComment(`Fade Out`);
    this._setConstMemInt8("fade_frames_per_step", fadeSpeeds[speed] ?? 0x3);
    this._fadeOut(true);
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Tiles

  replaceTileXY = (
    x: number,
    y: number,
    tilesetId: string,
    tileIndex: number,
    tileSize: "8px" | "16px"
  ) => {
    const { tilesets } = this.options;
    const tileset = tilesets.find((t) => t.id === tilesetId) ?? tilesets[0];
    if (!tileset) {
      return;
    }

    this._addComment(`Replace Tile XY`);
    this._stackPushConst(tileIndex);
    if (tileSize === "16px") {
      // Top left tile
      this._replaceTileXY(x, y, tileset.symbol, ".ARG0");
      // Top right tile
      this._rpn() //
        .ref(".ARG0")
        .int8(1)
        .operator(".ADD")
        .refSet(".ARG0")
        .stop();
      this._replaceTileXY(x + 1, y, tileset.symbol, ".ARG0");
      // Bottom right tile
      this._rpn() //
        .ref(".ARG0")
        .int8(tileset.width)
        .operator(".ADD")
        .refSet(".ARG0")
        .stop();
      this._replaceTileXY(x + 1, y + 1, tileset.symbol, ".ARG0");
      // Bottom left tile
      this._rpn() //
        .ref(".ARG0")
        .int8(1)
        .operator(".SUB")
        .refSet(".ARG0")
        .stop();
      this._replaceTileXY(x, y + 1, tileset.symbol, ".ARG0");
    } else {
      this._replaceTileXY(x, y, tileset.symbol, ".ARG0");
    }
    this._stackPop(1);
  };

  replaceTileXYVariable = (
    x: number,
    y: number,
    tilesetId: string,
    tileIndexVariable: string,
    tileSize: "8px" | "16px"
  ) => {
    const { tilesets } = this.options;
    const tileset = tilesets.find((t) => t.id === tilesetId) ?? tilesets[0];
    if (!tileset) {
      return;
    }

    const variableAlias = this.getVariableAlias(tileIndexVariable);

    this._addComment(`Replace Tile XY`);
    if (this._isIndirectVariable(tileIndexVariable)) {
      this._stackPushInd(variableAlias);
    } else {
      this._stackPush(variableAlias);
    }
    if (tileSize === "16px") {
      // Top left tile
      this._replaceTileXY(x, y, tileset.symbol, ".ARG0");
      // Top right tile
      this._rpn() //
        .ref(".ARG0")
        .int8(1)
        .operator(".ADD")
        .refSet(".ARG0")
        .stop();
      this._replaceTileXY(x + 1, y, tileset.symbol, ".ARG0");
      // Bottom right tile
      this._rpn() //
        .ref(".ARG0")
        .int8(tileset.width)
        .operator(".ADD")
        .refSet(".ARG0")
        .stop();
      this._replaceTileXY(x + 1, y + 1, tileset.symbol, ".ARG0");
      // Bottom left tile
      this._rpn() //
        .ref(".ARG0")
        .int8(1)
        .operator(".SUB")
        .refSet(".ARG0")
        .stop();
      this._replaceTileXY(x, y + 1, tileset.symbol, ".ARG0");
    } else {
      this._replaceTileXY(x, y, tileset.symbol, ".ARG0");
    }
    this._stackPop(1);
  };

  replaceTileXYScriptValue = (
    x: number,
    y: number,
    tilesetId: string,
    tileIndexValue: ScriptValue,
    tileSize: "8px" | "16px"
  ) => {
    const { tilesets } = this.options;
    const tileset = tilesets.find((t) => t.id === tilesetId) ?? tilesets[0];
    if (!tileset) {
      return;
    }
    const tileIndex = this._declareLocal("tile_index", 1, true);

    this._addComment(`Replace Tile XY`);
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(tileIndexValue)
    );
    const localsLookup = this._performFetchOperations(fetchOps);
    const rpn = this._rpn();
    this._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.refSet(tileIndex);
    rpn.stop();
    if (tileSize === "16px") {
      // Top left tile
      this._replaceTileXY(x, y, tileset.symbol, tileIndex);
      // Top right tile
      this._rpn() //
        .ref(tileIndex)
        .int8(1)
        .operator(".ADD")
        .refSet(tileIndex)
        .stop();
      this._replaceTileXY(x + 1, y, tileset.symbol, tileIndex);
      // Bottom right tile
      this._rpn() //
        .ref(tileIndex)
        .int8(tileset.width)
        .operator(".ADD")
        .refSet(tileIndex)
        .stop();
      this._replaceTileXY(x + 1, y + 1, tileset.symbol, tileIndex);
      // Bottom left tile
      this._rpn() //
        .ref(tileIndex)
        .int8(1)
        .operator(".SUB")
        .refSet(tileIndex)
        .stop();
      this._replaceTileXY(x, y + 1, tileset.symbol, tileIndex);
    } else {
      this._replaceTileXY(x, y, tileset.symbol, tileIndex);
    }
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

  musicRoutineSet = (
    routine: number,
    script: ScriptEvent[],
    symbol?: string
  ) => {
    this._addComment(`Music Routine Attach`);
    const scriptRef = this._compileSubScript("music", script, symbol);
    const routineValue = Number(routine);
    this._musicRoutine(routineValue, scriptRef);
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Sound

  soundStartTone = (period = 1600, toneFrames = 30, priority: SFXPriority) => {
    this._addComment("Sound Play Tone");
    const symbol = this._soundPlayBasic(1, toneFrames, [
      0x00,
      (0x0 << 6) | 0x01,
      (0x0f << 4) | 0x00,
      period & 0x00ff,
      0x80 | ((period & 0x0700) >> 8),
    ]);
    this._soundPlay(symbol, toASMSoundPriority(priority));
    this._addNL();
  };

  soundPlayBeep = (pitch = 4, frames = 30, priority: SFXPriority) => {
    this._addComment("Sound Play Beep");
    let pitchValue = pitch - 1;
    if (pitchValue < 0) {
      pitchValue = 0;
    }
    if (pitchValue >= 8) {
      pitchValue = 7;
    }
    pitchValue = pitchValue & 0x07;
    const symbol = this._soundPlayBasic(4, frames, [
      0x01,
      (0x0f << 4) | 0x02,
      0x20 | 0x08 | pitchValue,
      0x80 | 0x40,
    ]);
    this._soundPlay(symbol, toASMSoundPriority(priority));
    this._addNL();
  };

  soundPlayCrash = (frames = 30, priority: SFXPriority) => {
    this._addComment("Sound Play Crash");
    const symbol = this._soundPlayBasic(4, frames, [
      0x01,
      (0x0f << 4) | 0x02,
      0x13,
      0x80,
    ]);
    this._soundPlay(symbol, toASMSoundPriority(priority));
    this._addNL();
  };

  soundPlay = (soundId: string, priority: SFXPriority, effect?: number) => {
    this._addComment(`Sound Play`);
    const { sounds } = this.options;
    const sound = sounds.find((s) => s.id === soundId);
    if (sound) {
      this._soundPlay(
        `${sound.symbol}${
          sound.type === "fxhammer"
            ? "_" + String(effect ?? 0).padStart(2, "0")
            : ""
        }`,
        toASMSoundPriority(priority)
      );
    }
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Palettes

  paletteSetBackground = (paletteIds: string[]) => {
    const { palettes, settings, scene } = this.options;

    let mask = 0;
    const writePalettes: Palette[] = [];
    for (let i = 0; i < paletteIds.length; i++) {
      const paletteId = paletteIds[i];
      const defaultPaletteId = settings.defaultBackgroundPaletteIds[i];
      if (paletteId === "keep") {
        continue;
      }
      let palette = getPalette(palettes, paletteId, defaultPaletteId);
      if (paletteId === "restore") {
        if (scene.background.autoPalettes) {
          // Restore from auto palette
          palette = scene.background.autoPalettes[i] ?? palette;
        } else {
          // Restore from manual palette
          const scenePaletteId =
            scene.paletteIds[i] ?? settings.defaultBackgroundPaletteIds[i];
          palette = getPalette(palettes, scenePaletteId, defaultPaletteId);
        }
      }
      mask += 1 << i;
      writePalettes.push(palette);
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
    if (!this.labelLookup[name]) {
      const label = this.getNextLabel();
      this.labelLookup[name] = label;
    }
    this._label(this.labelLookup[name]);
  };

  labelGoto = (name: string) => {
    if (!this.labelLookup[name]) {
      const label = this.getNextLabel();
      this.labelLookup[name] = label;
    }
    this._jump(this.labelLookup[name]);
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
    const hasLoadedRef = this._declareLocal("has_loaded", 1, true);
    const loadedLabel = this.getNextLabel();
    this._addComment(`Save Data to Slot ${slot}`);
    this._raiseException("EXCEPTION_SAVE", 1);
    this._saveSlot(slot);
    this._pollLoaded(hasLoadedRef);
    this._ifConst(".EQ", hasLoadedRef, 1, loadedLabel, 0);
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
    const peekValueRef = this._declareLocal("peek_value", 1, true);
    const variableDestAlias = this.getVariableAlias(variableDest);
    const variableSourceAlias = this.getVariableAlias(variableSource);
    const foundLabel = this.getNextLabel();

    this._addComment(
      `Store ${variableSourceAlias} from save slot ${slot} into ${variableDestAlias}`
    );
    this._savePeek(
      peekValueRef,
      variableDestAlias,
      variableSourceAlias,
      1,
      slot
    );
    this._ifConst(".EQ", peekValueRef, 1, foundLabel, 0);
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

  linkClose = () => {
    this._sioSetMode(".SIO_MODE_NONE");
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

  whileExpression = (
    expression: string,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const loopId = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`While ${this._expressionToHumanReadable(expression)}`);
    this._label(loopId);
    this._stackPushEvaluatedExpression(expression);
    this._ifConst(".EQ", ".ARG0", 0, endLabel, 1);
    this._compilePath(truePath);
    this._jump(loopId);
    this._label(endLabel);
    this._addNL();
  };

  whileScriptValue = (
    value: ScriptValue,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const loopId = this.getNextLabel();
    const endLabel = this.getNextLabel();

    this._addComment(`While`);
    this._label(loopId);

    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(value)
    );
    const localsLookup = this._performFetchOperations(fetchOps);
    this._addComment(`-- Calculate value`);
    const rpn = this._rpn();
    this._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();

    this._ifConst(".EQ", ".ARG0", 0, endLabel, 1);
    this._compilePath(truePath);
    this._jump(loopId);
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

  ifVariableCompareScriptValue = (
    variable: string,
    operator: ScriptBuilderComparisonOperator,
    value: ScriptValue,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(value)
    );

    this._addComment(`If Variable ${operator} Value`);

    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();

    if (rpnOps.length === 1 && rpnOps[0].type === "number") {
      this._ifVariableConst(operator, variable, rpnOps[0].value, trueLabel, 0);
    } else if (rpnOps.length === 1 && rpnOps[0].type === "direction") {
      this._ifVariableCmpVariable(
        operator,
        variable,
        rpnOps[0].value,
        trueLabel,
        0
      );
    } else {
      this._addComment(`-- Calculate value`);
      const localsLookup = this._performFetchOperations(fetchOps);
      const ifValueRef = this._declareLocal("if_value", 1, true);
      const rpn = this._rpn();
      this._performValueRPN(rpn, rpnOps, localsLookup);
      rpn.refSet(ifValueRef).stop();
      this._ifVariableCmpVariable(operator, variable, ifValueRef, trueLabel, 0);
    }

    this._compilePath(falsePath);
    this._jump(endLabel);
    this._label(trueLabel);
    this._compilePath(truePath);
    this._label(endLabel);
    this._addNL();
  };

  ifScriptValue = (
    value: ScriptValue,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(value)
    );
    const localsLookup = this._performFetchOperations(fetchOps);
    const ifValueRef = this._declareLocal("if_value", 1, true);
    this._addComment(`If`);

    this._addComment(`-- Calculate value`);
    const rpn = this._rpn();
    this._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.refSet(ifValueRef).stop();

    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If`);
    this._ifVariableConst(".NE", ifValueRef, 0, trueLabel, 0);
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
      .int16(flags)
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
    const paramValueRef = this._declareLocal(
      `param${parameter}_value`,
      1,
      true
    );
    if (!this.includeParams.includes(parameter)) {
      this.includeParams.push(parameter);
    }
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Parameter ${parameter} Equals ${value}`);
    this._getThreadLocal(paramValueRef, parameter);
    this._ifConst(".EQ", paramValueRef, value, trueLabel, 0);
    this._jump(endLabel);
    this._label(trueLabel);
    this._compilePath(truePath);
    this._stop();
    this._label(endLabel);
    this._addNL();
  };

  ifColorSupported = (truePath = [], falsePath = []) => {
    const cpuValueRef = this._declareLocal("cpu_value", 1, true);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Color Supported`);
    this._getMemUInt8(cpuValueRef, "_cpu");
    this._ifConst(".NE", cpuValueRef, "0x11", falseLabel, 0);
    this._addNL();
    this._compilePath(truePath);
    this._jump(endLabel);
    this._label(falseLabel);
    this._compilePath(falsePath);
    this._label(endLabel);
    this._addNL();
  };

  ifDeviceCGB = (truePath = [], falsePath = []) => {
    const isCGBRef = this._declareLocal("is_cgb", 1, true);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Color Supported`);
    this._getMemUInt8(isCGBRef, "_is_CGB");
    this._ifConst(".NE", isCGBRef, 1, falseLabel, 0);
    this._addNL();
    this._compilePath(truePath);
    this._jump(endLabel);
    this._label(falseLabel);
    this._compilePath(falsePath);
    this._label(endLabel);
    this._addNL();
  };

  ifDeviceSGB = (truePath = [], falsePath = []) => {
    const isSGBRef = this._declareLocal("is_sgb", 1, true);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Device SGB`);
    this._getMemUInt8(isSGBRef, "_is_SGB");
    this._ifConst(".NE", isSGBRef, 1, falseLabel, 0);
    this._addNL();
    this._compilePath(truePath);
    this._jump(endLabel);
    this._label(falseLabel);
    this._compilePath(falsePath);
    this._label(endLabel);
    this._addNL();
  };

  ifDeviceGBA = (truePath = [], falsePath = []) => {
    const isGBARef = this._declareLocal("is_gba", 1, true);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Device GBA`);
    this._getMemUInt8(isGBARef, "_is_GBA");
    this._ifConst(".NE", isGBARef, 1, falseLabel, 0);
    this._addNL();
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
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    units: DistanceUnitType = "tiles"
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Actor At Position`);
    this._actorGetPosition(actorRef);
    this._rpn()
      .ref(this._localRef(actorRef, 1))
      .int16(x * (units === "tiles" ? 8 : 1) * 16)
      .operator(".EQ")
      .ref(this._localRef(actorRef, 2))
      .int16(y * (units === "tiles" ? 8 : 1) * 16)
      .operator(".EQ")
      .operator(".AND")
      .stop();
    this._ifConst(".EQ", ".ARG0", 0, falseLabel, 1);
    this._addNL();
    this._compilePath(truePath);
    this._jump(endLabel);
    this._label(falseLabel);
    this._compilePath(falsePath);
    this._label(endLabel);
    this._addNL();
  };

  ifActorAtPositionByScriptValues = (
    actorId: string,
    valueX: ScriptValue,
    valueY: ScriptValue,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    units: DistanceUnitType = "tiles"
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();

    this._addComment(`If Actor At Position`);

    const [rpnOpsX, fetchOpsX] = precompileScriptValue(
      optimiseScriptValue(
        multiplyScriptValueConst(valueX, (units === "tiles" ? 8 : 1) * 16)
      ),
      "x"
    );
    const [rpnOpsY, fetchOpsY] = precompileScriptValue(
      optimiseScriptValue(
        multiplyScriptValueConst(valueY, (units === "tiles" ? 8 : 1) * 16)
      ),
      "y"
    );

    const localsLookup = this._performFetchOperations([
      ...fetchOpsX,
      ...fetchOpsY,
    ]);

    this.actorSetById(actorId);
    this._actorGetPosition(actorRef);

    const rpn = this._rpn();

    this._addComment(`-- Calculate coordinate values`);

    // X Value EQ
    rpn.ref(this._localRef(actorRef, 1));
    this._performValueRPN(rpn, rpnOpsX, localsLookup);
    rpn.operator(".EQ");

    // Y Value EQ
    rpn.ref(this._localRef(actorRef, 2));
    this._performValueRPN(rpn, rpnOpsY, localsLookup);
    rpn.operator(".EQ");

    // Both are EQ
    rpn.operator(".AND");
    rpn.stop();

    this._ifConst(".EQ", ".ARG0", 0, falseLabel, 1);
    this._addNL();
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
    const actorRef = this._declareLocal("actor", 4);
    const actorDirRef = this._declareLocal("actor_dir", 1, true);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Actor Facing Direction`);
    this._actorGetDirection(actorRef, actorDirRef);
    this._ifConst(".NE", actorDirRef, toASMDir(direction), falseLabel, 0);
    this._addNL();
    this._compilePath(truePath);
    this._jump(endLabel);
    this._label(falseLabel);
    this._compilePath(falsePath);
    this._label(endLabel);
    this._addNL();
  };

  ifActorDirectionScriptValue = (
    actorId: string,
    directionValue: ScriptValue,
    truePath = [],
    falsePath = []
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const actorDirRef = this._declareLocal("actor_dir", 1, true);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();

    this._addComment(`If Actor Facing Direction`);
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(directionValue)
    );

    this.actorSetById(actorId);
    this._actorGetDirection(actorRef, actorDirRef);

    const localsLookup = this._performFetchOperations(fetchOps);
    this._addComment(`-- Calculate value`);
    const rpn = this._rpn();
    this._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();

    this._if(".NE", actorDirRef, ".ARG0", falseLabel, 1);
    this._addNL();
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
    const savePeekRef = this._declareLocal("save_peek", 1, true);
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Variable True`);
    this._savePeek(savePeekRef, 0, 0, 0, slot);
    this._ifConst(".EQ", savePeekRef, 1, trueLabel, 0);
    this._addNL();
    this._compilePath(falsePath);
    this._jump(endLabel);
    this._label(trueLabel);
    this._compilePath(truePath);
    this._label(endLabel);
    this._addNL();
  };

  ifCurrentSceneIs = (
    sceneId: string,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const { scenes } = this.options;
    const scene = scenes.find((s) => s.id === sceneId);
    const symbol = scene?.symbol;

    this._addComment(`If Current Scene Is ${symbol}`);

    if (symbol) {
      const falseLabel = this.getNextLabel();
      const endLabel = this.getNextLabel();

      const bankRef = this._declareLocal("bank", 1, true);
      const addrRef = this._declareLocal("addr", 1, true);

      this._getMemInt8(bankRef, "_current_scene");
      this._getMemInt16(addrRef, "^/(_current_scene+1)/");

      this._rpn()
        .ref(bankRef)
        .int8(`___bank_${symbol}`)
        .operator(".EQ")
        .ref(addrRef)
        .int16(`_${symbol}`)
        .operator(".EQ")
        .operator(".AND")
        .stop();
      this._ifConst(".EQ", ".ARG0", 0, falseLabel, 1);
      this._addNL();
      this._compilePath(truePath);
      this._jump(endLabel);
      this._label(falseLabel);
      this._compilePath(falsePath);
      this._label(endLabel);
      this._addNL();
    } else {
      this._compilePath(falsePath);
    }
  };

  ifInput = (
    input: string,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const inputRef = this._declareLocal("input", 1, true);
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Input`);
    this._getMemInt8(inputRef, "^/(_joypads + 1)/");
    this._rpn() //
      .ref(inputRef)
      .int8(inputDec(input))
      .operator(".B_AND")
      .stop();
    this._ifConst(".NE", ".ARG0", 0, trueLabel, 1);
    this._addNL();
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
    const actorRef = this._declareLocal("actor", 4);
    const otherActorRef = this._declareLocal("other_actor", 3, true);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Actor ${operation} Relative To Actor`);
    this._actorGetPosition(actorRef);
    this.setActorId(otherActorRef, otherId);
    this._actorGetPosition(otherActorRef);
    if (operation === "left") {
      this._rpn() //
        .ref(this._localRef(actorRef, 1)) // X1
        .ref(this._localRef(otherActorRef, 1)) // X2
        .operator(".LT")
        .stop();
    } else if (operation === "right") {
      this._rpn() //
        .ref(this._localRef(actorRef, 1)) // X1
        .ref(this._localRef(otherActorRef, 1)) // X2
        .operator(".GT")
        .stop();
    } else if (operation === "up") {
      this._rpn() //
        .ref(this._localRef(actorRef, 2)) // Y1
        .ref(this._localRef(otherActorRef, 2)) // Y2
        .operator(".LT")
        .stop();
    } else if (operation === "down") {
      this._rpn() //
        .ref(this._localRef(actorRef, 2)) // Y1
        .ref(this._localRef(otherActorRef, 2)) // Y2
        .operator(".GT")
        .stop();
    } else {
      throw new Error("Missing operation in ifActorRelativeToActor");
    }
    this._ifConst(".EQ", ".ARG0", 0, falseLabel, 1);
    this._addNL();
    this._compilePath(truePath);
    this._jump(endLabel);
    this._label(falseLabel);
    this._compilePath(falsePath);
    this._label(endLabel);
    this._addNL();
  };

  ifActorDistanceFromActor = (
    distance: number,
    operator: ScriptBuilderComparisonOperator,
    otherId: string,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const otherActorRef = this._declareLocal("other_actor", 3, true);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    const distanceSquared = distance * distance;

    this._addComment(`If Actor ${operator} ${distance} tiles from Actor`);
    this._actorGetPosition(actorRef);
    this.setActorId(otherActorRef, otherId);
    this._actorGetPosition(otherActorRef);

    // (x2-x1)^2 + (y2-y1)^2
    this._rpn() //
      .ref(this._localRef(otherActorRef, 1)) // X2
      .int16(8 * 16)
      .operator(".DIV")
      .ref(this._localRef(actorRef, 1)) // X1
      .int16(8 * 16)
      .operator(".DIV")
      .operator(".SUB")
      .ref(this._localRef(otherActorRef, 1)) // X2
      .int16(8 * 16)
      .operator(".DIV")
      .ref(this._localRef(actorRef, 1)) // X1
      .int16(8 * 16)
      .operator(".DIV")
      .operator(".SUB")
      .operator(".MUL")
      .ref(this._localRef(otherActorRef, 2)) // Y2
      .int16(8 * 16)
      .operator(".DIV")
      .ref(this._localRef(actorRef, 2)) // Y1
      .int16(8 * 16)
      .operator(".DIV")
      .operator(".SUB")
      .ref(this._localRef(otherActorRef, 2)) // Y2
      .int16(8 * 16)
      .operator(".DIV")
      .ref(this._localRef(actorRef, 2)) // Y1
      .int16(8 * 16)
      .operator(".DIV")
      .operator(".SUB")
      .operator(".MUL")
      .operator(".ADD")
      .int16(distanceSquared)
      .operator(operator)
      .stop();

    this._ifConst(".EQ", ".ARG0", 0, falseLabel, 1);
    this._addNL();
    this._compilePath(truePath);
    this._jump(endLabel);
    this._label(falseLabel);
    this._compilePath(falsePath);
    this._label(endLabel);
    this._addNL();
  };

  ifActorDistanceVariableFromActor = (
    distanceVariable: string,
    operator: ScriptBuilderComparisonOperator,
    otherId: string,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const otherActorRef = this._declareLocal("other_actor", 3, true);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();

    this._addComment(
      `If Actor ${operator} ${distanceVariable} tiles from Actor`
    );
    this._actorGetPosition(actorRef);
    this.setActorId(otherActorRef, otherId);
    this._actorGetPosition(otherActorRef);

    // (x2-x1)^2 + (y2-y1)^2
    this._rpn() //
      .ref(this._localRef(otherActorRef, 1)) // X2
      .int16(8 * 16)
      .operator(".DIV")
      .ref(this._localRef(actorRef, 1)) // X1
      .int16(8 * 16)
      .operator(".DIV")
      .operator(".SUB")
      .ref(this._localRef(otherActorRef, 1)) // X2
      .int16(8 * 16)
      .operator(".DIV")
      .ref(this._localRef(actorRef, 1)) // X1
      .int16(8 * 16)
      .operator(".DIV")
      .operator(".SUB")
      .operator(".MUL")
      .ref(this._localRef(otherActorRef, 2)) // Y2
      .int16(8 * 16)
      .operator(".DIV")
      .ref(this._localRef(actorRef, 2)) // Y1
      .int16(8 * 16)
      .operator(".DIV")
      .operator(".SUB")
      .ref(this._localRef(otherActorRef, 2)) // Y2
      .int16(8 * 16)
      .operator(".DIV")
      .ref(this._localRef(actorRef, 2)) // Y1
      .int16(8 * 16)
      .operator(".DIV")
      .operator(".SUB")
      .operator(".MUL")
      .operator(".ADD")
      .refVariable(distanceVariable)
      .refVariable(distanceVariable)
      .operator(".MUL")
      .operator(operator)
      .stop();

    this._ifConst(".EQ", ".ARG0", 0, falseLabel, 1);
    this._addNL();
    this._compilePath(truePath);
    this._jump(endLabel);
    this._label(falseLabel);
    this._compilePath(falsePath);
    this._label(endLabel);
    this._addNL();
  };

  ifActorDistanceScriptValueFromActor = (
    actorId: string,
    distanceValue: ScriptValue,
    operator: ScriptBuilderComparisonOperator,
    otherId: string,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const otherActorRef = this._declareLocal("other_actor", 3, true);
    const distanceRef = this._declareLocal("distance", 1, true);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();

    this._addComment(`If Actor Distance from Actor`);

    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(distanceValue)
    );

    const localsLookup = this._performFetchOperations(fetchOps);
    this._addComment(`-- Calculate value`);
    const rpn = this._rpn();
    this._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.refSet(distanceRef);
    rpn.stop();

    this.actorSetById(actorId);
    this._actorGetPosition(actorRef);
    this.setActorId(otherActorRef, otherId);
    this._actorGetPosition(otherActorRef);

    // (x2-x1)^2 + (y2-y1)^2
    this._rpn() //
      .ref(this._localRef(otherActorRef, 1)) // X2
      .int16(8 * 16)
      .operator(".DIV")
      .ref(this._localRef(actorRef, 1)) // X1
      .int16(8 * 16)
      .operator(".DIV")
      .operator(".SUB")
      .ref(this._localRef(otherActorRef, 1)) // X2
      .int16(8 * 16)
      .operator(".DIV")
      .ref(this._localRef(actorRef, 1)) // X1
      .int16(8 * 16)
      .operator(".DIV")
      .operator(".SUB")
      .operator(".MUL")
      .ref(this._localRef(otherActorRef, 2)) // Y2
      .int16(8 * 16)
      .operator(".DIV")
      .ref(this._localRef(actorRef, 2)) // Y1
      .int16(8 * 16)
      .operator(".DIV")
      .operator(".SUB")
      .ref(this._localRef(otherActorRef, 2)) // Y2
      .int16(8 * 16)
      .operator(".DIV")
      .ref(this._localRef(actorRef, 2)) // Y1
      .int16(8 * 16)
      .operator(".DIV")
      .operator(".SUB")
      .operator(".MUL")
      .operator(".ADD")
      .ref(distanceRef)
      .ref(distanceRef)
      .operator(".MUL")
      .operator(operator)
      .stop();

    this._ifConst(".EQ", ".ARG0", 0, falseLabel, 1);
    this._addNL();
    this._compilePath(truePath);
    this._jump(endLabel);
    this._label(falseLabel);
    this._compilePath(falsePath);
    this._label(endLabel);
    this._addNL();
  };

  caseVariableValue = (
    variable: string,
    cases: {
      [key: string]: ScriptEvent[] | ScriptBuilderPathFunction;
    } = {},
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const caseKeys = Object.keys(cases);
    const numCases = caseKeys.length;

    if (numCases === 0) {
      this._compilePath(falsePath);
      return;
    }

    const caseLabels = caseKeys.map(() => this.getNextLabel());
    const endLabel = this.getNextLabel();

    this._addComment(`Switch Variable`);
    this._switchVariable(
      variable,
      caseLabels.map((label, i) => [Number(caseKeys[i]), `${label}$`]),
      0
    );
    this._addNL();

    // Default
    this._compilePath(falsePath);
    this._jump(endLabel);

    // Cases
    for (let i = 0; i < numCases; i++) {
      this._addComment(`case ${caseKeys[i]}:`);
      this._label(caseLabels[i]);
      this._compilePath(cases[caseKeys[i]]);
      this._jump(endLabel);
    }
    this._label(endLabel);

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

  _getAvailableSymbol = (name: string, register = true) => {
    const { symbols } = this.options;
    if (!symbols[name]) {
      if (register) {
        symbols[name] = name;
      }
      return name;
    }
    let counter = 0;
    while (true) {
      const newName = `${name.replace(/_[0-9]+$/, "")}_${counter}`;
      if (!symbols[newName]) {
        if (register) {
          symbols[newName] = newName;
        }
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
    inputSymbol?: string,
    options?: Partial<ScriptBuilderOptions>
  ) => {
    const symbol = this._getAvailableSymbol(
      inputSymbol ? inputSymbol : `script_${type}_0`
    );
    // Set script context to calculate default value for missing vars
    let context: ScriptEditorContextType = this.options.context;
    if (type === "custom") {
      context = "script";
    } else if (context === "script") {
      context = "global";
    }
    const compiledSubScript = compileEntityEvents(
      symbol,
      this.options.maxDepth >= 0 ? script : [],
      {
        ...this.options,
        ...options,
        scriptEventHandlers: this.options.scriptEventHandlers,
        output: [],
        loop: false,
        lock: false,
        context,
        isFunction: type === "custom",
        maxDepth: this.options.maxDepth - 1,
        branch: false,
        debugEnabled: this.options.debugEnabled,
        warnings: (msg: string) => {
          console.error(msg);
        },
      }
    );
    this.options.additionalScripts[symbol] = {
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
  // Dynamic asset files

  writeAsset = (filename: string, data: string) => {
    this.options.additionalOutput[filename] = {
      filename,
      data,
    };
  };

  makeSymbol = (name: string) => {
    return this._getAvailableSymbol(name);
  };

  // --------------------------------------------------------------------------
  // Debuger

  addDebugSymbol = (scriptSymbolName: string, scriptEventId: string) => {
    if (this.options.debugEnabled) {
      const debugSymbol = (
        scriptEventId === "autofade"
          ? [
              scriptSymbolName,
              scriptEventId,
              this.options.scene?.id ?? "",
              "scene",
              this.options.scene?.id ?? "",
              "script",
            ]
          : [
              scriptSymbolName,
              scriptEventId,
              this.options.scene?.id ?? "",
              this.options.entityType,
              this.options.entity?.id ?? "",
              this.options.entityScriptKey ?? "script",
            ]
      )
        .map((i) => i.replace(/-/g, "_"))
        .join("$");
      this.output.push(`GBVM$${debugSymbol} = .`);
      this.output.push(`.globl GBVM$${debugSymbol}`);
    }
  };

  addDebugEndSymbol = (scriptSymbolName: string, scriptEventId: string) => {
    if (this.options.debugEnabled) {
      const debugSymbol = [scriptSymbolName, scriptEventId]
        .map((i) => i.replace(/-/g, "_"))
        .join("$");
      this.output.push(`GBVM_END$${debugSymbol} = .`);
      this.output.push(`.globl GBVM_END$${debugSymbol}`);
    }
  };

  // --------------------------------------------------------------------------
  // Export

  toScriptString = (name: string, lock: boolean) => {
    this._assertStackNeutral();

    const reserveMem = this._calcLocalsSize();

    const scriptArgVars = Array.from(this.options.argLookup.variable.values())
      .reverse()
      .map((arg, index) =>
        arg ? `\n${arg.symbol} = -${3 + reserveMem + index}` : ""
      )
      .join("");

    const scriptArgActors = Array.from(this.options.argLookup.actor.values())
      .reverse()
      .map((arg, index) =>
        arg
          ? `\n${arg.symbol} = -${
              3 + reserveMem + index + this.options.argLookup.variable.size
            }`
          : ""
      )
      .join("");

    return `.module ${name}

${this.headers.map((header) => `.include "${header}"`).join("\n")}
${
  this.dependencies.length > 0
    ? `\n.globl ${this.dependencies.join(", ")}\n`
    : ""
}
.area _CODE_255
${scriptArgVars}${scriptArgActors}${Object.keys(this.localsLookup)
      .map((symbol) => `\n${symbol} = -${this.localsLookup[symbol].addr}`)
      .join("")}

___bank_${name} = 255
.globl ___bank_${name}

_${name}::
${lock ? this._padCmd("VM_LOCK", "", 8, 24) + "\n\n" : ""}${
      reserveMem > 0
        ? this._padCmd("VM_RESERVE", String(reserveMem), 8, 24) + "\n\n"
        : ""
    }${this.output.join("\n")}
`;
  };
}

export default ScriptBuilder;
