const id = "EVENT_ACTOR_SHOW";
const group = "EVENT_GROUP_ACTOR";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
];

const compile = (input, helpers) => {
  const { actorShow } = helpers;
  actorShow(input.actorId);
};

module.exports = {
  id,
  group,
  fields,
  compile,
  allowedBeforeInitFade: true,
};
