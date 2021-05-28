import electron from "electron";
import l10n from "../../helpers/l10n";

const dialog = electron.remote ? electron.remote.dialog : electron.dialog;

export default (name, sceneNames, count) => {
  // eslint-disable-next-line global-require
  const dialogOptions = {
    type: "info",
    buttons: [l10n("DIALOG_DELETE"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_DELETE_CUSTOM_EVENT", { name }),
    message: l10n("DIALOG_DELETE_CUSTOM_EVENT", { name }),
    detail: l10n(
      count === 1
        ? "DIALOG_DELETE_CUSTOM_EVENT_USED_SINGLAR"
        : "DIALOG_DELETE_CUSTOM_EVENT_USED",
      { count, sceneNames: sceneNames.join(", ") }
    ),
  };

  return dialog.showMessageBoxSync(dialogOptions);
};
