import l10n from "../helpers/l10n";

export const id = "EVENT_ACTOR_SET_POSITION_RELATIVE";

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
    min: -31,
    max: 31,
    width: "50%",
    defaultValue: 0
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "number",
    min: -31,
    max: 31,
    width: "50%",
    defaultValue: 0
  }
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorSetPositionRelative } = helpers;
  actorSetActive(input.actorId);
  actorSetPositionRelative(input.x, input.y);
};
