import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmReplacePrefab = (name: string) => {
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("DIALOG_REPLACE"), l10n("DIALOG_KEEP")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_REPLACE_PREFAB", { name }),
    message: l10n("DIALOG_REPLACE_PREFAB", { name }),
    detail: l10n("DIALOG_REPLACE_PREFAB_DESCRIPTION"),
  });
};

export default confirmReplacePrefab;
