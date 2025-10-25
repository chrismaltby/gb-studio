const l10n = require("../helpers/l10n").default;

const id = "EVENT_DIALOGUE_CLOSE_NONMODAL";
const groups = ["EVENT_GROUP_DIALOGUE"];

const subGroups = {
  EVENT_GROUP_DIALOGUE: "EVENT_GROUP_PROPERTIES",
};

const fields = [
  {
    key: "speed",
    label: l10n("FIELD_SPEED"),
    description: l10n("FIELD_SPEED_DESC"),
    type: "cameraSpeed",
    defaultValue: 0,
  },
  {
    label: l10n("FIELD_DIALOGUE_CLOSE_NONMODAL_LABEL"),
    flexBasis: "100%",
  },
];

const compile = (input, helpers) => {
  const { textCloseNonModal } = helpers;

  const convertSpeed = (value) => {
    if (value > 0) {
      return value - 1;
    }
    if (value === 0) {
      return -3;
    }
    return -1;
  };

  textCloseNonModal(convertSpeed(input.speed));
};

module.exports = {
  id,
  description: l10n("EVENT_DIALOGUE_CLOSE_NONMODAL_DESC"),
  groups,
  subGroups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
