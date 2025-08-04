const l10n = require("../helpers/l10n").default;

const id = "EVENT_CAMERA_LOCK";
const groups = ["EVENT_GROUP_CAMERA"];

const fields = [
  {
    key: "speed",
    width: "50%",
    label: l10n("FIELD_SPEED"),
    description: l10n("FIELD_SPEED_PLUS_INSTANT_DESC"),
    type: "moveSpeed",
    defaultValue: 1,
    allowNone: true,
    noneLabel: l10n("FIELD_INSTANT"),
  },
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
  cameraLock(Number(input.speed), input.axis, input.preventScroll);
};

module.exports = {
  id,
  description: l10n("EVENT_CAMERA_LOCK_DESC"),
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
