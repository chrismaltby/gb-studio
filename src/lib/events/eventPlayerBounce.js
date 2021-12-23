const l10n = require("../helpers/l10n").default;

const id = "EVENT_PLAYER_BOUNCE";
const groups = ["EVENT_GROUP_ACTOR"];

const fields = [
  {
    key: "height",
    type: "select",
    label: l10n("FIELD_HEIGHT"),
    options: [
      ["low", l10n("FIELD_LOW")],
      ["medium", l10n("FIELD_MEDIUM")],
      ["high", l10n("FIELD_HIGH")],
    ],
    defaultValue: "medium",
  },
  {
    label: l10n("FIELD_BOUNCE_NOTE"),
  },
];

const compile = (input, helpers) => {
  const { playerBounce } = helpers;
  playerBounce(input.height);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
