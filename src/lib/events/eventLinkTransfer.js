const l10n = require("../helpers/l10n").default;

const id = "EVENT_LINK_TRANSFER";
const subGroups = {
  EVENT_GROUP_MISC: "EVENT_GROUP_MULTIPLAYER",
};

const fields = [
  {
    key: "sendVariable",
    label: l10n("FIELD_SEND_VARIABLE"),
    description: l10n("FIELD_LINK_TRANSFER_SEND_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "receiveVariable",
    label: l10n("FIELD_RECEIVE_VARIABLE"),
    description: l10n("FIELD_LINK_TRANSFER_RECEIVE_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "size",
    label: l10n("FIELD_PACKET_SIZE"),
    description: l10n("FIELD_LINK_TRANSFER_PACKET_SIZE_DESC"),
    type: "number",
    defaultValue: 1,
  },
];

const compile = (input, helpers) => {
  const { linkTransfer } = helpers;
  linkTransfer(input.sendVariable, input.receiveVariable, input.size);
};

module.exports = {
  id,
  description: l10n("EVENT_LINK_TRANSFER_DESC"),
  subGroups,
  fields,
  compile,
};
