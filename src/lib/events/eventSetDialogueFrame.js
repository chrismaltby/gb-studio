const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_DIALOGUE_FRAME";
const groups = ["EVENT_GROUP_DIALOGUE"];
const subGroups = {
  EVENT_GROUP_DIALOGUE: "EVENT_GROUP_PROPERTIES",
};

const fields = [].concat([
  {
    key: "tilesetId",
    type: "tileset",
    label: l10n("FIELD_FRAME_IMAGE"),
    description: l10n("FIELD_SET_FRAME_IMAGE_DESC"),
    optional: true,
    optionalLabel: l10n("FIELD_DEFAULT"),
    filters: {
      width: 24,
      height: 24,
    },
  },
  {
    label: l10n("FIELD_SET_FRAME_IMAGE_INFO"),
  },
]);

const compile = (input, helpers) => {
  const { dialogueFrameSetTiles } = helpers;
  dialogueFrameSetTiles(input.tilesetId);
};

module.exports = {
  id,
  description: l10n("EVENT_SET_DIALOGUE_FRAME_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};
