import l10n from "../helpers/l10n";

export const EVENT_END = "EVENT_END";
export const EVENT_STOP = "EVENT_STOP"; // Same as End except explicitly user created
export const EVENT_WAIT = "EVENT_WAIT";

// Scenes
export const EVENT_SWITCH_SCENE = "EVENT_SWITCH_SCENE";
export const EVENT_START_BATTLE = "EVENT_START_BATTLE";
export const EVENT_RETURN_TO_TITLE = "EVENT_RETURN_TO_TITLE";
export const EVENT_SCENE_PUSH_STATE = "EVENT_SCENE_PUSH_STATE";
export const EVENT_SCENE_POP_STATE = "EVENT_SCENE_POP_STATE";
export const EVENT_SCENE_RESET_STATE = "EVENT_SCENE_RESET_STATE";
export const EVENT_SCENE_POP_ALL_STATE = "EVENT_SCENE_POP_ALL_STATE";

// Data
export const EVENT_LOAD_DATA = "EVENT_LOAD_DATA";
export const EVENT_SAVE_DATA = "EVENT_SAVE_DATA";
export const EVENT_CLEAR_DATA = "EVENT_CLEAR_DATA";

// Conditional
export const EVENT_IF_EXPRESSION = "EVENT_IF_EXPRESSION";
export const EVENT_IF_TRUE = "EVENT_IF_TRUE";
export const EVENT_IF_FALSE = "EVENT_IF_FALSE";
export const EVENT_IF_VALUE = "EVENT_IF_VALUE";
export const EVENT_IF_VALUE_COMPARE = "EVENT_IF_VALUE_COMPARE";
export const EVENT_IF_INPUT = "EVENT_IF_INPUT";
export const EVENT_IF_ACTOR_DIRECTION = "EVENT_IF_ACTOR_DIRECTION";
export const EVENT_IF_ACTOR_RELATIVE_TO_ACTOR =
  "EVENT_IF_ACTOR_RELATIVE_TO_ACTOR";
export const EVENT_IF_ACTOR_DISTANCE_FROM_ACTOR =
  "EVENT_IF_ACTOR_DISTANCE_FROM_ACTOR";
export const EVENT_IF_SAVED_DATA = "EVENT_IF_SAVED_DATA";
export const EVENT_IF_ACTOR_AT_POSITION = "EVENT_IF_ACTOR_AT_POSITION";
export const EVENT_SET_TRUE = "EVENT_SET_TRUE";
export const EVENT_SET_FALSE = "EVENT_SET_FALSE";
export const EVENT_CHOICE = "EVENT_CHOICE";
export const EVENT_RESET_VARIABLES = "EVENT_RESET_VARIABLES";
export const EVENT_LOOP = "EVENT_LOOP";
export const EVENT_GROUP = "EVENT_GROUP";
export const EVENT_MENU = "EVENT_MENU";
export const EVENT_COMMENT = "EVENT_COMMENT";

// Background Scripts
export const EVENT_SET_INPUT_SCRIPT = "EVENT_SET_INPUT_SCRIPT";
export const EVENT_SET_BACKGROUND_SCRIPT = "EVENT_SET_BACKGROUND_SCRIPT";
export const EVENT_REMOVE_INPUT_SCRIPT = "EVENT_REMOVE_INPUT_SCRIPT";

