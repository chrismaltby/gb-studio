export const id = "EVENT_GROUP";

export const fields = [
  {
    key: "true",
    type: "events"
  }
];

export const compile = (input, helpers) => {
  const { compileEvents } = helpers;
  compileEvents(input.true);
};
