const l10n = require("../helpers/l10n");

const id = "EVENT_OVERLAY_HIDE";

const fields = [
  {
    label: l10n("FIELD_OVERLAY_HIDE")
  }
];

const compile = (input, helpers) => {
  const { overlayHide } = helpers;
  overlayHide();
};

module.exports = {
  id,
  fields,
  compile
};
