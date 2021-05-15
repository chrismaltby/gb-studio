import electron from "electron";
import { AssetFolder } from "../../project/assets";

const dialog = electron.remote ? electron.remote.dialog : electron.dialog;

export default (folders: AssetFolder[]): AssetFolder | undefined => {
  // eslint-disable-next-line global-require
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const l10n = require("../../helpers/l10n").default;
  const cancelId = folders.length;
  const dialogOptions = {
    type: "info",
    buttons: ([] as string[]).concat(folders, l10n("DIALOG_CANCEL")),
    defaultId: 0,
    cancelId,
    title: l10n("DIALOG_IMPORT_ASSET"),
    message: l10n("DIALOG_IMPORT_ASSET"),
    detail: l10n("DIALOG_IMPORT_ASSET_DESCRIPTION"),
  };

  const res = dialog.showMessageBoxSync(dialogOptions);

  if (res === cancelId) {
    return undefined;
  }

  return folders[res];
};
