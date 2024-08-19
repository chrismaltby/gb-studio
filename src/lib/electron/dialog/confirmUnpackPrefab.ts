import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmUnpackPrefab = () => {
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("FIELD_UNPACK_PREFAB"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("FIELD_UNPACK_PREFAB"),
    message: l10n("FIELD_UNPACK_PREFAB"),
    detail: l10n("FIELD_UNPACK_PREFAB_DESC"),
  });
};

export default confirmUnpackPrefab;
