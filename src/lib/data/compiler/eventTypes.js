export const EVENT_END = "EVENT_END";
export const EVENT_WAIT = "EVENT_WAIT";

// Scenes
export const EVENT_SWITCH_SCENE = "EVENT_SWITCH_SCENE";
export const EVENT_START_BATTLE = "EVENT_START_BATTLE";
export const EVENT_RETURN_TO_TITLE = "EVENT_RETURN_TO_TITLE";

// Conditional
export const EVENT_IF_FLAG = "EVENT_IF_FLAG";
export const EVENT_SET_FLAG = "EVENT_SET_FLAG";
export const EVENT_CLEAR_FLAG = "EVENT_CLEAR_FLAG";

// Actor
export const EVENT_TEXT = "EVENT_TEXT";
export const EVENT_ACTOR_SET_DIRECTION = "EVENT_ACTOR_SET_DIRECTION";
export const EVENT_ACTOR_SET_POSITION = "EVENT_ACTOR_SET_POSITION";
export const EVENT_ACTOR_MOVE_TO = "EVENT_ACTOR_MOVE_TO";
export const EVENT_ACTOR_EMOTION = "EVENT_ACTOR_EMOTION";

// Camera
export const EVENT_CAMERA_MOVE_TO = "EVENT_CAMERA_MOVE_TO";
export const EVENT_CAMERA_LOCK = "EVENT_CAMERA_LOCK";
export const EVENT_CAMERA_SHAKE = "EVENT_CAMERA_SHAKE";
export const EVENT_FADE_OUT = "EVENT_FADE_OUT";
export const EVENT_FADE_IN = "EVENT_FADE_IN";
export const EVENT_SHOW_SPRITES = "EVENT_SHOW_SPRITES";
export const EVENT_HIDE_SPRITES = "EVENT_HIDE_SPRITES";
export const EVENT_SHOW_PLAYER = "EVENT_SHOW_PLAYER";
export const EVENT_HIDE_PLAYER = "EVENT_HIDE_PLAYER";

export const EventFields = {
  [EVENT_END]: [],
  [EVENT_SWITCH_SCENE]: [],
  [EVENT_WAIT]: [
    {
      key: "seconds",
      type: "number",
      label: "Seconds",
      min: 0,
      max: 4
    }
  ],
  [EVENT_IF_FLAG]: [
    {
      key: "flag",
      type: "flag"
    }
  ],
  [EVENT_SET_FLAG]: [
    {
      key: "flag",
      type: "flag"
    }
  ],
  [EVENT_CLEAR_FLAG]: [
    {
      key: "flag",
      type: "flag"
    }
  ],
  [EVENT_TEXT]: [
    {
      key: "text",
      type: "textarea",
      rows: 2,
      maxPerLine: 18
    }
  ]
};
