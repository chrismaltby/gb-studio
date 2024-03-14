import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmReplaceCustomEvent = (name: string) => {
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("DIALOG_REPLACE"), l10n("DIALOG_KEEP")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_REPLACE_CUSTOM_EVENT", { name }),
    message: l10n("DIALOG_REPLACE_CUSTOM_EVENT", { name }),
    detail: l10n("DIALOG_REPLACE_CUSTOM_EVENT_DESCRIPTION"),
  });
};

export default confirmReplaceCustomEvent;
