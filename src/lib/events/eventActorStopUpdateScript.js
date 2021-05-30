const id = "EVENT_ACTOR_STOP_UPDATE";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$"
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, actorStopUpdate } = helpers;
  actorSetActive(input.actorId);
  actorStopUpdate();
};

module.exports = {
  id,
  fields,
  compile
};
