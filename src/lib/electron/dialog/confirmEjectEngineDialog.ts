import { dialog } from "electron";
import l10n from "lib/helpers/l10n";

const confirmEjectEngineDialog = () => {
  const dialogOptions = {
    type: "info",
    buttons: [l10n("DIALOG_EJECT"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_EJECT_ENGINE"),
    message: l10n("DIALOG_EJECT_ENGINE"),
    detail: l10n("DIALOG_EJECT_ENGINE_DESCRIPTION"),
  };

  return dialog.showMessageBoxSync(dialogOptions);
};

export default confirmEjectEngineDialog;
