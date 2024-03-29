import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmDeleteCustomEvent = (
  name: string,
  sceneNames: string[],
  count: number
) => {
  return dialog.showMessageBoxSync({
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
  });
};

export default confirmDeleteCustomEvent;
