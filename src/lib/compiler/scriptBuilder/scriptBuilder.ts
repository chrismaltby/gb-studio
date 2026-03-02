import { inputDec } from "lib/compiler/helpers";
import { decOct, hexDec } from "shared/lib/helpers/8bit";
import { is16BitCType } from "shared/lib/engineFields/engineFieldToCType";
import type {
  DistanceUnitType,
  TimeUnitType,
} from "shared/lib/entities/entitiesTypes";
import {
  LYC_SYNC_VALUE,
  SCENE_MAX_SIZE_PX,
  SCREEN_HEIGHT_PX,
  SCREEN_WIDTH_PX,
} from "consts";
import {
  isPropertyField,
  isVariableField,
  isActorField,
  isScriptValueField,
} from "shared/lib/scripts/scriptDefHelpers";
import {
  isUnionPropertyValue,
  isUnionVariableValue,
  isVariableCustomEvent,
} from "shared/lib/entities/entitiesHelpers";
import type { Reference } from "components/forms/ReferencesSelect";
import { clone } from "lib/helpers/clone";
import type {
  ActorDirection,
  Palette,
  ScriptEvent,
  SpriteModeSetting,
} from "shared/lib/resources/types";
import { mapUncommentedScript } from "shared/lib/scripts/walk";
import {
  ConstScriptValue,
  isScriptValue,
  ScriptValue,
} from "shared/lib/scriptValue/types";
import {
  mapScriptValueLeafNodes,
  optimiseScriptValue,
  precompileScriptValue,
  addScriptValueConst,
  addScriptValueToScriptValue,
  shiftLeftScriptValueConst,
  clampScriptValueConst,
  subScriptValueConst,
} from "shared/lib/scriptValue/helpers";
import { calculateAutoFadeEventId } from "shared/lib/scripts/eventHelpers";
import keyBy from "lodash/keyBy";
import { calculateTextBoxHeight } from "shared/lib/helpers/dialogue";
import {
  pxToSubpx,
  pxToSubpxVel,
  subpxShiftForUnits,
  tileToSubpx,
} from "shared/lib/helpers/subpixels";
import {
  CameraProperty,
  ScriptBuilderAxis,
  ScriptBuilderChoiceFlag,
  ScriptBuilderComparisonOperator,
  ScriptBuilderFunctionArg,
  ScriptBuilderMoveType,
  ScriptBuilderOptions,
  ScriptBuilderOverlayWaitFlag,
  ScriptBuilderPathFunction,
  ScriptBuilderRPNOperation,
  ScriptBuilderStackVariable,
  ScriptBuilderVariable,
  ScriptOutput,
  SFXPriority,
} from "./types";
import {
  andFlags,
  assertUnreachable,
  dirToAngle,
  fadeSpeeds,
  getPalette,
  scriptValueToPixels,
  scriptValueToSubpixels,
  textCodeGoto,
  textCodeSetFont,
  textCodeSetSpeed,
  toASMCameraLock,
  toASMDir,
  toASMMoveFlags,
  toASMSoundPriority,
  toASMSpriteMode,
  unionFlags,
} from "./helpers";
import ScriptBuilderBase from "./scriptBuilderBase";
import { createDeprecatedMethods } from "./deprecatedAPI";

/**
 * ScriptBuilder contains the public API available to event plugins.
 *
 * These functions should remain stable even when GBVM operations are changed,
 * to avoid breaking event plugins. Prefer using functions in this class
 * over lower level operations in ScriptBuilderBase where possible.
 */
class ScriptBuilder extends ScriptBuilderBase {
  constructor(
    output: ScriptOutput,
    options: Partial<ScriptBuilderOptions> &
      Pick<ScriptBuilderOptions, "scene" | "scriptEventHandlers">,
  ) {
    super(output, options);
    Object.assign(this, createDeprecatedMethods(this));
  }

  // --------------------------------------------------------------------------
  // Actors

  actorSetById = (id: ScriptBuilderVariable) => {
    const actorRef = this._declareLocal("actor", 4);
    this.setActorId(actorRef, id);
  };

  actorPushById = (id: ScriptBuilderVariable) => {
    const actorId = this.resolveActorId(id);
    switch (actorId.type) {
      case "number": {
        this.actorIndex = actorId.value;
        this._stackPushConst(this.actorIndex);
        break;
      }
      case "reference": {
        this.actorIndex = -1;
        this._stackPush(actorId.symbol);
        break;
      }
      default: {
        assertUnreachable(actorId);
      }
    }
  };

  actorSetActive = (id: ScriptBuilderVariable) => {
    this._addComment("Actor Set Active");
    this.actorSetById(id);
    this._addNL();
  };

