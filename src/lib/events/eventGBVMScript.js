const l10n = require("../helpers/l10n").default;

const id = "EVENT_GBVM_SCRIPT";
const groups = ["EVENT_GROUP_MISC"];

const fields = [
  {
    key: "script",
    type: "code",
    flexBasis: "100%",
  },
  {
    key: "references",
    type: "references",
    label: l10n("FIELD_REFERENCES"),
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
  groups,
  fields,
  compile,
};
