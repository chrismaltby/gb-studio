const l10n = require("../helpers/l10n").default;

const id = "EVENT_LINK_TRANSFER";

const fields = [
  {
    key: "sendVariable",
    label: l10n("FIELD_SEND_VARIABLE"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "receiveVariable",
    label: l10n("FIELD_RECEIVE_VARIABLE"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "size",
    label: l10n("FIELD_PACKET_SIZE"),
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
  fields,
  compile,
};
