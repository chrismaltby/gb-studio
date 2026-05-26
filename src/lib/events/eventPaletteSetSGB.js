const l10n = require("../helpers/l10n").default;

const id = "EVENT_PALETTE_SET_SGB";
const groups = ["EVENT_GROUP_COLOR"];

const fields = [
  {
    key: "palette1",
    type: "palette",
    label: l10n("FIELD_PALETTES"),
    description: l10n("FIELD_PALETTES_DESC"),
    defaultValue: "keep",
    paletteType: "background",
    paletteIndex: 4,
    prefix: 1,
    canKeep: true,
    canRestore: true,
  },
  {
    key: "palette2",
    type: "palette",
    defaultValue: "keep",
    paletteType: "sgb",
    paletteIndex: 5,
    prefix: 2,
    canKeep: true,
    canRestore: true,
  },
  {
    key: "palette3",
    type: "palette",
    defaultValue: "keep",
    paletteType: "background",
    paletteIndex: 6,
    prefix: 3,
    canKeep: true,
    canRestore: true,
  },
  {
    key: "palette4",
    type: "palette",
    defaultValue: "keep",
    paletteType: "sgb",
    paletteIndex: 7,
    prefix: 4,
    canKeep: true,
    canRestore: true,
  },
  {
    label: l10n("FIELD_COLOR_0_PAIRS_SGB_PALETTE_NOTE", {
      index1: 1,
      index2: 2,
    }),
    conditions: [
      {
        key: "palette1",
        ne: "keep",
      },
      {
        key: "palette2",
        eq: "keep",
      },
      {
        key: "palette3",
        eq: "keep",
      },
      {
        key: "palette4",
        eq: "keep",
      },
    ],
  },
  {
    label: l10n("FIELD_COLOR_0_PAIRS_SGB_PALETTE_NOTE", {
      index1: 1,
      index2: 2,
    }),
    conditions: [
      {
        key: "palette2",
        ne: "keep",
      },
      {
        key: "palette3",
        eq: "keep",
      },
      {
        key: "palette4",
        eq: "keep",
      },
    ],
  },
  {
    label: l10n("FIELD_COLOR_0_PAIRS_SGB_PALETTE_NOTE", {
      index1: 3,
      index2: 4,
    }),
    conditions: [
      {
        key: "palette3",
        ne: "keep",
      },
      {
        key: "palette4",
        eq: "keep",
      },
    ],
  },
  {
    label: l10n("FIELD_COLOR_0_PAIRS_SGB_PALETTE_NOTE", {
      index1: 3,
      index2: 4,
    }),
    conditions: [
      {
        key: "palette4",
        ne: "keep",
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { paletteSetSGB } = helpers;
  paletteSetSGB([
    input.palette1,
    input.palette2,
    input.palette3,
    input.palette4,
  ]);
};

module.exports = {
  id,
  description: l10n("EVENT_PALETTE_SET_SGB_DESC"),
  groups,
  fields,
  compile,
};
