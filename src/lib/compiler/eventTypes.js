import trim2lines from "../helpers/trim2lines";

export const EVENT_END = "EVENT_END";
export const EVENT_STOP = "EVENT_STOP"; // Same as End except explicitly user created
export const EVENT_WAIT = "EVENT_WAIT";

// Scenes
export const EVENT_SWITCH_SCENE = "EVENT_SWITCH_SCENE";
export const EVENT_START_BATTLE = "EVENT_START_BATTLE";
export const EVENT_RETURN_TO_TITLE = "EVENT_RETURN_TO_TITLE";

// Data
export const EVENT_LOAD_DATA = "EVENT_LOAD_DATA";
export const EVENT_SAVE_DATA = "EVENT_SAVE_DATA";
export const EVENT_CLEAR_DATA = "EVENT_CLEAR_DATA";

// Conditional
export const EVENT_IF_TRUE = "EVENT_IF_TRUE";
export const EVENT_IF_FALSE = "EVENT_IF_FALSE";
export const EVENT_IF_VALUE = "EVENT_IF_VALUE";
export const EVENT_IF_INPUT = "EVENT_IF_INPUT";
export const EVENT_IF_ACTOR_DIRECTION = "EVENT_IF_ACTOR_DIRECTION";
export const EVENT_IF_SAVED_DATA = "EVENT_IF_SAVED_DATA";
export const EVENT_IF_ACTOR_AT_POSITION = "EVENT_IF_ACTOR_AT_POSITION";
export const EVENT_SET_TRUE = "EVENT_SET_TRUE";
export const EVENT_SET_FALSE = "EVENT_SET_FALSE";
export const EVENT_SET_VALUE = "EVENT_SET_VALUE";
export const EVENT_SET_RANDOM_VALUE = "EVENT_SET_RANDOM_VALUE";
export const EVENT_INC_VALUE = "EVENT_INC_VALUE";
export const EVENT_DEC_VALUE = "EVENT_DEC_VALUE";
export const EVENT_CHOICE = "EVENT_CHOICE";
export const EVENT_RESET_VARIABLES = "EVENT_RESET_VARIABLES";
export const EVENT_LOOP = "EVENT_LOOP";

// Input
export const EVENT_AWAIT_INPUT = "EVENT_AWAIT_INPUT";

// Actor
export const EVENT_TEXT = "EVENT_TEXT";
export const EVENT_ACTOR_SET_DIRECTION = "EVENT_ACTOR_SET_DIRECTION";
export const EVENT_ACTOR_SET_POSITION = "EVENT_ACTOR_SET_POSITION";
export const EVENT_ACTOR_MOVE_TO = "EVENT_ACTOR_MOVE_TO";
export const EVENT_ACTOR_PUSH = "EVENT_ACTOR_PUSH";
export const EVENT_ACTOR_EMOTE = "EVENT_ACTOR_EMOTE";
export const EVENT_PLAYER_SET_SPRITE = "EVENT_PLAYER_SET_SPRITE";

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

