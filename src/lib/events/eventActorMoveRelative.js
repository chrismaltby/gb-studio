import l10n from "../helpers/l10n";

export const id = "EVENT_ACTOR_MOVE_RELATIVE";

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
  },
  {
    key: "c",
    label: l10n("FIELD_STOP_FOR_COLLISION"),
    type: "checkbox",
    width: "100%",
    defaultValue: false
  }
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorMoveRelative } = helpers;
  actorSetActive(input.actorId);
  actorMoveRelative(input.x, input.y, input.c);
};
