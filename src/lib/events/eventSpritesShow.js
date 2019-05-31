import l10n from "../helpers/l10n";

export const id = "EVENT_SHOW_SPRITES";

export const fields = [
  {
    label: l10n("FIELD_UNHIDE_SPRITES")
  }
];

export const compile = (input, helpers) => {
  const { spritesShow } = helpers;
  spritesShow();
};
