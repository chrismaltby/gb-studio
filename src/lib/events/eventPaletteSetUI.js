const id = "EVENT_PALETTE_SET_UI";

const fields = [
  {
    key: "palette",
    type: "palette",
    defaultValue: "",
  }
];

const compile = (input, helpers) => {
  const { paletteSetUI, event } = helpers;
  paletteSetUI(event.id);
};

module.exports = {
  id,
  fields,
  compile,
};
