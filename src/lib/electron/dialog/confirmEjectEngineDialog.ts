import electron from "electron";
import l10n from "../../helpers/l10n";

const dialog = electron.remote ? electron.remote.dialog : electron.dialog;

export default () => {
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
