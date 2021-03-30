import { inputDec, textSpeedDec } from "./helpers";
import { decOct } from "../helpers/8bit";
import trimlines from "../helpers/trimlines";
import { is16BitCType } from "../helpers/engineFields";
import {
  globalVariableName,
  localVariableName,
  tempVariableName,
} from "../helpers/variables";
import {
  ActorDirection,
  ScriptEvent,
  Variable,
} from "../../store/features/entities/entitiesTypes";
import { Dictionary } from "@reduxjs/toolkit";
import { EngineFieldSchema } from "../../store/features/engine/engineState";
import { FunctionSymbol, OperatorSymbol } from "../rpn/types";
import tokenize from "../rpn/tokenizer";
import shuntingYard from "../rpn/shuntingYard";
import { PrecompiledFontData } from "./compileFonts";
import { encodeString } from "../helpers/encodings";

type ScriptOutput = string[];

interface ScriptBuilderEntity {
  id: string;
}

interface ScriptBuilderScene {
  id: string;
  actors: ScriptBuilderEntity[];
  triggers: ScriptBuilderEntity[];
}

type ScriptBuilderEntityType = "scene" | "actor" | "trigger";

type ScriptBuilderStackVariable = string | number;

interface ScriptBuilderOptions {
  scene: ScriptBuilderScene;
  sceneIndex: number;
  entityIndex: number;
  entityType: ScriptBuilderEntityType;
  variables: string[];
  variablesLookup: VariablesLookup;
  variableAliasLookup: Dictionary<string>;
  scenes: ScriptBuilderScene[];
  sprites: ScriptBuilderEntity[];
  fonts: PrecompiledFontData[];
  characterEncoding: string;
  entity?: ScriptBuilderEntity;
  engineFields: Dictionary<EngineFieldSchema>;
  additionalScripts: {
    symbol: string;
    script: ScriptEvent[] | ScriptBuilderPathFunction;
  }[];
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

type ScriptBuilderChoiceFlag = ".UI_MENU_LAST_0" | ".UI_MENU_CANCEL_B";

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
  | ".OVERLAY_TEXT_IN_SPEED"
  | ".OVERLAY_TEXT_OUT_SPEED";

type ScriptBuilderUIColor = 0 | ".UI_COLOR_WHITE" | ".UI_COLOR_BLACK";

type ScriptBuilderPathFunction = () => void;

type VariablesLookup = { [name: string]: Variable | undefined };

// - Helpers --------------

const getActorIndex = (actorId: string, scene: ScriptBuilderScene) => {
  return scene.actors.findIndex((a) => a.id === actorId) + 1;
};

export const getVariableIndex = (variable: string, variables: string[]) => {
  const normalisedVariable = String(variable)
    .replace(/\$/g, "")
    .replace(/^0+([0-9])/, "$1");
  let variableIndex = variables.indexOf(normalisedVariable);
  if (variableIndex === -1) {
    variables.push(normalisedVariable);
    variableIndex = variables.length - 1;
  }
  return variableIndex;
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
  return String(parseInt(variable));
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

const unionFlags = (flags: string[], defaultValue: string = "0") => {
  if (flags.length === 0) {
    return defaultValue;
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

const assertUnreachable = (x: never): never => {
  throw new Error("Didn't expect to get here");
};

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
      variables: options.variables || [],
      variablesLookup: options.variablesLookup || {},
      variableAliasLookup: options.variableAliasLookup || {},
      engineFields: options.engineFields || {},
      scenes: options.scenes || [],
      sprites: options.sprites || [],
      fonts: options.fonts || [],
      characterEncoding: options.characterEncoding || "",
      additionalScripts: options.additionalScripts || [],
      compileEvents: options.compileEvents || ((_self, _e) => {}),
    };
    this.dependencies = [];
    this.nextLabel = 1;
    this.actorIndex = options.entity
      ? getActorIndex(options.entity.id, options.scene)
      : 0;
    this.stackPtr = 0;
    this.labelStackSize = {};
    this.includeActor = false;
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

  _stackPushConst = (value: number | string) => {
    this.stackPtr++;
    this._addCmd("VM_PUSH_CONST", value);
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

  _setUInt8 = (cVariable: string, location: ScriptBuilderStackVariable) => {
    this._addDependency(cVariable);
    this._addCmd("VM_SET_UINT8", `_${cVariable}`, location);
  };

  _setUInt16 = (cVariable: string, location: ScriptBuilderStackVariable) => {
    this._addDependency(cVariable);
    this._addCmd("VM_SET_UINT16", `_${cVariable}`, location);
  };

  _setConstUInt8 = (cVariable: string, value: number) => {
    this._addDependency(cVariable);
    this._addCmd("VM_SET_CONST_INT8", `_${cVariable}`, value);
  };

  _setConstUInt16 = (cVariable: string, value: number) => {
    this._addDependency(cVariable);
    this._addCmd("VM_SET_CONST_INT16", `_${cVariable}`, value);
  };

  _getUInt8 = (location: ScriptBuilderStackVariable, cVariable: string) => {
    this._addCmd("VM_GET_UINT8", location, `_${cVariable}`);
  };

  _getUInt16 = (location: ScriptBuilderStackVariable, cVariable: string) => {
    this._addCmd("VM_GET_UINT16", location, `_${cVariable}`);
  };

  _string = (str: string) => {
    const { characterEncoding } = this.options;
    this._addCmd(`.asciz "${encodeString(str, characterEncoding)}"`);
  };

  _importFarPtrData = (farPtr: string) => {
    this._includeHeader("macro.i");
    this._addBankedDataDependency(farPtr);
    this._addCmd(`    IMPORT_FAR_PTR_DATA`, `_${farPtr}`);
  };

  _saveSlot = (slot: number) => {
    this._addCmd(`    .SAVE_SLOT ${slot}`);
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
      ref: (variable: string) => {
        rpnCmd(".R_REF ", variable);
        stack.push(0);
        return rpn;
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
        stack.forEach((value: number) => {
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

  _actorActivate = (addr: string) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_ACTIVATE", addr);
  };

  _actorDeactivate = (addr: string) => {
    this.includeActor = true;
    this._addCmd("VM_ACTOR_DEACTIVATE", addr);
  };

  _actorMoveTo = (addr: string) => {
    this._addCmd("VM_ACTOR_MOVE_TO", addr);
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

  _actorSetDirection = (addr: string, asmDir: string) => {
    this._addCmd("VM_ACTOR_SET_DIR", addr, asmDir);
  };

  _actorSetHidden = (addr: string, hidden: boolean) => {
    this._addCmd("VM_ACTOR_SET_HIDDEN", addr, hidden ? 1 : 0);
  };

  _loadText = (numInputs: number) => {
    this._addCmd("VM_LOAD_TEXT", `${numInputs}`);
  };

  _loadStructuredText = (inputText: string) => {
    let text = inputText;

    const inlineVariables = (
      text.match(/(\$L[0-9]\$|\$T[0-1]\$|\$[0-9]+\$)/g) || []
    ).map((s) => s.replace(/\$/g, ""));

    const inlineFonts = (text.match(/(!F:[0-9a-f-]+!)/g) || []).map((id) =>
      id.substring(3).replace(/!$/, "")
    );

    const usedVariableAliases = inlineVariables.map((variable) =>
      this.getVariableAlias(variable.replace(/^0/g, ""))
    );

    // Replace speed codes
    text = text.replace(/!S([0-5])!/g, (_match, value: string) => {
      return `\\02${value}`;
    });

    inlineVariables.forEach((code) => {
      text = text.replace(`$${code}$`, "%d");
    });

    inlineFonts.forEach((fontId, i) => {
      const fontIndex = this._getFontIndex(fontId);
      text = text.replace(`!F:${fontId}!`, `\\002\\${decOct(fontIndex + 1)}`);
    });

    this._loadText(usedVariableAliases.length);
    if (usedVariableAliases.length > 0) {
      this._dw(...usedVariableAliases);
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
      drawFrame ? ".UI_DRAW_FRAME" : 0
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

  _isDataSaved = (variable: ScriptBuilderStackVariable, slot: number) => {
    this._addCmd("VM_DATA_IS_SAVED", variable, slot);
  };

  _scenePush = () => {
    this._addCmd("VM_SCENE_PUSH");
  };

  _scenePop = () => {
    this._addCmd("VM_SCENE_POP");
  };

  _fadeIn = (speed: number) => {
    this._addCmd("VM_FADE_IN", speed);
  };

  _fadeOut = (speed: number) => {
    this._addCmd("VM_FADE_OUT", speed);
  };

  _stop = () => {
    this._assertStackNeutral();
    this._addComment("Stop Script");
    this._addCmd("VM_STOP");
  };

  // --------------------------------------------------------------------------
  // Actors

  actorSetActive = (id: string) => {
    const { scene, entity } = this.options;
    const newIndex =
      id === "$self$" && entity
        ? getActorIndex(entity.id, scene)
        : getActorIndex(id, scene);
    // if (newIndex !== this.actorIndex) {

    this._addComment("Actor Set Active");

    this.actorIndex = newIndex;
    this._setConst("ACTOR", this.actorIndex);
    this._actorActivate("ACTOR");
    this._addNL();
    // }
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
    this._setConst(
      "^/(ACTOR + 3)/",
      unionFlags(
        ([] as string[]).concat(
          useCollisions ? ".ACTOR_ATTR_CHECK_COLL" : [],
          moveType === "horizontal" ? ".ACTOR_ATTR_H_FIRST" : []
        )
      )
    );
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
    this._setConst(
      "^/(ACTOR + 3)/",
      unionFlags(
        ([] as string[]).concat(
          useCollisions ? ".ACTOR_ATTR_CHECK_COLL" : [],
          moveType === "horizontal" ? ".ACTOR_ATTR_H_FIRST" : []
        )
      )
    );
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
    const { scene, entity } = this.options;
    const newIndex =
      id === "$self$" && entity
        ? getActorIndex(entity.id, scene)
        : getActorIndex(id, scene);
    this._addComment("Actor Show");
    this.actorIndex = newIndex;
    this._setConst("ACTOR", this.actorIndex);
    this._actorSetHidden("ACTOR", false);
    this._actorActivate("ACTOR");
    this._addNL();
  };

  actorHide = (id: string) => {
    const { scene, entity } = this.options;
    const newIndex =
      id === "$self$" && entity
        ? getActorIndex(entity.id, scene)
        : getActorIndex(id, scene);
    this._addComment("Actor Hide");
    this.actorIndex = newIndex;
    this._setConst("ACTOR", this.actorIndex);
    this._actorSetHidden("ACTOR", true);
    this._actorDeactivate("ACTOR");
    this._addNL();
  };

  actorSetCollisions = (enabled: boolean) => {
    this._addComment("Actor Set Collisions");
    this._addComment("NOT IMPLEMENTED");
    console.error("actorSetCollisions not implemented");
    this._addNL();
  };

  actorSetDirection = (direction: ActorDirection) => {
    this._addComment("Actor Set Direction");
    this._actorSetDirection("ACTOR", toASMDir(direction));
    this._addNL();
  };

  actorEmote = (emoteId = 0) => {
    this._addComment("Actor Emote");

    // const output = this.output;
    // output.push(cmd(ACTOR_EMOTE));
    // output.push(emoteId);
    this._addNL();
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
    const { sprites } = this.options;
    const input: string[] = Array.isArray(inputText) ? inputText : [inputText];

    const initialNumLines = input.map(
      (textBlock) => textBlock.split("\n").length
    );

    const maxNumLines = Math.max.apply(null, initialNumLines);
    const textBoxHeight = maxNumLines + 2;
    const textBoxY = 18 - textBoxHeight;

    // Add additional newlines so all textboxes in a
    // sequence have the same height
    const paddedInput = input.map((textBlock) => {
      let text = textBlock;
      const numLines = text.split("\n").length;
      if (numLines < maxNumLines) {
        text += new Array(maxNumLines - numLines + 1).join("\n");
      }
      return text;
    });

    this._addComment("Text Dialogue");
    paddedInput.forEach((text, textIndex) => {
      this._loadStructuredText(text);
      this._overlayClear(0, 0, 20, textBoxHeight, ".UI_COLOR_WHITE", true);
      if (textIndex === 0) {
        this._overlayMoveTo(0, textBoxY, ".OVERLAY_TEXT_IN_SPEED");
      }
      this._displayText();
      this._overlayWait(true, [
        ".UI_WAIT_WINDOW",
        ".UI_WAIT_TEXT",
        ".UI_WAIT_BTN_A",
      ]);
      if (textIndex === paddedInput.length - 1) {
        this._overlayMoveTo(0, 18, ".OVERLAY_TEXT_OUT_SPEED");
        this._overlayWait(true, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);
      }
    });
    this._addNL();
  };

  textSetAnimSpeed = (
    speedIn: number,
    speedOut: number,
    textSpeed: number = 1,
    allowFastForward: boolean = true
  ) => {
    this._addComment("Text Set Animation Speed");
    this._setConstUInt8("text_ff_joypad", allowFastForward ? 1 : 0);
    this._setConstUInt8("text_draw_speed", textSpeedDec(textSpeed));
    this._setConstUInt8("text_out_speed", speedOut);
    this._setConstUInt8("text_in_speed", speedIn);
    this._addNL();
  };

  textChoice = (
    setVariable: string,
    args: { trueText: string; falseText: string }
  ) => {
    const trueText = trimlines(args.trueText || "", 17, 1) || "Choice A";
    const falseText = trimlines(args.falseText || "", 17, 1) || "Choice B";
    const choiceText = `\\001\\001 ${trueText}\n ${falseText}`;
    const variableAlias = this.getVariableAlias(setVariable);
    const numLines = choiceText.split("\n").length;

    this._addComment("Text Multiple Choice");
    this._loadStructuredText(choiceText);
    this._overlayClear(0, 0, 20, numLines + 2, ".UI_COLOR_WHITE", true);
    this._overlayMoveTo(0, 18 - numLines - 2, ".OVERLAY_TEXT_IN_SPEED");
    this._displayText();
    this._overlayWait(true, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);
    this._choice(variableAlias, [".UI_MENU_LAST_0", ".UI_MENU_CANCEL_B"], 2);
    this._menuItem(1, 1, 0, 0, 0, 2);
    this._menuItem(1, 2, 0, 0, 1, 0);
    this._overlayMoveTo(0, 18, ".OVERLAY_TEXT_OUT_SPEED");
    this._overlayWait(true, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);
    this._addNL();
  };

  textMenu = (
    setVariable: string,
    options: string[],
    layout: string = "menu",
    cancelOnLastOption: boolean = false,
    cancelOnB: boolean = false
  ) => {
    const variableAlias = this.getVariableAlias(setVariable);
    const optionsText = options.map(
      (option, index) =>
        " " + (trimlines(option || "", 6, 1) || `Item ${index + 1}`)
    );
    const height =
      layout === "menu" ? options.length : Math.min(options.length, 4);
    const menuText =
      "\\001\\001" +
      (layout === "menu"
        ? optionsText.join("\n")
        : Array.from(Array(height))
            .map(
              (_, i) =>
                optionsText[i].padEnd(9, " ") +
                (optionsText[i + 4] ? optionsText[i + 4] : "")
            )
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
    this._loadStructuredText(menuText);
    this._overlayClear(0, 0, 20 - x, height + 2, ".UI_COLOR_WHITE", true);
    if (layout === "menu") {
      this._overlayMoveTo(10, 18, 0);
    }
    this._overlayMoveTo(x, 18 - height - 2, ".OVERLAY_TEXT_IN_SPEED");
    this._displayText();
    this._overlayWait(true, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);
    this._choice(variableAlias, choiceFlags, numLines);

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

    this._overlayMoveTo(x, 18, ".OVERLAY_TEXT_OUT_SPEED");
    this._overlayWait(true, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);
    if (layout === "menu") {
      this._overlayMoveTo(0, 18, 0);
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
    persist: boolean,
    script: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const scriptRef = this._compileSubScript("input", script);
    this._inputContextPrepare(scriptRef, 1);
    this._inputContextAttach(inputDec(input), 1);
    this._addNL();
  };

  inputScriptRemove = (input: string) => {
    console.error("inputScriptRemove not implemented");
    this._inputContextDetach(inputDec(input));

    // const output = this.output;
    // output.push(cmd(REMOVE_INPUT_SCRIPT));
    // output.push(inputDec(input));
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Scenes

  sceneSwitch = (
    sceneId: string,
    x: number = 0,
    y: number = 0,
    direction: ActorDirection = "down",
    fadeSpeed: number = 2
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
    console.error("scenePopAllState not implemented");
    this._addNL();
  };

  sceneResetState = () => {
    this._addComment("Reset Scene State Stack");
    console.error("sceneResetState not implemented");
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Variables

  getVariableAlias = (variable = "0"): string => {
    if (variable.startsWith(".")) {
      return variable;
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
    const existingAlias = variableAliasLookup[id];
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
      const num = toVariableNumber(variable);
      name = globalVariableName(num, variablesLookup);
    }

    let alias = "VAR_" + toASMVar(name);
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
    const variableAlias = this.getVariableAlias(variable);
    this._addComment("Variable Increment By 1");
    this._rpn() //
      .ref(variableAlias)
      .int8(1)
      .operator(".ADD")
      .stop();
    this._set(variableAlias, ".ARG0");
    this._stackPop(1);
    this._addNL();
  };

  variableDec = (variable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    this._addComment("Variable Decrement By 1");
    this._rpn() //
      .ref(variableAlias)
      .int8(1)
      .operator(".SUB")
      .stop();
    this._set(variableAlias, ".ARG0");
    this._stackPop(1);
    this._addNL();
  };

  variableSetToTrue = (variable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    this._addComment("Variable Set To True");
    this._setConst(variableAlias, 1);
    this._addNL();
  };

  variableSetToFalse = (variable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    this._addComment("Variable Set To False");
    this._setConst(variableAlias, 0);
    this._addNL();
  };

  variableSetToValue = (variable: string, value: number) => {
    const variableAlias = this.getVariableAlias(variable);
    this._addComment("Variable Set To Value");
    this._setConst(variableAlias, value);
    this._addNL();
  };

  variableCopy = (setVariable: string, otherVariable: string) => {
    const variableAliasA = this.getVariableAlias(setVariable);
    const variableAliasB = this.getVariableAlias(otherVariable);
    this._addComment("Variable Copy");
    this._set(variableAliasA, variableAliasB);
    this._addNL();
  };

  variableSetToRandom = (variable: string, min: number, range: number) => {
    const variableAlias = this.getVariableAlias(variable);
    this._addComment("Variable Set To Random");
    this._randomize();
    this._rand(variableAlias, min, range);
    this._addNL();
  };

  variablesOperation = (
    setVariable: string,
    operation: ScriptBuilderRPNOperation,
    otherVariable: string,
    clamp: boolean
  ) => {
    const variableAliasA = this.getVariableAlias(setVariable);
    const variableAliasB = this.getVariableAlias(otherVariable);
    const clampLabel = clamp ? this.getNextLabel() : "";

    this._addComment(`Variables ${operation}`);
    this._rpn() //
      .ref(variableAliasA)
      .ref(variableAliasB)
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

    this._set(variableAliasA, ".ARG0");
    this._stackPop(1);
    this._addNL();
  };

  variableValueOperation = (
    setVariable: string,
    operation: ScriptBuilderRPNOperation,
    value: number,
    clamp: boolean
  ) => {
    const variableAliasA = this.getVariableAlias(setVariable);
    const clampLabel = clamp ? this.getNextLabel() : "";

    this._addComment(`Variables ${operation} Value`);
    this._rpn() //
      .ref(variableAliasA)
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

    this._set(variableAliasA, ".ARG0");
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
    const variableAlias = this.getVariableAlias(variable);
    const clampLabel = clamp ? this.getNextLabel() : "";

    this._addComment(`Variables ${operation} Random`);
    this._stackPushConst(0);
    this._randomize();
    this._rand(".ARG0", min, range);
    this._rpn() //
      .ref(variableAlias)
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

    this._set(variableAlias, ".ARG0");
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
    const variableAlias = this.getVariableAlias(variable);
    this._addComment(`Variable Add Flags`);
    this._rpn() //
      .ref(variableAlias)
      .int8(flags)
      .operator(".B_OR")
      .stop();
    this._set(variableAlias, ".ARG0");
    this._stackPop(1);
    this._addNL();
  };

  variableClearFlags = (variable: string, flags: number) => {
    const variableAlias = this.getVariableAlias(variable);
    this._addComment(`Variable Clear Flags`);
    this._rpn() //
      .ref(variableAlias)
      .int8(-1)
      .int8(flags)
      .operator(".B_XOR")
      .operator(".B_AND")
      .stop();
    this._set(variableAlias, ".ARG0");
    this._stackPop(1);
    this._addNL();
  };

  variableEvaluateExpression = (variable: string, expression: string) => {
    const variableAlias = this.getVariableAlias(variable);
    this._addComment(
      `Variable ${variableAlias} = ${this._expressionToHumanReadable(
        expression
      )}`
    );
    this._stackPushEvaluatedExpression(expression);
    this._set(variableAlias, ".ARG0");
    this._stackPop(1);
    this._addNL();
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
        this._setConstUInt16(key, numberValue);
      } else {
        this._setConstUInt8(key, numberValue);
      }
      this._addNL();
    }
  };

  engineFieldSetToVariable = (key: string, variable: string) => {
    const { engineFields } = this.options;
    const engineField = engineFields[key];
    if (engineField !== undefined) {
      const variableAlias = this.getVariableAlias(variable);
      const cType = engineField.cType;
      this._addComment(`Engine Field Set To Variable`);
      if (is16BitCType(cType)) {
        this._setUInt16(key, variableAlias);
      } else {
        this._setUInt8(key, variableAlias);
      }
      this._addNL();
    }
  };

  engineFieldStoreInVariable = (key: string, variable: string) => {
    const { engineFields } = this.options;
    const engineField = engineFields[key];
    if (engineField !== undefined) {
      const variableAlias = this.getVariableAlias(variable);
      const cType = engineField.cType;
      this._addComment(`Engine Field Store In Variable`);
      if (is16BitCType(cType)) {
        this._getUInt16(variableAlias, key);
      } else {
        this._getUInt8(variableAlias, key);
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
    console.error("musicPlay not implemented");
    // throw new Error("musicPlay not implemented");
    this._addNL();
  };

  musicStop = () => {
    console.error("musicStop not implemented");
    // throw new Error("musicStop not implemented");
    this._addNL();
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

  dataLoad = (slot: number) => {
    this._addComment(`Load Data from Slot ${slot}`);
    this._raiseException("EXCEPTION_LOAD", 1);
    this._saveSlot(slot);
    this._addNL();
  };

  dataSave = (slot: number) => {
    this._addComment(`Save Data to Slot ${slot}`);
    this._raiseException("EXCEPTION_SAVE", 1);
    this._saveSlot(slot);
    this._addNL();
  };

  dataClear = (slot: number) => {
    this._addComment(`Clear Data in Slot ${slot}`);
    console.error("dataClear not implemented");
    // throw new Error("dataClear not implemented");
    this._addNL();
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
    const variableAlias = this.getVariableAlias(variable);
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Variable True`);
    this._ifConst(".EQ", variableAlias, 1, trueLabel, 0);
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
    const variableAlias = this.getVariableAlias(variable);
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Variable ${operator} Value`);
    this._ifConst(operator, variableAlias, value, trueLabel, 0);
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
    const variableAliasA = this.getVariableAlias(variableA);
    const variableAliasB = this.getVariableAlias(variableB);
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Variable ${operator} Variable`);
    this._if(operator, variableAliasA, variableAliasB, trueLabel, 0);
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
    const variableAlias = this.getVariableAlias(variable);
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Variable ${operator} Value`);
    this._rpn() //
      .ref(variableAlias)
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

  ifColorSupported = (truePath = [], falsePath = []) => {
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Color Supported`);
    this._stackPushConst(0);
    this._getUInt8(".ARG0", "_cpu");
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
    slot: number,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`If Variable True`);
    this._stackPushConst(0);
    this._isDataSaved(".ARG0", slot);
    this._ifConst(".EQ", ".ARG0", 1, trueLabel, 1);
    this._compilePath(falsePath);
    this._jump(endLabel);
    this._label(trueLabel);
    this._compilePath(truePath);
    this._label(endLabel);
    this._addNL();
  };

  caseVariableValue = (
    variable: string,
    cases: { [key: string]: ScriptEvent[] | ScriptBuilderPathFunction } = {},
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const variableAlias = this.getVariableAlias(variable);
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
        this._ifConst(".NE", variableAlias, caseKeys[i], caseLabels[i], 0);
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

  _compileSubScript = (
    type: "input" | "timer",
    script: ScriptEvent[] | ScriptBuilderPathFunction = []
  ) => {
    const symbol = `script_${type}_${this.options.additionalScripts.length}`;
    this.options.additionalScripts.push({
      symbol,
      script,
    });
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

  compileEvents = (path: ScriptEvent[]) => {
    const { compileEvents } = this.options;
    compileEvents(this, path);
  };

  /*

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

  // Variables

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

  variablesReset = () => {
    const output = this.output;
    output.push(cmd(RESET_VARIABLES));
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

  // Control Flow

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

${this.includeActor ? "ACTOR = -4" : ""}

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
    }${this.output.join("\n")}
`;
  };
}

export default ScriptBuilder;
