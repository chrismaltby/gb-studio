import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmDeletePrefab = (name: string, count: number) => {
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("DIALOG_DELETE"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_DELETE_PREFAB", { name }),
    message: l10n("DIALOG_DELETE_PREFAB", { name }),
    detail: l10n(
      count === 1
        ? "DIALOG_DELETE_PREFAB_USED_SINGLAR"
        : "DIALOG_DELETE_PREFAB_USED",
      { count }
    ),
  });
};

export default confirmDeletePrefab;
