import trimlines from "../helpers/trimlines";
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
export const EVENT_IF_TRUE = "EVENT_IF_TRUE";
export const EVENT_IF_FALSE = "EVENT_IF_FALSE";
export const EVENT_IF_VALUE = "EVENT_IF_VALUE";
export const EVENT_IF_VALUE_COMPARE = "EVENT_IF_VALUE_COMPARE";
export const EVENT_IF_INPUT = "EVENT_IF_INPUT";
export const EVENT_IF_ACTOR_DIRECTION = "EVENT_IF_ACTOR_DIRECTION";
export const EVENT_IF_SAVED_DATA = "EVENT_IF_SAVED_DATA";
export const EVENT_IF_ACTOR_AT_POSITION = "EVENT_IF_ACTOR_AT_POSITION";
export const EVENT_SET_TRUE = "EVENT_SET_TRUE";
export const EVENT_SET_FALSE = "EVENT_SET_FALSE";
export const EVENT_CHOICE = "EVENT_CHOICE";
export const EVENT_RESET_VARIABLES = "EVENT_RESET_VARIABLES";
export const EVENT_LOOP = "EVENT_LOOP";
export const EVENT_GROUP = "EVENT_GROUP";

// Math
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

// Input
export const EVENT_AWAIT_INPUT = "EVENT_AWAIT_INPUT";

// Actor
export const EVENT_TEXT = "EVENT_TEXT";
export const EVENT_TEXT_SET_ANIMATION_SPEED = "EVENT_TEXT_SET_ANIMATION_SPEED";
export const EVENT_ACTOR_SET_DIRECTION = "EVENT_ACTOR_SET_DIRECTION";
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
export const EVENT_ACTOR_SET_POSITION_TO_VALUE =
  "EVENT_ACTOR_SET_POSITION_TO_VALUE";
export const EVENT_ACTOR_MOVE_TO_VALUE = "EVENT_ACTOR_MOVE_TO_VALUE";
export const EVENT_ACTOR_INVOKE = "EVENT_ACTOR_INVOKE";

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

// Overlay
export const EVENT_OVERLAY_SHOW = "EVENT_OVERLAY_SHOW";
export const EVENT_OVERLAY_HIDE = "EVENT_OVERLAY_HIDE";
export const EVENT_OVERLAY_MOVE_TO = "EVENT_OVERLAY_MOVE_TO";

// Music
export const EVENT_MUSIC_PLAY = "EVENT_MUSIC_PLAY";
export const EVENT_MUSIC_STOP = "EVENT_MUSIC_STOP";

export const EventsOnlyForActors = [EVENT_ACTOR_PUSH];

