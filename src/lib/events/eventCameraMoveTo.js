const l10n = require("../helpers/l10n").default;

const id = "EVENT_CAMERA_MOVE_TO";
const groups = ["EVENT_GROUP_CAMERA"];

const autoLabel = (fetchArg, input) => {
  if (input.units === "pixels") {
    return l10n("EVENT_CAMERA_MOVE_TO_LABEL", {
      units: l10n("FIELD_PIXELS"),
      x: fetchArg("px"),
      y: fetchArg("py"),
    });
  }
  return l10n("EVENT_CAMERA_MOVE_TO_LABEL", {
    units: l10n("FIELD_TILES"),
    x: fetchArg("x"),
    y: fetchArg("y"),
  });
};

const fields = [
  {
    key: "units",
    type: "select",
    options: [
      ["tiles", l10n("FIELD_TILES")],
      ["pixels", l10n("FIELD_PIXELS")],
    ],
    defaultValue: "tiles",
  },
  {
    type: "group",
    conditions: [
      {
        key: "units",
        eq: "tiles",
      },
    ],
    fields: [
      {
        key: "x",
        label: l10n("FIELD_X"),
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
      },
    ],
  },
  {
    type: "group",
    conditions: [
      {
        key: "units",
        eq: "pixels",
      },
    ],
    fields: [
      {
        key: "px",
        label: l10n("FIELD_X"),
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 2040,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
      },
      {
        key: "py",
        label: l10n("FIELD_Y"),
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 2040,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
      },
    ],
  },
  {
    key: "speed",
    label: l10n("FIELD_SPEED"),
    type: "cameraSpeed",
    defaultValue: 0,
  },
];

const compile = (input, helpers) => {
  const {
    cameraMoveTo,
    cameraMoveToVariables,
    variableFromUnion,
    temporaryEntityVariable,
  } = helpers;
  if (input.units === "frames") {
    if (input.x.type === "number" && input.y.type === "number") {
      cameraMoveTo(input.x.value, input.y.value, Number(input.speed), input.units);
    } else {
      // If any value is not a number transfer values into variables and use variable implementation
      const xVar = variableFromUnion(input.x, temporaryEntityVariable(0));
      const yVar = variableFromUnion(input.y, temporaryEntityVariable(1));
      cameraMoveToVariables(xVar, yVar, Number(input.speed), input.units);
    }
  } else {
    if (input.px.type === "number" && input.py.type === "number") {
      cameraMoveTo(input.px.value, input.py.value, Number(input.speed), input.units);
    } else {
      // If any value is not a number transfer values into variables and use variable implementation
      const xVar = variableFromUnion(input.px, temporaryEntityVariable(0));
      const yVar = variableFromUnion(input.py, temporaryEntityVariable(1));
      cameraMoveToVariables(xVar, yVar, Number(input.speed), input.units);
    }
  }
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
