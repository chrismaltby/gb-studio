const l10n = require("../helpers/l10n").default;

const id = "EVENT_CAMERA_PROPERTY_SET";
const groups = ["EVENT_GROUP_CAMERA"];
const subGroups = {
  EVENT_GROUP_CAMERA: "EVENT_GROUP_PROPERTIES",
};

const autoLabel = (fetchArg, input) => {
  /* eslint-disable camelcase */
  const propL10N = {
    camera_deadzone_x: l10n("FIELD_CAMERA_DEADZONE_X"),
    camera_deadzone_y: l10n("FIELD_CAMERA_DEADZONE_Y"),
    camera_offset_x: l10n("FIELD_CAMERA_OFFSET_X"),
    camera_offset_y: l10n("FIELD_CAMERA_OFFSET_Y"),
  };
  /* eslint-enable camelcase */

  if (
    input.property === undefined ||
    input.value === undefined ||
    !propL10N[input.property]
  ) {
    return l10n("EVENT_CAMERA_PROPERTY_SET");
  }

  return l10n("EVENT_GENERIC_SET_LABEL", {
    field: propL10N[input.property],
    value: fetchArg("value"),
  });
};

const fields = [
  {
    key: "property",
    label: l10n("FIELD_PROPERTY"),
    description: l10n("FIELD_CAMERA_PROPERTY_SET_DESC"),
    type: "select",
    defaultValue: "camera_deadzone_x",
    options: [
      ["camera_deadzone_x", l10n("FIELD_CAMERA_DEADZONE_X")],
      ["camera_deadzone_y", l10n("FIELD_CAMERA_DEADZONE_Y")],
      ["camera_offset_x", l10n("FIELD_CAMERA_OFFSET_X")],
      ["camera_offset_y", l10n("FIELD_CAMERA_OFFSET_Y")],
    ],
  },
  {
    key: "value",
    label: l10n("FIELD_VALUE"),
    description: l10n("FIELD_VALUE_SET_DESC"),
    type: "value",
    min: -128,
    max: 127,
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
];

const compile = (input, helpers) => {
  const { cameraSetPropertyToScriptValue } = helpers;
  cameraSetPropertyToScriptValue(input.property, input.value);
};

module.exports = {
  id,
  description: l10n("EVENT_CAMERA_PROPERTY_SET_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
  allowedBeforeInitFade: true,
};
