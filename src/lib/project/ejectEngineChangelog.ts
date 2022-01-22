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
  {
    version: "3.0.2-e1",
    description:
      "Bug fixes:\n" +
      "   * Hide sprites when overlay is fullscreen\n" +
      '   * Make sequences of control codes in strings "instant"',
    modifiedFiles: [
      "src/core/actor.s",
      "src/core/interrupts.c",
      "src/core/ui.c",
    ],
  },
  {
    version: "3.0.2-e2",
    description:
      "Bug fixes:\n" +
      "   * Don't prevent jumping when overlapping actor in platform scenes",
    modifiedFiles: ["src/states/platform.c"],
  },
  {
    version: "3.0.3-e0",
    description:
      "Updates:\n" +
      "   * Update to latest hUGEDriver\n" +
      "   * Add engine support for text sounds\n" +
      "   * Save executing ctxs when saving game data\n" +
      "   * Improve GBA detection\n" +
      "   * Fix scroll jitter seen in top-down scenes",
    modifiedFiles: [
      "include/input.h",
      "include/ui.h",
      "include/vm.h",
      "include/vm.i",
      "include/vm_ui.h",
      "lib/hUGEDriver.lib",
      "src/core/core.c",
      "src/core/input.c",
      "src/core/interrupts.c",
      "src/core/load_save.c",
      "src/core/ui.c",
      "src/core/vm.c",
      "src/core/vm_instructions.c",
      "src/core/vm_ui.c",
    ],
  },
  {
    version: "3.0.3-e1",
    description:
      "Updates:\n" +
      "   * Avoid rendering garbage when no scene has loaded yet\n" +
      "   * use GBDK-2020 hardware sprite hiding function\n" +
      "   * Move save blob signature to game data",
    modifiedFiles: [
      "include/actor.h",
      "include/oam_utils.h",
      "include/shadow.h",
      "src/core/actor.c",
      "src/core/data_manager.c",
      "src/core/interrupts.c",
      "src/core/load_save.c",
      "src/core/oam_utils.s",
    ],
  },
  {
    version: "3.0.3-e2",
    description:
      "Updates:\n" +
      "   * Fix logic hiding actors behind overlay\n" +
      "   * Fix VM_OVERLAY_HIDE\n" +
      "   * Remove optional macro args from sound instructions",
    modifiedFiles: ["include/vm.i", "src/core/interrupts.c"],
  },
  {
    version: "3.0.3-e3",
    description:
      "Updates:\n" +
      "   * Fix issue where vertical parallax could write over tiles\n" +
      "   * Merged sprites hide/show into single instruction\n" +
      "   * Merged fade in/out into single instruction",
    modifiedFiles: [
      "include/vm.i",
      "include/vm_gameboy.h",
      "src/core/scroll.c",
      "src/core/vm_gameboy.c",
      "src/core/vm_instructions.c",
    ],
  },
  {
    version: "3.0.3-e4",
    description:
      "Updates:\n" +
      "   * Allow reserving sprite tiles per scene for player\n" +
      "   * Renamed exclusive_sprite to reserve_tiles",
    modifiedFiles: ["include/gbs_types.i", "src/core/data_manager.c"],
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
