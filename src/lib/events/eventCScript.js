const l10n = require("../helpers/l10n").default;

const id = "EVENT_C_SCRIPT";
const groups = ["EVENT_GROUP_MISC"];

const fields = [
  {
    key: "headers",
    label: l10n("FIELD_HEADERS"),
    description: l10n("FIELD_C_HEADERS_DESC"),
    type: "code",
    flexBasis: "100%",
    language: "c",
    placeholder: `e.g. #include "data/game_globals.h"`,
    defaultValue: `#include "data/game_globals.h"`,
  },
  {
    key: "script",
    label: l10n("FIELD_SCRIPT"),
    description: l10n("FIELD_C_SCRIPT_DESC"),
    type: "code",
    flexBasis: "100%",
    language: "c",
    placeholder: `e.g. script_memory[VAR_HEALTH] += 5;`,
  },

  {
    key: "references",
    type: "references",
    label: l10n("FIELD_REFERENCES"),
    description: l10n("FIELD_REFERENCES_DESC"),
  },
];

const compile = (input, helpers) => {
  const { inlineCScript, compileReferencedAssets } = helpers;
  if (input.script) {
    inlineCScript(input.script, input.headers);
  }
  if (input.references) {
    compileReferencedAssets(input.references);
  }
};

module.exports = {
  id,
  description: l10n("EVENT_C_SCRIPT_DESC"),
  groups,
  fields,
  compile,
};
