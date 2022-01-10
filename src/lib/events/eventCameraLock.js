const l10n = require("../helpers/l10n").default;

const id = "EVENT_CAMERA_LOCK";
const groups = ["EVENT_GROUP_CAMERA"];

const fields = [
  {
    key: "speed",
    width: "50%",
    label: l10n("FIELD_SPEED"),
    type: "cameraSpeed",
    defaultValue: 0,
  },
  {
    key: "axis",
    width: "50%",
    label: l10n("FIELD_LOCK_AXIS"),
    type: "togglebuttons",
    options: [
      ["x", "H", l10n("FIELD_HORIZONTAL")],
      ["y", "V", l10n("FIELD_VERTICAL")],
    ],
    allowMultiple: true,
    allowNone: false,
    defaultValue: ["x", "y"],
  },
];

const compile = (input, helpers) => {
  const { cameraLock } = helpers;
  cameraLock(Number(input.speed), input.axis);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
