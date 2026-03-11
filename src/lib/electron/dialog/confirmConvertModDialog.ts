import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmConvertModReplaceDialog = (filename: string) => {
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("DIALOG_UGE_REPLACE"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_CONVERT_MOD_REPLACE"),
    message: l10n("DIALOG_CONVERT_MOD_REPLACE"),
    detail: l10n("DIALOG_CONVERT_MOD_REPLACE_DESCRIPTION", { filename }),
  });
};

export default confirmConvertModReplaceDialog;
