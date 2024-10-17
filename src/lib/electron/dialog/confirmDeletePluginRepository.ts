import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmDeletePluginRepository = (name: string, url: string) => {
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("DIALOG_DELETE"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_DELETE_PLUGIN_REPO", { name }),
    message: l10n("DIALOG_DELETE_PLUGIN_REPO", { name }),
    detail: l10n("DIALOG_DELETE_PLUGIN_REPO_DESCRIPTION", {
      url,
    }),
  });
};

export default confirmDeletePluginRepository;
