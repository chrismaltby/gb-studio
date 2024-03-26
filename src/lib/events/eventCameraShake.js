const l10n = require("../helpers/l10n").default;

const id = "EVENT_CAMERA_SHAKE";
const groups = ["EVENT_GROUP_CAMERA"];

const autoLabel = (fetchArg, input) => {
  let direction = l10n("FIELD_HORIZONTAL");
  if (input.shakeDirection === "vertical") {
    direction = l10n("FIELD_VERTICAL");
  } else if (input.shakeDirection === "diagonal") {
    direction = l10n("FIELD_DIAGONAL");
  }
  if (input.units === "frames") {
    return l10n("EVENT_CAMERA_SHAKE_LABEL", {
      time: fetchArg("frames"),
      units: l10n("FIELD_FRAMES"),
      direction,
    });
  }
  return l10n("EVENT_CAMERA_SHAKE_LABEL", {
    time: fetchArg("time"),
    units: l10n("FIELD_SECONDS"),
    direction,
  });
};

const fields = [
  {
    type: "group",
    fields: [
      {
        key: "time",
        type: "number",
        label: l10n("FIELD_DURATION"),
        description: l10n("FIELD_DURATION_SHAKE_DESC"),
        min: 0,
        max: 60,
        step: 0.1,
        defaultValue: 0.5,
        unitsField: "units",
        unitsDefault: "time",
        unitsAllowed: ["time", "frames"],
        conditions: [
          {
            key: "units",
            ne: "frames",
          },
        ],
      },
      {
        key: "frames",
        label: l10n("FIELD_DURATION"),
        description: l10n("FIELD_DURATION_SHAKE_DESC"),
        type: "number",
        min: 0,
        max: 3600,
        width: "50%",
        defaultValue: 30,
        unitsField: "units",
        unitsDefault: "time",
        unitsAllowed: ["time", "frames"],
        conditions: [
          {
            key: "units",
            eq: "frames",
          },
        ],
      },
      {
        key: "shakeDirection",
        label: l10n("FIELD_MOVE_TYPE"),
        description: l10n("FIELD_MOVE_TYPE_SHAKE_DESC"),
        hideLabel: true,
        type: "moveType",
        defaultValue: "horizontal",
        flexBasis: 30,
        flexGrow: 0,
      },
    ],
  },
  {
    key: "magnitude",
    label: l10n("FIELD_MAGNITUDE"),
    description: l10n("FIELD_MAGNITUDE_DESC"),
    type: "union",
    types: ["number", "variable", "property"],
    defaultType: "number",
    min: 1,
    max: 255,
    defaultValue: {
      number: 5,
      variable: "LAST_VARIABLE",
      property: "$self$:xpos",
    },
  },
];

const compile = (input, helpers) => {
  const {
    cameraShake,
    cameraShakeVariables,
    variableFromUnion,
    temporaryEntityVariable,
  } = helpers;
  let frames = 0;
  if (input.units === "frames") {
    frames = typeof input.frames === "number" ? input.frames : 30;
  } else {
    const seconds = typeof input.time === "number" ? input.time : 0.5;
    frames = Math.ceil(seconds * 60);
  }

  const shakeDirection = input.shakeDirection;
  let shouldShakeX = true;
  let shouldShakeY = false;
  switch (shakeDirection) {
    case "horizontal":
      shouldShakeX = true;
      shouldShakeY = false;
      break;
    case "vertical":
      shouldShakeX = false;
      shouldShakeY = true;
      break;
    case "diagonal":
      shouldShakeX = true;
      shouldShakeY = true;
      break;
    default:
      shouldShakeX = true;
      shouldShakeY = false;
  }

  if (input.magnitude.type === "number") {
    if (frames > 0) {
      cameraShake(shouldShakeX, shouldShakeY, frames, input.magnitude.value);
    }
  } else {
    const magnitudeVar = variableFromUnion(
      input.magnitude,
      temporaryEntityVariable(0)
    );
    if (frames > 0) {
      cameraShakeVariables(shouldShakeX, shouldShakeY, frames, magnitudeVar);
    }
  }
};

module.exports = {
  id,
  description: l10n("EVENT_CAMERA_SHAKE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
