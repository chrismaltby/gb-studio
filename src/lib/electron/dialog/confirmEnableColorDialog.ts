import { dialog, BrowserWindow } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmEnableColorDialog = (win: BrowserWindow) => {
  return dialog.showMessageBoxSync(win, {
    type: "info",
    buttons: [l10n("DIALOG_ENABLE_COLOR"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_ENABLE_COLOR_MODE"),
    message: l10n("DIALOG_ENABLE_COLOR_MODE"),
    detail: l10n("DIALOG_ENABLE_COLOR_MODE_DESCRIPTION"),
  });
};

export default confirmEnableColorDialog;