// Math
export const EVENT_VARIABLE_MATH = "EVENT_VARIABLE_MATH";
export const EVENT_SET_VALUE = "EVENT_SET_VALUE";
export const EVENT_SET_RANDOM_VALUE = "EVENT_SET_RANDOM_VALUE";
export const EVENT_INC_VALUE = "EVENT_INC_VALUE";
export const EVENT_DEC_VALUE = "EVENT_DEC_VALUE";
export const EVENT_MATH_ADD = "EVENT_MATH_ADD";
export const EVENT_MATH_SUB = "EVENT_MATH_SUB";
export const EVENT_MATH_MUL = "EVENT_MATH_MUL";
export const EVENT_MATH_DIV = "EVENT_MATH_DIV";
export const EVENT_MATH_MOD = "EVENT_MATH_MOD";
export const EVENT_MATH_ADD_VALUE = "EVENT_MATH_ADD_VALUE";
export const EVENT_MATH_SUB_VALUE = "EVENT_MATH_SUB_VALUE";
export const EVENT_MATH_MUL_VALUE = "EVENT_MATH_MUL_VALUE";
export const EVENT_MATH_DIV_VALUE = "EVENT_MATH_DIV_VALUE";
export const EVENT_MATH_MOD_VALUE = "EVENT_MATH_MOD_VALUE";
export const EVENT_COPY_VALUE = "EVENT_COPY_VALUE";
export const EVENT_SET_FLAGS = "EVENT_SET_FLAGS";
export const EVENT_ADD_FLAGS = "EVENT_ADD_FLAGS";
export const EVENT_CLEAR_FLAGS = "EVENT_CLEAR_FLAGS";
export const EVENT_IF_FLAGS_COMPARE = "EVENT_IF_FLAGS_COMPARE";

// Input
export const EVENT_AWAIT_INPUT = "EVENT_AWAIT_INPUT";

// Actor
export const EVENT_TEXT = "EVENT_TEXT";
export const EVENT_TEXT_SET_ANIMATION_SPEED = "EVENT_TEXT_SET_ANIMATION_SPEED";
export const EVENT_ACTOR_SET_DIRECTION = "EVENT_ACTOR_SET_DIRECTION";
export const EVENT_ACTOR_SET_DIRECTION_TO_VALUE =
  "EVENT_ACTOR_SET_DIRECTION_TO_VALUE";
export const EVENT_ACTOR_SET_POSITION = "EVENT_ACTOR_SET_POSITION";
export const EVENT_ACTOR_SET_POSITION_RELATIVE =
  "EVENT_ACTOR_SET_POSITION_RELATIVE";
export const EVENT_ACTOR_MOVE_RELATIVE = "EVENT_ACTOR_MOVE_RELATIVE";
export const EVENT_ACTOR_MOVE_TO = "EVENT_ACTOR_MOVE_TO";
export const EVENT_ACTOR_PUSH = "EVENT_ACTOR_PUSH";
export const EVENT_ACTOR_SET_ANIMATION_SPEED =
  "EVENT_ACTOR_SET_ANIMATION_SPEED";
export const EVENT_ACTOR_SET_MOVEMENT_SPEED = "EVENT_ACTOR_SET_MOVEMENT_SPEED";
export const EVENT_ACTOR_EMOTE = "EVENT_ACTOR_EMOTE";
export const EVENT_PLAYER_SET_SPRITE = "EVENT_PLAYER_SET_SPRITE";
export const EVENT_ACTOR_GET_POSITION = "EVENT_ACTOR_GET_POSITION";
export const EVENT_ACTOR_GET_DIRECION = "EVENT_ACTOR_GET_DIRECTION";
export const EVENT_ACTOR_SET_POSITION_TO_VALUE =
  "EVENT_ACTOR_SET_POSITION_TO_VALUE";
export const EVENT_ACTOR_MOVE_TO_VALUE = "EVENT_ACTOR_MOVE_TO_VALUE";
export const EVENT_ACTOR_INVOKE = "EVENT_ACTOR_INVOKE";
export const EVENT_ACTOR_SET_FRAME = "EVENT_ACTOR_SET_FRAME";
export const EVENT_ACTOR_SET_FRAME_TO_VALUE = "EVENT_ACTOR_SET_FRAME_TO_VALUE";
export const EVENT_ACTOR_SET_SPRITE = "EVENT_ACTOR_SET_SPRITE";

// Camera
export const EVENT_CAMERA_MOVE_TO = "EVENT_CAMERA_MOVE_TO";
export const EVENT_CAMERA_LOCK = "EVENT_CAMERA_LOCK";
export const EVENT_CAMERA_SHAKE = "EVENT_CAMERA_SHAKE";
export const EVENT_FADE_OUT = "EVENT_FADE_OUT";
export const EVENT_FADE_IN = "EVENT_FADE_IN";
export const EVENT_SHOW_SPRITES = "EVENT_SHOW_SPRITES";
export const EVENT_HIDE_SPRITES = "EVENT_HIDE_SPRITES";
export const EVENT_ACTOR_SHOW = "EVENT_ACTOR_SHOW";
export const EVENT_ACTOR_HIDE = "EVENT_ACTOR_HIDE";

