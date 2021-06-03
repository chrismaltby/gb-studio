import electron from "electron";
import l10n from "../../helpers/l10n";
import { dialog as remoteDialog, getCurrentWindow } from '@electron/remote';

const dialog = remoteDialog ? remoteDialog : electron.dialog;
const win = getCurrentWindow();

export default () => {
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
