const id = "EVENT_PALETTE_SET_BACKGROUND";

const fields = [
  {
    key: "palette0",
    type: "palette",
    defaultValue: "",
    paletteType: "background",
    paletteIndex: 0,
    canKeep: true
  },
  {
    key: "palette1",
    type: "palette",
    defaultValue: "",
    paletteType: "background",
    paletteIndex: 1,
    canKeep: true
  },
  {
    key: "palette2",
    type: "palette",
    defaultValue: "",
    paletteType: "background",
    paletteIndex: 2,
    canKeep: true
  },
  {
    key: "palette3",
    type: "palette",
    defaultValue: "",
    paletteType: "background",
    paletteIndex: 3,
    canKeep: true
  },
  {
    key: "palette4",
    type: "palette",
    defaultValue: "",
    paletteType: "background",
    paletteIndex: 4,
    canKeep: true    
  },
  {
    key: "palette5",
    type: "palette",
    defaultValue: "",
    paletteType: "background",
    paletteIndex: 5,
    canKeep: true
  },
];

const compile = (input, helpers) => {
  const { paletteSetBackground, event } = helpers;
  const mask = [0,1,2,3,4,5].map((i) => input[`palette${i}`] !== "keep")
  paletteSetBackground(event.id, mask);
};

module.exports = {
  id,
  fields,
  compile,
};
