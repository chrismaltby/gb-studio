import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmEjectEngineReplaceDialog = () => {
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("DIALOG_EJECT_REPLACE"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_EJECT_ENGINE_REPLACE"),
    message: l10n("DIALOG_EJECT_ENGINE_REPLACE"),
    detail: l10n("DIALOG_EJECT_ENGINE_REPLACE_DESCRIPTION"),
  });
};

export default confirmEjectEngineReplaceDialog;
