const id = "EVENT_ACTOR_STOP_UPDATE";
const groups = ["EVENT_GROUP_ACTOR"];

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
  groups,
  fields,
  compile,
};
