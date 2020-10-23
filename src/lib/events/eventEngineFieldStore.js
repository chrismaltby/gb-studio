const id = "EVENT_ENGINE_FIELD_STORE";

const fields = [
  {
    type: "text",
    key: "engineFieldKey"
  }   
];

const compile = (input, helpers) => {
  const { engineFieldStoreInVariable } = helpers;
};

module.exports = {
  id,
  fields,
  compile
};
