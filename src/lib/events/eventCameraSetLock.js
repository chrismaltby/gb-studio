const l10n = require("../helpers/l10n").default;

const id = "EVENT_CAMERA_SET_LOCK";
const groups = ["EVENT_GROUP_CAMERA"];

const fields = [
  {
    key: "axis",
    width: "50%",
    label: l10n("FIELD_LOCK_AXIS"),
    description: l10n("FIELD_LOCK_AXIS_DESC"),
    type: "togglebuttons",
    options: [
      ["x", "H", l10n("FIELD_HORIZONTAL")],
      ["y", "V", l10n("FIELD_VERTICAL")],
    ],
    allowMultiple: true,
    allowNone: false,
    defaultValue: ["x", "y"],
  },
  {
    key: "preventScroll",
    label: l10n("FIELD_PREVENT_BACKTRACKING"),
    description: l10n("FIELD_PREVENT_BACKTRACKING_DESC"),
    type: "direction",
    allowMultiple: true,
  },
];

const compile = (input, helpers) => {
  const { cameraLock } = helpers;
  cameraLock(0, input.axis, input.preventScroll);
};

module.exports = {
  id,
  description: l10n("EVENT_CAMERA_SET_LOCK_DESC"),
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: false,
};
