import l10n from "../helpers/l10n";

export const id = "EVENT_IF_ACTOR_DIRECTION";

export const fields = [
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
    defaultValue: false
  },
  {
    key: "false",
    conditions: [
      {
        key: "__collapseElse",
        ne: true
      }
    ],
    type: "events"
  }
];

export const compile = (input, helpers) => {
  const { actorSetActive, ifActorDirection } = helpers;
  actorSetActive(input.actorId);
  ifActorDirection(input.direction, input.true, input.false);
};
