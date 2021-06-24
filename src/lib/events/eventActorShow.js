const id = "EVENT_ACTOR_SHOW";
const groups = ["EVENT_GROUP_ACTOR"];

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
  groups,
  fields,
  compile,
  allowedBeforeInitFade: true,
};
