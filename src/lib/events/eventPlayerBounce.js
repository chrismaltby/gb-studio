const l10n = require("../helpers/l10n").default;

const id = "EVENT_PLAYER_BOUNCE";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "GAMETYPE_PLATFORMER",
};

const fields = [
  {
    key: "height",
    type: "select",
    label: l10n("FIELD_HEIGHT"),
    description: l10n("FIELD_BOUNCE_HEIGHT_DESC"),
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
  description: l10n("EVENT_PLAYER_BOUNCE_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};
