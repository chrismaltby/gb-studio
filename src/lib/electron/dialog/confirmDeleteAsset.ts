import { dialog } from "electron";
import { Asset, AssetType, assetPath } from "shared/lib/helpers/assets";
import l10n from "shared/lib/lang/l10n";

const confirmDeleteAsset = (assetType: AssetType, asset: Asset): boolean => {
  return (
    dialog.showMessageBoxSync({
      type: "info",
      buttons: [l10n("DIALOG_DELETE"), l10n("DIALOG_CANCEL")],
      defaultId: 0,
      cancelId: 1,
      title: l10n("DIALOG_DELETE_ASSET", { filename: asset.filename }),
      message: l10n("DIALOG_DELETE_ASSET", { filename: asset.filename }),
      detail: l10n("DIALOG_DELETE_ASSET_DESCRIPTION", {
        filename: assetPath(assetType, asset),
      }),
    }) === 0
  );
};

export default confirmDeleteAsset;
