const id = "EVENT_ACTOR_GET_DIRECTION";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "direction",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, ifActorDirection, variableSetToValue } = helpers;
  actorSetActive(input.actorId);
  ifActorDirection(
    "down",
    () => {
      variableSetToValue(input.direction, 1);
    },
    () => {
      ifActorDirection(
        "left",
        () => {
          variableSetToValue(input.direction, 2);
        },
        () => {
          ifActorDirection(
            "right",
            () => {
              variableSetToValue(input.direction, 4);
            },
            () => {
              variableSetToValue(input.direction, 8);
            }
          );
        }
      );
    }
  );
};

module.exports = {
  id,
  fields,
  compile
};
