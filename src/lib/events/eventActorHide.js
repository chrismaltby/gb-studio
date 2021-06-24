const id = "EVENT_ACTOR_HIDE";
const group = "EVENT_GROUP_ACTOR";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
];

const compile = (input, helpers) => {
  const { actorHide } = helpers;
  actorHide(input.actorId);
};

module.exports = {
  id,
  group,
  fields,
  compile,
  allowedBeforeInitFade: true,
};
