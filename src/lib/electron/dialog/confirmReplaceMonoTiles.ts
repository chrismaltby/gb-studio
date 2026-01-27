import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

export enum DeleteReplaceMonoTilesConfirmButton {
  delete = 0,
  cancel,
}

const confirmReplaceMonoTiles = (name: string) => {
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("DIALOG_REPLACE"), l10n("DIALOG_KEEP")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_REPLACE_MONO_TILES", { name }),
    message: l10n("DIALOG_REPLACE_MONO_TILES", { name }),
    detail: l10n("DIALOG_REPLACE_MONO_TILES_DESCRIPTION"),
  });
};

export default confirmReplaceMonoTiles;
