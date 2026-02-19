import { DMG_PALETTE } from "consts";
import {
  isVariableLocal,
  isVariableTemp,
} from "shared/lib/entities/entitiesHelpers";
import { DistanceUnitType } from "shared/lib/entities/entitiesTypes";
import { decOct } from "shared/lib/helpers/8bit";
import {
  subpxShiftForUnits,
  pxShiftForUnits,
  subpxSnapMaskForUnits,
} from "shared/lib/helpers/subpixels";
import {
  Palette,
  ActorDirection,
  SpriteModeSetting,
} from "shared/lib/resources/types";
import { OperatorSymbol, FunctionSymbol } from "shared/lib/rpn/types";
import {
  shiftLeftScriptValueConst,
  maskScriptValueConst,
} from "shared/lib/scriptValue/helpers";
import {
  ValueOperatorType,
  ValueUnaryOperatorType,
  ScriptValue,
} from "shared/lib/scriptValue/types";
import SparkMD5 from "spark-md5";
import {
  ScriptBuilderRPNOperation,
  ScriptBuilderScene,
  ScriptBuilderEntity,
  ScriptBuilderOverlayWaitFlag,
  ScriptBuilderAxis,
  SFXPriority,
  ASMSFXPriority,
  ASMSpriteMode,
} from "./types";

export const rpnUnaryOperators: ScriptBuilderRPNOperation[] = [
  ".ABS",
  ".NOT",
  ".B_NOT",
  ".ISQRT",
  ".RND",
  ".NEG",
];

// - Helpers --------------

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const getActorIndex = (actorId: string, scene: ScriptBuilderScene) => {
  return (scene.actors || []).findIndex((a) => a.id === actorId) + 1;
};

