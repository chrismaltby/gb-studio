const l10n = require("../helpers/l10n").default;

const id = "EVENT_WAIT";
const groups = ["EVENT_GROUP_TIMER"];

const autoLabel = (fetchArg, input) => {
  if (input.units === "frames") {
    return l10n("EVENT_WAIT_LABEL", {
      time: fetchArg("frames"),
      units: l10n("FIELD_FRAMES"),
    });
  }
  return l10n("EVENT_WAIT_LABEL", {
    time: fetchArg("time"),
    units: l10n("FIELD_SECONDS"),
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
        description: l10n("FIELD_DURATION_WAIT_DESC"),
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
        description: l10n("FIELD_DURATION_WAIT_DESC"),
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
    ],
  },
];

const compile = (input, helpers) => {
  const { wait } = helpers;
  let frames = 0;
  if (input.units === "frames") {
    frames = typeof input.frames === "number" ? input.frames : 30;
  } else {
    const seconds = typeof input.time === "number" ? input.time : 0.5;
    frames = Math.ceil(seconds * 60);
  }
  if (frames > 0) {
    wait(frames);
  }
};

module.exports = {
  id,
  description: l10n("EVENT_WAIT_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
