import { decBin, decHex } from "shared/lib/helpers/8bit";
import { is16BitCType } from "shared/lib/engineFields/engineFieldToCType";
import tokenize from "shared/lib/rpn/tokenizer";
import shuntingYard from "shared/lib/rpn/shuntingYard";
import { defaultProjectSettings } from "consts";
import { lexText, Token } from "shared/lib/compiler/lexText";
import { encodeString } from "shared/lib/helpers/fonts";
import {
  PrecompiledValueFetch,
  PrecompiledValueRPNOperation,
  ScriptValue,
} from "shared/lib/scriptValue/types";
import {
  optimiseScriptValue,
  precompileScriptValue,
  sortFetchOperations,
} from "shared/lib/scriptValue/helpers";
import { chunkTextOnWaitCodes } from "shared/lib/text/textCodes";
import {
  ASMSFXPriority,
  ASMSpriteMode,
  ResolvedActorId,
  RPNHandler,
  RPNMemType,
  ScriptBuilderActorFlags,
  ScriptBuilderAxis,
  ScriptBuilderChoiceFlag,
  ScriptBuilderComparisonOperator,
  ScriptBuilderFunctionArg,
  ScriptBuilderLocalSymbol,
  ScriptBuilderMoveType,
  ScriptBuilderOptions,
  ScriptBuilderOverlayMoveSpeed,
  ScriptBuilderOverlayWaitFlag,
  ScriptBuilderPaletteType,
  ScriptBuilderPathFunction,
  ScriptBuilderRPNOperation,
  ScriptBuilderStackVariable,
  ScriptBuilderUIColor,
  ScriptBuilderVariable,
  ScriptOutput,
} from "./types";
import {
  assertUnreachable,
  buildOverlayWaitCondition,
  funToScriptOperator,
  getActorIndex,
  getVariableId,
  isObject,
  rpnUnaryOperators,
  textCodeGoto,
  textCodeGotoRel,
  textCodeInput,
  textCodeSetFont,
  textCodeSetSpeed,
  toASMDir,
  toASMVar,
  toProjectileHash,
  toScriptOperator,
  toValidLabel,
  unionFlags,
  valueFunctionToScriptOperator,
} from "./helpers";
import {
  isVariableLocal,
  isVariableTemp,
  toVariableNumber,
} from "shared/lib/entities/entitiesHelpers";
import {
  globalVariableDefaultName,
  localVariableName,
  tempVariableName,
} from "shared/lib/variables/variableNames";
import { defaultVariableForContext } from "shared/lib/scripts/context";
import { PrecompiledProjectile } from "lib/compiler/generateGBVMData";
import { ScriptEvent, ScriptEditorCtxType } from "shared/lib/resources/types";
import { generateScriptHash } from "shared/lib/scripts/scriptHelpers";
import compileEntityEvents from "lib/compiler/compileEntityEvents";
import { gbvmScriptChecksum } from "lib/compiler/gbvm/buildHelpers";

/**
 * ScriptBuilderBase is the base class for ScriptBuilder.
 *
 * This contains low level methods for generating GBVM code, as well as shared helper methods.
 *
 * Functions in this file are subject to change as the operations available in GBVM are
 * modified. Where possible it's preferable to use the functions in ScriptBuilder
 * which are more stable and provide a higher level API.
 */
abstract class ScriptBuilderBase {
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
  labelStackSize: Record<string, number>;
  includeParams: number[];
  headers: string[];
  eventCommand: string;

