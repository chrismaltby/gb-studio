const l10n = require("../helpers/l10n").default;

const id = "EVENT_PALETTE_SET_SPRITE";
const groups = ["EVENT_GROUP_COLOR"];

const fields = [
  {
    key: "palette0",
    label: l10n("FIELD_PALETTES"),
    description: l10n("FIELD_PALETTES_DESC"),
    type: "palette",
    defaultValue: "keep",
    paletteType: "sprite",
    paletteIndex: 0,
    canKeep: true,
    canRestore: true,
  },
  {
    key: "palette1",
    type: "palette",
    defaultValue: "keep",
    paletteType: "sprite",
    paletteIndex: 1,
    canKeep: true,
    canRestore: true,
  },
  {
    key: "palette2",
    type: "palette",
    defaultValue: "keep",
    paletteType: "sprite",
    paletteIndex: 2,
    canKeep: true,
    canRestore: true,
  },
  {
    key: "palette3",
    type: "palette",
    defaultValue: "keep",
    paletteType: "sprite",
    paletteIndex: 3,
    canKeep: true,
    canRestore: true,
  },
  {
    key: "palette4",
    type: "palette",
    defaultValue: "keep",
    paletteType: "sprite",
    paletteIndex: 4,
    canKeep: true,
    canRestore: true,
  },
  {
    key: "palette5",
    type: "palette",
    defaultValue: "keep",
    paletteType: "sprite",
    paletteIndex: 5,
    canKeep: true,
    canRestore: true,
  },
  {
    key: "palette6",
    type: "palette",
    defaultValue: "keep",
    paletteType: "sprite",
    paletteIndex: 6,
    canKeep: true,
    canRestore: true,
  },
  {
    key: "palette7",
    type: "palette",
    defaultValue: "keep",
    paletteType: "sprite",
    paletteIndex: 7,
    canKeep: true,
    canRestore: true,
  },
];

const compile = (input, helpers) => {
  const { paletteSetSprite } = helpers;
  paletteSetSprite([
    input.palette0,
    input.palette1,
    input.palette2,
    input.palette3,
    input.palette4,
    input.palette5,
    input.palette6,
    input.palette7,
  ]);
};

module.exports = {
  id,
  description: l10n("EVENT_PALETTE_SET_SPRITE_DESC"),
  groups,
  fields,
  compile,
};
