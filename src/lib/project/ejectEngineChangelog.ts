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
  {
    version: "3.0.1-e0",
    description:
      "Bug fixes and preperation for GBDK-2020 v4.0.6:\n" +
      "   * Fixed issue where input scripts could be trigger while VM is locked\n" +
      "   * Allowed input scripts to optionally prevent default button actions\n" +
      "   * Moved engine field defines into a single state_defines.h file\n" +
      "   * Switched SDCC features to use macros in preparation for new GBDK",
    modifiedFiles: ["All..."],
  },
  {
    version: "3.0.2-e0",
    description:
      "Bug fixes and crash handler:\n" +
      "   * Added crash handler screen\n" +
      "   * Text control code 0x09 added to skip characters without waiting\n" +
      "   * Allow tilesets with zero length\n" +
      "   * Fix issue where VM_LOCK was not affecting context switching\n" +
      "   * Optimised input script checks",
    modifiedFiles: [
      "src/core/crash_handler.s",
      "src/core/data_manager.c",
      "src/core/events.c",
      "src/core/ui.c",
      "src/core/vm.c",
    ],
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
