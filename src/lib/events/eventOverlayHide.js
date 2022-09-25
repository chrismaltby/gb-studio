const l10n = require("../helpers/l10n").default;

const id = "EVENT_OVERLAY_HIDE";
const groups = ["EVENT_GROUP_SCREEN"];

const fields = [
  {
    label: l10n("FIELD_OVERLAY_HIDE"),
  },
];

const compile = (input, helpers) => {
  const { overlayHide } = helpers;
  overlayHide();
};

module.exports = {
  id,
  description: l10n("EVENT_OVERLAY_HIDE_DESC"),
  groups,
  fields,
  compile,
};
