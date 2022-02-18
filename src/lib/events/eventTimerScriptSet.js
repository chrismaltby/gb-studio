const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_TIMER_SCRIPT";
const groups = ["EVENT_GROUP_TIMER"];

const fields = [
  {
    type: "group",
    fields: [
      {
        key: "duration",
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
        step: 16,
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
    key: "__scriptTabs",
    type: "tabs",
    defaultValue: "end",
    values: {
      end: l10n("FIELD_ON_TIMER_TICK"),
    },
  },
  {
    key: "script",
    label: l10n("FIELD_ON_TIMER_TICK"),
    type: "events",
    conditions: [
      {
        key: "__scriptTabs",
        in: [undefined, "end"],
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { timerScriptSet, event } = helpers;
  let frames = 0;
  if (input.units === "frames") {
    frames = typeof input.frames === "number" ? input.frames : 30;
  } else {
    let duration = typeof input.duration === "number" ? input.duration : 10.0;
    frames = Math.ceil(duration * 60);
  }
  timerScriptSet(frames, input.script, event.symbol);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
  editableSymbol: true,
  allowChildrenBeforeInitFade: true,
};
