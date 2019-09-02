import electron from "electron";

const dialog = electron.remote ? electron.remote.dialog : electron.dialog;

export default () => {
  // eslint-disable-next-line global-require
  const l10n = require("../../helpers/l10n").default;
  const dialogOptions = {
    type: "info",
    buttons: [l10n("DIALOG_OK")],
    defaultId: 0,
    title: l10n("DIALOG_LANGUAGE_CHANGES_NEED_RESTART"),
    message: l10n("DIALOG_LANGUAGE_CHANGES_NEED_RESTART"),
    detail: l10n("DIALOG_LANGUAGE_SAVE_AND_RESTART")
  };

  dialog.showMessageBox(dialogOptions);
};