// Palettes
export const EVENT_PALETTE_SET_BACKGROUND = "EVENT_PALETTE_SET_BACKGROUND";
export const EVENT_PALETTE_SET_ACTOR = "EVENT_PALETTE_SET_ACTOR";
export const EVENT_PALETTE_SET_UI = "EVENT_PALETTE_SET_UI";

// Overlay
export const EVENT_OVERLAY_SHOW = "EVENT_OVERLAY_SHOW";
export const EVENT_OVERLAY_HIDE = "EVENT_OVERLAY_HIDE";
export const EVENT_OVERLAY_MOVE_TO = "EVENT_OVERLAY_MOVE_TO";

// Music
export const EVENT_MUSIC_PLAY = "EVENT_MUSIC_PLAY";
export const EVENT_MUSIC_STOP = "EVENT_MUSIC_STOP";

// Sound
export const EVENT_SOUND_PLAY_BEEP = "EVENT_SOUND_PLAY_BEEP";
export const EVENT_SOUND_PLAY_EFFECT = "EVENT_SOUND_PLAY_EFFECT";

// Call CustomEvent
export const EVENT_CALL_CUSTOM_EVENT = "EVENT_CALL_CUSTOM_EVENT";

// Engine fields
export const EVENT_ENGINE_FIELD_SET = "EVENT_ENGINE_FIELD_SET";
export const EVENT_ENGINE_FIELD_STORE = "EVENT_ENGINE_FIELD_STORE";

// Real Time Clock (RTC)
export const EVENT_RTC_START = "EVENT_RTC_START";
export const EVENT_RTC_STOP = "EVENT_RTC_STOP";
export const EVENT_RTC_RESET = "EVENT_RTC_RESET";
export const EVENT_RTC_GET = "EVENT_RTC_GET";
export const EVENT_RTC_GET_ALL = "EVENT_RTC_GET_ALL";
export const EVENT_RTC_SET = "EVENT_RTC_SET";
export const EVENT_RTC_SET_ALL = "EVENT_RTC_SET_ALL";

export const EventsOnlyForActors = [EVENT_ACTOR_PUSH];
export const EventsHidden = [
  EVENT_MATH_ADD,
  EVENT_MATH_SUB,
  EVENT_MATH_MUL,
  EVENT_MATH_DIV,
  EVENT_MATH_MOD,
  EVENT_COPY_VALUE,
  EVENT_SET_RANDOM_VALUE,
  EVENT_MATH_ADD_VALUE,
  EVENT_MATH_SUB_VALUE,
  EVENT_MATH_MUL_VALUE,
  EVENT_MATH_DIV_VALUE,
  EVENT_MATH_MOD_VALUE,
  EVENT_CALL_CUSTOM_EVENT,
  EVENT_ACTOR_SET_POSITION_TO_VALUE,
  EVENT_ACTOR_MOVE_TO_VALUE,
  EVENT_ACTOR_SET_DIRECTION_TO_VALUE,
  EVENT_ACTOR_SET_FRAME_TO_VALUE,
];

export const EventFields = {
  [EVENT_LOOP]: [
    {
      label: l10n("FIELD_LOOP_EXIT"),
    },
  ],
  [EVENT_GROUP]: [],
  [EVENT_COMMENT]: [],
  [EVENT_SET_INPUT_SCRIPT]: [
    {
      key: "input",
      label: l10n("FIELD_ON_PRESS"),
      type: "input",
      defaultValue: "b",
    },
  ],
  [EVENT_REMOVE_INPUT_SCRIPT]: [
    {
      key: "input",
      label: l10n("FIELD_REMOVE_INPUT_SCRIPT_ON"),
      type: "input",
      defaultValue: ["b"],
    },
  ],
  [EVENT_STOP]: [
    {
      label: l10n("FIELD_STOP_SCRIPT"),
    },
  ],
};
