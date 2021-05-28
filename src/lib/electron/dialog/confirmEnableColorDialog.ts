import electron from "electron";
import l10n from "../../helpers/l10n";

const dialog = electron.remote ? electron.remote.dialog : electron.dialog;
const win = electron.remote?.getCurrentWindow();

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
