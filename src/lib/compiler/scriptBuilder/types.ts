import type {
  Constant,
  EngineFieldValue,
  Palette,
  Script,
  ScriptEditorCtxType,
  ScriptEvent,
  Sound,
  Variable,
} from "shared/lib/resources/types";
import type { ScriptEventHandlers } from "lib/scriptEventsHandlers/handlerTypes";
import type { VariableMapData } from "lib/compiler/compileData";
import type {
  PrecompiledBackground,
  PrecompiledEmote,
  PrecompiledProjectile,
  PrecompiledScene,
  PrecompiledSprite,
  PrecompiledTilesetData,
} from "../generateGBVMData";
import type { PrecompiledFontData } from "../compileFonts";
import type { PrecompiledMusicTrack } from "../compileMusic";
import type { EngineFieldSchema } from "store/features/engine/engineState";
import type { SettingsState } from "store/features/settings/settingsState";
import type ScriptBuilderBase from "./scriptBuilderBase";

export type ScriptOutput = string[];

export interface ScriptBuilderEntity {
  id: string;
  name: string;
}

export interface ScriptBuilderScene {
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

export type ScriptBuilderStackVariable = string | number;

export type ScriptBuilderFunctionArg = {
  type: "argument";
  indirect: boolean;
  symbol: string;
};

type ScriptBuilderSimpleVariable = string | number;

export type ScriptBuilderVariable =
  | ScriptBuilderSimpleVariable
  | ScriptBuilderFunctionArg;

export type CameraProperty =
  | "camera_x"
  | "camera_y"
  | "camera_deadzone_x"
  | "camera_deadzone_y"
  | "camera_offset_x"
  | "camera_offset_y";

interface ScriptBuilderFunctionArgLookup {
  actor: Map<string, ScriptBuilderFunctionArg>;
  variable: Map<string, ScriptBuilderFunctionArg>;
}

export interface GlobalProjectiles {
  symbol: string;
  projectiles: PrecompiledProjectile[];
}

export interface ScriptBuilderOptions<
  TBuilder extends ScriptBuilderBase = ScriptBuilderBase,
> {
  scriptEventHandlers: ScriptEventHandlers;
  context: ScriptEditorCtxType;
  scriptSymbolName: string;
  scene: PrecompiledScene;
  sceneIndex: number;
  entityIndex: number;
  entityType: ScriptBuilderEntityType;
  entityScriptKey: string;
  variablesLookup: VariablesLookup;
  variableAliasLookup: Record<string, VariableMapData>;
  constantsLookup: Record<string, Constant>;
  scenes: PrecompiledScene[];
  sprites: PrecompiledSprite[];
  backgrounds: PrecompiledBackground[];
  statesOrder: string[];
  stateReferences: string[];
  fonts: PrecompiledFontData[];
  defaultFontId: string;
  music: PrecompiledMusicTrack[];
  sounds: Sound[];
  avatars: ScriptBuilderEntity[];
  emotes: PrecompiledEmote[];
  tilesets: PrecompiledTilesetData[];
  palettes: Palette[];
  customEvents: Script[];
  entity?: ScriptBuilderEntity;
  engineFields: Record<string, EngineFieldSchema>;
  engineFieldValues: EngineFieldValue[];
  settings: SettingsState;
  additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  >;
  additionalOutput: Record<
    string,
    {
      filename: string;
      data: string;
    }
  >;
  symbols: Record<string, string>;
  globalProjectiles: GlobalProjectiles[];
  argLookup: ScriptBuilderFunctionArgLookup;
  maxDepth: number;
  compiledCustomEventScriptCache: Record<
    string,
    {
      scriptRef: string;
      argsLen: number;
    }
  >;
  recursiveSymbolMap: Record<string, string>;
  additionalScriptsCache: Record<string, string>;
  debugEnabled: boolean;
  compiledAssetsCache: Record<string, string>;
  disabledSceneTypeIds: string[];
  warnings: (msg: string) => void;
  compileEvents: (self: TBuilder, events: ScriptEvent[]) => void;
}

export type ScriptBuilderMoveType = "horizontal" | "vertical" | "diagonal";

export type ScriptBuilderComparisonOperator =
  | ".EQ"
  | ".NE"
  | ".GT"
  | ".GTE"
  | ".LT"
  | ".LTE"
  | ".AND"
  | ".OR"
  | ".NOT";

export type ScriptBuilderOverlayWaitFlag =
  | ".UI_WAIT_WINDOW"
  | ".UI_WAIT_TEXT"
  | ".UI_WAIT_BTN_A"
  | ".UI_WAIT_BTN_B"
  | ".UI_WAIT_BTN_ANY";

export type ScriptBuilderPaletteType = ".PALETTE_BKG" | ".PALETTE_SPRITE";

export type ScriptBuilderChoiceFlag = ".UI_MENU_LAST_0" | ".UI_MENU_CANCEL_B";

export type ScriptBuilderAxis = "x" | "y";

export type ScriptBuilderRPNOperation =
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
  | ".RND"
  | ".NEG"
  | ScriptBuilderComparisonOperator;

export type ScriptBuilderOverlayMoveSpeed =
  | number
  | ".OVERLAY_IN_SPEED"
  | ".OVERLAY_OUT_SPEED"
  | ".OVERLAY_SPEED_INSTANT";

export type ScriptBuilderUIColor = 0 | ".UI_COLOR_WHITE" | ".UI_COLOR_BLACK";

export type ScriptBuilderUnionValue =
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

export type ScriptBuilderPathFunction = () => void;

export type ResolvedActorId =
  | { type: "number"; value: number }
  | { type: "reference"; symbol: string };

type VariablesLookup = { [name: string]: Variable | undefined };

export type ScriptBuilderLocalSymbol = {
  symbol: string;
  size: number;
  addr: number;
  firstUse: number;
  lastUse: number;
};

export type SFXPriority = "low" | "medium" | "high";
export type ASMSFXPriority =
  | ".SFX_PRIORITY_MINIMAL"
  | ".SFX_PRIORITY_NORMAL"
  | ".SFX_PRIORITY_HIGH";

export type ASMSpriteMode = ".MODE_8X8" | ".MODE_8X16";

export type ScriptBuilderActorFlags =
  | ".ACTOR_FLAG_PINNED"
  | ".ACTOR_FLAG_HIDDEN"
  | ".ACTOR_FLAG_ANIM_NOLOOP"
  | ".ACTOR_FLAG_COLLISION"
  | ".ACTOR_FLAG_PERSISTENT";

export type RPNHandler = {
  ref: (variable: ScriptBuilderStackVariable) => RPNHandler;
  refInd: (variable: ScriptBuilderStackVariable) => RPNHandler;
  refVariable: (variable: ScriptBuilderVariable) => RPNHandler;
  int8: (value: number | string) => RPNHandler;
  int16: (value: number | string) => RPNHandler;
  refMem: (type: RPNMemType, address: string) => RPNHandler;
  intConstant: (value: string) => RPNHandler;
  operator: (op: ScriptBuilderRPNOperation) => RPNHandler;
  stop: () => void;
};

export type RPNMemType = ".MEM_I8" | ".MEM_U8" | ".MEM_I16";
