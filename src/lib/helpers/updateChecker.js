import electron, { dialog } from "electron";
import semver from "semver";
import Octokit from "@octokit/rest";
import open from "open";
import meta from "../../../package.json";
import settings from "electron-settings";
import l10n from "./l10n";

const github = new Octokit();
const oneHour = 60 * 60 * 1000;

const cache = {
  latest: {
    value: null,
    timestamp: null
  }
};

export const getLatestVersion = async () => {
  try {
    const now = new Date().getTime();
    if (cache.latest.timestamp > now) {
      return cache.latest.value;
    }

    const latest = await github.repos.getLatestRelease({
      owner: "chrismaltby",
      repo: "gb-studio"
    });

    if (latest) {
      const version = latest.data.tag_name.split("v").pop();
      cache.latest.value = version;
      cache.latest.timestamp = now + oneHour;
      return version;
    }
  } catch (error) {
    console.error("Unable to check for updates", error);
  }

  return null;
};

export const getCurrentVersion = () => {
  return meta.version;
};

export const needsUpdate = async () => {
  const currentVersion = getCurrentVersion();
  const latestVersion = await getLatestVersion();
  if (semver.valid(currentVersion) && semver.valid(latestVersion)) {
    return semver.gt(latestVersion, currentVersion);
  }

  return false;
};

export const checkForUpdate = async force => {
  if (force) {
    // If manually checking for updates using menu, clear previous settings
    settings.set("dontCheckForUpdates", false);
    settings.set("dontNotifyUpdatesForVersion", false);
  }
  if (!settings.get("dontCheckForUpdates")) {
    const latestVersion = await getLatestVersion();

    if (await needsUpdate()) {
      if (settings.get("dontNotifyUpdatesForVersion") === latestVersion) {
        // User has chosen to ignore this version so don't show any details
        console.log("Ignoring version " + latestVersion);
        return;
      }

      const dialogOptions = {
        type: "info",
        buttons: [
          l10n("DIALOG_DOWNLOAD"),
          l10n("DIALOG_REMIND_LATER"),
          l10n("DIALOG_SKIP_VERSION")
        ],
        defaultId: 0,
        cancelId: 1,
        title: l10n("DIALOG_UPDATE_AVAILABLE"),
        message: l10n("DIALOG_UPDATE_AVAILABLE"),
        detail: l10n("DIALOG_UPDATE_DESCRIPTION", {
          version: latestVersion
        }),
        checkboxLabel: l10n("DIALOG_UPDATE_DONT_ASK_AGAIN"),
        checkboxChecked: false
      };

      dialog.showMessageBox(dialogOptions, (buttonIndex, checkboxChecked) => {
        if (checkboxChecked) {
          // Ignore all updates until manually check for updates
          settings.set("dontCheckForUpdates", true);
        }
        if (buttonIndex === 0) {
          open("https://www.gbstudio.dev/download/");
        } else if (buttonIndex === 2) {
          // Ingore this version but notify for next
          settings.set("dontNotifyUpdatesForVersion", latestVersion);
        }
      });
    } else {
      if (force) {
        // If specifically asked to check for updates need to show message
        // that you're all up to date
        const dialogOptions = {
          type: "info",
          buttons: [l10n("DIALOG_OK")],
          defaultId: 0,
          title: l10n("DIALOG_UP_TO_DATE"),
          message: l10n("DIALOG_UP_TO_DATE"),
          detail: l10n("DIALOG_NEWEST_VERSION_AVAILABLE", {
            version: latestVersion
          })
        };

        dialog.showMessageBox(dialogOptions);
      }
    }
  }
};
