import l10n from "../helpers/l10n";

export const id = "EVENT_SCENE_RESET_STATE";

export const fields = [
  {
    label: l10n("FIELD_SCENE_RESET_STATE_DESCRIPTION")
  }
];

export const compile = (input, helpers) => {
  const { sceneResetState } = helpers;
  sceneResetState();
};
