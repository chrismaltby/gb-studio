const id = "EVENT_PALETTE_SET_EMOTE";

const fields = [
  {
    key: "palette",
    type: "palette",
    defaultValue: "",
    paletteType: "emote",
  },
];

const compile = (input, helpers) => {
  const { paletteSetEmote } = helpers;
  paletteSetEmote(input.palette);
};

module.exports = {
  id,
  fields,
  compile,
};
