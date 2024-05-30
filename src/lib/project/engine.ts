import { readFile, readJSON } from "fs-extra";

export const readEngineVersion = async (path: string) => {
  return (await readJSON(path, { encoding: "utf8" })).version;
};

export const readEngineVersionLegacy = async (path: string) => {
  return (await readFile(path, "utf8")).replace(/#.*/g, "").trim();
};
