const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_TIMER_SCRIPT";
const groups = ["EVENT_GROUP_TIMER"];
const subGroups = {
  EVENT_GROUP_TIMER: "EVENT_GROUP_SCRIPT",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_SET_TIMER_SCRIPT_LABEL", {
    timer: fetchArg("timer"),
  });
};

const fields = [
  {
    key: "timer",
    label: l10n("FIELD_TIMER"),
    description: l10n("FIELD_TIMER_DESC"),
    type: "togglebuttons",
    options: [
      [1, "1", `${l10n("FIELD_TIMER")} 1`],
      [2, "2", `${l10n("FIELD_TIMER")} 2`],
      [3, "3", `${l10n("FIELD_TIMER")} 3`],
      [4, "4", `${l10n("FIELD_TIMER")} 4`],
    ],
    allowNone: false,
    defaultValue: 1,
  },
  {
    type: "group",
    fields: [
      {
        key: "duration",
        type: "number",
        label: l10n("FIELD_TIME_INTERVAL"),
        description: l10n("FIELD_TIME_INTERVAL_TIMER_DESC"),
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
        label: l10n("FIELD_TIME_INTERVAL"),
        description: l10n("FIELD_TIME_INTERVAL_TIMER_DESC"),
        type: "number",
        min: 0,
        max: 3600,
        step: 16,
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
    description: l10n("FIELD_ON_TIMER_TICK_DESC"),
    type: "events",
    allowedContexts: ["global", "entity", "prefab"],
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
  timerScriptSet(frames, input.script, event.symbol, input.timer);
};

module.exports = {
  id,
  autoLabel,
  description: l10n("EVENT_SET_TIMER_SCRIPT_DESC"),
  groups,
  subGroups,
  fields,
  compile,
  editableSymbol: true,
  allowChildrenBeforeInitFade: true,
};
