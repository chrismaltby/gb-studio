import { DistanceUnitType } from "shared/lib/entities/entitiesTypes";
import {
  ScriptBuilderComparisonOperator,
  ScriptBuilderFunctionArg,
  ScriptBuilderMoveType,
  ScriptBuilderPathFunction,
  ScriptBuilderStackVariable,
  ScriptBuilderUnionValue,
  ScriptBuilderVariable,
} from "lib/compiler/scriptBuilder/types";
import {
  pxToSubpx,
  subpxShiftForUnits,
  tileToSubpx,
  unitsValueToSubpx,
} from "shared/lib/helpers/subpixels";
import {
  fadeSpeeds,
  toASMDir,
  toASMMoveFlags,
  unionFlags,
} from "lib/compiler/scriptBuilder/helpers";
import type ScriptBuilder from "lib/compiler/scriptBuilder/scriptBuilder";
import { ActorDirection, ScriptEvent } from "shared/lib/resources/types";
import { is16BitCType } from "shared/lib/engineFields/engineFieldToCType";
import l10n from "shared/lib/lang/l10n";

export type DeprecatedAPI = ReturnType<typeof createDeprecatedMethods>;

export function createDeprecatedMethods(sb: ScriptBuilder) {
  const _deprecated = ({
    oldFn,
    newFn,
    msg,
  }: {
    oldFn: string;
    newFn?: string;
    msg?: string;
  }) => {
    sb.options.warnings(
      l10n("WARNING_FN_DEPRECATED", { name: oldFn }) +
        (newFn
          ? " " + l10n("WARNING_FN_DEPRECATED_REPLACEMENT", { name: newFn })
          : "") +
        `${msg ? ` ${msg}` : ""} (${sb.eventCommand})`,
    );
  };

  const variableSetToProperty = (
    variable: string,
    property: string | { value: ScriptBuilderVariable; property: string },
  ) => {
    _deprecated({
      oldFn: "variableSetToProperty",
      newFn: "variableSetToScriptValue",
    });
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

    sb.actorSetById(actorValue);
    if (propertyValue === "xpos") {
      sb.actorGetPositionX(variable);
    } else if (propertyValue === "ypos") {
      sb.actorGetPositionY(variable);
    } else if (propertyValue === "pxpos") {
      sb.actorGetPositionX(variable, "pixels");
    } else if (propertyValue === "pypos") {
      sb.actorGetPositionY(variable, "pixels");
    } else if (propertyValue === "direction") {
      sb.actorGetDirection(variable);
    } else if (propertyValue === "frame") {
      sb.actorGetAnimFrame(variable);
    } else {
      throw new Error(`Unsupported property type "${propertyValue}"`);
    }
  };

  const variableSetToUnionValue = (
    variable: string,
    unionValue: ScriptBuilderUnionValue,
  ) => {
    _deprecated({
      oldFn: "variableSetToUnionValue",
      newFn: "variableSetToScriptValue",
    });
    if (unionValue.type === "number") {
      sb.variableSetToValue(variable, unionValue.value);
      return variable;
    }
    if (unionValue.type === "direction") {
      sb.variableSetToValue(variable, toASMDir(unionValue.value));
      return variable;
    }
    if (unionValue.type === "property") {
      variableSetToProperty(variable, unionValue.value);
      return variable;
    }
    if (unionValue.type === "variable") {
      sb.variableCopy(variable, unionValue.value);
      return variable;
    }
    throw new Error(`Union type "${unionValue}" unknown.`);
  };

  const localVariableFromUnion = (
    unionValue: ScriptBuilderUnionValue,
  ): string | ScriptBuilderFunctionArg => {
    _deprecated({
      oldFn: "localVariableFromUnion",
    });
    if (!unionValue) {
      // Guard undefined values
      return localVariableFromUnion({ type: "number", value: 0 });
    }
    if (unionValue.type === "variable") {
      return unionValue.value;
    }
    const local = sb._declareLocal("union_val", 1, true);
    variableSetToUnionValue(sb._localRef(local, 0), unionValue);
    return local;
  };

  return {
    actorMoveTo: (
      x: number,
      y: number,
      useCollisions: boolean,
      moveType: ScriptBuilderMoveType = "horizontal",
      units: DistanceUnitType = "tiles",
    ) => {
      _deprecated({
        oldFn: "actorMoveTo",
        newFn: "actorMoveToScriptValues",
      });

      const actorRef = sb._declareLocal("actor", 4);
      const stackPtr = sb.stackPtr;

      sb._addComment("Actor Move To");
      sb._setConst(sb._localRef(actorRef, 1), unitsValueToSubpx(x, units));
      sb._setConst(sb._localRef(actorRef, 2), unitsValueToSubpx(y, units));
      sb._setConst(
        sb._localRef(actorRef, 3),
        toASMMoveFlags(moveType, useCollisions),
      );
      sb._actorMoveTo(actorRef);
      sb._assertStackNeutral(stackPtr);
      sb._addNL();
    },

    actorMoveToVariables: (
      variableX: string,
      variableY: string,
      useCollisions: boolean,
      moveType: ScriptBuilderMoveType = "horizontal",
      units: DistanceUnitType = "tiles",
    ) => {
      _deprecated({
        oldFn: "actorMoveToVariables",
        newFn: "actorMoveToScriptValues",
      });
      const actorRef = sb._declareLocal("actor", 4);
      const stackPtr = sb.stackPtr;
      sb._addComment("Actor Move To Variables");

      sb._rpn() //
        .refVariable(variableX)
        .int16(subpxShiftForUnits(units))
        .operator(".SHL")
        .refSet(sb._localRef(actorRef, 1))
        .refVariable(variableY)
        .int16(subpxShiftForUnits(units))
        .operator(".SHL")
        .refSet(sb._localRef(actorRef, 2))
        .stop();

      sb._setConst(
        sb._localRef(actorRef, 3),
        toASMMoveFlags(moveType, useCollisions),
      );
      sb._actorMoveTo(actorRef);
      sb._assertStackNeutral(stackPtr);
      sb._addNL();
    },

    actorMoveRelative: (
      x = 0,
      y = 0,
      useCollisions = false,
      moveType: ScriptBuilderMoveType = "horizontal",
      units: DistanceUnitType = "tiles",
    ) => {
      _deprecated({
        oldFn: "actorMoveRelative",
        newFn: "actorMoveRelativeByScriptValues",
      });
      const actorRef = sb._declareLocal("actor", 4);
      const stackPtr = sb.stackPtr;
      sb._addComment("Actor Move Relative");
      sb._actorGetPosition(actorRef);
      sb._rpn() //
        .ref(sb._localRef(actorRef, 1))
        .int16(unitsValueToSubpx(x, units))
        .operator(".ADD")
        .int16(0)
        .operator(".MAX")
        .refSet(sb._localRef(actorRef, 1))
        .ref(sb._localRef(actorRef, 2))
        .int16(unitsValueToSubpx(y, units))
        .operator(".ADD")
        .int16(0)
        .operator(".MAX")
        .refSet(sb._localRef(actorRef, 2))
        .stop();

      sb._setConst(
        sb._localRef(actorRef, 3),
        toASMMoveFlags(moveType, useCollisions),
      );
      sb._actorMoveTo(actorRef);
      sb._assertStackNeutral(stackPtr);
      sb._addNL();
    },

    actorSetPosition: (x = 0, y = 0, units: DistanceUnitType = "tiles") => {
      _deprecated({
        oldFn: "actorSetPosition",
        newFn: "actorSetPositionToScriptValues",
      });
      const actorRef = sb._declareLocal("actor", 4);
      sb._addComment("Actor Set Position");

      sb._setConst(sb._localRef(actorRef, 1), unitsValueToSubpx(x, units));
      sb._setConst(sb._localRef(actorRef, 2), unitsValueToSubpx(y, units));
      sb._actorSetPosition(actorRef);

      sb._addNL();
    },

    actorSetPositionToVariables: (
      variableX: string,
      variableY: string,
      units: DistanceUnitType = "tiles",
    ) => {
      _deprecated({
        oldFn: "actorSetPositionToVariables",
        newFn: "actorSetPositionToScriptValues",
      });
      const actorRef = sb._declareLocal("actor", 4);
      const stackPtr = sb.stackPtr;
      sb._addComment("Actor Set Position To Variables");

      sb._rpn() //
        .refVariable(variableX)
        .int16(subpxShiftForUnits(units))
        .operator(".SHL")
        .refSet(sb._localRef(actorRef, 1))
        .refVariable(variableY)
        .int16(subpxShiftForUnits(units))
        .operator(".SHL")
        .refSet(sb._localRef(actorRef, 2))
        .stop();

      sb._actorSetPosition(actorRef);
      sb._assertStackNeutral(stackPtr);
      sb._addNL();
    },

    actorSetPositionRelative: (
      x = 0,
      y = 0,
      units: DistanceUnitType = "tiles",
    ) => {
      _deprecated({
        oldFn: "actorSetPositionRelative",
        newFn: "actorSetPositionRelativeByScriptValues",
      });
      const actorRef = sb._declareLocal("actor", 4);
      sb._addComment("Actor Set Position Relative");
      sb._actorGetPosition(actorRef);
      sb._rpn() //
        .ref(sb._localRef(actorRef, 1))
        .int16(unitsValueToSubpx(x, units))
        .operator(".ADD")
        .int16(0)
        .operator(".MAX")
        .refSet(sb._localRef(actorRef, 1))
        .ref(sb._localRef(actorRef, 2))
        .int16(unitsValueToSubpx(y, units))
        .operator(".ADD")
        .int16(0)
        .operator(".MAX")
        .refSet(sb._localRef(actorRef, 2))
        .stop();

      sb._actorSetPosition(actorRef);
      sb._addNL();
    },

    actorSetBounds: (
      left: number,
      right: number,
      top: number,
      bottom: number,
    ) => {
      _deprecated({
        oldFn: "actorSetBounds",
        newFn: "actorSetBoundToScriptValues",
      });
      const stackPtr = sb.stackPtr;
      const actorRef = sb._declareLocal("actor", 5);
      sb._addComment("Actor Set Bounds");

      const rpn = sb._rpn();

      sb._addComment(`-- Calculate values`);

      // Left Value
      rpn.int16(pxToSubpx(left));
      rpn.refSet(sb._localRef(actorRef, 1));

      // Right Value
      rpn.int16(pxToSubpx(right));
      rpn.refSet(sb._localRef(actorRef, 2));

      // Top Value
      rpn.int16(pxToSubpx(top));
      rpn.refSet(sb._localRef(actorRef, 3));

      // Bottom Value
      rpn.int16(pxToSubpx(bottom));
      rpn.refSet(sb._localRef(actorRef, 4));

      rpn.stop();
      sb._addComment(`-- Set Bounds`);
      sb._actorSetBounds(actorRef);
      sb._assertStackNeutral(stackPtr);
      sb._addNL();
    },

    actorSetDirection: (direction: ActorDirection) => {
      _deprecated({
        oldFn: "actorSetDirection",
        newFn: "actorSetDirectionToScriptValue",
      });
      const actorRef = sb._declareLocal("actor", 4);
      sb._addComment("Actor Set Direction");
      sb._actorSetDirection(actorRef, toASMDir(direction));
      sb._addNL();
    },

    actorSetDirectionToVariable: (variable: string) => {
      _deprecated({
        oldFn: "actorSetDirectionToVariable",
        newFn: "actorSetDirectionToScriptValue",
      });
      const actorRef = sb._declareLocal("actor", 4);
      const leftLabel = sb.getNextLabel();
      const rightLabel = sb.getNextLabel();
      const upLabel = sb.getNextLabel();
      const endLabel = sb.getNextLabel();

      sb._addComment("Actor Set Direction To Variable");
      sb._ifVariableConst(".EQ", variable, ".DIR_LEFT", leftLabel, 0);
      sb._ifVariableConst(".EQ", variable, ".DIR_RIGHT", rightLabel, 0);
      sb._ifVariableConst(".EQ", variable, ".DIR_UP", upLabel, 0);
      // Down
      sb._actorSetDirection(actorRef, ".DIR_DOWN");
      sb._jump(endLabel);
      // Left
      sb._label(leftLabel);
      sb._actorSetDirection(actorRef, ".DIR_LEFT");
      sb._jump(endLabel);
      // Right
      sb._label(rightLabel);
      sb._actorSetDirection(actorRef, ".DIR_RIGHT");
      sb._jump(endLabel);
      // Up
      sb._label(upLabel);
      sb._actorSetDirection(actorRef, ".DIR_UP");

      sb._label(endLabel);
      sb._addNL();
    },

    actorSetFrame: (frame = 0) => {
      _deprecated({
        oldFn: "actorSetFrame",
        newFn: "actorSetFrameToScriptValue",
      });
      const actorRef = sb._declareLocal("actor", 4);
      sb._addComment("Actor Set Animation Frame");
      sb._setConst(sb._localRef(actorRef, 1), frame);
      sb._actorSetAnimFrame(actorRef);
      sb._addNL();
    },

    actorSetFrameToVariable: (variable: string) => {
      _deprecated({
        oldFn: "actorSetFrameToVariable",
        newFn: "actorSetFrameToScriptValue",
      });
      const actorRef = sb._declareLocal("actor", 4);
      sb._addComment("Actor Set Animation Frame To Variable");
      sb._setToVariable(sb._localRef(actorRef, 1), variable);
      sb._actorSetAnimFrame(actorRef);
      sb._addNL();
    },

    actorSetAnimate: (_enabled: boolean) => {
      _deprecated({
        oldFn: "actorSetAnimate",
      });
      console.error("actorSetAnimate not implemented");
    },

    wait: (frames: number) => {
      _deprecated({
        oldFn: "wait",
        newFn: "waitScriptValue",
      });
      sb._addComment(`Wait ${frames} Frames`);
      if (frames < 5) {
        for (let i = 0; i < frames; i++) {
          sb._idle();
        }
      } else {
        const waitArgsRef = sb._declareLocal("wait_args", 1, true);
        const stackPtr = sb.stackPtr;
        sb._setConst(waitArgsRef, Math.round(frames));
        sb._invoke("wait_frames", 0, waitArgsRef);
        sb._assertStackNeutral(stackPtr);
      }
      sb._addNL();
    },

    nextFrameAwait: () => {
      _deprecated({
        oldFn: "nextFrameAwait",
        newFn: "idle",
      });
      sb._idle();
    },

    cameraMoveTo: (
      x = 0,
      y = 0,
      speed = 0,
      units: DistanceUnitType = "tiles",
    ) => {
      _deprecated({
        oldFn: "cameraMoveTo",
        newFn: "cameraMoveToScriptValues",
      });
      const cameraMoveArgsRef = sb._declareLocal("camera_move_args", 2, true);
      sb._addComment("Camera Move To");
      const xOffsetSubpx = pxToSubpx(80);
      const yOffsetSubpx = pxToSubpx(72);

      sb._setConst(
        cameraMoveArgsRef,
        xOffsetSubpx + unitsValueToSubpx(x, units),
      );
      sb._setConst(
        sb._localRef(cameraMoveArgsRef, 1),
        yOffsetSubpx + unitsValueToSubpx(y, units),
      );
      if (speed === 0) {
        sb._cameraSetPos(cameraMoveArgsRef);
      } else {
        sb._cameraMoveTo(cameraMoveArgsRef, pxToSubpx(speed), ".CAMERA_UNLOCK");
      }
      sb._addNL();
    },

    cameraMoveToVariables: (
      variableX: string,
      variableY: string,
      speed = 0,
      units: DistanceUnitType = "tiles",
    ) => {
      _deprecated({
        oldFn: "cameraMoveToVariables",
        newFn: "cameraMoveToScriptValues",
      });

      sb._addComment("Camera Move To Variables");

      sb._rpn() //
        .refVariable(variableX)
        .int16(subpxShiftForUnits(units))
        .operator(".SHL")
        .int16(pxToSubpx(80))
        .operator(".ADD")
        .refVariable(variableY)
        .int16(subpxShiftForUnits(units))
        .operator(".SHL")
        .int16(pxToSubpx(72))
        .operator(".ADD")
        .stop();

      if (speed === 0) {
        sb._cameraSetPos(".ARG1");
      } else {
        sb._cameraMoveTo(".ARG1", pxToSubpx(speed), ".CAMERA_UNLOCK");
      }
      sb._stackPop(2);
    },

    cameraShake: (
      shouldShakeX: boolean,
      shouldShakeY: boolean,
      frames: number,
      magnitude: number,
    ) => {
      _deprecated({
        oldFn: "cameraShake",
        newFn: "cameraShakeScriptValue",
      });
      const cameraShakeArgsRef = sb._declareLocal("camera_shake_args", 3, true);
      sb._addComment("Camera Shake");
      sb._setConst(cameraShakeArgsRef, frames);
      sb._setConst(
        sb._localRef(cameraShakeArgsRef, 1),
        unionFlags(
          ([] as string[]).concat(
            shouldShakeX ? ".CAMERA_SHAKE_X" : [],
            shouldShakeY ? ".CAMERA_SHAKE_Y" : [],
          ),
        ),
      );
      sb._setConst(sb._localRef(cameraShakeArgsRef, 2), magnitude);
      sb._invoke("camera_shake_frames", 0, cameraShakeArgsRef);
      sb._addNL();
    },

    cameraShakeVariables: (
      shouldShakeX: boolean,
      shouldShakeY: boolean,
      frames: number,
      magnitude: string,
    ) => {
      _deprecated({
        oldFn: "cameraShakeVariables",
        newFn: "cameraShakeScriptValue",
      });
      const cameraShakeArgsRef = sb._declareLocal("camera_shake_args", 3, true);
      sb._addComment("Camera Shake");
      sb._setConst(cameraShakeArgsRef, frames);
      sb._setConst(
        sb._localRef(cameraShakeArgsRef, 1),
        unionFlags(
          ([] as string[]).concat(
            shouldShakeX ? ".CAMERA_SHAKE_X" : [],
            shouldShakeY ? ".CAMERA_SHAKE_Y" : [],
          ),
        ),
      );

      sb._rpn() //
        .refVariable(magnitude)
        .refSet(sb._localRef(cameraShakeArgsRef, 2))
        .stop();

      sb._invoke("camera_shake_frames", 0, cameraShakeArgsRef);
      sb._addNL();
    },

    sceneSwitch: (
      sceneId: string,
      x = 0,
      y = 0,
      direction: ActorDirection = "down",
      fadeSpeed = 2,
    ) => {
      _deprecated({
        oldFn: "sceneSwitch",
        newFn: "sceneSwitchUsingScriptValues",
      });
      const actorRef = sb._declareLocal("actor", 4);
      sb._addComment("Load Scene");
      const { scenes } = sb.options;
      const scene = scenes.find((s) => s.id === sceneId);
      if (scene) {
        if (fadeSpeed > 0) {
          sb._setConstMemInt8(
            "fade_frames_per_step",
            fadeSpeeds[fadeSpeed] ?? 0x3,
          );
          sb._fadeOut(true);
        }
        sb._setConst(actorRef, 0);
        sb._setConst(sb._localRef(actorRef, 1), tileToSubpx(x));
        sb._setConst(sb._localRef(actorRef, 2), tileToSubpx(y));
        sb._actorSetPosition(actorRef);
        const asmDir = toASMDir(direction);
        if (asmDir) {
          sb._actorSetDirection(actorRef, asmDir);
        }
        sb._setConstMemInt8("camera_settings", ".CAMERA_LOCK");
        sb._raiseException("EXCEPTION_CHANGE_SCENE", 3);
        sb._importFarPtrData(scene.symbol);
        sb._addNL();
      }
    },

    variableSetToTrue: (variable: string) => {
      _deprecated({
        oldFn: "variableSetToTrue",
        newFn: "variableSetToScriptValue",
      });
      sb._addComment("Variable Set To True");
      sb._setVariableConst(variable, 1);
      sb._addNL();
    },

    variableSetToFalse: (variable: string) => {
      _deprecated({
        oldFn: "variableSetToFalse",
        newFn: "variableSetToScriptValue",
      });
      sb._addComment("Variable Set To False");
      sb._setVariableConst(variable, 0);
      sb._addNL();
    },

    variablesAdd: (
      setVariable: string,
      otherVariable: string,
      clamp: boolean,
    ) => {
      _deprecated({
        oldFn: "variablesAdd",
        newFn: "variableSetToScriptValue",
      });
      sb.variablesOperation(setVariable, ".ADD", otherVariable, clamp);
    },

    variablesSub: (
      setVariable: string,
      otherVariable: string,
      clamp: boolean,
    ) => {
      _deprecated({
        oldFn: "variablesSub",
        newFn: "variableSetToScriptValue",
      });
      sb.variablesOperation(setVariable, ".SUB", otherVariable, clamp);
    },

    variablesMul: (setVariable: string, otherVariable: string) => {
      _deprecated({
        oldFn: "variablesMul",
        newFn: "variableSetToScriptValue",
      });
      sb.variablesOperation(setVariable, ".MUL", otherVariable, false);
    },

    variablesDiv: (setVariable: string, otherVariable: string) => {
      _deprecated({
        oldFn: "variablesDiv",
        newFn: "variableSetToScriptValue",
      });
      sb.variablesOperation(setVariable, ".DIV", otherVariable, false);
    },

    variablesMod: (setVariable: string, otherVariable: string) => {
      _deprecated({
        oldFn: "variablesMod",
        newFn: "variableSetToScriptValue",
      });
      sb.variablesOperation(setVariable, ".MOD", otherVariable, false);
    },

    variableSetToProperty,

    variableSetToUnionValue,

    variableFromUnion: (
      unionValue: ScriptBuilderUnionValue,
      defaultVariable: string,
    ) => {
      _deprecated({
        oldFn: "variableFromUnion",
        newFn: "variableSetToScriptValue",
      });
      if (unionValue.type === "variable") {
        return unionValue.value;
      }
      variableSetToUnionValue(defaultVariable, unionValue);
      return defaultVariable;
    },

    localVariableFromUnion,

    temporaryEntityVariable: (index: number) => {
      _deprecated({
        oldFn: "temporaryEntityVariable",
      });
      return `T${index}`;
    },

    engineFieldSetToValue: (
      key: string,
      value: ScriptBuilderStackVariable | boolean,
    ) => {
      _deprecated({
        oldFn: "engineFieldSetToValue",
        newFn: "engineFieldSetToScriptValue",
      });
      const { engineFields } = sb.options;
      const engineField = engineFields[key];
      if (engineField !== undefined && engineField.key) {
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
        sb._addComment(`Engine Field Set To Value`);
        if (is16BitCType(cType)) {
          sb._setConstMemInt16(key, numberValue);
        } else {
          sb._setConstMemInt8(key, numberValue);
        }
        sb._addNL();
      }
    },

    engineFieldSetToVariable: (key: string, variable: string) => {
      _deprecated({
        oldFn: "engineFieldSetToVariable",
        newFn: "engineFieldSetToScriptValue",
      });
      const { engineFields } = sb.options;
      const engineField = engineFields[key];
      if (engineField !== undefined && engineField.key) {
        const cType = engineField.cType;
        sb._addComment(`Engine Field Set To Variable`);
        if (is16BitCType(cType)) {
          sb._setMemInt16ToVariable(key, variable);
        } else {
          sb._setMemInt8ToVariable(key, variable);
        }
        sb._addNL();
      }
    },

    replaceTileXY: (
      x: number,
      y: number,
      tilesetId: string,
      tileIndex: number,
      tileSize: "8px" | "16px",
    ) => {
      _deprecated({
        oldFn: "replaceTileXY",
        newFn: "replaceTileXYScriptValue",
      });
      const { tilesets } = sb.options;
      const tileset = tilesets.find((t) => t.id === tilesetId) ?? tilesets[0];
      if (!tileset) {
        return;
      }

      sb._addComment(`Replace Tile XY`);
      sb._stackPushConst(tileIndex);
      if (tileSize === "16px") {
        // Top left tile
        sb._replaceTileXY(x, y, tileset.symbol, ".ARG0");
        // Top right tile
        sb._rpn() //
          .ref(".ARG0")
          .int8(1)
          .operator(".ADD")
          .refSet(".ARG0")
          .stop();
        sb._replaceTileXY(x + 1, y, tileset.symbol, ".ARG0");
        // Bottom right tile
        sb._rpn() //
          .ref(".ARG0")
          .int8(tileset.width)
          .operator(".ADD")
          .refSet(".ARG0")
          .stop();
        sb._replaceTileXY(x + 1, y + 1, tileset.symbol, ".ARG0");
        // Bottom left tile
        sb._rpn() //
          .ref(".ARG0")
          .int8(1)
          .operator(".SUB")
          .refSet(".ARG0")
          .stop();
        sb._replaceTileXY(x, y + 1, tileset.symbol, ".ARG0");
      } else {
        sb._replaceTileXY(x, y, tileset.symbol, ".ARG0");
      }
      sb._stackPop(1);
    },

    replaceTileXYVariable: (
      x: number,
      y: number,
      tilesetId: string,
      tileIndexVariable: string,
      tileSize: "8px" | "16px",
    ) => {
      _deprecated({
        oldFn: "replaceTileXYVariable",
        newFn: "replaceTileXYScriptValue",
      });
      const { tilesets } = sb.options;
      const tileset = tilesets.find((t) => t.id === tilesetId) ?? tilesets[0];
      if (!tileset) {
        return;
      }

      const variableAlias = sb.getVariableAlias(tileIndexVariable);

      sb._addComment(`Replace Tile XY`);
      if (sb._isIndirectVariable(tileIndexVariable)) {
        sb._stackPushInd(variableAlias);
      } else {
        sb._stackPush(variableAlias);
      }
      if (tileSize === "16px") {
        // Top left tile
        sb._replaceTileXY(x, y, tileset.symbol, ".ARG0");
        // Top right tile
        sb._rpn() //
          .ref(".ARG0")
          .int8(1)
          .operator(".ADD")
          .refSet(".ARG0")
          .stop();
        sb._replaceTileXY(x + 1, y, tileset.symbol, ".ARG0");
        // Bottom right tile
        sb._rpn() //
          .ref(".ARG0")
          .int8(tileset.width)
          .operator(".ADD")
          .refSet(".ARG0")
          .stop();
        sb._replaceTileXY(x + 1, y + 1, tileset.symbol, ".ARG0");
        // Bottom left tile
        sb._rpn() //
          .ref(".ARG0")
          .int8(1)
          .operator(".SUB")
          .refSet(".ARG0")
          .stop();
        sb._replaceTileXY(x, y + 1, tileset.symbol, ".ARG0");
      } else {
        sb._replaceTileXY(x, y, tileset.symbol, ".ARG0");
      }
      sb._stackPop(1);
    },

    ifExpression: (
      expression: string,
      truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
      falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    ) => {
      _deprecated({
        oldFn: "ifExpression",
        newFn: "ifScriptValue",
      });
      const trueLabel = sb.getNextLabel();
      const endLabel = sb.getNextLabel();
      sb._addComment(`If ${sb._expressionToHumanReadable(expression)}`);
      sb._stackPushEvaluatedExpression(expression);
      sb._ifConst(".GT", ".ARG0", 0, trueLabel, 1);
      sb._compilePath(falsePath);
      sb._jump(endLabel);
      sb._label(trueLabel);
      sb._compilePath(truePath);
      sb._label(endLabel);
      sb._addNL();
    },

    whileExpression: (
      expression: string,
      truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    ) => {
      _deprecated({
        oldFn: "whileExpression",
        newFn: "whileScriptValue",
      });
      const loopId = sb.getNextLabel();
      const endLabel = sb.getNextLabel();
      sb._addComment(`While ${sb._expressionToHumanReadable(expression)}`);
      sb._label(loopId);
      sb._stackPushEvaluatedExpression(expression);
      sb._ifConst(".EQ", ".ARG0", 0, endLabel, 1);
      sb._compilePath(truePath);
      sb._jump(loopId);
      sb._label(endLabel);
      sb._addNL();
    },

    ifVariableTrue: (
      variable: string,
      truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
      falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    ) => {
      _deprecated({
        oldFn: "ifVariableTrue",
        newFn: "ifScriptValue",
      });
      const trueLabel = sb.getNextLabel();
      const endLabel = sb.getNextLabel();
      sb._addComment(`If Variable True`);
      sb._ifVariableConst(".GT", variable, 0, trueLabel, 0);
      sb._compilePath(falsePath);
      sb._jump(endLabel);
      sb._label(trueLabel);
      sb._compilePath(truePath);
      sb._label(endLabel);
      sb._addNL();
    },

    ifVariableValue: (
      variable: string,
      operator: ScriptBuilderComparisonOperator,
      value: number,
      truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
      falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    ) => {
      _deprecated({
        oldFn: "ifVariableValue",
        newFn: "ifScriptValue",
      });
      const trueLabel = sb.getNextLabel();
      const endLabel = sb.getNextLabel();
      sb._addComment(`If Variable ${operator} Value`);
      sb._ifVariableConst(operator, variable, value, trueLabel, 0);
      sb._compilePath(falsePath);
      sb._jump(endLabel);
      sb._label(trueLabel);
      sb._compilePath(truePath);
      sb._label(endLabel);
      sb._addNL();
    },

    ifActorAtPosition: (
      x: number,
      y: number,
      truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
      falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
      units: DistanceUnitType = "tiles",
    ) => {
      _deprecated({
        oldFn: "ifActorAtPosition",
        newFn: "ifActorAtPositionByScriptValues",
      });
      const actorRef = sb._declareLocal("actor", 4);
      const falseLabel = sb.getNextLabel();
      const endLabel = sb.getNextLabel();
      sb._addComment(`If Actor At Position`);
      sb._actorGetPosition(actorRef);
      sb._rpn()
        .ref(sb._localRef(actorRef, 1))
        .int16(unitsValueToSubpx(x, units))
        .operator(".EQ")
        .ref(sb._localRef(actorRef, 2))
        .int16(unitsValueToSubpx(y, units))
        .operator(".EQ")
        .operator(".AND")
        .stop();
      sb._ifConst(".EQ", ".ARG0", 0, falseLabel, 1);
      sb._addNL();
      sb._compilePath(truePath);
      sb._jump(endLabel);
      sb._label(falseLabel);
      sb._compilePath(falsePath);
      sb._label(endLabel);
      sb._addNL();
    },

    ifActorDirection: (
      direction: ActorDirection,
      truePath = [],
      falsePath = [],
    ) => {
      _deprecated({
        oldFn: "ifActorDirection",
        newFn: "ifActorDirectionScriptValue",
      });
      const actorRef = sb._declareLocal("actor", 4);
      const actorDirRef = sb._declareLocal("actor_dir", 1, true);
      const falseLabel = sb.getNextLabel();
      const endLabel = sb.getNextLabel();
      sb._addComment(`If Actor Facing Direction`);
      sb._actorGetDirection(actorRef, actorDirRef);
      sb._ifConst(".NE", actorDirRef, toASMDir(direction), falseLabel, 0);
      sb._addNL();
      sb._compilePath(truePath);
      sb._jump(endLabel);
      sb._label(falseLabel);
      sb._compilePath(falsePath);
      sb._label(endLabel);
      sb._addNL();
    },

    ifActorDistanceFromActor: (
      distance: number,
      operator: ScriptBuilderComparisonOperator,
      otherId: string,
      truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
      falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    ) => {
      _deprecated({
        oldFn: "ifActorDistanceFromActor",
        newFn: "ifActorDistanceScriptValueFromActor",
      });
      const actorRef = sb._declareLocal("actor", 4);
      const otherActorRef = sb._declareLocal("other_actor", 3, true);
      const falseLabel = sb.getNextLabel();
      const endLabel = sb.getNextLabel();
      const distanceSquared = distance * distance;
      const subpxShiftBits = subpxShiftForUnits("tiles");

      sb._addComment(`If Actor ${operator} ${distance} tiles from Actor`);
      sb._actorGetPosition(actorRef);
      sb.setActorId(otherActorRef, otherId);
      sb._actorGetPosition(otherActorRef);

      // (x2-x1)^2 + (y2-y1)^2
      sb._rpn() //
        .ref(sb._localRef(otherActorRef, 1)) // X2
        .int16(subpxShiftBits)
        .operator(".SHR")
        .ref(sb._localRef(actorRef, 1)) // X1
        .int16(subpxShiftBits)
        .operator(".SHR")
        .operator(".SUB")
        .ref(sb._localRef(otherActorRef, 1)) // X2
        .int16(subpxShiftBits)
        .operator(".SHR")
        .ref(sb._localRef(actorRef, 1)) // X1
        .int16(subpxShiftBits)
        .operator(".SHR")
        .operator(".SUB")
        .operator(".MUL")
        .ref(sb._localRef(otherActorRef, 2)) // Y2
        .int16(subpxShiftBits)
        .operator(".SHR")
        .ref(sb._localRef(actorRef, 2)) // Y1
        .int16(subpxShiftBits)
        .operator(".SHR")
        .operator(".SUB")
        .ref(sb._localRef(otherActorRef, 2)) // Y2
        .int16(subpxShiftBits)
        .operator(".SHR")
        .ref(sb._localRef(actorRef, 2)) // Y1
        .int16(subpxShiftBits)
        .operator(".SHR")
        .operator(".SUB")
        .operator(".MUL")
        .operator(".ADD")
        .int16(distanceSquared)
        .operator(operator)
        .stop();

      sb._ifConst(".EQ", ".ARG0", 0, falseLabel, 1);
      sb._addNL();
      sb._compilePath(truePath);
      sb._jump(endLabel);
      sb._label(falseLabel);
      sb._compilePath(falsePath);
      sb._label(endLabel);
      sb._addNL();
    },

    ifActorDistanceVariableFromActor: (
      distanceVariable: string,
      operator: ScriptBuilderComparisonOperator,
      otherId: string,
      truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
      falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    ) => {
      _deprecated({
        oldFn: "ifActorDistanceVariableFromActor",
        newFn: "ifActorDistanceScriptValueFromActor",
      });
      const actorRef = sb._declareLocal("actor", 4);
      const otherActorRef = sb._declareLocal("other_actor", 3, true);
      const falseLabel = sb.getNextLabel();
      const endLabel = sb.getNextLabel();
      const subpxShiftBits = subpxShiftForUnits("tiles");

      sb._addComment(
        `If Actor ${operator} ${distanceVariable} tiles from Actor`,
      );
      sb._actorGetPosition(actorRef);
      sb.setActorId(otherActorRef, otherId);
      sb._actorGetPosition(otherActorRef);

      // (x2-x1)^2 + (y2-y1)^2
      sb._rpn() //
        .ref(sb._localRef(otherActorRef, 1)) // X2
        .int16(subpxShiftBits)
        .operator(".SHR")
        .ref(sb._localRef(actorRef, 1)) // X1
        .int16(subpxShiftBits)
        .operator(".SHR")
        .operator(".SUB")
        .ref(sb._localRef(otherActorRef, 1)) // X2
        .int16(subpxShiftBits)
        .operator(".SHR")
        .ref(sb._localRef(actorRef, 1)) // X1
        .int16(subpxShiftBits)
        .operator(".SHR")
        .operator(".SUB")
        .operator(".MUL")
        .ref(sb._localRef(otherActorRef, 2)) // Y2
        .int16(subpxShiftBits)
        .operator(".SHR")
        .ref(sb._localRef(actorRef, 2)) // Y1
        .int16(subpxShiftBits)
        .operator(".SHR")
        .operator(".SUB")
        .ref(sb._localRef(otherActorRef, 2)) // Y2
        .int16(subpxShiftBits)
        .operator(".SHR")
        .ref(sb._localRef(actorRef, 2)) // Y1
        .int16(subpxShiftBits)
        .operator(".SHR")
        .operator(".SUB")
        .operator(".MUL")
        .operator(".ADD")
        .refVariable(distanceVariable)
        .refVariable(distanceVariable)
        .operator(".MUL")
        .operator(operator)
        .stop();

      sb._ifConst(".EQ", ".ARG0", 0, falseLabel, 1);
      sb._addNL();
      sb._compilePath(truePath);
      sb._jump(endLabel);
      sb._label(falseLabel);
      sb._compilePath(falsePath);
      sb._label(endLabel);
      sb._addNL();
    },

    caseVariableValue: (
      variable: string,
      cases: {
        [key: string]: ScriptEvent[] | ScriptBuilderPathFunction;
      } = {},
      falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    ) => {
      _deprecated({
        oldFn: "caseVariableValue",
        newFn: "caseVariableConstValue",
      });
      const caseKeys = Object.keys(cases);
      const numCases = caseKeys.length;

      if (numCases === 0) {
        sb._compilePath(falsePath);
        return;
      }

      const caseLabels = caseKeys.map(() => sb.getNextLabel());
      const endLabel = sb.getNextLabel();

      sb._addComment(`Switch Variable`);
      sb._switchVariable(
        variable,
        caseLabels.map((label, i) => [caseKeys[i], `${label}$`]),
        0,
      );
      sb._addNL();

      // Default
      sb._compilePath(falsePath);
      sb._jump(endLabel);

      // Cases
      for (let i = 0; i < numCases; i++) {
        sb._addComment(`case ${caseKeys[i]}:`);
        sb._label(caseLabels[i]);
        sb._compilePath(cases[caseKeys[i]]);
        sb._jump(endLabel);
      }
      sb._label(endLabel);

      sb._addNL();
    },
  };
}
