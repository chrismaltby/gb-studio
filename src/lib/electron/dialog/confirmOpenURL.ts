import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmOpenURL = (url: string) => {
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("DIALOG_VISIT_SITE"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_LEAVING_GBSTUDIO"),
    message: l10n("DIALOG_THIS_LINK_IS_TAKING_YOU_TO"),
    detail: url,
  });
};

export default confirmOpenURL;
