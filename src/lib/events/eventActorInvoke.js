import l10n from "../helpers/l10n";

export const id = "EVENT_ACTOR_INVOKE";

export const fields = [
  {
    label: l10n("FIELD_ACTOR_INVOKE")
  },
  {
    key: "actorId",
    type: "actor",
    defaultValue: "LAST_ACTOR"
  }
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorInvoke } = helpers;
  actorSetActive(input.actorId);
  actorInvoke();
};
