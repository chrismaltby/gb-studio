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
    conditions: [
      {
        key: "size",
        eq: 1,
      },
    ],
  },
  {
    key: "receiveVariable",
    label: l10n("FIELD_RECEIVE_VARIABLE"),
    description: l10n("FIELD_LINK_TRANSFER_RECEIVE_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    conditions: [
      {
        key: "size",
        eq: 1,
      },
    ],
  },
  {
    key: "sendVariableArray",
    label: l10n("FIELD_SEND_VARIABLE"),
    description: l10n("FIELD_LINK_TRANSFER_SEND_VARIABLE_DESC"),
    type: "variable",
    variableType: "arrayReference",
    defaultValue: "LAST_VARIABLE",
    conditions: [
      {
        key: "size",
        gt: 1,
      },
    ],
  },
  {
    key: "receiveVariableArray",
    label: l10n("FIELD_RECEIVE_VARIABLE"),
    description: l10n("FIELD_LINK_TRANSFER_RECEIVE_VARIABLE_DESC"),
    type: "variable",
    variableType: "arrayReference",
    defaultValue: "LAST_VARIABLE",
    conditions: [
      {
        key: "size",
        gt: 1,
      },
    ],
  },
  {
    key: "size",
    label: l10n("FIELD_PACKET_SIZE"),
    description: l10n("FIELD_LINK_TRANSFER_PACKET_SIZE_DESC"),
    type: "number",
    defaultValue: 1,
    min: 1,
  },
];

const compile = (input, helpers) => {
  const { linkTransfer } = helpers;
  if (input.size === 1) {
    linkTransfer(input.sendVariable, input.receiveVariable, input.size);
  } else {
    linkTransfer(
      input.sendVariableArray,
      input.receiveVariableArray,
      input.size,
    );
  }
};

module.exports = {
  id,
  description: l10n("EVENT_LINK_TRANSFER_DESC"),
  subGroups,
  fields,
  compile,
};