export const EventNames = {
  [EVENT_SWITCH_SCENE]: "Switch Scene",
  [EVENT_WAIT]: "Wait",
  [EVENT_CAMERA_SHAKE]: "Camera Shake",
  [EVENT_IF_TRUE]: "If Variable Is 'True'",
  [EVENT_IF_FALSE]: "If Variable Is 'False'",
  [EVENT_IF_VALUE]: "If Variable Has Value",
  [EVENT_IF_INPUT]: "If Joypad Input Pressed",
  [EVENT_IF_ACTOR_AT_POSITION]: "If Actor At Position",
  [EVENT_IF_ACTOR_DIRECTION]: "If Actor Facing Direction",
  [EVENT_SET_TRUE]: "Set Variable To 'True'",
  [EVENT_SET_FALSE]: "Reset Variable To 'False'",
  [EVENT_SET_VALUE]: "Set Variable To Value",
  [EVENT_SET_RANDOM_VALUE]: "Set Variable To Random Value",
  [EVENT_INC_VALUE]: "Increment Variable By 1",
  [EVENT_DEC_VALUE]: "Decrement Variable By 1",
  [EVENT_CHOICE]: "Multiple Choice",
  [EVENT_RESET_VARIABLES]: "Reset All Variables",
  [EVENT_LOOP]: "Loop Forever",
  [EVENT_TEXT]: "Display Text",
  [EVENT_CAMERA_MOVE_TO]: "Camera Move To",
  [EVENT_CAMERA_LOCK]: "Camera Lock To Player",
  [EVENT_FADE_IN]: "Fade In",
  [EVENT_FADE_OUT]: "Fade Out",
  [EVENT_ACTOR_SET_DIRECTION]: "Actor Set Direction",
  [EVENT_ACTOR_SET_POSITION]: "Actor Set Position",
  [EVENT_ACTOR_MOVE_TO]: "Actor Move To",
  [EVENT_ACTOR_PUSH]: "Push Actor",
  [EVENT_ACTOR_EMOTE]: "Actor Emote Bubble",
  [EVENT_ACTOR_SHOW]: "Show Actor",
  [EVENT_ACTOR_HIDE]: "Hide Actor",
  [EVENT_PLAYER_SET_SPRITE]: "Set Player Sprite Sheet",
  [EVENT_SHOW_SPRITES]: "Show Sprites",
  [EVENT_HIDE_SPRITES]: "Hide Sprites",
  [EVENT_OVERLAY_SHOW]: "Show Overlay",
  [EVENT_OVERLAY_HIDE]: "Hide Overlay",
  [EVENT_OVERLAY_MOVE_TO]: "Overlay Move To",
  [EVENT_AWAIT_INPUT]: "Await Joypad Input",
  [EVENT_MUSIC_PLAY]: "Play Music",
  [EVENT_MUSIC_STOP]: "Stop Music",
  [EVENT_STOP]: "Stop Script",
  [EVENT_LOAD_DATA]: "Load Game Data",
  [EVENT_SAVE_DATA]: "Save Game Data",
  [EVENT_CLEAR_DATA]: "Clear Game Data",
  [EVENT_IF_SAVED_DATA]: "If Saved Game Data"
};

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
      label: "X",
      type: "number",
      min: 0,
      max: 32,
      defaultValue: 0,
      width: "50%"
    },
    {
      key: "y",
      label: "Y",
      type: "number",
      min: 0,
      max: 32,
      defaultValue: 0,
      width: "50%"
    },
    {
      key: "direction",
      label: "Direction",
      type: "direction",
      width: "50%",
      defaultValue: ""
    },
    {
      key: "fadeSpeed",
      label: "Fade Speed",
      type: "fadeSpeed",
      defaultValue: "2",
      width: "50%"
    }
  ],
  [EVENT_WAIT]: [
    {
      key: "time",
      type: "number",
      label: "Seconds",
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
      label: "Seconds",
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
  [EVENT_IF_INPUT]: [
    {
      key: "input",
      label: "Any of",
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
      label: "X",
      type: "number",
      min: 0,
      max: 32,
      width: "50%",
      defaultValue: 0
    },
    {
      key: "y",
      label: "Y",
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
    },
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
      label: "Max value",
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
      label: "Reset ALL variables back to 'False'."
    }
  ],
  [EVENT_LOOP]: [
    {
      label: "Exit using 'Stop Script' or 'Switch Scene'."
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
      label: "Set to 'True' if",
      type: "text",
      maxLength: 17,
      defaultValue: "",
      placeholder: "Choice A"
    },
    {
      key: "falseText",
      label: "Set to 'False' if",
      type: "text",
      maxLength: 17,
      defaultValue: "",
      placeholder: "Choice B"
    }
  ],
  [EVENT_TEXT]: [
    {
      key: "text",
      type: "textarea",
      rows: 2,
      maxPerLine: 18,
      placeholder: "Text...",
      updateFn: trim2lines,
      defaultValue: ""
    }
  ],
  [EVENT_CAMERA_MOVE_TO]: [
    {
      key: "x",
      label: "X",
      type: "number",
      min: 0,
      max: 12,
      width: "50%",
      defaultValue: 0
    },
    {
      key: "y",
      label: "Y",
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
  [EVENT_ACTOR_SET_POSITION]: [
    {
      key: "actorId",
      type: "actor",
      defaultValue: "player"
    },
    {
      key: "x",
      label: "X",
      type: "number",
      min: 0,
      max: 32,
      width: "50%",
      defaultValue: 0
    },
    {
      key: "y",
      label: "Y",
      type: "number",
      min: 0,
      max: 32,
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
      label: "X",
      type: "number",
      min: 0,
      max: 32,
      width: "50%",
      defaultValue: 0
    },
    {
      key: "y",
      label: "Y",
      type: "number",
      min: 0,
      max: 32,
      width: "50%",
      defaultValue: 0
    }
  ],
  [EVENT_ACTOR_PUSH]: [
    {
      key: "continue",
      label: "Slide Until Collision",
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
  [EVENT_PLAYER_SET_SPRITE]: [
    {
      key: "spriteSheetId",
      type: "sprite",
      defaultValue: "LAST_SPRITE"
    }
  ],
  [EVENT_SHOW_SPRITES]: [
    {
      label: "Unhide all active sprites."
    }
  ],
  [EVENT_HIDE_SPRITES]: [
    {
      label: "Hide all sprites from screen."
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
      label: "X",
      type: "number",
      min: 0,
      max: 20,
      defaultValue: 0,
      width: "50%"
    },
    {
      key: "y",
      label: "Y",
      type: "number",
      min: 0,
      max: 18,
      defaultValue: 0,
      width: "50%"
    }
  ],
  [EVENT_OVERLAY_HIDE]: [
    {
      label: "Hides overlay window from screen."
    }
  ],
  [EVENT_OVERLAY_MOVE_TO]: [
    {
      key: "x",
      label: "X",
      type: "number",
      min: 0,
      max: 20,
      defaultValue: 0,
      width: "50%"
    },
    {
      key: "y",
      label: "Y",
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
      label: "Any of",
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
      label: "Loop",
      type: "checkbox",
      defaultValue: true
    }
  ],
  [EVENT_MUSIC_STOP]: [
    {
      label: "Stops any music that was previously playing."
    }
  ],
  [EVENT_STOP]: [
    {
      label: "Stops current script from running."
    }
  ],
  [EVENT_LOAD_DATA]: [
    {
      label: "Load game data from memory."
    }
  ],
  [EVENT_SAVE_DATA]: [
    {
      label: "Save current game data to memory."
    }
  ],
  [EVENT_CLEAR_DATA]: [
    {
      label: "Clear all saved game data from memory."
    }
  ],
  [EVENT_IF_SAVED_DATA]: [
    {
      label: "Run if player has saved a game."
    }
  ]
};
