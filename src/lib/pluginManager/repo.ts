import fetch from "node-fetch";
import settings from "electron-settings";
import { ensureStringArray } from "shared/types";
import { PluginRepositoryMetadata } from "./types";
import { Value } from "@sinclair/typebox/value";
import { checksumString } from "lib/helpers/checksum";

const CORE_PLUGIN_REPOSITORY = "http://127.0.0.1:9999/repository.json";

export const getRepoUrls = () => {
  const userRepositoryUrls = ensureStringArray(
    settings.get("plugins:repositories"),
    []
  );
  return [CORE_PLUGIN_REPOSITORY, ...userRepositoryUrls];
};

export const getGlobalPluginsList = async () => {
  const repositoryUrls = getRepoUrls();
  const repos: PluginRepositoryMetadata[] = [];
  for (const url of repositoryUrls) {
    const data = await (await fetch(url)).json();
    const castData = Value.Cast(PluginRepositoryMetadata, data);
    repos.push({
      ...castData,
      id: checksumString(url),
      url,
    });
  }
  return repos;
};

export const getRepoUrlById = (id: string): string | undefined => {
  const repositoryUrls = getRepoUrls();
  return repositoryUrls.find((url) => checksumString(url) === id);
};
