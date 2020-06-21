const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_ACTOR_RELATIVE_TO_ACTOR";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "operation",
    type: "select",
    options: [
      ["up", l10n("FIELD_IS_ABOVE")],
      ["down", l10n("FIELD_IS_BELOW")],
      ["left", l10n("FIELD_IS_LEFT_OF")],
      ["right", l10n("FIELD_IS_RIGHT_OF")]
    ],
    defaultValue: "up",
    width: "50%"
  },  
  {
    key: "otherActorId",
    type: "actor",
    defaultValue: "$self$"
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
  const { actorSetActive, ifActorRelativeToActor } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  actorSetActive(input.actorId);
  ifActorRelativeToActor(input.operation, input.otherActorId, truePath, falsePath);
};

module.exports = {
  id,
  fields,
  compile
};
