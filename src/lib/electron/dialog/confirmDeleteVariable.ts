import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const MAX_USES_NAMES = 5;

const confirmDeleteVariable = (name: string, usesNames: string[]) => {
  const foundReferences =
    usesNames.length > 0
      ? usesNames.slice(0, MAX_USES_NAMES).join(", ") +
        (usesNames.length > MAX_USES_NAMES ? "..." : "")
      : l10n("FIELD_SCRIPT");
  return dialog.showMessageBoxSync({
    type: "warning",
    buttons: [l10n("DIALOG_DELETE"), l10n("DIALOG_CANCEL")],
    defaultId: 1,
    cancelId: 1,
    title: l10n("DIALOG_DELETE_VARIABLE", { name }),
    message: l10n("DIALOG_DELETE_VARIABLE", { name }),
    detail: l10n(
      usesNames.length === 1
        ? "DIALOG_DELETE_VARIABLE_USED_SINGLAR"
        : "DIALOG_DELETE_VARIABLE_USED",
      { count: usesNames.length, foundReferences },
    ),
  });
};

export default confirmDeleteVariable;
