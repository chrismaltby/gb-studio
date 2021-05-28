import { dialog, shell } from "electron";
import semverValid from "semver/functions/valid";
import semverGt from "semver/functions/gt";
import Octokit from "@octokit/rest";
import settings from "electron-settings";
import l10n from "./l10n";

const github = new Octokit();
const oneHour = 60 * 60 * 1000;

const cache = {
  latest: {
    value: null,
    timestamp: null,
  },
};

export const getLatestVersion = async () => {
  const now = new Date().getTime();
  if (cache.latest.timestamp > now) {
    return cache.latest.value;
  }

  const latest = await github.repos.getLatestRelease({
    owner: "chrismaltby",
    repo: "gb-studio",
  });

  if (latest) {
    const version = latest.data.tag_name.split("v").pop();
    cache.latest.value = version;
    cache.latest.timestamp = now + oneHour;
    return version;
  }

  return null;
};

export const getCurrentVersion = () => {
  return VERSION; /* Comes from webpack.plugins.js */
};

export const needsUpdate = async () => {
  const currentVersion = getCurrentVersion();
  const latestVersion = await getLatestVersion();
  if (semverValid(currentVersion) && semverValid(latestVersion)) {
    return semverGt(latestVersion, currentVersion);
  }
  return false;
};

export const checkForUpdate = async (force) => {
  if (force) {
    // If manually checking for updates using menu, clear previous settings
    settings.set("dontCheckForUpdates", false);
    settings.set("dontNotifyUpdatesForVersion", false);
  }
  if (!settings.get("dontCheckForUpdates")) {
    let latestVersion;

    try {
      latestVersion = await getLatestVersion();
      if (!latestVersion) {
        throw new Error("NO_LATEST");
      }
    } catch (e) {
      // If explicitly asked to check latest version and checking failed
      // (no internet connection / github down)
      // Show an error message
      if (force) {
        const dialogOptions = {
          type: "info",
          buttons: [l10n("DIALOG_OK")],
          defaultId: 0,
          title: l10n("DIALOG_UNABLE_TO_CHECK_LATEST_VERSION"),
          message: l10n("DIALOG_UNABLE_TO_CHECK_LATEST_VERSION"),
        };
        await dialog.showMessageBox(dialogOptions);
        return;
      }
    }

    if (await needsUpdate()) {
      if (settings.get("dontNotifyUpdatesForVersion") === latestVersion) {
        // User has chosen to ignore this version so don't show any details
        return;
      }

      const dialogOptions = {
        type: "info",
        buttons: [
          l10n("DIALOG_DOWNLOAD"),
          l10n("DIALOG_REMIND_LATER"),
          l10n("DIALOG_SKIP_VERSION"),
        ],
        defaultId: 0,
        cancelId: 1,
        title: l10n("DIALOG_UPDATE_AVAILABLE"),
        message: l10n("DIALOG_UPDATE_AVAILABLE"),
        detail: l10n("DIALOG_UPDATE_DESCRIPTION", {
          version: latestVersion,
        }),
        checkboxLabel: l10n("DIALOG_UPDATE_DONT_ASK_AGAIN"),
        checkboxChecked: false,
      };

      const { response: buttonIndex, checkboxChecked } =
        await dialog.showMessageBox(dialogOptions);

      if (checkboxChecked) {
        // Ignore all updates until manually check for updates
        settings.set("dontCheckForUpdates", true);
      }
      if (buttonIndex === 0) {
        shell.openExternal("https://www.gbstudio.dev/download/");
      } else if (buttonIndex === 2) {
        // Ingore this version but notify for next
        settings.set("dontNotifyUpdatesForVersion", latestVersion);
      }
    } else if (force) {
      // If specifically asked to check for updates need to show message
      // that you're all up to date
      const dialogOptions = {
        type: "info",
        buttons: [l10n("DIALOG_OK")],
        defaultId: 0,
        title: l10n("DIALOG_UP_TO_DATE"),
        message: l10n("DIALOG_UP_TO_DATE"),
        detail: l10n("DIALOG_NEWEST_VERSION_AVAILABLE", {
          version: latestVersion,
        }),
      };

      await dialog.showMessageBox(dialogOptions);
    }
  }
};
