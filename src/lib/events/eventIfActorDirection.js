const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_ACTOR_DIRECTION";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "direction",
    type: "direction",
    defaultValue: "up"
  },
  {
    key: "true",
    type: "events"
  },
  {
    key: "__collapseElse",
    label: l10n("FIELD_ELSE"),
    type: "collapsable",
    defaultValue: false,
    conditions: [
      {
        key: "__disableElse",
        ne: true
      }
    ]
  },
  {
    key: "false",
    conditions: [
      {
        key: "__collapseElse",
        ne: true
      },
      {
        key: "__disableElse",
        ne: true
      }
    ],
    type: "events"
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, ifActorDirection } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  actorSetActive(input.actorId);
  ifActorDirection(input.direction, truePath, falsePath);
};

module.exports = {
  id,
  fields,
  compile
};
