import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmApplyPreset = () => {
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("FIELD_APPLY_CHANGES"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_APPLY_PRESET"),
    message: l10n("DIALOG_APPLY_PRESET"),
    detail: l10n("DIALOG_APPLY_PRESET_DESCRIPTION"),
  });
};

export default confirmApplyPreset;