export const getPalette = (
  palettes: Palette[],
  id: string,
  fallbackId: string,
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
  entity?: ScriptBuilderEntity,
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

export const toValidLabel = (label: string): string => {
  return label.replace(/[^A-Za-z0-9]/g, "_");
};

export const buildOverlayWaitCondition = (
  flags: ScriptBuilderOverlayWaitFlag[],
) => {
  return unionFlags(flags, ".UI_WAIT_NONE");
};

export const unionFlags = (flags: string[], defaultValue = "0") => {
  if (flags.length === 0) {
    return defaultValue;
  }
  if (flags.length === 1) {
    return flags[0];
  }
  return `^/(${flags.join(" | ")})/`;
};

export const andFlags = (flags: string[], defaultValue = "0") => {
  if (flags.length === 0) {
    return defaultValue;
  }
  if (flags.length === 1) {
    return flags[0];
  }
  return `^/(${flags.join(" & ")})/`;
};

export const toASMVar = (symbol: string) => {
  return symbol.toUpperCase().replace(/[^A-Z0-9]/g, "_");
};

export const toASMDir = (direction: string) => {
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

export const toASMMoveFlags = (
  moveType: string,
  useCollisions: boolean | Array<"walls" | "actors">,
  relative?: boolean,
  relativeUnits?: DistanceUnitType,
) => {
  return unionFlags(
    ([] as string[]).concat(
      useCollisions === true ? ".ACTOR_ATTR_CHECK_COLL" : [],
      Array.isArray(useCollisions) && useCollisions.includes("walls")
        ? ".ACTOR_ATTR_CHECK_COLL_WALLS"
        : [],
      Array.isArray(useCollisions) && useCollisions.includes("actors")
        ? ".ACTOR_ATTR_CHECK_COLL_ACTORS"
        : [],
      moveType === "horizontal" ? ".ACTOR_ATTR_H_FIRST" : [],
      moveType === "diagonal" ? ".ACTOR_ATTR_DIAGONAL" : [],
      relative && relativeUnits === "pixels"
        ? ".ACTOR_ATTR_RELATIVE_SNAP_PX"
        : [],
      relative && relativeUnits === "tiles"
        ? ".ACTOR_ATTR_RELATIVE_SNAP_TILE"
        : [],
    ),
  );
};

export const toASMCameraLock = (
  axis: ScriptBuilderAxis[],
  preventScroll: ActorDirection[],
) => {
  return unionFlags(
    ([] as string[]).concat(
      axis.includes("x") ? ".CAMERA_LOCK_X" : [],
      axis.includes("y") ? ".CAMERA_LOCK_Y" : [],
      preventScroll.includes("left") ? ".CAMERA_LOCK_X_MIN" : [],
      preventScroll.includes("right") ? ".CAMERA_LOCK_X_MAX" : [],
      preventScroll.includes("up") ? ".CAMERA_LOCK_Y_MIN" : [],
      preventScroll.includes("down") ? ".CAMERA_LOCK_Y_MAX" : [],
    ),
  );
};

export const toASMSoundPriority = (priority: SFXPriority): ASMSFXPriority => {
  if (priority === "low") {
    return ".SFX_PRIORITY_MINIMAL";
  }
  if (priority === "high") {
    return ".SFX_PRIORITY_HIGH";
  }
  return ".SFX_PRIORITY_NORMAL";
};

export const toASMSpriteMode = (mode: SpriteModeSetting): ASMSpriteMode => {
  if (mode === "8x8") {
    return ".MODE_8X8";
  }
  return ".MODE_8X16";
};

export const dirToAngle = (direction: string) => {
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

export const toScriptOperator = (
  operator: OperatorSymbol,
): ScriptBuilderRPNOperation => {
  switch (operator) {
    case "+":
      return ".ADD";
    case "-":
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
    case "!":
      return ".NOT";
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
    case "neg":
      return ".NEG";
  }
  assertUnreachable(operator);
};

export const valueFunctionToScriptOperator = (
  operator: ValueOperatorType | ValueUnaryOperatorType,
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
    case "rnd":
      return ".RND";
    case "neg":
      return ".NEG";
  }
  assertUnreachable(operator);
};

export const funToScriptOperator = (
  fun: FunctionSymbol,
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
    case "isqrt":
      return ".ISQRT";
    case "rnd":
      return ".RND";
    case "neg":
      return ".SUB";
  }
  assertUnreachable(fun);
};

export const textCodeSetSpeed = (speed: number): string => {
  return `\\001\\${decOct(speed + 1)}`;
};

export const textCodeSetFont = (fontIndex: number): string => {
  return `\\002\\${decOct(fontIndex + 1)}`;
};

export const textCodeGoto = (x: number, y: number): string => {
  return `\\003\\${decOct(x)}\\${decOct(y)}`;
};

export const textCodeGotoRel = (x: number, y: number): string => {
  return `\\004\\${decOct(x)}\\${decOct(y)}`;
};

export const textCodeInput = (mask: number): string => {
  return `\\006\\${decOct(mask)}`;
};

export const assertUnreachable = (_x: never): never => {
  throw new Error("Didn't expect to get here");
};

export const toProjectileHash = ({
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
}: {
  spriteSheetId: string;
  spriteStateId: string;
  speed: number;
  animSpeed: number;
  loopAnim: boolean;
  lifeTime: number;
  initialOffset: number;
  destroyOnHit: boolean;
  collisionGroup: string;
  collisionMask: string[];
}) =>
  SparkMD5.hash(
    JSON.stringify({
      spriteSheetId,
      spriteStateId,
      speed,
      animSpeed,
      loopAnim,
      lifeTime,
      initialOffset,
      destroyOnHit,
      collisionGroup,
      collisionMask: [...collisionMask].sort(),
    }),
  );

export const fadeSpeeds = [0x0, 0x1, 0x3, 0x7, 0xf, 0x1f, 0x3f];

export const scriptValueToSubpixels = (
  value: ScriptValue,
  units: DistanceUnitType,
) => {
  return shiftLeftScriptValueConst(value, subpxShiftForUnits(units));
};

export const scriptValueToPixels = (
  value: ScriptValue,
  units: DistanceUnitType,
) => {
  if (units === "pixels") {
    return value;
  }
  return shiftLeftScriptValueConst(value, pxShiftForUnits(units));
};

export const snapScriptValueToUnits = (
  value: ScriptValue,
  units: DistanceUnitType,
) => {
  return maskScriptValueConst(value, subpxSnapMaskForUnits(units));
};
