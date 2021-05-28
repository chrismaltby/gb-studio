import electron from "electron";
import l10n from "../../helpers/l10n";

const dialog = electron.remote ? electron.remote.dialog : electron.dialog;

export default (name) => {
  const dialogOptions = {
    type: "info",
    buttons: [
      l10n("DIALOG_SAVE_AND_CONTINUE"),
      l10n("DIALOG_CONTINUE_WITHOUT_SAVING"),
      l10n("DIALOG_CANCEL"),
    ],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_TRACKER_CHANGES_NOT_SAVED"),
    message: l10n("DIALOG_TRACKER_CHANGES_NOT_SAVED", { name: name }),
    detail: l10n("DIALOG_TRACKER_CHANGES_NOT_SAVED_DESCRIPTION"),
  };

  return dialog.showMessageBoxSync(dialogOptions);
};
