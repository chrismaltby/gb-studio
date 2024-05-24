import Octokit from "@octokit/rest";
import inbuiltPatrons from "patrons.json";
import type { Patrons } from "scripts/fetchPatrons";
import { isString } from "shared/types";

const github = new Octokit();
const oneHour = 60 * 60 * 1000;

const cache = {
  latest: {
    value: inbuiltPatrons,
    timestamp: 0,
  },
};
const isPatrons = (input: unknown): input is Patrons => {
  if (input === null || typeof input !== "object") {
    return false;
  }

  const obj = input as Record<string, unknown>;

  if (!("goldTier" in obj) || !("silverTier" in obj)) {
    return false;
  }
  if (!Array.isArray(obj.goldTier) || !Array.isArray(obj.silverTier)) {
    return false;
  }
  if (!obj.goldTier.every(isString) || !obj.silverTier.every(isString)) {
    return false;
  }
  return true;
};

export const getPatronsFromGithub = async () => {
  try {
    const now = new Date().getTime();
    if (cache.latest.timestamp > now) {
      return cache.latest.value;
    }

    const result = await github.repos.getContents({
      owner: "chrismaltby",
      repo: "gb-studio",
      path: "patrons.json",
      ref: "develop",
    });

    if (result) {
      const content = Buffer.from(result.data.content, "base64").toString();
      const patrons = JSON.parse(content);
      if (isPatrons(patrons)) {
        cache.latest.value = patrons;
        cache.latest.timestamp = now + oneHour;
        return patrons;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return inbuiltPatrons;
};

getPatronsFromGithub();
