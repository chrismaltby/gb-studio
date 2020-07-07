const id = "EVENT_CALL_CUSTOM_EVENT";

const fields = [
  {
    type: "text",
    hide: true,
    key: "customEventId"
  }
];

const compile = (input, helpers) => {
  const { customEventInvoke, variableCopy, variableSetToValue, scene } = helpers;

  for (let i = 0; i < 10; i++) {
    if (input[`__parameter_V${i}`]) {
      variableCopy(`${input.customEventId}__V${i}`, input[`__parameter_V${i}`]);
    }

    if (input[`__parameter_A${i}`]) {
      const actorId = (input[`__parameter_A${i}`] === '$self$') ? helpers.entity.id : input[`__parameter_A${i}`];
      const actorIndex = scene.actors.findIndex(a => actorId === a.id) + 1;
      variableSetToValue(`${input.customEventId}__A${i}`, actorIndex);
    }
  }
    
  customEventInvoke(input.customEventId, input.__name);

  for (let i = 0; i < 9; i++) {
    if (input[`__parameter_V${i}`]) {
      variableCopy(input[`__parameter_V${i}`], `${input.customEventId}__V${i}`);
    }
  }
};

module.exports = {
  id,
  fields,
  compile
};