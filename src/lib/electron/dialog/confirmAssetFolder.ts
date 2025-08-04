import { dialog } from "electron";
import { AssetFolder } from "lib/project/assets";
import l10n from "shared/lib/lang/l10n";

const confirmAssetFolder = (
  folders: AssetFolder[],
): AssetFolder | undefined => {
  const cancelId = folders.length;

  const res = dialog.showMessageBoxSync({
    type: "info",
    buttons: ([] as string[]).concat(folders, l10n("DIALOG_CANCEL")),
    defaultId: 0,
    cancelId,
    title: l10n("DIALOG_IMPORT_ASSET"),
    message: l10n("DIALOG_IMPORT_ASSET"),
    detail: l10n("DIALOG_IMPORT_ASSET_DESCRIPTION"),
  });

  if (res === cancelId) {
    return undefined;
  }

  return folders[res];
};

export default confirmAssetFolder;
