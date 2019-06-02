import l10n from "../helpers/l10n";

export const id = "EVENT_SCENE_POP_STATE";

export const fields = [
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
];

export const compile = (input, helpers) => {
  const { scenePopState, scriptEnd } = helpers;
  scenePopState(input.fadeSpeed);
  scriptEnd();
};
