const id = "EVENT_ACTOR_STOP_UPDATE";
const group = "EVENT_GROUP_ACTOR";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorStopUpdate } = helpers;
  actorSetActive(input.actorId);
  actorStopUpdate();
};

module.exports = {
  id,
  group,
  fields,
  compile,
};