  constructor(
    output: ScriptOutput,
    options: Partial<ScriptBuilderOptions> &
      Pick<ScriptBuilderOptions, "scene" | "scriptEventHandlers">,
  ) {
    this.byteSize = 0;
    this.output = output;
    this.eventCommand = "";
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
      constantsLookup: options.constantsLookup || {},
      engineFields: options.engineFields || {},
      engineFieldValues: options.engineFieldValues || [],
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
      globalProjectiles: options.globalProjectiles || [],
      argLookup: options.argLookup || { actor: new Map(), variable: new Map() },
      maxDepth: options.maxDepth ?? 5,
      debugEnabled: options.debugEnabled ?? false,
      compiledCustomEventScriptCache:
        options.compiledCustomEventScriptCache ?? {},
      recursiveSymbolMap: options.recursiveSymbolMap ?? {},
      additionalScriptsCache: options.additionalScriptsCache ?? {},
      compiledAssetsCache: options.compiledAssetsCache ?? {},
      disabledSceneTypeIds: options.disabledSceneTypeIds || [],
      compileEvents: options.compileEvents || ((_self, _e) => {}),
      warnings: options.warnings || (() => {}),
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

  _includeHeader = (filename: string) => {
    if (!this.headers.includes(filename)) {
      this.headers.push(filename);
    }
  };

  _addDependency = (symbol: string) => {
    const dataSymbol = `_${symbol}`;
    if (!this.dependencies.includes(dataSymbol)) {
      this.dependencies.push(dataSymbol);
    }
  };

  _addBankedFnDependency = (symbol: string) => {
    const bankSymbol = `b_${symbol}`;
    const dataSymbol = `_${symbol}`;
    if (!this.dependencies.includes(bankSymbol)) {
      this.dependencies.push(bankSymbol);
    }
    if (!this.dependencies.includes(dataSymbol)) {
      this.dependencies.push(dataSymbol);
    }
  };

  _addBankedDataDependency = (symbol: string) => {
    const bankSymbol = `___bank_${symbol}`;
    const dataSymbol = `_${symbol}`;
    if (!this.dependencies.includes(bankSymbol)) {
      this.dependencies.push(bankSymbol);
    }
    if (!this.dependencies.includes(dataSymbol)) {
      this.dependencies.push(dataSymbol);
    }
  };

  _addComment = (comment: string) => {
    this.output.push(`        ; ${comment}`);
  };

  _addNL = () => {
    this.output.push(``);
  };

  _addCmd = (cmd: string, ...args: Array<ScriptBuilderStackVariable>) => {
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
        24,
      ),
    );
  };

  _prettyFormatCmd = (cmd: string, args: Array<ScriptBuilderStackVariable>) => {
    if (args.length > 0) {
      return `        ${cmd.padEnd(
        Math.max(24, cmd.length + 1),
        " ",
      )}${args.join(", ")}`;
    } else {
      return `        ${cmd}`;
    }
  };

  _padCmd = (cmd: string, args: string, nPadStart: number, nPadCmd: number) => {
    const startPadding = "".padStart(nPadStart);
    if (args.length > 0) {
      return `${startPadding}${cmd.padEnd(
        Math.max(nPadCmd, cmd.length + 1),
        " ",
      )}${args}`;
    } else {
      return `${startPadding}${cmd}`;
    }
  };

  _assertStackNeutral = (expected = 0) => {
    if (this.stackPtr !== expected) {
      const diff = this.stackPtr - expected;
      if (this.stackPtr > expected) {
        throw new Error(`Script was not stack neutral! Stack grew by ${diff}`);
      } else if (this.stackPtr < expected) {
        throw new Error(
          `Script was not stack neutral! Stack shrank by ${-diff}`,
        );
      }
    }
  };

  _assertLabelStackNeutral = (label: string) => {
    if (!this.labelStackSize[label]) {
      this.labelStackSize[label] = this.stackPtr;
    } else {
      if (this.stackPtr !== this.labelStackSize[label]) {
        throw new Error(
          `Jump to label with different stack size. First call size=${this.labelStackSize[label]}, this call size=${this.stackPtr}`,
        );
      }
    }
  };

  _stackPushEvaluatedExpression = (
    expression: string,
    resultVariable?: ScriptBuilderVariable,
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
        } else if (token.type === "CONST") {
          rpn = rpn.intConstant(token.symbol);
        } else {
          assertUnreachable(token);
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

  _expressionToHumanReadable = (expression: string) => {
    return expression
      .replace(/\s+/g, "")
      .replace(/\n/g, "")
      .replace(/(\$L[0-9]\$|\$T[0-1]\$|\$[0-9]+\$)/g, (symbol) => {
        return this.getVariableAlias(symbol.replace(/\$/g, ""));
      })
      .replace(/@([a-z0-9-]{36})@/g, (symbol) => {
        return this.getConstantSymbol(symbol.replace(/@/g, ""));
      });
  };

  _getFontIndex = (fontId: string) => {
    const { fonts } = this.options;
    const index = fonts.findIndex((f) => f.id === fontId);
    if (index === -1) {
      return 0;
    }
    return index;
  };

  _getFontSymbol = (fontId: string) => {
    const { fonts } = this.options;
    const font = fonts.find((f) => f.id === fontId);
    if (!font?.symbol) {
      return "0";
    }
    return font.symbol.toUpperCase();
  };

  resolveActorId(id: ScriptBuilderVariable): ResolvedActorId {
    if (typeof id === "number") {
      return { type: "number", value: id };
    }
    if (typeof id === "string") {
      if (id.startsWith(".")) {
        return { type: "reference", symbol: id };
      } else {
        return { type: "number", value: this.getActorIndex(id) };
      }
    }
    return { type: "reference", symbol: id.symbol };
  }

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

  _stackPushVariable = (variable: ScriptBuilderVariable) => {
    const variableAlias = this.getVariableAlias(variable);
    if (this._isIndirectVariable(variable)) {
      this._stackPushInd(variableAlias);
    } else {
      this._stackPush(variableAlias);
    }
  };

  _stackPushReference = (
    addr: ScriptBuilderStackVariable,
    comment?: string,
  ) => {
    this._addCmd("VM_PUSH_REFERENCE", addr, comment ? `; ${comment}` : "");
    this.stackPtr++;
  };

  _stackPushScriptValue = (value: ScriptValue) => {
    this._addComment("Push Script Value");
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(value),
    );
    if (rpnOps.length === 1 && rpnOps[0].type === "number") {
      this._stackPushConst(rpnOps[0].value);
    } else if (rpnOps.length === 1 && rpnOps[0].type === "variable") {
      this._stackPushVariable(rpnOps[0].value);
    } else {
      const localsLookup = this._performFetchOperations(fetchOps);
      this._addComment(`-- Calculate value`);
      const rpn = this._rpn();
      this._performValueRPN(rpn, rpnOps, localsLookup);
      rpn.stop();
    }
    this._addNL();
  };

  _stackPop = (num: number) => {
    this._addCmd("VM_POP", num);
    this.stackPtr -= num;
  };

  _set = (
    addr: ScriptBuilderStackVariable,
    value: ScriptBuilderStackVariable,
  ) => {
    this._addCmd("VM_SET", addr, value);
  };

  _setConst = (
    addr: ScriptBuilderStackVariable,
    value: ScriptBuilderStackVariable,
  ) => {
    this._addCmd("VM_SET_CONST", addr, value);
  };

  _setInd = (
    addr: ScriptBuilderStackVariable,
    value: ScriptBuilderStackVariable,
  ) => {
    this._addCmd("VM_SET_INDIRECT", addr, value);
  };

  _setVariable = (
    variable: ScriptBuilderVariable,
    value: ScriptBuilderStackVariable,
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
    variableB: ScriptBuilderVariable,
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
    value: ScriptBuilderStackVariable,
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
    value: ScriptBuilderStackVariable,
  ) => {
    this._addCmd("VM_GET_INDIRECT", addr, value);
  };

  _setMemInt8 = (cVariable: string, addr: ScriptBuilderStackVariable) => {
    this._addDependency(cVariable);
    this._addCmd("VM_SET_INT8", `_${cVariable}`, addr);
  };

  _setMemUInt8 = (cVariable: string, addr: ScriptBuilderStackVariable) => {
    this._addDependency(cVariable);
    this._addCmd("VM_SET_UINT8", `_${cVariable}`, addr);
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

  _setMemUInt8ToVariable = (cVariable: string, variable: string) => {
    const variableAlias = this.getVariableAlias(variable);
    this._addDependency(cVariable);
    if (this._isIndirectVariable(variable)) {
      this._stackPushInd(variableAlias);
      this._setMemUInt8(cVariable, ".ARG0");
      this._stackPop(1);
    } else {
      this._setMemUInt8(cVariable, variableAlias);
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

  _setMemToScriptValue = (
    cVariable: string,
    cType: "BYTE" | "UBYTE" | "WORD" | "UWORD",
    value: ScriptValue,
  ) => {
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(value),
    );
    if (rpnOps.length === 1 && rpnOps[0].type === "number") {
      // Was single number - set using const
      if (cType === "WORD" || cType === "UWORD") {
        this._setConstMemInt16(cVariable, rpnOps[0].value);
      } else if (cType === "UBYTE") {
        this._setConstMemUInt8(cVariable, rpnOps[0].value);
      } else {
        this._setConstMemInt8(cVariable, rpnOps[0].value);
      }
    } else if (rpnOps.length === 1 && rpnOps[0].type === "variable") {
      // Was single variable
      if (cType === "WORD" || cType === "UWORD") {
        this._setMemInt16ToVariable(cVariable, rpnOps[0].value);
      } else if (cType === "UBYTE") {
        this._setMemUInt8ToVariable(cVariable, rpnOps[0].value);
      } else {
        this._setMemInt8ToVariable(cVariable, rpnOps[0].value);
      }
    } else {
      // Was RPN instructions
      const memSetValueRef = this._declareLocal("mem_set_value", 1, true);
      const localsLookup = this._performFetchOperations(fetchOps);
      this._addComment(`-- Calculate value`);
      const rpn = this._rpn();
      this._performValueRPN(rpn, rpnOps, localsLookup);
      rpn.refSetVariable(memSetValueRef).stop();
      if (cType === "WORD" || cType === "UWORD") {
        this._setMemInt16ToVariable(cVariable, memSetValueRef);
      } else if (cType === "UBYTE") {
        this._setMemUInt8ToVariable(cVariable, memSetValueRef);
      } else {
        this._setMemInt8ToVariable(cVariable, memSetValueRef);
      }
    }
  };

  _setConstMemInt8 = (cVariable: string, value: ScriptBuilderStackVariable) => {
    this._addDependency(cVariable);
    this._addCmd("VM_SET_CONST_INT8", `_${cVariable}`, value);
  };

  _setConstMemUInt8 = (
    cVariable: string,
    value: ScriptBuilderStackVariable,
  ) => {
    this._addDependency(cVariable);
    this._addCmd("VM_SET_CONST_UINT8", `_${cVariable}`, value);
  };

  _setConstMemInt16 = (
    cVariable: string,
    value: ScriptBuilderStackVariable,
  ) => {
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
        : `_${cVariable}`,
    );
  };

  _getMemInt16 = (addr: ScriptBuilderStackVariable, cVariable: string) => {
    this._addCmd(
      "VM_GET_INT16",
      addr,
      cVariable.startsWith("^") || cVariable.startsWith("_")
        ? cVariable
        : `_${cVariable}`,
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
    count: ScriptBuilderStackVariable,
  ) => {
    this._addCmd("VM_MEMSET", dest, value, count);
  };

  _memCpy = (
    dest: ScriptBuilderStackVariable,
    source: ScriptBuilderStackVariable,
    count: ScriptBuilderStackVariable,
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
    mode: ".SIO_MODE_MASTER" | ".SIO_MODE_SLAVE" | ".SIO_MODE_NONE",
  ) => {
    this._addCmd("VM_SIO_SET_MODE", mode);
  };

  _sioExchange = (
    sendVariable: string,
    receiveVariable: string,
    packetSize: number,
  ) => {
    this._addCmd("VM_SIO_EXCHANGE", sendVariable, receiveVariable, packetSize);
  };

  _sioExchangeVariables = (
    variableA: string,
    variableB: string,
    packetSize: number,
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

  _printerDetect = (statusAddr: string, timeout: number) => {
    this._addCmd("VM_PRINTER_DETECT", statusAddr, timeout);
  };

  _printOverlay = (
    statusAddr: string,
    startLine: number,
    height: number,
    margin: number,
  ) => {
    // Height must be a multiple of two
    const roundUpToNearest2 = (num: number) => Math.ceil(num / 2) * 2;
    this._addCmd(
      "VM_PRINT_OVERLAY",
      statusAddr,
      startLine,
      roundUpToNearest2(height),
      margin,
    );
  };

  _dw = (...data: Array<ScriptBuilderStackVariable>) => {
    this._addCmd(
      `.dw ${data.map((d) => this._rawOffsetStackAddr(d)).join(", ")}`,
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

  // Loops while variable is not zero
  _loop = (
    counterAddr: ScriptBuilderStackVariable,
    label: string,
    popNum: number,
  ) => {
    const _label = toValidLabel(label);
    this._addCmd("VM_LOOP", counterAddr, `${_label}$`, popNum);
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
    let rpnStackSize = 0;

    const rpnCmd = (
      cmd: string,
      ...args: Array<ScriptBuilderStackVariable>
    ) => {
      output.push(
        this._padCmd(
          cmd,
          args.map((d) => this._offsetStackAddr(d)).join(", "),
          12,
          12,
        ),
      );
    };

    const rpn = {
      ref: (variable: ScriptBuilderStackVariable) => {
        rpnCmd(".R_REF", variable);
        rpnStackSize++;
        return rpn;
      },
      refInd: (variable: ScriptBuilderStackVariable) => {
        rpnCmd(".R_REF_IND", variable);
        rpnStackSize++;
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
        rpnStackSize--;
        return rpn;
      },
      refSetInd: (variable: ScriptBuilderStackVariable) => {
        rpnCmd(".R_REF_SET_IND", variable);
        rpnStackSize--;
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
      refMem: (type: RPNMemType, address: string) => {
        rpnCmd(".R_REF_MEM", type, `_${address}`);
        rpnStackSize++;
        return rpn;
      },
      actorId: (id: ScriptBuilderVariable) => {
        const actorId = this.resolveActorId(id);
        switch (actorId.type) {
          case "number": {
            rpnCmd(".R_INT16", actorId.value);
            break;
          }
          case "reference": {
            rpnCmd(".R_REF", actorId.symbol);
            break;
          }
          default: {
            assertUnreachable(actorId);
          }
        }
        rpnStackSize++;
        return rpn;
      },
      int8: (value: number | string) => {
        rpnCmd(".R_INT8", value);
        rpnStackSize++;
        return rpn;
      },
      int16: (value: number | string) => {
        rpnCmd(".R_INT16", value);
        rpnStackSize++;
        return rpn;
      },
      intConstant: (value: string) => {
        const symbol = this.getConstantSymbol(value);
        rpnCmd(".R_INT16", symbol);
        rpnStackSize++;
        return rpn;
      },
      memSet: (type: RPNMemType, address: string) => {
        rpnCmd(".R_REF_MEM_SET", type, `_${address}`);
        rpnStackSize--;
        return rpn;
      },
      operator: (op: ScriptBuilderRPNOperation) => {
        rpnCmd(".R_OPERATOR", op);
        if (!rpnUnaryOperators.includes(op)) {
          rpnStackSize--;
        }
        return rpn;
      },
      stop: () => {
        rpnCmd(".R_STOP");
        this._addCmd("VM_RPN");
        output.forEach((cmd: string) => {
          this.output.push(cmd);
        });
        this.stackPtr += rpnStackSize;
      },
    };

    return rpn;
  };

  _performFetchOperations = (
    fetchOps: PrecompiledValueFetch[],
  ): Record<string, string | PrecompiledValueRPNOperation[]> => {
    const localsLookup: Record<
      string,
      string | PrecompiledValueRPNOperation[]
    > = {};
    const sortedFetchOps = sortFetchOperations(fetchOps);

    let currentTarget = "-1";
    let currentProperty: PrecompiledValueFetch["value"]["type"] | undefined =
      undefined;
    let prevLocalVar = "";

    for (const fetchOp of sortedFetchOps) {
      const property = fetchOp.value.type;
      if (
        property === "actorPosition" ||
        property === "actorDirection" ||
        property === "actorFrame"
      ) {
        const targetValue = fetchOp.value.target || "player";
        const targetSymbol =
          typeof targetValue === "string" ? targetValue : targetValue.symbol;
        let localVar = "";

        if (
          targetSymbol === currentTarget &&
          property === currentProperty &&
          prevLocalVar !== ""
        ) {
          // If requested prop was fetched previously, reuse local var, don't fetch again
          localsLookup[fetchOp.local] = prevLocalVar;
          continue;
        }

        this._addComment(`-- Fetch ${targetSymbol} ${property}`);

        switch (property) {
          case "actorPosition": {
            localVar = this._declareLocal("actor_pos", 4, true);
            this.setActorId(localVar, targetValue);
            this._actorGetPosition(localVar);
            break;
          }
          case "actorDirection": {
            localVar = this._declareLocal("actor_dir", 1, true);
            const actorRef = this._declareLocal("actor", 4);
            this.setActorId(actorRef, targetValue);
            this._actorGetDirection(actorRef, localVar);
            break;
          }
          case "actorFrame": {
            localVar = this._declareLocal("actor_frame", 2, true);
            this.setActorId(localVar, targetValue);
            this._actorGetAnimFrame(localVar);
            break;
          }
          default: {
            assertUnreachable(fetchOp.value);
          }
        }
        currentTarget = targetSymbol;
        currentProperty = property;
        prevLocalVar = localVar;
        localsLookup[fetchOp.local] = localVar;
      } else if (property === "engineField") {
        const key = fetchOp.value.value || "";
        const { engineFields } = this.options;
        const engineField = engineFields[key];
        if (engineField !== undefined && engineField.key) {
          const cType = engineField.cType;
          const memType = is16BitCType(cType)
            ? "memI16"
            : cType === "BYTE"
              ? "memI8"
              : "memU8";
          localsLookup[fetchOp.local] = [
            {
              type: memType,
              value: engineField.key,
            },
          ];
        } else {
          // Engine field not found so fallback to 0
          localsLookup[fetchOp.local] = [{ type: "number", value: 0 }];
        }
      } else {
        assertUnreachable(fetchOp.value);
      }
    }

    return localsLookup;
  };

  // Replaces custom script V0-V9 strings with arg ScriptBuilderFunctionArg data
  _resolveVariableRef = <T extends ScriptBuilderVariable>(
    variable: T,
  ): T | ScriptBuilderFunctionArg => {
    if (typeof variable === "string" && variable.match(/^V[0-9]$/)) {
      const arg = this.options.argLookup.variable.get(variable);
      if (!arg) {
        throw new Error("Cant find arg");
      }
      return arg;
    }
    return variable;
  };

  _performValueRPN = (
    rpn: RPNHandler,
    rpnOps: PrecompiledValueRPNOperation[],
    localsLookup: Record<string, string | PrecompiledValueRPNOperation[]>,
  ) => {
    for (const rpnOp of rpnOps) {
      switch (rpnOp.type) {
        case "number":
        case "numberSymbol": {
          rpn.int16(rpnOp.value ?? 0);
          break;
        }
        case "constant": {
          rpn.intConstant(rpnOp.value);
          break;
        }
        case "variable": {
          rpn.refVariable(this._resolveVariableRef(rpnOp.value));
          break;
        }
        case "local": {
          const local = localsLookup[rpnOp.value];
          if (typeof local === "string") {
            // Fetch value is stored in a local var
            this._markLocalUse(local);
            rpn.ref(this._localRef(local, rpnOp.offset ?? 0));
          } else {
            // Fetch can be executed directly with RPN
            this._performValueRPN(rpn, local, localsLookup);
          }
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
        case "memI16": {
          rpn.refMem(".MEM_I16", rpnOp.value);
          break;
        }
        case "memI8": {
          rpn.refMem(".MEM_I8", rpnOp.value);
          break;
        }
        case "memU8": {
          rpn.refMem(".MEM_U8", rpnOp.value);
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
    popNum: number,
  ) => {
    this._addCmd("VM_IF", operator, variableA, variableB, `${label}$`, popNum);
    this.stackPtr -= popNum;
  };

  _ifConst = (
    operator: ScriptBuilderComparisonOperator,
    variable: ScriptBuilderStackVariable,
    value: ScriptBuilderStackVariable,
    label: string,
    popNum: number,
  ) => {
    this._addCmd("VM_IF_CONST", operator, variable, value, `${label}$`, popNum);
    this.stackPtr -= popNum;
  };

  _rateLimitConst = (
    frames: ScriptBuilderStackVariable,
    variable: ScriptBuilderStackVariable,
    label: string,
  ) => {
    this._addCmd("VM_RATE_LIMIT_CONST", frames, variable, `${label}$`);
  };

  _switch = (
    variable: ScriptBuilderStackVariable,
    switchCases: [number | string, string][],
    popNum: number,
  ) => {
    this._addCmd("VM_SWITCH", variable, switchCases.length, popNum);
    for (const switchCase of switchCases) {
      this._dw(...switchCase);
    }
    this.stackPtr -= popNum;
  };

  _switchVariable = (
    variable: string,
    switchCases: [number | string, string][],
    popNum: number,
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
    popNum: number,
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
    popNum: number,
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

  _actorMoveToInit = (addr: string, attr: string) => {
    this._addCmd("VM_ACTOR_MOVE_TO_INIT", addr, attr);
  };

  _actorMoveToX = (addr: string, attr: string) => {
    this._addCmd("VM_ACTOR_MOVE_TO_X", addr, attr);
  };

  _actorMoveToY = (addr: string, attr: string) => {
    this._addCmd("VM_ACTOR_MOVE_TO_Y", addr, attr);
  };

  _actorMoveToXY = (addr: string, attr: string) => {
    this._addCmd("VM_ACTOR_MOVE_TO_XY", addr, attr);
  };

  _actorMoveToSetDirX = (addr: string) => {
    this._addCmd("VM_ACTOR_MOVE_TO_SET_DIR_X", addr);
  };

  _actorMoveToSetDirY = (addr: string) => {
    this._addCmd("VM_ACTOR_MOVE_TO_SET_DIR_Y", addr);
  };

  _actorMoveToOps = (
    addr: string,
    attr: string,
    moveType: ScriptBuilderMoveType,
    moveX: boolean,
    moveY: boolean,
    lockDirection: ScriptBuilderAxis[],
  ) => {
    const lockDirX = lockDirection.includes("x");
    const lockDirY = lockDirection.includes("y");

    if (!moveX && !moveY) {
      return;
    }

    this._actorMoveToInit(addr, attr);
    if (moveX && !moveY) {
      if (!lockDirX) {
        this._actorMoveToSetDirX(addr);
      } else {
        this._actorSetAnimMoving(addr);
      }
      this._actorMoveToX(addr, attr);
    } else if (moveY && !moveX) {
      if (!lockDirY) {
        this._actorMoveToSetDirY(addr);
      } else {
        this._actorSetAnimMoving(addr);
      }
      this._actorMoveToY(addr, attr);
    } else if (moveType === "horizontal") {
      if (!lockDirX) {
        this._actorMoveToSetDirX(addr);
      } else {
        this._actorSetAnimMoving(addr);
      }
      this._actorMoveToX(addr, attr);
      if (!lockDirY) {
        this._actorMoveToSetDirY(addr);
      } else {
        this._actorSetAnimMoving(addr);
      }
      this._actorMoveToY(addr, attr);
    } else if (moveType === "vertical") {
      if (!lockDirY) {
        this._actorMoveToSetDirY(addr);
      } else {
        this._actorSetAnimMoving(addr);
      }
      this._actorMoveToY(addr, attr);
      if (!lockDirX) {
        this._actorMoveToSetDirX(addr);
      } else {
        this._actorSetAnimMoving(addr);
      }
      this._actorMoveToX(addr, attr);
    } else if (moveType === "diagonal") {
      if (!lockDirY) {
        this._actorMoveToSetDirY(addr);
      } else if (!lockDirX) {
        this._actorMoveToSetDirX(addr);
      } else {
        this._actorSetAnimMoving(addr);
      }
      this._actorMoveToXY(addr, attr);
    }
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

  _actorSetBounds = (addr: string) => {
    this._addCmd("VM_ACTOR_SET_BOUNDS", addr);
  };

  _actorSetAnimTick = (addr: string, tick: number) => {
    this._addCmd("VM_ACTOR_SET_ANIM_TICK", addr, tick);
  };

  _actorSetAnimFrame = (addr: string) => {
    this._addCmd("VM_ACTOR_SET_ANIM_FRAME", addr);
  };

  _actorSetAnimMoving = (addr: string) => {
    this._addCmd("VM_ACTOR_SET_ANIM_MOVING", addr);
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
      `_${symbol}`,
    );
  };

  _actorSetAnimState = (addr: string, state: string) => {
    this._addCmd("VM_ACTOR_SET_ANIM_SET", addr, state);
  };

  _actorEmote = (addr: string, symbol: string) => {
    this._addCmd("VM_ACTOR_EMOTE", addr, `___bank_${symbol}`, `_${symbol}`);
  };

  _actorStartUpdate = (addr: string) => {
    this._addCmd("VM_ACTOR_BEGIN_UPDATE", addr);
  };

  _actorTerminateUpdate = (addr: string) => {
    this._addCmd("VM_ACTOR_TERMINATE_UPDATE", addr);
  };

  _actorSetFlags = (
    addr: string,
    flags: ScriptBuilderActorFlags[],
    mask: ScriptBuilderActorFlags[],
  ) => {
    this._addCmd(
      "VM_ACTOR_SET_FLAGS",
      addr,
      unionFlags(flags),
      unionFlags(mask),
    );
  };

  _projectileLaunch = (index: number, addr: string) => {
    this._addCmd("VM_PROJECTILE_LAUNCH", index, addr);
  };

  _projectileLoad = (destIndex: number, srcIndex: number, symbol: string) => {
    this._addCmd(
      "VM_PROJECTILE_LOAD_TYPE",
      destIndex,
      srcIndex,
      `___bank_${symbol}`,
      `_${symbol}`,
    );
  };

  _spritesHide = () => {
    this._addCmd("VM_HIDE_SPRITES");
  };

  _spritesShow = () => {
    this._addCmd("VM_SHOW_SPRITES");
  };

  _setSpriteMode = (mode: ASMSpriteMode) => {
    this._addCmd("VM_SET_SPRITE_MODE", mode);
  };

  _loadText = (numInputs: number) => {
    this._addCmd("VM_LOAD_TEXT", `${numInputs}`);
  };

  _injectScrollCode = (inputText: string, scrollHeight?: number) => {
    let text = inputText;
    // Replace newlines with scroll code if larger than max dialogue size
    if (scrollHeight) {
      let numNewlines = 0;
      text = text.replace(/(\\012|\n)/g, (newline) => {
        numNewlines++;
        if (numNewlines > scrollHeight - 1) {
          return "\\015";
        }
        return newline;
      });
    }
    return text;
  };

  _getAvatarCode = (avatarIndex?: number) => {
    if (avatarIndex === undefined) {
      return "";
    }
    const { fonts } = this.options;
    const avatarFontSize = 16;
    const fontIndex = fonts.length + Math.floor(avatarIndex / avatarFontSize);
    const baseCharCode = ((avatarIndex * 4) % (avatarFontSize * 4)) + 64;
    return `${textCodeSetSpeed(0)}${textCodeSetFont(
      fontIndex,
    )}${String.fromCharCode(baseCharCode)}${String.fromCharCode(
      baseCharCode + 1,
    )}\\n${String.fromCharCode(baseCharCode + 2)}${String.fromCharCode(
      baseCharCode + 3,
    )}${textCodeSetSpeed(2)}${textCodeGotoRel(1, -1)}${textCodeSetFont(0)}`;
  };

  _loadAndDisplayText = (inputText: string) => {
    let waitArgsRef = "";
    let lastWait = -1;
    // Split into chunks where wait frames code is found
    const chunks = chunkTextOnWaitCodes(inputText);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      this._loadTokens(chunk.tokens);
      this._displayText(i !== 0);

      if (chunk.action?.type === "wait") {
        if (waitArgsRef === "") {
          // Declare wait args variable on first call to wait
          waitArgsRef = this._declareLocal("wait_args", 1, true);
        }
        const waitFrames = chunk.action.frames;
        this._overlayWait(true, [".UI_WAIT_TEXT"]);
        if (lastWait !== waitFrames) {
          this._setConst(waitArgsRef, Math.round(waitFrames));
          lastWait = waitFrames;
        }
        this._invoke("wait_frames", 0, waitArgsRef);
      }
    }
  };

  _loadTokens = (textTokens: Token[]) => {
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
      } else if (
        token.type === "variable" ||
        token.type === "char" ||
        token.type === "speedVariable" ||
        token.type === "fontVariable"
      ) {
        const variable = this._resolveVariableRef(token.variableId);
        if (this._isFunctionArg(variable)) {
          if (this._isIndirectVariable(variable)) {
            const localRef = this._declareLocal(
              `text_arg${indirectVars.length}`,
              1,
              true,
            );
            indirectVars.unshift({
              local: localRef,
              arg: variable.symbol,
            });
            usedVariableAliases.push(this._rawOffsetStackAddr(localRef));
          } else {
            usedVariableAliases.push(this._rawOffsetStackAddr(variable.symbol));
          }
        } else {
          usedVariableAliases.push(
            this.getVariableAlias(variable.replace(/^0/g, "")),
          );
        }
        if (token.type === "variable" && token.fixedLength !== undefined) {
          text += `%D${token.fixedLength}`;
        } else if (token.type === "variable") {
          text += "%d";
        } else if (token.type === "char") {
          text += "%c";
        } else if (token.type === "speedVariable") {
          text += "%t";
        } else if (token.type === "fontVariable") {
          text += "%f";
        }
      } else if (token.type === "speed") {
        text += textCodeSetSpeed(token.speed);
      } else if (token.type === "gotoxy" && token.relative) {
        text += textCodeGotoRel(token.x, token.y);
      } else if (token.type === "gotoxy" && !token.relative) {
        text += textCodeGoto(token.x, token.y);
      } else if (token.type === "input") {
        text += textCodeInput(token.mask);
      }
    });

    if (indirectVars.length > 0) {
      for (const indirectVar of indirectVars) {
        this._getInd(indirectVar.local, indirectVar.arg);
      }
    }

    this._loadText(usedVariableAliases.length);

    if (usedVariableAliases.length > 0) {
      this._dw(...usedVariableAliases);
    }

    this._string(text);
  };

  // @deprecated Replace with _loadAndDisplayText which supports wait codes
  _loadStructuredText = (
    inputText: string,
    avatarIndex?: number,
    scrollHeight?: number,
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
      } else if (
        token.type === "variable" ||
        token.type === "char" ||
        token.type === "speedVariable" ||
        token.type === "fontVariable"
      ) {
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
              true,
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
            this.getVariableAlias(variable.replace(/^0/g, "")),
          );
        }
        if (token.type === "variable" && token.fixedLength !== undefined) {
          text += `%D${token.fixedLength}`;
        } else if (token.type === "variable") {
          text += "%d";
        } else if (token.type === "char") {
          text += "%c";
        } else if (token.type === "speedVariable") {
          text += "%t";
        } else if (token.type === "fontVariable") {
          text += "%f";
        }
      } else if (token.type === "speed") {
        text += textCodeSetSpeed(token.speed);
      } else if (token.type === "gotoxy" && token.relative) {
        text += textCodeGotoRel(token.x, token.y);
      } else if (token.type === "gotoxy" && !token.relative) {
        text += textCodeGoto(token.x, token.y);
      } else if (token.type === "input") {
        text += textCodeInput(token.mask);
      }
    });

    // Replace newlines with scroll code if larger than max dialogue size
    if (scrollHeight) {
      let numNewlines = 0;
      text = text.replace(/\\012/g, (newline) => {
        numNewlines++;
        if (numNewlines > scrollHeight - 1) {
          return "\\015";
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
        fontIndex,
      )}${String.fromCharCode(baseCharCode)}${String.fromCharCode(
        baseCharCode + 1,
      )}\\n${String.fromCharCode(baseCharCode + 2)}${String.fromCharCode(
        baseCharCode + 3,
      )}${textCodeSetSpeed(2)}${textCodeGotoRel(1, -1)}${textCodeSetFont(
        0,
      )}${text}`;
    }

    this._string(text);
  };

  _displayText = (preservePos?: boolean, startTile?: number) => {
    if (preservePos || startTile !== undefined) {
      this._addCmd(
        "VM_DISPLAY_TEXT_EX",
        preservePos ? ".DISPLAY_PRESERVE_POS" : ".DISPLAY_DEFAULT",
        startTile ?? ".TEXT_TILE_CONTINUE",
      );
    } else {
      this._addCmd("VM_DISPLAY_TEXT");
    }
  };

  _setTextLayer = (layer: ".TEXT_LAYER_BKG" | ".TEXT_LAYER_WIN") => {
    this._addCmd("VM_SWITCH_TEXT_LAYER", layer);
  };

  _setFont = (fontRef: number | string) => {
    this._addCmd("VM_SET_FONT", fontRef);
  };

  _choice = (
    variable: ScriptBuilderStackVariable,
    options: ScriptBuilderChoiceFlag[],
    numItems: number,
  ) => {
    this._addCmd("VM_CHOICE", variable, unionFlags(options), numItems);
  };

  _menuItem = (
    x: number,
    y: number,
    left: number,
    right: number,
    up: number,
    down: number,
  ) => {
    this._addCmd("    .MENUITEM", x, y, left, right, up, down);
  };

  _overlayShow = (x: number, y: number, color: number | string) => {
    this._addCmd("VM_OVERLAY_SHOW", x, y, color, 0);
  };

  _overlayClear = (
    x: number,
    y: number,
    width: number,
    height: number,
    color: ScriptBuilderUIColor,
    drawFrame: boolean,
    autoScroll = true,
  ) => {
    this._addCmd(
      "VM_OVERLAY_CLEAR",
      x,
      y,
      width,
      height,
      color,
      unionFlags([
        ...(autoScroll ? [".UI_AUTO_SCROLL"] : []),
        ...(drawFrame ? [".UI_DRAW_FRAME"] : []),
      ]),
    );
  };

  _overlayHide = () => {
    this._addCmd("VM_OVERLAY_HIDE");
  };

  _overlayMoveTo = (
    x: number,
    y: number,
    speed: ScriptBuilderOverlayMoveSpeed,
  ) => {
    this._addCmd("VM_OVERLAY_MOVE_TO", x, y, speed);
  };

  _overlayWait = (
    modal: boolean,
    waitFlags: ScriptBuilderOverlayWaitFlag[],
  ) => {
    this._addCmd(
      "VM_OVERLAY_WAIT",
      modal ? ".UI_MODAL" : ".UI_NONMODAL",
      buildOverlayWaitCondition(waitFlags),
    );
  };

  _overlaySetScroll = (
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
  ) => {
    this._addCmd("VM_OVERLAY_SET_SCROLL", x, y, width, height, color);
  };

  _overlaySetSubmapEx = (addr: string) => {
    this._addCmd("VM_OVERLAY_SET_SUBMAP_EX", addr);
  };

  _inputWait = (mask: number) => {
    this._addCmd("VM_INPUT_WAIT", mask);
  };

  _inputContextPrepare = (symbol: string, context: number) => {
    this._addCmd(
      "VM_CONTEXT_PREPARE",
      context,
      `___bank_${symbol}`,
      `_${symbol}`,
    );
  };

  _inputContextAttach = (
    buttonMask: number,
    context: number,
    override: boolean,
  ) => {
    this._addCmd(
      "VM_INPUT_ATTACH",
      buttonMask,
      unionFlags([String(context)].concat(override ? ".OVERRIDE_DEFAULT" : [])),
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
      `_${symbol}`,
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

  _threadStart = (symbol: string, handleAddr: string, numArgs: number) => {
    this._addCmd(
      "VM_BEGINTHREAD",
      `___bank_${symbol}`,
      `_${symbol}`,
      handleAddr,
      numArgs,
    );
  };

  _threadStartWithVariableHandle = (
    symbol: string,
    handleVariable: ScriptBuilderVariable,
    numArgs: number,
  ) => {
    const handleVariableAlias = this.getVariableAlias(handleVariable);
    if (this._isIndirectVariable(handleVariable)) {
      const valueTmpRef = this._declareLocal("value_tmp", 1, true);
      this._threadStart(symbol, valueTmpRef, numArgs);
      this._setInd(handleVariableAlias, valueTmpRef);
    } else {
      this._threadStart(symbol, handleVariableAlias, numArgs);
    }
  };

  _threadTerminate = (handleAddr: string) => {
    this._addCmd("VM_TERMINATE", handleAddr);
  };

  _threadTerminateWithVariableHandle = (
    handleVariable: ScriptBuilderVariable,
  ) => {
    const handleVariableAlias = this.getVariableAlias(handleVariable);
    if (this._isIndirectVariable(handleVariable)) {
      this._stackPushInd(handleVariableAlias);
      this._threadTerminate(".ARG0");
      this._stackPop(1);
    } else {
      this._threadTerminate(handleVariableAlias);
    }
  };

  _savePeek = (
    successDest: ScriptBuilderStackVariable,
    dest: ScriptBuilderStackVariable,
    source: ScriptBuilderStackVariable,
    count: number,
    slot: number,
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
      loop ? ".MUSIC_LOOP" : ".MUSIC_NO_LOOP",
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
      `_${symbol}`,
    );
  };

  _soundPlay = (symbol: string, priority: ASMSFXPriority) => {
    this._addCmd(
      "VM_SFX_PLAY",
      `___bank_${symbol}`,
      `_${symbol}`,
      `___mute_mask_${symbol}`,
      priority,
    );
  };

  _soundPlayBasic = (
    channel: number,
    frames: number,
    data: number[],
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
void AT(0b${decBin(muteMask)}) __mute_mask_${symbol};`,
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
`,
    );

    compiledAssetsCache[output] = symbol;

    return symbol;
  };

  _textSetSound = (symbol: string) => {
    this._addCmd(
      "VM_SET_TEXT_SOUND",
      `___bank_${symbol}`,
      `_${symbol}`,
      `___mute_mask_${symbol}`,
    );
  };

  _textRemoveSound = () => {
    this._addCmd("VM_SET_TEXT_SOUND", `0`, `0`, `0`);
  };

  _paletteLoad = (
    mask: number,
    type: ScriptBuilderPaletteType,
    commit: boolean,
  ) => {
    this._addCmd(
      "VM_LOAD_PALETTE",
      mask,
      unionFlags(
        ([] as string[]).concat(type, commit ? ".PALETTE_COMMIT" : []),
      ),
    );
  };

  _paletteDMG = (
    color1: number,
    color2: number,
    color3: number,
    color4: number,
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
    b4: number,
  ) => {
    this._addCmd(".CGB_PAL", r1, g1, b1, r2, g2, b2, r3, g3, b3, r4, g4, b4);
  };

  _replaceTile = (
    addr: ScriptBuilderStackVariable,
    symbol: string,
    tileIndex: ScriptBuilderStackVariable,
    numTiles: number | string,
  ) => {
    this._addCmd(
      "VM_REPLACE_TILE",
      addr,
      `___bank_${symbol}`,
      `_${symbol}`,
      tileIndex,
      numTiles,
    );
  };

  _replaceTileXY = (
    x: number,
    y: number,
    symbol: string,
    tileIndex: ScriptBuilderStackVariable,
  ) => {
    this._addCmd(
      "VM_REPLACE_TILE_XY",
      x,
      y,
      `___bank_${symbol}`,
      `_${symbol}`,
      tileIndex,
    );
  };

  _getTileXY = (
    addr: ScriptBuilderStackVariable,
    x: ScriptBuilderStackVariable,
    y: ScriptBuilderStackVariable,
  ) => {
    this._addCmd("VM_GET_TILE_XY", addr, x, y);
  };

  _callFar = (symbol: string, argsLen: number) => {
    this._addCmd("VM_CALL_FAR", `___bank_${symbol}`, `_${symbol}`);
    if (argsLen > 0) {
      // Args are popped by called script with ret_far_n
      this.stackPtr -= argsLen;
    }
  };

  _callNative = (symbol: string, bank?: number) => {
    this._addCmd("VM_CALL_NATIVE", bank ? bank : `b_${symbol}`, `_${symbol}`);
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

  _isFunctionArg = (x: unknown): x is ScriptBuilderFunctionArg => {
    return (
      isObject(x) && typeof x["type"] === "string" && x.type === "argument"
    );
  };

  _isIndirectVariable = (x: ScriptBuilderVariable): boolean => {
    return this._isFunctionArg(x) && x.indirect;
  };

  _declareLocal = (
    symbol: string,
    size: number,
    isTemporary = false,
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
        addr: 0,
        firstUse: this.output.length,
        lastUse: this.output.length,
      };
    } else {
      this.localsLookup[asmSymbol].size = Math.max(
        size,
        this.localsLookup[asmSymbol].size,
      );
      this.localsLookup[asmSymbol].firstUse = Math.min(
        this.output.length,
        this.localsLookup[asmSymbol].firstUse,
      );
      this.localsLookup[asmSymbol].lastUse = Math.max(
        this.output.length,
        this.localsLookup[asmSymbol].lastUse,
      );
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
    offset = 0,
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
    offset = 0,
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
              localSymbol.firstUse,
            );
            packedSymbol.lastUse = Math.max(
              packedSymbol.lastUse,
              localSymbol.lastUse,
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
    this.localsLookup = packedSymbols.reduce(
      (memo, packedSymbol) => {
        packedAddr += packedSymbol.size;
        for (const localSymbol of packedSymbol.symbols) {
          memo[localSymbol.symbol] = {
            ...localSymbol,
            size: packedSymbol.size,
            addr: packedAddr,
          };
        }
        return memo;
      },
      {} as Record<string, ScriptBuilderLocalSymbol>,
    );

    return this._calcLocalsSize();
  };

  _calcLocalsSize = () => {
    const reserveMem = Object.values(this.localsLookup).reduce(
      (memo, local) => {
        return Math.max(memo, local.addr);
      },
      0,
    );
    return reserveMem;
  };

  _reserve = (size: number) => {
    this._addCmd("VM_RESERVE", size);
  };

  /* */

  getActorIndex = (id: string): number => {
    const { entity, entityType, scene } = this.options;

    // Actor == player
    if (id === "player" || (id === "$self$" && entityType !== "actor")) {
      return 0;
    }

    // Actor == Self
    if (id === "$self$" && entity) {
      return getActorIndex(entity.id, scene);
    }

    // Find actor in current scene
    const index = getActorIndex(id, scene);

    // Actor id not found but entity was set, fall back to Self
    if (entity && index === 0) {
      return getActorIndex(entity.id, scene);
    }

    return index;
  };

  setActorId = (addr: string, id: ScriptBuilderVariable) => {
    const actorId = this.resolveActorId(id);
    switch (actorId.type) {
      case "number": {
        this.actorIndex = actorId.value;
        this._setConst(addr, this.actorIndex);
        break;
      }
      case "reference": {
        this.actorIndex = -1;
        this._set(addr, actorId.symbol);
        break;
      }
      default: {
        assertUnreachable(actorId);
      }
    }
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
    const arg = this._resolveVariableRef(variable);
    if (this._isFunctionArg(arg)) {
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
      name = namedVariable?.name || globalVariableDefaultName(num);
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

  getConstantSymbol = (id: string): string => {
    if (id.startsWith("engine::")) {
      return id.replace(/^engine::/, "");
    }
    const { constantsLookup } = this.options;
    const constant = constantsLookup[id];
    if (!constant) {
      return "0";
    }
    return constant.symbol.toLocaleUpperCase();
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
    let newName = name;
    while (true) {
      newName =
        counter === 0
          ? `${newName}_0`
          : `${newName.replace(/_[0-9]+$/, "")}_${counter}`;
      if (!symbols[newName]) {
        if (register) {
          symbols[newName] = newName;
        }
        return newName;
      }
      counter++;
    }
  };

  getProjectileIndex = (
    spriteSheetId: string,
    spriteStateId: string,
    speed: number,
    animSpeed: number,
    loopAnim: boolean,
    lifeTime: number,
    initialOffset: number,
    destroyOnHit: boolean,
    collisionGroup: string,
    collisionMask: string[],
  ) => {
    const { scene } = this.options;
    const projectileHash = toProjectileHash({
      spriteSheetId,
      spriteStateId,
      speed,
      animSpeed,
      loopAnim,
      lifeTime,
      initialOffset,
      destroyOnHit,
      collisionGroup,
      collisionMask,
    });
    const projectileHashes = scene.projectiles.map((p) => p.hash);
    const projectileIndex = projectileHashes.indexOf(projectileHash);
    return projectileIndex;
  };

  getGlobalProjectile = (
    spriteSheetId: string,
    spriteStateId: string,
    speed: number,
    animSpeed: number,
    loopAnim: boolean,
    lifeTime: number,
    initialOffset: number,
    destroyOnHit: boolean,
    collisionGroup: string,
    collisionMask: string[],
  ): { symbol: string; index: number } => {
    const projectileHash = toProjectileHash({
      spriteSheetId,
      spriteStateId,
      speed,
      animSpeed,
      loopAnim,
      lifeTime,
      initialOffset,
      destroyOnHit,
      collisionGroup,
      collisionMask,
    });

    // Check cached projectiles first
    for (const projectiles of this.options.globalProjectiles) {
      const index = projectiles.projectiles.findIndex(
        (p) => p.hash === projectileHash,
      );
      if (index > -1) {
        return {
          symbol: projectiles.symbol,
          index,
        };
      }
    }

    // Not found add to existing
    const lastGlobalProjectiles =
      this.options.globalProjectiles[this.options.globalProjectiles.length - 1];

    const projectile: PrecompiledProjectile = {
      hash: projectileHash,
      spriteSheetId,
      spriteStateId,
      speed,
      animSpeed,
      loopAnim,
      lifeTime,
      initialOffset,
      destroyOnHit,
      collisionGroup,
      collisionMask,
    };

    if (lastGlobalProjectiles && lastGlobalProjectiles.projectiles.length < 5) {
      lastGlobalProjectiles.projectiles.push(projectile);
      return {
        symbol: lastGlobalProjectiles.symbol,
        index: lastGlobalProjectiles.projectiles.length - 1,
      };
    }

    // No existing global projectiles array to add to, make a new one

    const symbol = this._getAvailableSymbol(
      `global_projectiles_${this.options.globalProjectiles.length}`,
    );

    this.options.globalProjectiles.push({
      symbol,
      projectiles: [projectile],
    });

    return { symbol, index: 0 };
  };

  // --------------------------------------------------------------------------
  // Sub scripts

  compileEvents = (path: ScriptEvent[]) => {
    const { compileEvents } = this.options;
    compileEvents(this, path);
  };

  _compilePath = (path: ScriptEvent[] | ScriptBuilderPathFunction = []) => {
    const { compileEvents } = this.options;
    if (typeof path === "function") {
      path();
    } else if (path) {
      compileEvents(this, path);
    }
  };

  _deregisterSymbol = (symbol: string) => {
    const { symbols } = this.options;
    delete symbols[symbol];
  };

  _contextHash = () => {
    const { scene, entityType, entity, context } = this.options;
    return `${scene.hash}_${context}_${entityType}_${entity?.id ?? ""}`;
  };

  _compileSubScript = (
    type: "input" | "timer" | "music" | "thread" | "custom",
    script: ScriptEvent[],
    inputSymbol?: string,
    options?: Partial<ScriptBuilderOptions>,
  ) => {
    let context: ScriptEditorCtxType = this.options.context;

    // Set script context to calculate default value for missing vars
    if (type === "custom") {
      context = "script";
    } else if (context === "script") {
      context = "global";
    }

    // Generate a quick hash of the script for this scene to see if
    // it's already been compiled - just reuse if possible
    const preBuildHash = `${generateScriptHash(
      script,
    )}_${this._contextHash()}_${type === "custom" ? inputSymbol : ""}`;

    if (this.options.additionalScriptsCache[preBuildHash]) {
      return this.options.additionalScriptsCache[preBuildHash];
    }

    const symbol = this._getAvailableSymbol(
      inputSymbol ? inputSymbol : `script_${type}`,
    );

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
      },
    );

    // Check if identical to any already compiled scripts
    const scriptHash = `${gbvmScriptChecksum(
      inputSymbol
        ? compiledSubScript.replaceAll(inputSymbol, "SCRIPT")
        : compiledSubScript,
    )}_${type === "custom" ? inputSymbol : ""}`;

    // If this script is identical to an already generated script
    // just reuse the existing symbol rather than writing a duplicate file
    if (this.options.additionalScriptsCache[scriptHash]) {
      return this.options.additionalScriptsCache[scriptHash];
    }

    this.options.additionalScripts[symbol] = {
      symbol,
      compiledScript: compiledSubScript,
    };

    // Store generate symbols in cache
    this.options.additionalScriptsCache[scriptHash] = symbol;
    this.options.additionalScriptsCache[preBuildHash] = symbol;

    return symbol;
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

  readonly toScriptString = (name: string, lock: boolean) => {
    this._assertStackNeutral();

    const reserveMem = this._calcLocalsSize();

    const scriptArgVars = Array.from(this.options.argLookup.variable.values())
      .reverse()
      .map((arg, index) =>
        arg ? `\n${arg.symbol} = -${3 + reserveMem + index}` : "",
      )
      .join("");

    const scriptArgActors = Array.from(this.options.argLookup.actor.values())
      .reverse()
      .map((arg, index) =>
        arg
          ? `\n${arg.symbol} = -${
              3 + reserveMem + index + this.options.argLookup.variable.size
            }`
          : "",
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

export default ScriptBuilderBase;
