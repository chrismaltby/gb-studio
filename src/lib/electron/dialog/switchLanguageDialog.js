import electron from "electron";
import l10n from "../../helpers/l10n";

const dialog = electron.remote ? electron.remote.dialog : electron.dialog;

export default () => {
  const dialogOptions = {
    type: "info",
    buttons: [l10n("DIALOG_OK")],
    defaultId: 0,
    title: l10n("DIALOG_LANGUAGE_CHANGES_NEED_RESTART"),
    message: l10n("DIALOG_LANGUAGE_CHANGES_NEED_RESTART"),
    detail: l10n("DIALOG_LANGUAGE_SAVE_AND_RESTART"),
  };

  dialog.showMessageBoxSync(dialogOptions);
};
