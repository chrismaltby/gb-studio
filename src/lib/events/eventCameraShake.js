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
        label: l10n("FIELD_SECONDS"),
        min: 0,
        max: 60,
        step: 0.1,
        defaultValue: 0.5,
        conditions: [
          {
            key: "units",
            ne: "frames",
          },
        ],
      },
      {
        key: "frames",
        label: l10n("FIELD_FRAMES"),
        type: "number",
        min: 0,
        max: 3600,
        width: "50%",
        defaultValue: 30,
        conditions: [
          {
            key: "units",
            eq: "frames",
          },
        ],
      },
      {
        key: "units",
        type: "selectbutton",
        options: [
          ["time", l10n("FIELD_SECONDS")],
          ["frames", l10n("FIELD_FRAMES")],
        ],
        inline: true,
        defaultValue: "time",
      },
    ],
  },
  {
    key: "shakeDirection",
    label: l10n("FIELD_DIRECTION"),
    width: "50%",
    type: "select",
    options: [
      ["horizontal", "↔ " + l10n("FIELD_HORIZONTAL")],
      ["vertical", "↕ " + l10n("FIELD_VERTICAL")],
      ["diagonal", "⤡ " + l10n("FIELD_DIAGONAL")],
    ],
    defaultValue: "horizontal",
  },
];

const compile = (input, helpers) => {
  const { cameraShake } = helpers;
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
  if (frames > 0) {
    cameraShake(shouldShakeX, shouldShakeY, frames);
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
