import electron from "electron";

const dialog = electron.remote ? electron.remote.dialog : electron.dialog;

export default () => {
    // eslint-disable-next-line global-require
    const l10n = require("../../helpers/l10n").default;
    const dialogOptions = {
        type: "info",
        buttons: [l10n("DIALOG_EJECT"), l10n("DIALOG_CANCEL")],
        defaultId: 0,
        cancelId: 1,
        title: l10n("DIALOG_EJECT_ENGINE"),
        message: l10n("DIALOG_EJECT_ENGINE"),
        detail: l10n("DIALOG_EJECT_ENGINE_DESCRIPTION")
    };

    return dialog.showMessageBoxSync(dialogOptions);
};
