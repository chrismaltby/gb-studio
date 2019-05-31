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
    min: -16,
    max: 16,
    width: "50%",
    defaultValue: 0
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "number",
    min: -16,
    max: 16,
    width: "50%",
    defaultValue: 0
  }
];

export const compile = (input, helpers) => {
  const { setActiveActor, actorMoveRelative } = helpers;
  setActiveActor(input.actorId);
  actorMoveRelative(input.x, input.y);
};
