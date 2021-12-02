import flatten from "lodash/flatten";
import uniq from "lodash/uniq";
import l10n from "../helpers/l10n";

type EngineChange = {
  version: string;
  description: string;
  modifiedFiles: string[];
};

const changes: EngineChange[] = [
  {
    version: "3.0.0-e0",
    description:
      "Complete engine rewrite based around GBVM:\n" +
      "   * Support for metasprites\n" +
      "   * Parallax backgrounds\n" +
      "   * hUGEDriver music engine\n" +
      "   * Variable width fonts\n" +
      "   * Super GB borders\n" +
      "   * GBVM scripting language\n" +
      "   * Much more!",
    modifiedFiles: ["All of them (sorry)"],
  },
];

const ejectEngineChangelog = (currentVersion: string) => {
  const startIndex = changes.findIndex(
    (change) => change.version === currentVersion
  );
  let changelog = l10n("WARNING_MISSING_UPDATES") + ":\n\n";
  const modifiedFiles = [];

  for (let i = startIndex + 1; i < changes.length; i++) {
    const change = changes[i];
    changelog += `  [${change.version}]\n  ${change.description}\n\n`;
    modifiedFiles.push(change.modifiedFiles);
  }

  changelog += "\n" + l10n("WARNING_MODIFIED_FILES") + ":\n\n  ";
  changelog += uniq(flatten(modifiedFiles)).join("\n  ");

  return changelog;
};

export default ejectEngineChangelog;
