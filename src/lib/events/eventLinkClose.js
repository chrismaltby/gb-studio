const l10n = require("../helpers/l10n").default;

const id = "EVENT_LINK_CLOSE";
const subGroups = {
  EVENT_GROUP_MISC: "EVENT_GROUP_MULTIPLAYER",
};

const fields = [
  {
    label: l10n("FIELD_LINK_CLOSE"),
  },
];

const compile = (input, helpers) => {
  const { linkClose } = helpers;
  linkClose();
};

module.exports = {
  id,
  description: l10n("EVENT_LINK_CLOSE_DESC"),
  subGroups,
  fields,
  compile,
};
