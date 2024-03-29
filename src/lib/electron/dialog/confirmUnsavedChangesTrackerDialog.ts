import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmUnsavedChangesTrackerDialog = (name: string) => {
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [
      l10n("DIALOG_SAVE_AND_CONTINUE"),
      l10n("DIALOG_CONTINUE_WITHOUT_SAVING"),
      l10n("DIALOG_CANCEL"),
    ],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_TRACKER_CHANGES_NOT_SAVED"),
    message: l10n("DIALOG_TRACKER_CHANGES_NOT_SAVED", { name: name }),
    detail: l10n("DIALOG_TRACKER_CHANGES_NOT_SAVED_DESCRIPTION"),
  });
};

export default confirmUnsavedChangesTrackerDialog;
