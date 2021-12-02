import fs from "fs-extra";
import { remote, shell } from "electron";
import settings from "electron-settings";
import semverValid from "semver/functions/valid";
import semverGt from "semver/functions/gt";
import { LATEST_PROJECT_VERSION } from "./migrateProject";
import l10n from "../helpers/l10n";

const dialog = remote && remote.dialog;

export const needsUpdate = (currentVersion) => {
  if (semverValid(currentVersion) && semverValid(LATEST_PROJECT_VERSION)) {
    return semverGt(LATEST_PROJECT_VERSION, currentVersion);
  }
  return false;
};

export const fromFuture = (currentVersion) => {
  if (semverValid(currentVersion) && semverValid(LATEST_PROJECT_VERSION)) {
    return semverGt(currentVersion, LATEST_PROJECT_VERSION);
  }
  return false;
};

export default async (projectPath) => {
  const project = await fs.readJson(projectPath);
  let currentVersion = project._version || "1.0.0";
  if (currentVersion === "1") {
    currentVersion = "1.0.0";
  }

  if (fromFuture(currentVersion)) {
    const dialogOptions = {
      type: "info",
      buttons: [
        l10n("DIALOG_DOWNLOAD"),
        l10n("DIALOG_OPEN_ANYWAY"),
        l10n("DIALOG_CANCEL"),
      ],
      defaultId: 0,
      cancelId: 1,
      title: l10n("DIALOG_FUTURE"),
      message: l10n("DIALOG_FUTURE"),
      detail: l10n("DIALOG_FUTURE_DESCRIPTION", {
        currentVersion,
        version: LATEST_PROJECT_VERSION,
      }),
    };
    const { response: updateButtonIndex } = await dialog.showMessageBox(
      dialogOptions
    );
    if (updateButtonIndex === 0) {
      await shell.openExternal("https://www.gbstudio.dev/download/");
      return false;
    }
    if (updateButtonIndex === 2) {
      return false;
    }
    return true;
  }

  if (!needsUpdate(currentVersion)) {
    return true;
  }

  const dialogOptions = {
    type: "info",
    buttons: [
      l10n("DIALOG_MIGRATE", {
        version: LATEST_PROJECT_VERSION,
      }),
      l10n("DIALOG_MIGRATION_GUIDE"),
      l10n("DIALOG_CANCEL"),
    ],
    defaultId: 0,
    cancelId: 2,
    title: l10n("DIALOG_PROJECT_NEED_MIGRATION"),
    message: l10n("DIALOG_PROJECT_NEED_MIGRATION"),
    detail: l10n("DIALOG_MIGRATION_DESCRIPTION", {
      currentVersion,
      version: LATEST_PROJECT_VERSION,
    }),
  };

  const { response: buttonIndex, checkboxChecked } =
    await dialog.showMessageBox(dialogOptions);

  if (checkboxChecked) {
    // Ignore all updates until manually check for updates
    settings.set("dontCheckForUpdates", true);
  }
  if (buttonIndex === 0) {
    return true;
  }
  if (buttonIndex === 1) {
    await shell.openExternal("https://www.gbstudio.dev/migrate/");
  }
  return false;
};
