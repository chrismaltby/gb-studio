import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const switchLanguageDialog = () => {
  dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("DIALOG_OK")],
    defaultId: 0,
    title: l10n("DIALOG_LANGUAGE_CHANGES_NEED_RESTART"),
    message: l10n("DIALOG_LANGUAGE_CHANGES_NEED_RESTART"),
    detail: l10n("DIALOG_LANGUAGE_SAVE_AND_RESTART"),
  });
};

export default switchLanguageDialog;
