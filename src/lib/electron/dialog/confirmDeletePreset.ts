import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmDeletePreset = (name: string) => {
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("FIELD_DELETE_PRESET"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_DELETE_PRESET", { name }),
    message: l10n("DIALOG_DELETE_PRESET", { name }),
    detail: l10n("DIALOG_DELETE_PRESET_DESCRIPTION"),
  });
};

export default confirmDeletePreset;
