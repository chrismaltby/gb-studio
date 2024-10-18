import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmDeletePlugin = (pluginName: string, pluginPath: string) => {
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("DIALOG_DELETE"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_DELETE_PLUGIN", { name: pluginName }),
    message: l10n("DIALOG_DELETE_PLUGIN", { name: pluginName }),
    detail: l10n("DIALOG_DELETE_PLUGIN_DESCRIPTION", {
      filename: pluginPath,
    }),
  });
};

export default confirmDeletePlugin;
