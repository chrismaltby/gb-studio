import l10n from "../helpers/l10n";

export const id = "EVENT_SWITCH_SCENE_BG";

export const fields = [
  {
    key: "sceneId",
    type: "scene",
    defaultValue: "LAST_SCENE"
  }
];

export const compile = (input, helpers) => {
  const { sceneSwitchBG } = helpers;
  sceneSwitchBG(
    input.sceneId
  );
};
