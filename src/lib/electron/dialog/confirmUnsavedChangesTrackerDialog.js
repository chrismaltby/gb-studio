import electron from "electron";

const dialog = electron.remote ? electron.remote.dialog : electron.dialog;

export default () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const l10n = require("../../helpers/l10n").default;
  const dialogOptions = {
    type: "info",
    buttons: [
        l10n("DIALOG_SAVE_AND_CONTINUE"), 
        l10n("DIALOG_CONTINUE_WITHOUT_SAVING"), 
        l10n("DIALOG_CANCEL")
      ],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_TRACKER_CHANGES_NOT_SAVED"),
    message: l10n("DIALOG_TRACKER_CHANGES_NOT_SAVED"),
    detail: l10n("DIALOG_TRACKER_CHANGES_NOT_SAVED_DESCRIPTION")
  };

  return dialog.showMessageBoxSync(dialogOptions);
};
