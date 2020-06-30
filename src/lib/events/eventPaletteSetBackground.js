const id = "EVENT_PALETTE_SET_BACKGROUND";

const fields = [
  {
    key: "palette0",
    type: "palette",
    defaultValue: "",
  },
  {
    key: "palette1",
    type: "palette",
    defaultValue: "",
  },
  {
    key: "palette2",
    type: "palette",
    defaultValue: "",
  },
  {
    key: "palette3",
    type: "palette",
    defaultValue: "",
  },
  {
    key: "palette4",
    type: "palette",
    defaultValue: "",
  },
  {
    key: "palette5",
    type: "palette",
    defaultValue: "",
  },
];

const compile = (input, helpers) => {
  const { paletteSetBackground, event } = helpers;
  paletteSetBackground(event.id);
};

module.exports = {
  id,
  fields,
  compile,
};
