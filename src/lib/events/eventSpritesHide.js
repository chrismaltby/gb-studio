import l10n from "../helpers/l10n";

export const id = "EVENT_HIDE_SPRITES";

export const fields = [
  {
    label: l10n("FIELD_HIDE_SPRITES")
  }
];

export const compile = (input, helpers) => {
  const { spritesHide } = helpers;
  spritesHide();
};
