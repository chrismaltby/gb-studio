import l10n from "../helpers/l10n";

export const id = "EVENT_OVERLAY_HIDE";

export const fields = [
  {
    label: l10n("FIELD_OVERLAY_HIDE")
  }
];

export const compile = (input, helpers) => {
  const { overlayHide } = helpers;
  overlayHide();
};
