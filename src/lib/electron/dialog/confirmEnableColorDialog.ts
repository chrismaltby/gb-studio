import { dialog, BrowserWindow } from "electron";
import l10n from "lib/helpers/l10n";

const confirmEnableColorDialog = (win: BrowserWindow) => {
  const dialogOptions = {
    type: "info",
    buttons: [l10n("DIALOG_ENABLE_COLOR"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_ENABLE_COLOR_MODE"),
    message: l10n("DIALOG_ENABLE_COLOR_MODE"),
    detail: l10n("DIALOG_ENABLE_COLOR_MODE_DESCRIPTION"),
  };

  return dialog.showMessageBoxSync(win, dialogOptions);
};

export default confirmEnableColorDialog;
