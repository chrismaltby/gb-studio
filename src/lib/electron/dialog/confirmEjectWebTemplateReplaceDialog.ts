import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmEjectWebTemplateReplaceDialog = () => {
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("DIALOG_REPLACE_WEB_TEMPLATE"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_EJECT_WEB_TEMPLATE_REPLACE"),
    message: l10n("DIALOG_EJECT_WEB_TEMPLATE_REPLACE"),
    detail: l10n("DIALOG_EJECT_WEB_TEMPLATE_REPLACE_DESCRIPTION"),
  });
};

export default confirmEjectWebTemplateReplaceDialog;