export const EventFields = {
  [EVENT_SWITCH_SCENE]: [
    {
      key: "sceneId",
      type: "scene",
      defaultValue: "LAST_SCENE"
    },
    {
      key: "x",
      label: l10n("FIELD_X"),
      type: "number",
      min: 0,
      max: 32,
      defaultValue: 0,
      width: "50%"
    },
    {
      key: "y",
      label: l10n("FIELD_Y"),
      type: "number",
      min: 0,
      max: 32,
      defaultValue: 0,
      width: "50%"
    },
    {
      key: "direction",
      label: l10n("FIELD_DIRECTION"),
      type: "direction",
      width: "50%",
      defaultValue: ""
    },
    {
      key: "fadeSpeed",
      label: l10n("FIELD_FADE_SPEED"),
      type: "fadeSpeed",
      defaultValue: "2",
      width: "50%"
    }
  ],
  [EVENT_SCENE_PUSH_STATE]: [
    {
      label: l10n("FIELD_SCENE_PUSH_STATE_DESCRIPTION")
    }
  ],
  [EVENT_SCENE_POP_STATE]: [
    {
      label: l10n("FIELD_SCENE_POP_STATE_DESCRIPTION")
    },
    {
      key: "fadeSpeed",
      label: l10n("FIELD_FADE_SPEED"),
      type: "fadeSpeed",
      defaultValue: "2",
      width: "50%"
    }
  ],
  [EVENT_SCENE_RESET_STATE]: [
    {
      label: l10n("FIELD_SCENE_RESET_STATE_DESCRIPTION")
    }
  ],
  [EVENT_SCENE_POP_ALL_STATE]: [
    {
      label: l10n("FIELD_SCENE_POP_ALL_STATE_DESCRIPTION")
    },
    {
      key: "fadeSpeed",
      label: l10n("FIELD_FADE_SPEED"),
      type: "fadeSpeed",
      defaultValue: "2",
      width: "50%"
    }
  ],
  [EVENT_WAIT]: [
    {
      key: "time",
      type: "number",
      label: l10n("FIELD_SECONDS"),
      min: 0,
      max: 10,
      step: 0.1,
      defaultValue: 0.5
    }
  ],
  [EVENT_CAMERA_SHAKE]: [
    {
      key: "time",
      type: "number",
      label: l10n("FIELD_SECONDS"),
      min: 0,
      max: 10,
      step: 0.1,
      defaultValue: 0.5
    }
  ],
  [EVENT_IF_TRUE]: [
    {
      key: "variable",
      type: "variable",
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_IF_FALSE]: [
    {
      key: "variable",
      type: "variable",
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_IF_VALUE]: [
    {
      key: "variable",
      type: "variable",
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "operator",
      type: "operator",
      width: "50%",
      defaultValue: "=="
    },
    {
      key: "comparator",
      type: "number",
      min: 0,
      max: 255,
      width: "50%",
      defaultValue: "0"
    }
  ],
  [EVENT_IF_VALUE_COMPARE]: [
    {
      key: "vectorX",
      type: "variable",
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "operator",
      type: "operator",
      width: "50%",
      defaultValue: "=="
    },
    {
      key: "vectorY",
      type: "variable",
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_IF_INPUT]: [
    {
      key: "input",
      label: l10n("FIELD_ANY_OF"),
      type: "input",
      defaultValue: ["a", "b"]
    }
  ],
  [EVENT_IF_ACTOR_AT_POSITION]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    },
    {
      key: "x",
      label: l10n("FIELD_X"),
      type: "number",
      min: 0,
      max: 32,
      width: "50%",
      defaultValue: 0
    },
    {
      key: "y",
      label: l10n("FIELD_Y"),
      type: "number",
      min: 0,
      max: 32,
      width: "50%",
      defaultValue: 0
    }
  ],
  [EVENT_IF_ACTOR_DIRECTION]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    },
    {
      key: "direction",
      type: "direction",
      defaultValue: "up"
    }
  ],
  [EVENT_SET_TRUE]: [
    {
      key: "variable",
      type: "variable",
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_SET_FALSE]: [
    {
      key: "variable",
      type: "variable",
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_SET_VALUE]: [
    {
      key: "variable",
      type: "variable",
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "value",
      type: "number",
      min: 0,
      max: 255,
      defaultValue: "0"
    }
  ],
  [EVENT_SET_RANDOM_VALUE]: [
    {
      key: "variable",
      type: "variable",
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "maxValue",
      type: "number",
      min: 0,
      max: 255,
      label: l10n("FIELD_MAX_VALUE"),
      defaultValue: "255"
    }
  ],
  [EVENT_INC_VALUE]: [
    {
      key: "variable",
      type: "variable",
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_DEC_VALUE]: [
    {
      key: "variable",
      type: "variable",
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_RESET_VARIABLES]: [
    {
      label: l10n("FIELD_RESET_VARIABLES")
    }
  ],
  [EVENT_LOOP]: [
    {
      label: l10n("FIELD_LOOP_EXIT")
    }
  ],
  [EVENT_GROUP]: [
    {
      key: "__label",
      type: "text",
      placeholder: l10n("FIELD_LABEL"),
      defaultValue: ""
    }
  ],
  [EVENT_CHOICE]: [
    {
      key: "variable",
      type: "variable",
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "trueText",
      label: l10n("FIELD_SET_TRUE_IF"),
      type: "text",
      maxLength: 17,
      defaultValue: "",
      placeholder: l10n("FIELD_CHOICE_A")
    },
    {
      key: "falseText",
      label: l10n("FIELD_SET_FALSE_IF"),
      type: "text",
      maxLength: 17,
      defaultValue: "",
      placeholder: l10n("FIELD_CHOICE_B")
    }
  ],
  [EVENT_TEXT]: [
    {
      key: "text",
      type: "textarea",
      rows: 2,
      maxPerLine: 18,
      placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
      updateFn: trimlines,
      defaultValue: ""
    }
  ],
  [EVENT_TEXT_SET_ANIMATION_SPEED]: [
    {
      label: l10n("TEXT_SPEED_IN"),
      key: "speedIn",
      type: "cameraSpeed",
      defaultValue: 1,
      width: "50%"
    },
    {
      label: l10n("TEXT_SPEED_OUT"),
      key: "speedOut",
      type: "cameraSpeed",
      defaultValue: 1,
      width: "50%"
    },
    {
      label: l10n("TEXT_SPEED"),
      key: "speed",
      type: "cameraSpeed",
      defaultValue: 1
    }
  ],
  [EVENT_CAMERA_MOVE_TO]: [
    {
      key: "x",
      label: l10n("FIELD_X"),
      type: "number",
      min: 0,
      max: 12,
      width: "50%",
      defaultValue: 0
    },
    {
      key: "y",
      label: l10n("FIELD_Y"),
      type: "number",
      min: 0,
      max: 14,
      width: "50%",
      defaultValue: 0
    },
    {
      key: "speed",
      type: "cameraSpeed",
      defaultValue: "0"
    }
  ],
  [EVENT_CAMERA_LOCK]: [
    {
      key: "speed",
      type: "cameraSpeed",
      defaultValue: "0"
    }
  ],
  [EVENT_FADE_IN]: [
    {
      key: "speed",
      type: "fadeSpeed",
      defaultValue: "2"
    }
  ],
  [EVENT_FADE_OUT]: [
    {
      key: "speed",
      type: "fadeSpeed",
      defaultValue: "2"
    }
  ],
  [EVENT_ACTOR_SET_DIRECTION]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    },
    {
      key: "direction",
      type: "direction",
      defaultValue: "up"
    }
  ],
  [EVENT_ACTOR_SET_ANIMATION_SPEED]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    },
    {
      key: "speed",
      type: "animSpeed",
      defaultValue: "3"
    }
  ],
  [EVENT_ACTOR_SET_MOVEMENT_SPEED]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    },
    {
      key: "speed",
      type: "moveSpeed",
      defaultValue: "1"
    }
  ],
  [EVENT_ACTOR_GET_POSITION]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    },
    {
      key: "vectorX",
      type: "variable",
      label: l10n("FIELD_X"),
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "vectorY",
      type: "variable",
      label: l10n("FIELD_Y"),
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_ACTOR_SET_POSITION]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    },
    {
      key: "x",
      label: l10n("FIELD_X"),
      type: "number",
      min: 0,
      max: 32,
      width: "50%",
      defaultValue: 0
    },
    {
      key: "y",
      label: l10n("FIELD_Y"),
      type: "number",
      min: 0,
      max: 32,
      width: "50%",
      defaultValue: 0
    }
  ],
  [EVENT_ACTOR_SET_POSITION_RELATIVE]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    },
    {
      key: "x",
      label: l10n("FIELD_X"),
      type: "number",
      min: -16,
      max: 16,
      width: "50%",
      defaultValue: 0
    },
    {
      key: "y",
      label: l10n("FIELD_Y"),
      type: "number",
      min: -16,
      max: 16,
      width: "50%",
      defaultValue: 0
    }
  ],
  [EVENT_ACTOR_SET_POSITION_TO_VALUE]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    },
    {
      key: "vectorX",
      type: "variable",
      label: l10n("FIELD_X"),
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "vectorY",
      type: "variable",
      label: l10n("FIELD_Y"),
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_ACTOR_MOVE_RELATIVE]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    },
    {
      key: "x",
      label: l10n("FIELD_X"),
      type: "number",
      min: -16,
      max: 16,
      width: "50%",
      defaultValue: 0
    },
    {
      key: "y",
      label: l10n("FIELD_Y"),
      type: "number",
      min: -16,
      max: 16,
      width: "50%",
      defaultValue: 0
    }
  ],
  [EVENT_ACTOR_MOVE_TO]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    },
    {
      key: "x",
      label: l10n("FIELD_X"),
      type: "number",
      min: 0,
      max: 32,
      width: "50%",
      defaultValue: 0
    },
    {
      key: "y",
      label: l10n("FIELD_Y"),
      type: "number",
      min: 0,
      max: 32,
      width: "50%",
      defaultValue: 0
    }
  ],
  [EVENT_ACTOR_MOVE_TO_VALUE]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    },
    {
      key: "vectorX",
      type: "variable",
      label: l10n("FIELD_X"),
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "vectorY",
      type: "variable",
      label: l10n("FIELD_Y"),
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_ACTOR_PUSH]: [
    {
      key: "continue",
      label: l10n("FIELD_SLIDE_UNTIL_COLLISION"),
      type: "checkbox",
      defaultValue: false
    }
  ],
  [EVENT_ACTOR_EMOTE]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    },
    {
      key: "emoteId",
      type: "emote",
      defaultValue: 0
    }
  ],
  // [EVENT_RETURN_TO_TITLE]: [],
  [EVENT_ACTOR_SHOW]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    }
  ],
  [EVENT_ACTOR_HIDE]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    }
  ],
  [EVENT_ACTOR_INVOKE]: [
    {
      label: l10n("FIELD_ACTOR_INVOKE")
    },
    {
      key: "actorId",
      type: "actor",
      defaultValue: "LAST_ACTOR"
    }
  ],
  [EVENT_PLAYER_SET_SPRITE]: [
    {
      key: "spriteSheetId",
      type: "sprite",
      defaultValue: "LAST_SPRITE"
    }
  ],
  [EVENT_SHOW_SPRITES]: [
    {
      label: l10n("FIELD_UNHIDE_SPRITES")
    }
  ],
  [EVENT_HIDE_SPRITES]: [
    {
      label: l10n("FIELD_HIDE_SPRITES")
    }
  ],
  [EVENT_OVERLAY_SHOW]: [
    {
      key: "color",
      type: "overlayColor",
      defaultValue: "black"
    },
    {
      key: "x",
      label: l10n("FIELD_X"),
      type: "number",
      min: 0,
      max: 20,
      defaultValue: 0,
      width: "50%"
    },
    {
      key: "y",
      label: l10n("FIELD_Y"),
      type: "number",
      min: 0,
      max: 18,
      defaultValue: 0,
      width: "50%"
    }
  ],
  [EVENT_OVERLAY_HIDE]: [
    {
      label: l10n("FIELD_OVERLAY_HIDE")
    }
  ],
  [EVENT_OVERLAY_MOVE_TO]: [
    {
      key: "x",
      label: l10n("FIELD_X"),
      type: "number",
      min: 0,
      max: 20,
      defaultValue: 0,
      width: "50%"
    },
    {
      key: "y",
      label: l10n("FIELD_Y"),
      type: "number",
      min: 0,
      max: 18,
      defaultValue: 0,
      width: "50%"
    },
    {
      key: "speed",
      type: "cameraSpeed",
      defaultValue: "0"
    }
  ],
  [EVENT_AWAIT_INPUT]: [
    {
      key: "input",
      label: l10n("FIELD_ANY_OF"),
      type: "input",
      defaultValue: ["a", "b"]
    }
  ],
  [EVENT_MUSIC_PLAY]: [
    {
      key: "musicId",
      type: "music",
      defaultValue: "LAST_MUSIC"
    },
    {
      key: "loop",
      label: l10n("FIELD_LOOP"),
      type: "checkbox",
      defaultValue: true
    }
  ],
  [EVENT_MUSIC_STOP]: [
    {
      label: l10n("FIELD_STOP_MUSIC")
    }
  ],
  [EVENT_STOP]: [
    {
      label: l10n("FIELD_STOP_SCRIPT")
    }
  ],
  [EVENT_LOAD_DATA]: [
    {
      label: l10n("FIELD_LOAD_DATA")
    }
  ],
  [EVENT_SAVE_DATA]: [
    {
      label: l10n("FIELD_SAVE_DATA")
    }
  ],
  [EVENT_CLEAR_DATA]: [
    {
      label: l10n("FIELD_CLEAR_DATA")
    }
  ],
  [EVENT_IF_SAVED_DATA]: [
    {
      label: l10n("FIELD_IF_SAVED_DATA")
    }
  ],
  [EVENT_MATH_ADD]: [
    {
      key: "value",
      type: "number",
      label: l10n("FIELD_ADD_VALUE"),
      min: 0,
      max: 255,
      defaultValue: "0"
    },
    {
      key: "variable",
      type: "variable",
      label: l10n("FIELD_TO_VARIABLE"),
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_MATH_SUB]: [
    {
      key: "value",
      type: "number",
      min: 0,
      max: 255,
      label: l10n("FIELD_SUB_VALUE"),
      defaultValue: "0"
    },
    {
      key: "variable",
      type: "variable",
      label: l10n("FIELD_FROM_VARIABLE"),
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_MATH_MUL]: [
    {
      key: "variable",
      type: "variable",
      label: l10n("FIELD_MUL_VARIABLE"),
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "value",
      type: "number",
      min: 0,
      max: 255,
      label: l10n("FIELD_BY_VALUE"),
      defaultValue: "0"
    }
  ],
  [EVENT_MATH_DIV]: [
    {
      key: "variable",
      type: "variable",
      label: l10n("FIELD_DIV_VARIABLE"),
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "value",
      type: "number",
      min: 0,
      max: 255,
      label: l10n("FIELD_BY_VALUE"),
      defaultValue: "0"
    }
  ],
  [EVENT_MATH_MOD]: [
    {
      key: "variable",
      type: "variable",
      label: l10n("FIELD_MOD_VARIABLE"),
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "value",
      type: "number",
      min: 0,
      max: 255,
      label: l10n("FIELD_BY_VALUE"),
      defaultValue: "0"
    }
  ],
  [EVENT_MATH_ADD_VALUE]: [
    {
      key: "vectorY",
      type: "variable",
      label: l10n("FIELD_ADD_VALUE_FROM"),
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "vectorX",
      type: "variable",
      label: l10n("FIELD_TO_VARIABLE"),
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_MATH_SUB_VALUE]: [
    {
      key: "vectorY",
      type: "variable",
      label: l10n("FIELD_SUB_VALUE"),
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "vectorX",
      type: "variable",
      label: l10n("FIELD_BY_VALUE"),
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_MATH_MUL_VALUE]: [
    {
      key: "vectorX",
      type: "variable",
      label: l10n("FIELD_MUL_VARIABLE"),
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "vectorY",
      type: "variable",
      label: l10n("FIELD_BY_VALUE"),
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_MATH_DIV_VALUE]: [
    {
      key: "vectorX",
      type: "variable",
      label: l10n("FIELD_DIV_VARIABLE"),
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "vectorY",
      type: "variable",
      label: l10n("FIELD_BY_VALUE"),
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_MATH_MOD_VALUE]: [
    {
      key: "vectorX",
      type: "variable",
      label: l10n("FIELD_MOD_VARIABLE"),
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "vectorY",
      type: "variable",
      label: l10n("FIELD_BY_VALUE"),
      defaultValue: "LAST_VARIABLE"
    }
  ],
  [EVENT_COPY_VALUE]: [
    {
      key: "vectorY",
      type: "variable",
      label: "Copy Variable",
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "vectorX",
      type: "variable",
      label: "To Variable",
      defaultValue: "LAST_VARIABLE"
    }
  ]
};
