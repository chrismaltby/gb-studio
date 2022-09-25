const l10n = require("../helpers/l10n").default;

const id = "EVENT_GBVM_SCRIPT";
const groups = ["EVENT_GROUP_MISC"];

const fields = [
  {
    key: "script",
    label: l10n("FIELD_SCRIPT"),
    description: l10n("FIELD_SCRIPT_DESC"),
    type: "code",
    flexBasis: "100%",
  },
  {
    key: "references",
    type: "references",
    label: l10n("FIELD_REFERENCES"),
    description: l10n("FIELD_REFERENCES_DESC"),
  },
];

const compile = (input, helpers) => {
  const { appendRaw, compileReferencedAssets } = helpers;
  if (input.script) {
    appendRaw(input.script);
  }
  if (input.references) {
    compileReferencedAssets(input.references);
  }
};

module.exports = {
  id,
  description: l10n("EVENT_GBVM_SCRIPT_DESC"),
  references: ["/docs/scripting/gbvm/", "/docs/scripting/gbvm/gbvm-operations"],
  groups,
  fields,
  compile,
};
