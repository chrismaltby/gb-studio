const id = "EVENT_PALETTE_SET_UI";
const groups = ["EVENT_GROUP_COLOR"];

const fields = [
  {
    key: "palette",
    type: "palette",
    defaultValue: "",
    paletteType: "ui",
  },
];

const compile = (input, helpers) => {
  const { paletteSetUI } = helpers;
  paletteSetUI(input.palette);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
