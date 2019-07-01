import l10n from "../helpers/l10n";

export const id = "EVENT_IF_ACTOR_AT_POSITION";

export const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "x",
    label: l10n("FIELD_X"),
    type: "number",
    min: 0,
    max: 32,
    width: "50%",
    defaultValue: 0
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "number",
    min: 0,
    max: 32,
    width: "50%",
    defaultValue: 0
  },
  {
    key: "true",
    type: "events"
  },
  {
    key: "false",
    type: "events"
  }
];

export const compile = (input, helpers) => {
  const { actorSetActive, ifActorAtPosition } = helpers;
  actorSetActive(input.actorId);
  ifActorAtPosition(input.x, input.y, input.true, input.false);
};
