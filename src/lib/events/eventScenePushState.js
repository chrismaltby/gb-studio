import l10n from "../helpers/l10n";

export const id = "EVENT_SCENE_PUSH_STATE";

export const fields = [
  {
    label: l10n("FIELD_SCENE_PUSH_STATE_DESCRIPTION")
  }
];

export const compile = (input, helpers) => {
  const { scenePushState } = helpers;
  scenePushState();
};
