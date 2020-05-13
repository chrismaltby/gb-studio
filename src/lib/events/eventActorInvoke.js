const l10n = require("../helpers/l10n");

const id = "EVENT_ACTOR_INVOKE";

const fields = [
  {
    label: l10n("FIELD_ACTOR_INVOKE")
  },
  {
    key: "actorId",
    type: "actor",
    defaultValue: "LAST_ACTOR"
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, actorInvoke } = helpers;
  actorSetActive(input.actorId);
  actorInvoke();
};

module.exports = {
  id,
  fields,
  compile
};
