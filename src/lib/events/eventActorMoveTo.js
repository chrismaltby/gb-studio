import l10n from "../helpers/l10n";

export const id = "EVENT_ACTOR_MOVE_TO";

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
    max: 30,
    width: "50%",
    defaultValue: 0
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "number",
    min: 0,
    max: 31,
    width: "50%",
    defaultValue: 0
  }
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorMoveTo } = helpers;
  actorSetActive(input.actorId);
  actorMoveTo(input.x, input.y);
};