  actorMoveToScriptValues = (
    actorId: string,
    valueX: ScriptValue,
    valueY: ScriptValue,
    collideWith: boolean | Array<"walls" | "actors">,
    moveType: ScriptBuilderMoveType = "horizontal",
    units: DistanceUnitType = "tiles",
    lockDirection: ScriptBuilderAxis[] = [],
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const stackPtr = this.stackPtr;
    this._addComment("Actor Move To");

    const optimisedX = optimiseScriptValue(
      scriptValueToSubpixels(valueX, units),
    );
    const optimisedY = optimiseScriptValue(
      scriptValueToSubpixels(valueY, units),
    );

    const attr = toASMMoveFlags(moveType, collideWith);

    const [rpnOpsX, fetchOpsX] = precompileScriptValue(optimisedX, "x");
    const [rpnOpsY, fetchOpsY] = precompileScriptValue(optimisedY, "y");

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
    this._addComment(`-- Move Actor`);
    this.actorSetById(actorId);
    this._actorMoveToOps(actorRef, attr, moveType, true, true, lockDirection);
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorMoveRelativeByScriptValues = (
    actorId: string,
    valueX: ScriptValue,
    valueY: ScriptValue,
    collideWith: boolean | Array<"walls" | "actors">,
    moveType: ScriptBuilderMoveType = "horizontal",
    units: DistanceUnitType = "tiles",
    lockDirection: ScriptBuilderAxis[] = [],
  ) => {
    const stackPtr = this.stackPtr;
    this._addComment("Actor Move Relative");

    const optimisedX = optimiseScriptValue(valueX);
    const optimisedY = optimiseScriptValue(valueY);

    const moveX = optimisedX.type !== "number" || optimisedX.value !== 0;
    const moveY = optimisedY.type !== "number" || optimisedY.value !== 0;

    if (!moveX && !moveY) {
      return;
    }

    const attr = toASMMoveFlags(moveType, collideWith, true, units);

    const [rpnOpsX, fetchOpsX] = precompileScriptValue(
      optimiseScriptValue(scriptValueToSubpixels(valueX, units)),
      "x",
    );

    const [rpnOpsY, fetchOpsY] = precompileScriptValue(
      optimiseScriptValue(scriptValueToSubpixels(valueY, units)),
      "y",
    );

    const localsLookup2 = this._performFetchOperations([
      ...fetchOpsX,
      ...fetchOpsY,
    ]);

    const rpn = this._rpn();

    this._addComment(`-- Calculate coordinate values`);
    rpn.actorId(actorId); // Actor ID
    this._performValueRPN(rpn, rpnOpsX, localsLookup2); // X Value
    this._performValueRPN(rpn, rpnOpsY, localsLookup2); // Y Value
    rpn.stop();

    this._addComment(`-- Move Actor`);
    this._actorMoveToOps(".ARG2", attr, moveType, moveX, moveY, lockDirection);
    this._stackPop(3);
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorMoveCancel = () => {
    const actorRef = this._declareLocal("actor", 4);
    this._actorMoveCancel(actorRef);
    this._addNL();
  };

  actorSetPositionToScriptValues = (
    actorId: string,
    valueX: ScriptValue,
    valueY: ScriptValue,
    units: DistanceUnitType = "tiles",
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const stackPtr = this.stackPtr;
    this._addComment("Actor Set Position");

    const [rpnOpsX, fetchOpsX] = precompileScriptValue(
      optimiseScriptValue(scriptValueToSubpixels(valueX, units)),
      "x",
    );
    const [rpnOpsY, fetchOpsY] = precompileScriptValue(
      optimiseScriptValue(scriptValueToSubpixels(valueY, units)),
      "y",
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

  actorSetPositionRelativeByScriptValues = (
    actorId: string,
    valueX: ScriptValue,
    valueY: ScriptValue,
    units: DistanceUnitType = "tiles",
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const stackPtr = this.stackPtr;
    this._addComment("Actor Set Position Relative");

    const [rpnOpsX, fetchOpsX] = precompileScriptValue(
      optimiseScriptValue(
        scriptValueToSubpixels(
          addScriptValueToScriptValue(
            {
              type: "property",
              target: actorId,
              property: units === "tiles" ? "xpos" : "pxpos",
            },
            valueX,
          ),
          units,
        ),
      ),
      "x",
    );

    const [rpnOpsY, fetchOpsY] = precompileScriptValue(
      optimiseScriptValue(
        scriptValueToSubpixels(
          addScriptValueToScriptValue(
            {
              type: "property",
              target: actorId,
              property: units === "tiles" ? "ypos" : "pypos",
            },
            valueY,
          ),
          units,
        ),
      ),
      "y",
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
    units: DistanceUnitType = "tiles",
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment(`Store Position In Variables`);
    this._actorGetPosition(actorRef);

    this._rpn() //
      .ref(this._localRef(actorRef, 1))
      .int8(subpxShiftForUnits(units))
      .operator(".SHR")
      .refSetVariable(variableX)
      .ref(this._localRef(actorRef, 2))
      .int8(subpxShiftForUnits(units))
      .operator(".SHR")
      .refSetVariable(variableY)
      .stop();

    this._addNL();
  };

  actorGetPositionX = (
    variableX: string,
    units: DistanceUnitType = "tiles",
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment(`Store X Position In Variable`);
    this._actorGetPosition(actorRef);

    this._rpn() //
      .ref(this._localRef(actorRef, 1))
      .int8(subpxShiftForUnits(units))
      .operator(".SHR")
      .refSetVariable(variableX)
      .stop();

    this._addNL();
  };

  actorGetPositionY = (
    variableY: string,
    units: DistanceUnitType = "tiles",
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment(`Store Y Position In Variable`);
    this._actorGetPosition(actorRef);

    this._rpn() //
      .ref(this._localRef(actorRef, 2))
      .int8(subpxShiftForUnits(units))
      .operator(".SHR")
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

    const offset = tileToSubpx(continueUntilCollision ? 100 : 2);

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

  actorSetBoundToScriptValues = (
    actorId: string,
    valueLeft: ScriptValue,
    valueTop: ScriptValue,
    valueWidth: ScriptValue,
    valueHeight: ScriptValue,
  ) => {
    const stackPtr = this.stackPtr;
    const actorRef = this._declareLocal("actor", 5);
    this._addComment("Actor Set Bounds");

    const [rpnOpsLeft, fetchOpsLeft] = precompileScriptValue(
      optimiseScriptValue(scriptValueToSubpixels(valueLeft, "pixels")),
      "left",
    );
    const [rpnOpsRight, fetchOpsRight] = precompileScriptValue(
      optimiseScriptValue(
        subScriptValueConst(
          scriptValueToSubpixels(
            addScriptValueToScriptValue(valueLeft, valueWidth),
            "pixels",
          ),
          1,
        ),
      ),
      "right",
    );
    const [rpnOpsTop, fetchOpsTop] = precompileScriptValue(
      optimiseScriptValue(scriptValueToSubpixels(valueTop, "pixels")),
      "top",
    );
    const [rpnOpsBottom, fetchOpsBottom] = precompileScriptValue(
      optimiseScriptValue(
        subScriptValueConst(
          scriptValueToSubpixels(
            addScriptValueToScriptValue(valueTop, valueHeight),
            "pixels",
          ),
          1,
        ),
      ),
      "bottom",
    );

    const localsLookup = this._performFetchOperations([
      ...fetchOpsLeft,
      ...fetchOpsRight,
      ...fetchOpsTop,
      ...fetchOpsBottom,
    ]);

    const rpn = this._rpn();

    this._addComment(`-- Calculate bounds values`);

    // Left Value
    this._performValueRPN(rpn, rpnOpsLeft, localsLookup);
    rpn.refSet(this._localRef(actorRef, 1));

    // Right Value
    this._performValueRPN(rpn, rpnOpsRight, localsLookup);
    rpn.refSet(this._localRef(actorRef, 2));

    // Top Value
    this._performValueRPN(rpn, rpnOpsTop, localsLookup);
    rpn.refSet(this._localRef(actorRef, 3));

    // Bottom Value
    this._performValueRPN(rpn, rpnOpsBottom, localsLookup);
    rpn.refSet(this._localRef(actorRef, 4));

    rpn.stop();

    this._addComment(`-- Set Bounds`);
    this.actorSetById(actorId);
    this._actorSetBounds(actorRef);
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  actorSetCollisions = (enabled: boolean) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Set Collisions");
    this._actorSetCollisionsEnabled(actorRef, enabled);
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
      optimiseScriptValue(value),
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

  playerSetSprite = (spriteSheetId: string) => {
    const actorRef = this._declareLocal("actor", 4);
    const { sprites } = this.options;
    const sprite = sprites.find((s) => s.id === spriteSheetId);
    if (sprite) {
      this._addComment("Player Set Spritesheet");
      this._setConst(actorRef, 0);
      this._actorSetSpritesheet(actorRef, sprite.symbol);
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
        [".ACTOR_FLAG_ANIM_NOLOOP"],
      );
      this._addNL();
    }
  };

  actorSetMovementSpeed = (speed = 1) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Set Movement Speed");
    this._actorSetMoveSpeed(actorRef, pxToSubpx(speed));
    this._addNL();
  };

  actorSetAnimationSpeed = (speed = 3) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Set Animation Tick");
    this._actorSetAnimTick(actorRef, speed);
    this._addNL();
  };

  actorSetFrameToScriptValue = (actorId: string, value: ScriptValue) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Set Animation Frame To");
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(value),
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

  actorStopUpdate = () => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Stop Update Script");
    this._actorTerminateUpdate(actorRef);
    this._addNL();
  };

  actorStartUpdate = () => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Actor Start Update Script");
    this._actorStartUpdate(actorRef);
    this._addNL();
  };

  playerBounce = (height: "low" | "medium" | "high") => {
    const { scene } = this.options;
    if (scene.type === "PLATFORM") {
      this._addComment("Player Bounce");
      let value = pxToSubpxVel(-0x400);
      if (height === "low") {
        value = pxToSubpxVel(-0x200);
      } else if (height === "high") {
        value = pxToSubpxVel(-0x600);
      }
      this._setConstMemInt16("plat_vel_y", value);
      this._addNL();
    }
  };

  actorInvoke = () => {
    const { scene } = this.options;
    const actor = scene.actors[this.actorIndex];
    if (actor && actor.script.length > 0) {
      this._addComment("Invoke Actor Interact Script");
      this._callFar(`${actor.symbol}_interact`, 0);
    }
  };

  actorFXSplitIn = (
    actorId: string,
    distance: number,
    speed: number,
    units: DistanceUnitType = "pixels",
  ) => {
    const pixelDistance = distance * (units === "tiles" ? 8 : 1);
    const steps = Math.floor(pixelDistance / speed);
    const subpixelDistance = pxToSubpx(pixelDistance);

    const actorRef = this._declareLocal("actor", 4);
    const loopVarRef = this._declareLocal("loop", 1, true);
    const actorFinalXRef = this._declareLocal("final_x", 1, true);
    const loopLabel = this.getNextLabel();

    this._addComment("Actor Effect : Split In");
    this.actorSetById(actorId);
    this._actorActivate(actorRef);
    this._setConst(loopVarRef, steps);
    this._actorGetPosition(actorRef);
    this._set(actorFinalXRef, this._localRef(actorRef, 1));

    this._label(loopLabel);

    // Position to right
    this._rpn()
      .ref(actorFinalXRef)
      .ref(loopVarRef)
      .int16(Math.floor(subpixelDistance / steps))
      .operator(".MUL")
      .operator(".ADD")
      .refSet(this._localRef(actorRef, 1))
      .stop();
    this._actorSetPosition(actorRef);
    this._idle();

    // Position to left
    this._rpn()
      .ref(actorFinalXRef)
      .ref(loopVarRef)
      .int16(Math.floor(subpixelDistance / steps))
      .operator(".MUL")
      .operator(".SUB")
      .refSet(this._localRef(actorRef, 1))
      .stop();
    this._actorSetPosition(actorRef);
    this._idle();

    this._loop(loopVarRef, loopLabel, 0);
  };

  actorFXSplitOut = (
    actorId: string,
    distance: number,
    speed: number,
    units: DistanceUnitType = "pixels",
  ) => {
    const pixelDistance = distance * (units === "tiles" ? 8 : 1);
    const steps = Math.floor(pixelDistance / speed);
    const subpixelDistance = pxToSubpx(pixelDistance);

    const actorRef = this._declareLocal("actor", 4);
    const loopVarRef = this._declareLocal("loop", 1, true);
    const actorFinalXRef = this._declareLocal("final_x", 1, true);
    const loopLabel = this.getNextLabel();

    this._addComment("Actor Effect : Split Out");
    this.actorSetById(actorId);
    this._setConst(loopVarRef, steps);
    this._actorGetPosition(actorRef);
    this._set(actorFinalXRef, this._localRef(actorRef, 1));

    this._label(loopLabel);

    // Position to right
    this._rpn()
      .ref(actorFinalXRef)
      .int16(steps)
      .ref(loopVarRef)
      .operator(".SUB")
      .int16(Math.floor(subpixelDistance / steps))
      .operator(".MUL")
      .operator(".ADD")
      .refSet(this._localRef(actorRef, 1))
      .stop();
    this._actorSetPosition(actorRef);
    this._idle();

    // Position to left
    this._rpn()
      .ref(actorFinalXRef)
      .int16(steps)
      .ref(loopVarRef)
      .operator(".SUB")
      .int16(Math.floor(subpixelDistance / steps))
      .operator(".MUL")
      .operator(".SUB")
      .refSet(this._localRef(actorRef, 1))
      .stop();
    this._actorSetPosition(actorRef);
    this._idle();

    this._loop(loopVarRef, loopLabel, 0);

    // Position at end
    this._rpn().ref(actorFinalXRef).refSet(this._localRef(actorRef, 1)).stop();
    this._actorSetPosition(actorRef);

    this._actorDeactivate(actorRef);
  };

  actorFXFlicker = (actorId: string, frames: number) => {
    if (frames === 0) {
      return;
    }
    const steps = Math.ceil(frames / 4);

    const actorRef = this._declareLocal("actor", 4);
    const loopVarRef = this._declareLocal("loop", 1, true);
    const loopLabel = this.getNextLabel();

    this._addComment("Actor Effect : Flicker");
    this.actorSetById(actorId);
    this._setConst(loopVarRef, steps);

    this._label(loopLabel);
    this._actorSetHidden(actorRef, true);
    this._idle();
    this._idle();
    this._actorSetHidden(actorRef, false);
    this._idle();
    this._idle();
    this._loop(loopVarRef, loopLabel, 0);
  };

  // --------------------------------------------------------------------------
  // Weapons

  _rpnProjectilePosArgs = (actorRef: string, x = 0, y = 0) => {
    this._actorGetPosition(actorRef);
    const rpn = this._rpn();
    rpn.ref(this._localRef(actorRef, 1));
    if (x) {
      rpn.int16(pxToSubpx(x)).operator(".ADD");
    }
    rpn.ref(this._localRef(actorRef, 2));
    if (y) {
      rpn.int16(pxToSubpx(-y)).operator(".ADD");
    }
    return rpn;
  };

  launchProjectileInDirection = (
    projectileIndex: number,
    x = 0,
    y = 0,
    direction: string,
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Launch Projectile In Direction");
    const rpn = this._rpnProjectilePosArgs(actorRef, x, y);
    rpn.int16(dirToAngle(direction)).stop();
    this._projectileLaunch(projectileIndex, ".ARG2");
    this._stackPop(3);
    this._addNL();
  };

  launchProjectileInAngle = (
    projectileIndex: number,
    x = 0,
    y = 0,
    angle: number,
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Launch Projectile In Angle");
    const rpn = this._rpnProjectilePosArgs(actorRef, x, y);
    rpn.int16(Math.round(angle % 256)).stop();
    this._projectileLaunch(projectileIndex, ".ARG2");
    this._stackPop(3);
    this._addNL();
  };

  launchProjectileInAngleVariable = (
    projectileIndex: number,
    x = 0,
    y = 0,
    angleVariable: string,
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Launch Projectile In Angle");
    const rpn = this._rpnProjectilePosArgs(actorRef, x, y);
    rpn.refVariable(angleVariable).stop();
    this._projectileLaunch(projectileIndex, ".ARG2");
    this._stackPop(3);
    this._addNL();
  };

  launchProjectileInSourceActorDirection = (
    projectileIndex: number,
    x = 0,
    y = 0,
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Launch Projectile In Source Actor Direction");
    const rpn = this._rpnProjectilePosArgs(actorRef, x, y);
    rpn
      .int16(0) // Save space for direction
      .stop();
    this._actorGetAngle(actorRef, ".ARG0");
    this._projectileLaunch(projectileIndex, ".ARG2");
    this._stackPop(3);
    this._addNL();
  };

  launchProjectileInActorDirection = (
    projectileIndex: number,
    x = 0,
    y = 0,
    actorId: string,
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Launch Projectile In Actor Direction");
    const rpn = this._rpnProjectilePosArgs(actorRef, x, y);
    rpn
      .int16(0) // Save space for direction
      .stop();
    this.setActorId(".ARG0", actorId);
    this._actorGetAngle(".ARG0", ".ARG0");
    this._projectileLaunch(projectileIndex, ".ARG2");
    this._stackPop(3);
    this._addNL();
  };

  launchProjectileTowardsActor = (
    projectileIndex: number,
    x = 0,
    y = 0,
    otherActorId: string,
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
      .int16(tileToSubpx(1))
      .operator(".DIV")
      .ref(this._localRef(otherActorRef, 1))
      .ref(this._localRef(actorRef, 1))
      .operator(".SUB")
      .int16(tileToSubpx(1))
      .operator(".DIV")
      .operator(".ATAN2")
      .stop();
    this._projectileLaunch(projectileIndex, ".ARG2");
    this._stackPop(3);
    this._addNL();
  };

  loadProjectile = (
    index: number,
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
    const { symbol, index: srcIndex } = this.getGlobalProjectile(
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
    );
    this._addComment("Load Projectile Into Slot");
    this._projectileLoad(index, srcIndex, symbol);
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Timing

  idle = () => {
    this._addComment("Idle");
    this._idle();
    this._addNL();
  };

  waitScriptValue = (duration: ScriptValue, units: TimeUnitType) => {
    const waitArgsRef = this._declareLocal("wait_args", 1, true);
    const stackPtr = this.stackPtr;
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(duration),
    );
    if (rpnOps.length === 1 && rpnOps[0].type === "number") {
      const frames =
        units === "time" ? Math.ceil(rpnOps[0].value * 60) : rpnOps[0].value;
      this._addComment(`Wait ${frames} frames`);
      if (frames < 5) {
        for (let i = 0; i < frames; i++) {
          this._idle();
        }
      } else {
        this._setConst(waitArgsRef, Math.round(frames));
        this._invoke("wait_frames", 0, waitArgsRef);
      }
    } else {
      this._addComment(`Wait frames ${units}`);
      const localsLookup = this._performFetchOperations(fetchOps);
      const rpn = this._rpn();
      this._performValueRPN(rpn, rpnOps, localsLookup);
      if (units === "time") {
        rpn.int16(60);
        rpn.operator(".MUL");
      }
      rpn.refSetVariable(waitArgsRef).stop();
      this._invoke("wait_frames", 0, waitArgsRef);
    }
    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // UI

  textNumLines = (input: string): number => {
    // eslint-disable-next-line no-control-regex
    return (input.match(/(\n|\r|\x0a|\x0d|\\012|\\015)/g)?.length ?? 0) + 1;
  };

  textDialogue = (
    inputText: string | string[] = " ",
    avatarId?: string,
    minHeight = 4,
    maxHeight = 7,
    position: "bottom" | "top" = "bottom",
    showFrame = true,
    clearPrevious = true,
    textX = 1,
    textY = 1,
    textHeight = 5,
    speedIn = -1,
    speedOut = -1,
    closeWhen: "key" | "text" | "notModal" = "key",
    closeButton: "a" | "b" | "any" = "a",
    closeDelayFrames = 0,
  ) => {
    const { scene } = this.options;
    const input: string[] = Array.isArray(inputText) ? inputText : [inputText];

    const overlayInSpeed =
      speedIn === -1
        ? ".OVERLAY_IN_SPEED"
        : speedIn === -3
          ? ".OVERLAY_SPEED_INSTANT"
          : speedIn;
    const overlayOutSpeed =
      speedOut === -1
        ? ".OVERLAY_OUT_SPEED"
        : speedOut === -3
          ? ".OVERLAY_SPEED_INSTANT"
          : speedOut;

    const initialNumLines = input.map(this.textNumLines);
    const maxNumLines = Math.max.apply(null, initialNumLines);
    const textBoxHeight = calculateTextBoxHeight({
      textLines: maxNumLines,
      textY,
      textHeight,
      minHeight,
      maxHeight,
      showFrame,
    });

    const isModal = closeWhen !== "notModal";
    const renderOnTop = position === "top" && !scene.parallax;
    const textBoxY = renderOnTop ? 0 : 18 - textBoxHeight;
    const x = decOct(Math.max(1, 1 + textX + (avatarId ? 2 : 0)));
    const y = decOct(Math.max(1, 1 + textY));
    const textPosSequence =
      textX !== 1 || textY !== 1 ? `\\003\\${x}\\${y}` : "";

    this._addComment("Text Dialogue");

    if (renderOnTop) {
      this._stackPushConst(0);
      this._getMemUInt8(".ARG0", "overlay_cut_scanline");
      this._setConstMemUInt8("overlay_cut_scanline", textBoxHeight * 8 - 1);
    }

    input.forEach((text, textIndex) => {
      let avatarIndex = undefined;
      if (avatarId) {
        const { avatars } = this.options;
        avatarIndex = avatars.findIndex((a) => a.id === avatarId);
        if (avatarIndex < 0) {
          avatarIndex = undefined;
        }
      }

      if (clearPrevious) {
        this._overlayClear(
          0,
          0,
          20,
          textBoxHeight,
          ".UI_COLOR_WHITE",
          showFrame,
          false,
        );
      }

      // Animate first dialogue window of sequence on screen
      if (textIndex === 0) {
        this._overlayMoveTo(
          0,
          renderOnTop ? textBoxHeight : 18,
          ".OVERLAY_SPEED_INSTANT",
        );
        this._overlayMoveTo(0, textBoxY, overlayInSpeed);

        this._overlaySetScroll(
          textX + (avatarId ? 2 : 0),
          textY,
          (showFrame ? 19 : 20) - (avatarId ? 2 : 0) - textX,
          textHeight,
          ".UI_COLOR_WHITE",
        );
      }

      const decoratedText = `${this._getAvatarCode(
        avatarIndex,
      )}${textPosSequence}${this._injectScrollCode(text, textHeight)}`;

      this._loadAndDisplayText(decoratedText);

      if (isModal) {
        const waitFlags: ScriptBuilderOverlayWaitFlag[] = [
          ".UI_WAIT_WINDOW",
          ".UI_WAIT_TEXT",
        ];
        if (closeWhen === "key") {
          if (closeButton === "a") {
            waitFlags.push(".UI_WAIT_BTN_A");
          }
          if (closeButton === "b") {
            waitFlags.push(".UI_WAIT_BTN_B");
          }
          if (closeButton === "any") {
            waitFlags.push(".UI_WAIT_BTN_ANY");
          }
        }
        this._overlayWait(isModal, waitFlags);
        if (closeWhen === "text" && closeDelayFrames > 0) {
          if (closeDelayFrames < 5) {
            for (let i = 0; i < closeDelayFrames; i++) {
              this._idle();
            }
          } else {
            const waitArgsRef = this._declareLocal("wait_args", 1, true);
            const stackPtr = this.stackPtr;
            this._setConst(waitArgsRef, Math.round(closeDelayFrames));
            this._invoke("wait_frames", 0, waitArgsRef);
            this._assertStackNeutral(stackPtr);
          }
        }
      }

      // Animate final dialogue window of sequence off screen
      if (textIndex === input.length - 1) {
        if (isModal) {
          this._overlayMoveTo(
            0,
            renderOnTop ? textBoxHeight : 18,
            overlayOutSpeed,
          );
          this._overlayWait(true, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);
        }
      }
    });

    // Reset scanline when rendering on top (as long as it wasn't non-modal)
    if (isModal && renderOnTop) {
      this._overlayMoveTo(0, 18, ".OVERLAY_SPEED_INSTANT");
      this._idle();
      this._setMemUInt8("overlay_cut_scanline", ".ARG0");
    }

    if (renderOnTop) {
      this._stackPop(1);
    }

    this._addNL();
  };

  textDraw = (
    inputText = " ",
    x = 0,
    y = 0,
    location: "background" | "overlay" = "background",
  ) => {
    const { settings } = this.options;
    const isColor = settings.colorMode !== "mono";
    const drawX = decOct(1 + x);
    const drawY = decOct(1 + y);

    this._addComment("Draw Text");

    if (isColor) {
      this._stackPushConst(0);
      this._getMemUInt8(".ARG0", "overlay_priority");
      this._setConstMemUInt8("overlay_priority", 0);
    }

    if (location === "background") {
      this._setTextLayer(".TEXT_LAYER_BKG");
    }

    this._loadAndDisplayText(`\\003\\${drawX}\\${drawY}\\001\\001${inputText}`);

    this._overlayWait(false, [".UI_WAIT_TEXT"]);

    if (location === "background") {
      this._setTextLayer(".TEXT_LAYER_WIN");
    }

    if (isColor) {
      this._setMemUInt8("overlay_priority", ".ARG0");
      this._stackPop(1);
    }

    this._addNL();
  };

  textSetAnimSpeed = (
    speedIn: number,
    speedOut: number,
    textSpeed = 1,
    allowFastForward = true,
  ) => {
    this._addComment("Text Set Animation Speed");
    this._setConstMemInt8("text_ff_joypad", allowFastForward ? 1 : 0);
    this._setConstMemInt8("text_draw_speed", textSpeed);
    this._setConstMemInt8(
      "text_out_speed",
      Number(speedOut) === -3 ? ".OVERLAY_SPEED_INSTANT" : speedOut,
    );
    this._setConstMemInt8(
      "text_in_speed",
      Number(speedIn) === -3 ? ".OVERLAY_SPEED_INSTANT" : speedIn,
    );
    this._addNL();
  };

  textChoice = (
    variable: string,
    args: { trueText: string; falseText: string },
  ) => {
    const variableAlias = this.getVariableAlias(variable);
    const trueText = args.trueText || "Choice A";
    const falseText = args.falseText || "Choice B";
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

    this._overlayClear(0, 0, 20, numLines + 2, ".UI_COLOR_WHITE", true, true);
    this._overlayMoveTo(0, 18 - numLines - 2, ".OVERLAY_IN_SPEED");
    this._loadAndDisplayText(choiceText);
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
    cancelOnB = false,
  ) => {
    const variableAlias = this.getVariableAlias(variable);
    const optionsText = options.map(
      (option, index) => textCodeSetFont(0) + (option || `Item ${index + 1}`),
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

    this._overlayClear(0, 0, 20 - x, height + 2, ".UI_COLOR_WHITE", true, true);
    if (layout === "menu") {
      this._overlayMoveTo(10, 18, ".OVERLAY_SPEED_INSTANT");
    }
    this._overlayMoveTo(x, 18 - height - 2, ".OVERLAY_IN_SPEED");
    this._loadAndDisplayText(menuText);
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
          clampedMenuIndex(i + 1),
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
          clampedMenuIndex(i + 1),
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

  textCloseNonModal = (speed = 0) => {
    this._addComment("Close Non-Modal Dialogue");
    this._overlayMoveTo(
      0,
      18,
      Number(speed) === -3 ? ".OVERLAY_SPEED_INSTANT" : speed,
    );
    this._idle();
    this._overlayWait(false, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);
    this._setConstMemUInt8("overlay_cut_scanline", LYC_SYNC_VALUE);
    this._addNL();
  };

  setFont = (fontId: string) => {
    this._addComment("Set Font");
    this._setFont(this._getFontSymbol(fontId));
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
    this._overlayMoveTo(
      x,
      y,
      Number(speed) === -3 ? ".OVERLAY_SPEED_INSTANT" : speed,
    );
    this._overlayWait(false, [".UI_WAIT_WINDOW"]);
    this._addNL();
  };

  overlaySetScanlineCutoff = (
    y: ScriptValue,
    units: DistanceUnitType = "pixels",
  ) => {
    this._addComment("Overlay Set Scanline Cutoff");
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(
        shiftLeftScriptValueConst(y, units === "tiles" ? 0x3 : 0x0),
      ),
    );
    if (rpnOps.length === 1 && rpnOps[0].type === "number") {
      this._setConstMemUInt8("overlay_cut_scanline", rpnOps[0].value);
    } else {
      const localsLookup = this._performFetchOperations(fetchOps);
      const yRef = this._declareLocal("y", 1, true);
      this._addComment(`-- Calculate value`);
      const rpn = this._rpn();
      this._performValueRPN(rpn, rpnOps, localsLookup);
      rpn.refSetVariable(yRef).stop();
      this._setMemUInt8ToVariable("overlay_cut_scanline", yRef);
    }
    this._addNL();
  };

  dialogueFrameSetTiles = (tilesetId: string) => {
    const { tilesets } = this.options;
    const tileset = tilesets.find((t) => t.id === tilesetId);

    if (tileset && (tileset.imageWidth !== 24 || tileset.imageHeight !== 24)) {
      throw new Error(
        `The selected tileset is ${tileset.imageWidth}x${tileset.imageHeight}px. Please select a 24x24 tileset.`,
      );
    }

    const symbol = tileset?.symbol ?? "tileset_default_frame";

    this._addComment(`Set dialogue frame`);
    this._stackPushConst(0);
    this._stackPushConst(".FRAME_TILE_ID");
    this._replaceTile(".ARG0", symbol, ".ARG1", ".FRAME_LENGTH");
    this._stackPop(2);
    this._addNL();
  };

  overlayCopyFromBackground = () => {
    this._addComment("Copy Background To Overlay");

    const scrollXRef = this._declareLocal("scroll_x", 1, true);
    const scrollYRef = this._declareLocal("scroll_y", 1, true);

    this._getMemInt16(scrollXRef, "scroll_x");
    this._getMemInt16(scrollYRef, "scroll_y");

    this._rpn()
      .int8(0) // overlay x
      .int8(0) // overlay y
      .int8(20) // copy width
      .int8(18) // copy height
      // scene_x
      .int8(0) // min x
      .ref(scrollXRef)
      .int8(3) // shift right by 3 (div by 8)
      .operator(".SHR")
      .operator(".MAX")
      // scene_y
      .int8(0) // min y
      .ref(scrollYRef)
      .int8(3) // shift right by 3 (div by 8)
      .operator(".SHR")
      .operator(".MAX")
      .stop();

    this._overlaySetSubmapEx(".ARG5");

    this._stackPop(6);
  };

  // --------------------------------------------------------------------------
  // Camera

  cameraMoveToScriptValues = (
    valueX: ScriptValue,
    valueY: ScriptValue,
    speed = 0,
    units: DistanceUnitType = "tiles",
  ) => {
    const cameraMoveArgsRef = this._declareLocal("camera_move_args", 2, true);
    const xOffset = pxToSubpx(80);
    const yOffset = pxToSubpx(72);

    const stackPtr = this.stackPtr;
    this._addComment("Camera Move To");

    const [rpnOpsX, fetchOpsX] = precompileScriptValue(
      optimiseScriptValue(
        addScriptValueConst(scriptValueToSubpixels(valueX, units), xOffset),
      ),
      "x",
    );
    const [rpnOpsY, fetchOpsY] = precompileScriptValue(
      optimiseScriptValue(
        addScriptValueConst(scriptValueToSubpixels(valueY, units), yOffset),
      ),
      "y",
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
      this._cameraMoveTo(cameraMoveArgsRef, pxToSubpx(speed), ".CAMERA_UNLOCK");
    }

    this._assertStackNeutral(stackPtr);
    this._addNL();
  };

  cameraSetBoundsToScriptValues = (
    valueX: ScriptValue,
    valueY: ScriptValue,
    width: ScriptValue,
    height: ScriptValue,
    units: DistanceUnitType = "tiles",
  ) => {
    this._addComment("Camera Set Bounds");
    const [rpnOpsX, fetchOpsX] = precompileScriptValue(
      optimiseScriptValue(scriptValueToPixels(valueX, units)),
      "x",
    );
    const [rpnOpsY, fetchOpsY] = precompileScriptValue(
      optimiseScriptValue(scriptValueToPixels(valueY, units)),
      "y",
    );
    const [rpnOpsWidth, fetchOpsWidth] = precompileScriptValue(
      optimiseScriptValue(
        subScriptValueConst(
          addScriptValueToScriptValue(
            clampScriptValueConst(
              scriptValueToPixels(width, units),
              SCREEN_WIDTH_PX,
              SCENE_MAX_SIZE_PX,
            ),
            scriptValueToPixels(valueX, units),
          ),
          SCREEN_WIDTH_PX,
        ),
      ),
      "width",
    );
    const [rpnOpsHeight, fetchOpsHeight] = precompileScriptValue(
      optimiseScriptValue(
        subScriptValueConst(
          addScriptValueToScriptValue(
            clampScriptValueConst(
              scriptValueToPixels(height, units),
              SCREEN_HEIGHT_PX,
              SCENE_MAX_SIZE_PX,
            ),
            scriptValueToPixels(valueY, units),
          ),
          SCREEN_HEIGHT_PX,
        ),
      ),
      "height",
    );
    const localsLookup = this._performFetchOperations([
      ...fetchOpsX,
      ...fetchOpsY,
      ...fetchOpsWidth,
      ...fetchOpsHeight,
    ]);
    const rpn = this._rpn();
    this._addComment(`-- Calculate bounds values`);
    // X Value
    this._performValueRPN(rpn, rpnOpsX, localsLookup);
    rpn.memSet(".MEM_I16", "scroll_x_min");
    // Y Value
    this._performValueRPN(rpn, rpnOpsY, localsLookup);
    rpn.memSet(".MEM_I16", "scroll_y_min");
    // Width Value
    this._performValueRPN(rpn, rpnOpsWidth, localsLookup);
    rpn.memSet(".MEM_I16", "scroll_x_max");
    // Height Value
    this._performValueRPN(rpn, rpnOpsHeight, localsLookup);
    rpn.memSet(".MEM_I16", "scroll_y_max");
    rpn.stop();
    this._addNL();
  };

  cameraLock = (
    speed = 0,
    axis: ScriptBuilderAxis[],
    preventScroll: ActorDirection[] = [],
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Camera Lock");
    this._setConst(actorRef, 0);
    this._actorGetPosition(actorRef);
    this._rpn() //
      .ref(this._localRef(actorRef, 1))
      .int16(tileToSubpx(1))
      .operator(".ADD")
      .ref(this._localRef(actorRef, 2))
      .int16(tileToSubpx(1))
      .operator(".ADD")
      .stop();
    if (speed === 0) {
      this._cameraSetPos(".ARG1");
    }
    this._cameraMoveTo(
      ".ARG1",
      pxToSubpx(speed),
      toASMCameraLock(axis, preventScroll),
    );
    this._stackPop(2);
  };

  cameraShakeScriptValue = (
    shouldShakeX: boolean,
    shouldShakeY: boolean,
    frames: number,
    magnitude: ScriptValue,
  ) => {
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(magnitude),
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
          shouldShakeY ? ".CAMERA_SHAKE_Y" : [],
        ),
      ),
    );

    const rpn = this._rpn();
    this._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.refSet(this._localRef(cameraShakeArgsRef, 2)).stop();
    this._invoke("camera_shake_frames", 0, cameraShakeArgsRef);
    this._addNL();
  };

  cameraSetPropertyToScriptValue = (
    property: CameraProperty = "camera_deadzone_x",
    value: ScriptValue,
  ) => {
    this._addComment(`Camera Set Property ${property}`);
    if (property === "camera_deadzone_x" || property === "camera_deadzone_y") {
      this._setMemToScriptValue(
        property,
        "BYTE",
        clampScriptValueConst(value, 0, 40),
      );
    } else {
      this._setMemToScriptValue(property, "BYTE", value);
    }
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
    symbol?: string,
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
    timer = 1,
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

  rateLimitConstValue = (
    delay: ConstScriptValue,
    units: TimeUnitType,
    timerVariable: ScriptBuilderStackVariable,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
  ) => {
    this._addComment(`Rate Limit`);

    const endLabel = this.getNextLabel();
    const variableAlias = this.getVariableAlias(timerVariable);

    let frames: ScriptBuilderStackVariable = 0;
    if (delay.type === "number") {
      frames = units === "time" ? Math.ceil(delay.value * 60) : delay.value;
    } else if (delay.type === "constant") {
      const symbol = this.getConstantSymbol(delay.value);
      frames = units === "time" ? `^/(${symbol} * 60)/` : symbol;
    }

    if (this._isIndirectVariable(timerVariable)) {
      this._stackPushInd(variableAlias);
      this._rateLimitConst(frames, ".ARG0", endLabel);
    } else {
      this._rateLimitConst(frames, variableAlias, endLabel);
    }

    this._compilePath(truePath);

    this._label(endLabel);

    if (this._isIndirectVariable(timerVariable)) {
      this._setInd(variableAlias, ".ARG0");
      this._stackPop(1);
    }
  };

  // --------------------------------------------------------------------------
  // Threads

  threadStart = (handleVariable: string, script: ScriptEvent[]) => {
    this._addComment(`Thread Start`);
    const scriptRef = this._compileSubScript("thread", script);
    this._vmUnlock();
    this._threadStartWithVariableHandle(scriptRef, handleVariable, 0);
    this._addNL();
  };

  threadTerminate = (handleVariable: string) => {
    this._addComment(`Thread Stop`);
    this._threadTerminateWithVariableHandle(handleVariable);
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Call Script

  callScript = (
    scriptId: string,
    input: Record<string, string | ScriptValue | ScriptBuilderFunctionArg>,
  ) => {
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
            variableValue.type !== "number" &&
            variableValue.type !== "argument"
          ) {
            const [rpnOps, fetchOps] = precompileScriptValue(
              optimiseScriptValue(variableValue),
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
          } else if (actorValue.type === "argument") {
            this._stackPush(actorValue.symbol);
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
                this._stackPushReference(
                  variableAlias,
                  `Variable ${variableArg.id}`,
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
                `Variable ${variableArg.id}`,
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
    const {
      customEvents,
      compiledCustomEventScriptCache,
      scene,
      recursiveSymbolMap,
    } = this.options;
    const customEvent = customEvents.find((ce) => ce.id === customEventId);

    if (!customEvent) {
      console.warn("Script not found", customEventId);
      return;
    }

    // Check if this script has already been compiled for this scene
    // If so, is safe to just reuse it
    // If not it's likely script is the same but need to compile anyway
    // to handle cases like scene projectiles being in a different order
    // anything that could cause scripts to be different per scene should
    // be included when generating scene.hash while precompiling scenes
    const cacheKey = `${customEventId}-${scene.hash}`;
    const cachedResult = compiledCustomEventScriptCache[cacheKey];
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
      value: string,
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
        throw new Error(
          "Unknown arg " +
            type +
            " " +
            value +
            ' within script "' +
            customEvent.name +
            '"',
        );
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

    const script = mapUncommentedScript(
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
              this.options.scriptEventHandlers,
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
              this.options.scriptEventHandlers,
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
              this.options.scriptEventHandlers,
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
              this.options.scriptEventHandlers,
            )
          ) {
            if (isScriptValue(argValue)) {
              e.args[arg] = mapScriptValueLeafNodes(argValue, (val) => {
                if (val.type === "variable") {
                  if (isVariableCustomEvent(val.value)) {
                    return {
                      ...val,
                      value: getArg("variable", val.value),
                    };
                  }
                } else if (val.type === "property" && val.target !== "camera") {
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
      },
    );

    const inputSymbol = customEvent.symbol
      ? customEvent.symbol
      : `script_custom_0`;
    // Generate symbol and cache it before compiling script to allow recursive function calls to work
    // all calls to this script while compilation is still in progress will
    // use this symbol that gets replaced later
    const placeholderSymbol =
      "__PLACEHOLDER|" + inputSymbol + this._contextHash() + "|PLACEHOLDER__";

    const tmpResult = {
      scriptRef: placeholderSymbol,
      argsLen,
    };

    // Cache placeholder symbol to be used by recursive calls
    compiledCustomEventScriptCache[cacheKey] = tmpResult;

    const symbol = this._compileSubScript("custom", script, inputSymbol, {
      argLookup,
    });

    const result = {
      scriptRef: symbol,
      argsLen,
    };

    // Replace placeholder symbol with actual one + add to mapping table for
    // handling find/replace of recursive calls that used placeholder
    recursiveSymbolMap[placeholderSymbol] = symbol;
    compiledCustomEventScriptCache[cacheKey] = result;

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

  setSpriteMode = (mode: SpriteModeSetting) => {
    this._addComment(`Set Sprite Mode: ${mode}`);
    this._setSpriteMode(toASMSpriteMode(mode));
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Scenes

  sceneSwitchUsingScriptValues = (
    sceneId: string,
    x: ScriptValue,
    y: ScriptValue,
    direction: ActorDirection = "down",
    fadeSpeed = 2,
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    this._addComment("Load Scene");
    const { scenes } = this.options;
    const scene = scenes.find((s) => s.id === sceneId);

    if (scene) {
      if (fadeSpeed > 0) {
        this._setConstMemInt8(
          "fade_frames_per_step",
          fadeSpeeds[fadeSpeed] ?? 0x3,
        );
        this._fadeOut(true);
      }

      const [rpnOpsX, fetchOpsX] = precompileScriptValue(
        optimiseScriptValue(scriptValueToSubpixels(x, "tiles")),
        "x",
      );
      const [rpnOpsY, fetchOpsY] = precompileScriptValue(
        optimiseScriptValue(scriptValueToSubpixels(y, "tiles")),
        "y",
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

      this._setConstMemInt8("camera_settings", ".CAMERA_LOCK");
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
    if (fadeSpeed > 0) {
      this._setConstMemInt8(
        "fade_frames_per_step",
        fadeSpeeds[fadeSpeed] ?? 0x3,
      );
      this._fadeOut(true);
    }
    this._setConstMemInt8("camera_settings", ".CAMERA_LOCK");
    this._scenePop();
    this._addNL();
  };

  scenePopAllState = (fadeSpeed = 2) => {
    this._addComment("Pop All Scene State");
    this._addComment("" + fadeSpeed);
    if (fadeSpeed > 0) {
      this._setConstMemInt8(
        "fade_frames_per_step",
        fadeSpeeds[fadeSpeed] ?? 0x3,
      );
      this._fadeOut(true);
    }
    this._setConstMemInt8("camera_settings", ".CAMERA_LOCK");
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

  // @to-deprecate Currently used by eventReplaceTileXYSequence
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

  variableSetToValue = (variable: string, value: number | string) => {
    this._addComment("Variable Set To Value");
    this._setVariableConst(variable, value);
    this._addNL();
  };

  variableSetToScriptValue = (variable: string, value: ScriptValue) => {
    this._addComment("Variable Set To");
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(value),
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
    otherVariable: ScriptBuilderVariable,
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
    clamp: boolean,
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
    clamp: boolean,
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
    value: ScriptValue,
  ) => {
    this._addComment(`Variables ${operation}`);
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(value),
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
    clamp: boolean,
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
      `Variable ${variable} = ${this._expressionToHumanReadable(expression)}`,
    );
    this._stackPushEvaluatedExpression(expression, variable);
    this._addNL();
  };

  markLocalsUsed = (...locals: string[]) => {
    locals.forEach((local) => {
      this._markLocalUse(local);
    });
  };

  variablesReset = () => {
    this._addComment("Variables Reset");
    this._memSet(0, 0, "MAX_GLOBAL_VARS");
  };

  // --------------------------------------------------------------------------
  // Engine Fields

  engineFieldSetToScriptValue = (key: string, value: ScriptValue) => {
    const { engineFields } = this.options;
    const engineField = engineFields[key];
    if (engineField !== undefined && engineField.key) {
      const cType = engineField.cType;
      this._addComment(`Engine Field Set To Value`);

      const [rpnOps, fetchOps] = precompileScriptValue(
        optimiseScriptValue(value),
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
          true,
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
    if (engineField !== undefined && engineField.key) {
      const cType = engineField.cType;
      const numberValue =
        (typeof engineField.defaultValue === "boolean"
          ? Number(engineField.defaultValue)
          : engineField.defaultValue) || 0;
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
    if (engineField !== undefined && engineField.key) {
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

  replaceTileXYScriptValue = (
    x: ScriptValue,
    y: ScriptValue,
    tilesetId: string,
    tileIndexValue: ScriptValue,
    tileSize: "8px" | "16px",
  ) => {
    const { tilesets } = this.options;
    const tileset = tilesets.find((t) => t.id === tilesetId) ?? tilesets[0];
    if (!tileset) {
      return;
    }
    const tileIndex = this._declareLocal("tile_index", 1, true);

    this._addComment(`Replace Tile XY`);

    const [rpnOpsX, fetchOpsX] = precompileScriptValue(optimiseScriptValue(x));
    const [rpnOpsY, fetchOpsY] = precompileScriptValue(optimiseScriptValue(y));
    const [rpnOpsTile, fetchOpsTile] = precompileScriptValue(
      optimiseScriptValue(tileIndexValue),
    );

    if (
      rpnOpsX.length === 1 &&
      rpnOpsX[0].type === "number" &&
      rpnOpsY.length === 1 &&
      rpnOpsY[0].type === "number"
    ) {
      // Can optimise using constant values for X and Y coordinates
      const localsLookup = this._performFetchOperations(fetchOpsTile);
      const constX = rpnOpsX[0].value;
      const constY = rpnOpsY[0].value;
      const rpn = this._rpn();
      this._performValueRPN(rpn, rpnOpsTile, localsLookup);
      rpn.refSet(tileIndex);
      rpn.stop();
      if (tileSize === "16px") {
        // 16px tiles - Top left tile
        this._replaceTileXY(constX, constY, tileset.symbol, tileIndex);
        // 16px tiles - Top right tile
        this._rpn() //
          .ref(tileIndex)
          .int8(1)
          .operator(".ADD")
          .refSet(tileIndex)
          .stop();
        this._replaceTileXY(constX + 1, constY, tileset.symbol, tileIndex);
        // 16px tiles - Bottom right tile
        this._rpn() //
          .ref(tileIndex)
          .int8(tileset.width)
          .operator(".ADD")
          .refSet(tileIndex)
          .stop();
        this._replaceTileXY(constX + 1, constY + 1, tileset.symbol, tileIndex);
        // 16px tiles - Bottom left tile
        this._rpn() //
          .ref(tileIndex)
          .int8(1)
          .operator(".SUB")
          .refSet(tileIndex)
          .stop();
        this._replaceTileXY(constX, constY + 1, tileset.symbol, tileIndex);
      } else {
        // 8px tiles
        this._replaceTileXY(constX, constY, tileset.symbol, tileIndex);
      }
    } else {
      // Using RPN for X/Y values
      const tileX = this._declareLocal("tile_x", 1, true);
      const tileY = this._declareLocal("tile_y", 1, true);
      const tileAddr = this._declareLocal("tile_addr", 1, true);

      const localsLookup = this._performFetchOperations([
        ...fetchOpsX,
        ...fetchOpsY,
        ...fetchOpsTile,
      ]);
      const rpn = this._rpn();
      this._performValueRPN(rpn, rpnOpsX, localsLookup);
      rpn.refSet(tileX);
      this._performValueRPN(rpn, rpnOpsY, localsLookup);
      rpn.refSet(tileY);
      this._performValueRPN(rpn, rpnOpsTile, localsLookup);
      rpn.refSet(tileIndex);
      rpn.stop();

      if (tileSize === "16px") {
        // 16px tiles - Top left tile
        this._getTileXY(tileAddr, tileX, tileY);
        this._replaceTile(tileAddr, tileset.symbol, tileIndex, 1);
        // 16px tiles - Top right tile
        this._rpn() //
          // Inc Tile X
          .ref(tileX)
          .int8(1)
          .operator(".ADD")
          .refSetVariable(tileX)
          // Inc Tile Index
          .ref(tileIndex)
          .int8(1)
          .operator(".ADD")
          .refSet(tileIndex)
          .stop();
        this._getTileXY(tileAddr, tileX, tileY);
        this._replaceTile(tileAddr, tileset.symbol, tileIndex, 1);
        // 16px tiles - Bottom right tile
        this._rpn() //
          // Inc Tile Y
          .ref(tileY)
          .int8(1)
          .operator(".ADD")
          .refSetVariable(tileY)
          // Inc Tile Index
          .ref(tileIndex)
          .int8(tileset.width)
          .operator(".ADD")
          .refSet(tileIndex)
          .stop();
        this._getTileXY(tileAddr, tileX, tileY);
        this._replaceTile(tileAddr, tileset.symbol, tileIndex, 1);
        // 16px tiles - Bottom left tile
        this._rpn() //
          // Inc Tile X
          .ref(tileX)
          .int8(1)
          .operator(".SUB")
          .refSetVariable(tileX)
          // Inc Tile Index
          .ref(tileIndex)
          .int8(1)
          .operator(".SUB")
          .refSet(tileIndex)
          .stop();
        this._getTileXY(tileAddr, tileX, tileY);
        this._replaceTile(tileAddr, tileset.symbol, tileIndex, 1);
      } else {
        // 8px tiles
        this._getTileXY(tileAddr, tileX, tileY);
        this._replaceTile(tileAddr, tileset.symbol, tileIndex, 1);
      }

      this.markLocalsUsed(tileIndex, tileAddr, tileX, tileY);
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

  musicSetMuteMask = (
    duty1Active: boolean,
    duty2Active: boolean,
    waveActive: boolean,
    noiseActive: boolean,
  ) => {
    this._addComment(`Mute Channel`);
    this._addCmd(
      "VM_MUSIC_MUTE",
      andFlags(
        (["0x0F"] as string[]).concat(
          duty1Active ? "0x0E" : [],
          duty2Active ? "0x0D" : [],
          waveActive ? "0x0B" : [],
          noiseActive ? "0x07" : [],
        ),
      ),
    );
    this._addNL();
  };

  musicRoutineSet = (
    routine: number,
    script: ScriptEvent[],
    symbol?: string,
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
      const maxEffect = (sound.numEffects ?? 0) - 1;
      const effectIndex =
        sound.type === "fxhammer"
          ? Math.max(0, Math.min(maxEffect, effect ?? 0))
          : 0;
      this._soundPlay(
        `${sound.symbol}${
          sound.type === "fxhammer"
            ? "_" + String(effectIndex).padStart(2, "0")
            : ""
        }`,
        toASMSoundPriority(priority),
      );
    }
    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Text Sound

  textSetSoundTone = (period = 1600, toneFrames = 30) => {
    this._addComment("Text Set Sound Tone");
    const symbol = this._soundPlayBasic(1, toneFrames, [
      0x00,
      (0x0 << 6) | 0x01,
      (0x0f << 4) | 0x00,
      period & 0x00ff,
      0x80 | ((period & 0x0700) >> 8),
    ]);
    this._textSetSound(symbol);
    this._addNL();
  };

  textSetSoundBeep = (pitch = 4, frames = 30) => {
    this._addComment("Text Set Sound Beep");
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
    this._textSetSound(symbol);
    this._addNL();
  };

  textSetSoundCrash = (frames = 30) => {
    this._addComment("Text Set Sound Crash");
    const symbol = this._soundPlayBasic(4, frames, [
      0x01,
      (0x0f << 4) | 0x02,
      0x13,
      0x80,
    ]);
    this._textSetSound(symbol);
    this._addNL();
  };

  textSetSound = (soundId: string, effect?: number) => {
    this._addComment(`Text Set Sound`);
    const { sounds } = this.options;
    const sound = sounds.find((s) => s.id === soundId);
    if (sound) {
      this._textSetSound(
        `${sound.symbol}${
          sound.type === "fxhammer"
            ? "_" + String(effect ?? 0).padStart(2, "0")
            : ""
        }`,
      );
    }
    this._addNL();
  };

  textRemoveSound = () => {
    this._addComment(`Text Remove Sound`);
    this._textRemoveSound();
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
        parseB(colors[3]),
      );
    }
  };

  paletteSetSprite = (paletteIds: string[]) => {
    const { palettes, scene, settings } = this.options;

    let mask = 0;
    const writePalettes: Palette[] = [];
    for (let i = 0; i < paletteIds.length; i++) {
      const paletteId = paletteIds[i];
      const defaultPaletteId = settings.defaultSpritePaletteIds[i];
      if (paletteId === "keep") {
        continue;
      }
      let palette = getPalette(palettes, paletteId, defaultPaletteId);
      if (paletteId === "restore") {
        // Restore from manual palette
        const scenePaletteId =
          scene.spritePaletteIds[i] ?? settings.defaultSpritePaletteIds[i];
        palette = getPalette(palettes, scenePaletteId, defaultPaletteId);
      }
      mask += 1 << i;
      writePalettes.push(palette);
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
        parseB(colors[3]),
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
      parseB(colors[3]),
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
      parseB(colors[3]),
    );
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
    onSavePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    onLoadPath: ScriptEvent[] | ScriptBuilderPathFunction = [],
  ) => {
    const { customEvents, scriptEventHandlers } = this.options;

    const hasLoadedRef = this._declareLocal("has_loaded", 1, true);
    const loadedLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    this._addComment(`Save Data to Slot ${slot}`);
    this._raiseException("EXCEPTION_SAVE", 1);
    this._saveSlot(slot);
    this._pollLoaded(hasLoadedRef);
    this._ifConst(".EQ", hasLoadedRef, 1, loadedLabel, 0);
    this._addNL();
    this._compilePath(onSavePath);
    this._jump(endLabel);
    this._label(loadedLabel);
    if (Array.isArray(onLoadPath)) {
      // Inject autofade into load script
      const customEventsLookup = keyBy(customEvents, "id");
      const autoFadeId = calculateAutoFadeEventId(
        onLoadPath,
        customEventsLookup,
        scriptEventHandlers,
      );
      const autoFadeIndex = autoFadeId
        ? onLoadPath.findIndex((item) => item.id === autoFadeId)
        : -1;
      const fadeEvent = {
        id: "autofade",
        command: "EVENT_FADE_IN",
        args: {
          speed: 2,
        },
      };
      if (autoFadeIndex > -1) {
        onLoadPath.splice(autoFadeIndex, 0, fadeEvent);
      } else if (autoFadeId !== "MANUAL") {
        onLoadPath.push(fadeEvent);
      }
    }
    this._compilePath(onLoadPath);
    if (!Array.isArray(onLoadPath)) {
      this._fadeIn(true);
    }
    this._label(endLabel);
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
      `Store ${variableSourceAlias} from save slot ${slot} into ${variableDestAlias}`,
    );
    this._savePeek(
      peekValueRef,
      variableDestAlias,
      variableSourceAlias,
      1,
      slot,
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
    packetSize: number,
  ) => {
    this._sioExchangeVariables(sendVariable, receiveVariable, packetSize);
  };

  // --------------------------------------------------------------------------
  // GB Printer

  printOverlay = (
    startLine: number,
    height: number,
    margin: number,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
  ) => {
    const isCGBRef = this._declareLocal("is_cgb", 1, true);
    const printStatusRef = this._declareLocal("print_status", 1, true);
    const timeout = 30;

    const colorNotSupportedLabelA = this.getNextLabel();
    const colorNotSupportedLabelB = this.getNextLabel();
    const printFailedLabel = this.getNextLabel();
    const printSuccessLabel = this.getNextLabel();
    const printCleanupLabel = this.getNextLabel();

    this._addComment("Print Overlay");

    // If using CGB slow CPU before connecting to printer
    this._getMemUInt8(isCGBRef, "_is_CGB");
    this._ifConst(".NE", isCGBRef, 1, colorNotSupportedLabelA, 0);
    this._callNative("cpu_slow", 1);
    this._label(colorNotSupportedLabelA);

    // Detect if printer was found
    this._printerDetect(printStatusRef, timeout);
    this._rpn().ref(printStatusRef).int8(0xf0).operator(".B_AND").stop();
    this._ifConst(".NE", ".ARG0", 0, printFailedLabel, 1);

    // Print overlay
    this._printOverlay(printStatusRef, startLine, height, margin);
    this._rpn().ref(printStatusRef).int8(0xf0).operator(".B_AND").stop();
    this._ifConst(".EQ", ".ARG0", 0, printSuccessLabel, 1);

    // Error path
    this._label(printFailedLabel);
    this._compilePath(falsePath);
    this._jump(printCleanupLabel);

    // Success
    this._label(printSuccessLabel);
    this._compilePath(truePath);

    // If using CGB set CPU back to fast
    this._label(printCleanupLabel);
    this._getMemUInt8(isCGBRef, "_is_CGB");
    this._ifConst(".NE", isCGBRef, 1, colorNotSupportedLabelB, 0);
    this._callNative("cpu_fast", 1);
    this._label(colorNotSupportedLabelB);

    this._addNL();
  };

  // --------------------------------------------------------------------------
  // Control Flow

  whileScriptValue = (
    value: ScriptValue,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
  ) => {
    const loopId = this.getNextLabel();
    const endLabel = this.getNextLabel();

    this._addComment(`While`);
    this._label(loopId);

    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(value),
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

  // @to-deprecate Currently used by eventReplaceTileXYSequence
  ifVariableCompare = (
    variableA: string,
    operator: ScriptBuilderComparisonOperator,
    variableB: string,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
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

  // @to-deprecate Currently used by eventReplaceTileXYSequence and eventLoopFor
  ifVariableCompareScriptValue = (
    variable: string,
    operator: ScriptBuilderComparisonOperator,
    value: ScriptValue,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
  ) => {
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(value),
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
        0,
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
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
  ) => {
    let testIfTruthy = true;
    let optimisedValue = optimiseScriptValue(value);

    if (optimisedValue.type === "not") {
      // "!expression != 0" - optimise to "expression == 0"
      optimisedValue = optimisedValue.value;
      testIfTruthy = false;
    } else if (
      // "(false == expression) != 0" (left side) - optimise to "expression == 0"
      optimisedValue.type === "eq" &&
      ((optimisedValue.valueA.type === "number" &&
        optimisedValue.valueA.value === 0) ||
        optimisedValue.valueA.type === "false")
    ) {
      optimisedValue = optimisedValue.valueB;
      testIfTruthy = false;
    } else if (
      // "(expression == false) != 0" (right side) - optimise to "expression == 0"
      optimisedValue.type === "eq" &&
      ((optimisedValue.valueB.type === "number" &&
        optimisedValue.valueB.value === 0) ||
        optimisedValue.valueB.type === "false")
    ) {
      optimisedValue = optimisedValue.valueA;
      testIfTruthy = false;
    }

    const trueLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();

    this._addComment(`If`);

    if (optimisedValue.type === "variable") {
      if (testIfTruthy) {
        this._addComment(`-- If Truthy`);
        this._ifVariableConst(".NE", optimisedValue.value, 0, trueLabel, 0);
      } else {
        this._addComment(`-- If Falsy`);
        this._ifVariableConst(".EQ", optimisedValue.value, 0, trueLabel, 0);
      }
    } else {
      const [rpnOps, fetchOps] = precompileScriptValue(optimisedValue);
      const localsLookup = this._performFetchOperations(fetchOps);

      this._addComment(`-- Calculate value`);
      const rpn = this._rpn();
      this._performValueRPN(rpn, rpnOps, localsLookup);
      rpn.stop();
      if (testIfTruthy) {
        this._addComment(`-- If Truthy`);
        this._ifConst(".NE", ".ARG0", 0, trueLabel, 1);
      } else {
        this._addComment(`-- If Falsy`);
        this._ifConst(".EQ", ".ARG0", 0, trueLabel, 1);
      }
    }

    this._compilePath(falsePath);
    this._jump(endLabel);
    this._label(trueLabel);
    this._compilePath(truePath);
    this._label(endLabel);
    this._addNL();
  };

  // @to-deprecate Currently used by eventIfVariableFlagsCompare (use if ifScriptValue)
  ifVariableBitwiseValue = (
    variable: string,
    operator: ScriptBuilderRPNOperation,
    flags: number,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
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
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
  ) => {
    const paramValueRef = this._declareLocal(
      `param${parameter}_value`,
      1,
      true,
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

  ifActorAtPositionByScriptValues = (
    actorId: string,
    valueX: ScriptValue,
    valueY: ScriptValue,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    units: DistanceUnitType = "tiles",
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();

    this._addComment(`If Actor At Position`);

    const [rpnOpsX, fetchOpsX] = precompileScriptValue(
      optimiseScriptValue(valueX),
      "x",
    );
    const [rpnOpsY, fetchOpsY] = precompileScriptValue(
      optimiseScriptValue(valueY),
      "y",
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
    // Convert to chosen units
    rpn.int8(subpxShiftForUnits(units));
    rpn.operator(".SHR");
    // Get value to compare X with
    this._performValueRPN(rpn, rpnOpsX, localsLookup);
    rpn.operator(".EQ");

    // Y Value EQ
    rpn.ref(this._localRef(actorRef, 2));
    // Convert to chosen units
    rpn.int8(subpxShiftForUnits(units));
    rpn.operator(".SHR");
    // Get value to compare Y with
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

  ifActorDirectionScriptValue = (
    actorId: string,
    directionValue: ScriptValue,
    truePath = [],
    falsePath = [],
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const actorDirRef = this._declareLocal("actor_dir", 1, true);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();

    this._addComment(`If Actor Facing Direction`);
    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(directionValue),
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
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
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
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
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
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
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
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
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

  ifActorDistanceScriptValueFromActor = (
    actorId: string,
    distanceValue: ScriptValue,
    operator: ScriptBuilderComparisonOperator,
    otherId: string,
    truePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
  ) => {
    const actorRef = this._declareLocal("actor", 4);
    const otherActorRef = this._declareLocal("other_actor", 3, true);
    const distanceRef = this._declareLocal("distance", 1, true);
    const falseLabel = this.getNextLabel();
    const endLabel = this.getNextLabel();
    const subpxShiftBits = subpxShiftForUnits("tiles");

    this._addComment(`If Actor Distance from Actor`);

    const [rpnOps, fetchOps] = precompileScriptValue(
      optimiseScriptValue(distanceValue),
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
      .int16(subpxShiftBits)
      .operator(".SHR")
      .ref(this._localRef(actorRef, 1)) // X1
      .int16(subpxShiftBits)
      .operator(".SHR")
      .operator(".SUB")
      .ref(this._localRef(otherActorRef, 1)) // X2
      .int16(subpxShiftBits)
      .operator(".SHR")
      .ref(this._localRef(actorRef, 1)) // X1
      .int16(subpxShiftBits)
      .operator(".SHR")
      .operator(".SUB")
      .operator(".MUL")
      .ref(this._localRef(otherActorRef, 2)) // Y2
      .int16(subpxShiftBits)
      .operator(".SHR")
      .ref(this._localRef(actorRef, 2)) // Y1
      .int16(subpxShiftBits)
      .operator(".SHR")
      .operator(".SUB")
      .ref(this._localRef(otherActorRef, 2)) // Y2
      .int16(subpxShiftBits)
      .operator(".SHR")
      .ref(this._localRef(actorRef, 2)) // Y1
      .int16(subpxShiftBits)
      .operator(".SHR")
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

  caseVariableConstValue = (
    variable: string,
    cases: {
      value: ConstScriptValue;
      branch: ScriptEvent[] | ScriptBuilderPathFunction;
    }[],
    falsePath: ScriptEvent[] | ScriptBuilderPathFunction = [],
  ) => {
    const numCases = cases.length;

    if (numCases === 0) {
      this._compilePath(falsePath);
      return;
    }

    const caseLabels = cases.map(() => this.getNextLabel());
    const endLabel = this.getNextLabel();

    const extractSymbol = (value: ConstScriptValue): string | number => {
      if (value.type === "number") {
        return value.value;
      } else if (value.type === "constant") {
        return this.getConstantSymbol(value.value);
      }
      return 0;
    };

    this._addComment(`Switch Variable`);
    this._switchVariable(
      variable,
      caseLabels.map((label, i) => {
        return [extractSymbol(cases[i].value), `${label}$`];
      }),
      0,
    );
    this._addNL();

    // Default
    this._compilePath(falsePath);
    this._jump(endLabel);

    // Cases
    for (let i = 0; i < numCases; i++) {
      this._addComment(`case ${extractSymbol(cases[i].value)}:`);
      this._label(caseLabels[i]);
      this._compilePath(cases[i].branch);
      this._jump(endLabel);
    }
    this._label(endLabel);

    this._addNL();
  };

  lock = () => {
    this._vmLock();
  };

  unlock = () => {
    this._vmUnlock();
  };

  sceneUpdatePause = () => {
    this._addComment(`Pause Scene Type Update`);
    this._setConstMemInt8("pause_state_update", 1);
    this._addNL();
  };

  sceneUpdateResume = () => {
    this._addComment(`Resume Scene Type Update`);
    this._setConstMemInt8("pause_state_update", 0);
    this._addNL();
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
}

export default ScriptBuilder;
