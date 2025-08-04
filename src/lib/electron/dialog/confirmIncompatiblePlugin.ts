import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const confirmIncompatiblePlugin = (
  version: string,
  pluginSupportedVersion: string,
) => {
  const isPrerelease = version.includes("-alpha") || version.includes("-beta");

  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("FIELD_INSTALL_ANYWAY"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_PLUGIN_INCOMPATIBLE_WITH_YOUR_GBSTUDIO"),
    message: l10n("DIALOG_PLUGIN_INCOMPATIBLE_WITH_YOUR_GBSTUDIO"),
    detail: l10n(
      isPrerelease
        ? "DIALOG_PLUGIN_INCOMPATIBLE_WITH_YOUR_GBSTUDIO_PRERELEASE_DESC"
        : "DIALOG_PLUGIN_INCOMPATIBLE_WITH_YOUR_GBSTUDIO_DESC",
      {
        version,
        pluginSupportedVersion,
      },
    ),
  });
};

export default confirmIncompatiblePlugin;
