import l10n from "../helpers/l10n";

export const id = "EVENT_ACTOR_MOVE_TO_VALUE";

export const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "vectorX",
    type: "variable",
    label: l10n("FIELD_X"),
    defaultValue: "LAST_VARIABLE"
  },
  {
    key: "vectorY",
    type: "variable",
    label: l10n("FIELD_Y"),
    defaultValue: "LAST_VARIABLE"
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
  const { actorSetActive, actorMoveToVariables } = helpers;
  actorSetActive(input.actorId);
  actorMoveToVariables(input.vectorX, input.vectorY, input.c);
};
