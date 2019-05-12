import semver from "semver";
import Octokit from "@octokit/rest";
import meta from "../../../package.json";

const github = new Octokit();
const oneHour = 60 * 60 * 1000;

const cache = {
  latest: {
    value: null,
    timestamp: null
  }
}

export const getLatestVersion = async () => {
  try {

    const now = new Date().getTime()
    if (cache.latest.timestamp > now) {
      return cache.latest.value
    }

    const latest = await github.repos.getLatestRelease({
      owner: "chrismaltby",
      repo: "gb-studio"
    });

    if (latest) {
      const version = latest.data.tag_name.split("v").pop();
      cache.latest.value = version;
      cache.latest.timestamp = now + oneHour;
      return version
    }
  } catch (error) {
    console.error("Unable to check for updates", error);
  }

  return null;
}

export const getCurrentVersion = () => {
  return meta.version;
}

export const needsUpdate = async () => {
  const currentVersion = getCurrentVersion();
  const latestVersion = await getLatestVersion();
  if (semver.valid(currentVersion) && semver.valid(latestVersion)) {
    return semver.gt(latestVersion, currentVersion);
  }

  return false;
}

