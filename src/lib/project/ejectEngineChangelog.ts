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
  {
    version: "3.1.0-e0",
    description:
      "Updates:\n" +
      "   * Store RNG seed in saved data\n" +
      "   * Add support for VM_SWITCH instruction",
    modifiedFiles: [
      "include/vm.h",
      "include/vm.i",
      "src/core/load_save.c",
      "src/core/vm.c",
      "src/core/vm_instructions.c",
    ],
  },
  {
    version: "3.1.0-e1",
    description:
      "Updates:\n" +
      "   * Fix vertical shoot em up scene type\n" +
      "   * Improved randomize\n" +
      "   * Add VM_LOAD_TILESET and VM_OVERLAY_SET_MAP",
    modifiedFiles: [
      "include/vm.i",
      "include/vm_gameboy.h",
      "include/vm_ui.h",
      "src/core/vm_gameboy.c",
      "src/core/vm_instructions.c",
      "src/core/vm_ui.c",
      "src/states/shmup.c",
    ],
  },
  {
    version: "3.1.0-e2",
    description:
      "Updates:\n" +
      "   * Add VM_ACTOR_MOVE_CANCEL\n" +
      "   * Update hUGEDriver\n" +
      "   * Fix issue where activating an actor wouldn't trigger update script",
    modifiedFiles: [
      "include/gbs_types.h",
      "include/hUGEDriver.h",
      "include/hUGEDriverRoutines.h",
      "include/vm.i",
      "include/vm_actor.h",
      "lib/hUGEDriver.lib",
      "src/core/music_manager.c",
      "src/core/vm.c",
      "src/core/vm_actor.c",
      "src/core/vm_instructions.c",
    ],
  },
  {
    version: "3.1.0-e3",
    description:
      "Updates:\n" +
      "   * Add disabled flag to actors\n" +
      "   * Manually deactivating an actor will disable it preventing it from activating when coming back onscreen\n" +
      "   * Manually activating an actor will enable it again",
    modifiedFiles: [
      "include/gbs_types.h",
      "src/core/actor.c",
      "src/core/data_manager.c",
      "src/core/vm_actor.c",
    ],
  },
  {
    version: "3.1.0-e4",
    description:
      "Updates:\n" +
      "   * Fix bug where disabling the player would trigger rendering garbage\n" +
      "   * Remove unused spritesheet_0 header include in projectiles",
    modifiedFiles: [
      "src/core/actor.c",
      "src/core/projectiles.c",
      "src/core/vm_actor.c",
    ],
  },
  {
    version: "3.1.0-e5",
    description:
      "Updates:\n" +
      "   * Update hUGEDriver.lib\n" +
      "   * unify types in far_ptr_t and TO_FAR_PTR_T\n" +
      "   * add .R_REF_SET macro for VM_RPN instruction to set by reference\n" +
      "   * VM_OVERLAY_SET_SUBMAP and VM_OVERLAY_SET_MAP now accept X and Y coordinates from variables\n" +
      "   * remove useless VM_GET_SYSTIME, use VM_GET_INT16 instead\n" +
      "   * move ___sdcc_bcall_ehl trampoline to 0x0008, add ph rule that replace CALL with RST which save 2 bytes and 2 cycles each call\n" +
      "   * new overlay_priority field that allow set priority CGB attributes bit for the UI by default and thus partially hide actors behind the partially visible window layer\n" +
      "   * replace VM_LOAD_FRAME and VM_LOAD_CURSOR with universal VM_LOAD_TILES",
    modifiedFiles: [
      "include/bankdata.h",
      "include/hUGEDriver.h",
      "include/music_manager.h",
      "include/sample_player.h",
      "include/sfx_player.h",
      "include/ui.h",
      "include/vm.h",
      "include/vm.i",
      "include/vm_gameboy.h",
      "include/vm_music.h",
      "include/vm_ui.h",
      "lib/hUGEDriver.lib",
      "src/core/___sdcc_bcall_ehl.s",
      "src/core/actor.c",
      "src/core/core.c",
      "src/core/data_manager.c",
      "src/core/interrupt_timer.s",
      "src/core/music_manager.c",
      "src/core/sample_player.c",
      "src/core/sfx_player.c",
      "src/core/ui.c",
      "src/core/vm.c",
      "src/core/vm_gameboy.c",
      "src/core/vm_instructions.c",
      "src/core/vm_music.c",
      "src/core/vm_ui.c",
    ],
  },
  {
    version: "3.1.0-e6",
    description:
      "Updates:\n" +
      [
        "   * Add support for sound effects priority",
        "   * Fix issue where soft reset could lead to UI tiles over scene tiles",
      ].join("\n"),
    modifiedFiles: [
      "include/music_manager.h",
      "include/sfx_player.h",
      "include/vm.i",
      "include/vm_music.h",
      "src/core/data_manager.c",
      "src/core/music_manager.c",
      "src/core/sfx_player.c",
      "src/core/ui.c",
      "src/core/vm_instructions.c",
      "src/core/vm_music.c",
    ],
  },
  {
    version: "3.1.0-e7",
    description:
      "Updates:\n" +
      [
        "   * Update hUGEDriver.lib",
        "   * Fix issue where projectiles launched at >224 degrees would be facing in wrong direction",
        "   * Allow overflowing of background tiles into UI",
        "   * Free space used in bank 2",
        "   * Remove 255 variable limit in VM_SAVE_PEEK",
        "   * Save rumble state while switching SRAM banks",
        "   * Update flasher for compatibility with GBDK-2020 v4.1",
        "   * Add .UI_MENU_SET_START flag for VM_CHOICE to set starting menu item",
        "   * Fix VM_OVERLAY_SET_SUBMAP on CGB",
        "   * Add boolean show_actors_on_overlay to draw actors over overlay layer",
        "   * Restore previously playing music when loading game data",
      ].join("\n"),
    modifiedFiles: [
      "include/interrupts.h",
      "include/load_save.h",
      "include/music_manager.h",
      "include/rtc.h",
      "include/system.h",
      "include/trigger.h",
      "include/ui.h",
      "include/vm.h",
      "include/vm.i",
      "include/vm_load_save.h",
      "include/vm_ui.h",
      "lib/hUGEDriver.lib",
      "src/core/actor.c",
      "src/core/bankdata.c",
      "src/core/data_manager.c",
      "src/core/flasher.c",
      "src/core/flasher_s.s",
      "src/core/interrupts.c",
      "src/core/load_save.c",
      "src/core/music_manager.c",
      "src/core/projectiles.c",
      "src/core/set_tile_submap.s",
      "src/core/states_caller.s",
      "src/core/system.c",
      "src/core/trigger.c",
      "src/core/ui.c",
      "src/core/ui_a.s",
      "src/core/vm.c",
      "src/core/vm_gameboy.c",
      "src/core/vm_instructions.c",
      "src/core/vm_load_save.c",
      "src/core/vm_music.c",
      "src/core/vm_ui.c",
    ],
  },
  {
    version: "3.1.0-e8",
    description:
      "Updates:\n" +
      [
        "   * Add GB Printer support",
        "   * Add instruction VM_CALL_NATIVE to call native C functions from script",
        "   * Fix issue where actors would play idle animation during scripted movement",
        "   * Remove unnecessary additional re-triggering of ch3 in the SFX engine",
      ].join("\n"),
    modifiedFiles: [
      "include/gbprinter.h",
      "include/ui.h",
      "include/vm.h",
      "include/vm.i",
      "include/vm_gbprinter.h",
      "include/vm_ui.h",
      "src/core/gbprinter.c",
      "src/core/sfx_player.c",
      "src/core/ui.c",
      "src/core/vm.c",
      "src/core/vm_actor.c",
      "src/core/vm_gbprinter.c",
      "src/core/vm_instructions.c",
      "src/core/vm_ui.c",
    ],
  },
  {
    version: "3.1.0-e9",
    description:
      "Updates:\n" +
      [
        "   * Fix an issue where fading out mid-scene would cause game to hang",
      ].join("\n"),
    modifiedFiles: [
      "src/core/fade_manager.c",
      "src/core/interrupts.c",
      "src/core/scroll.c",
      "src/core/vm.c",
      "src/states/topdown.c",
    ],
  },
  {
    version: "3.1.0-e10",
    description:
      "Updates:\n" +
      [
        "   * Add support for persistent actors that won't unload when offscreen",
        "   * Add support for projectiles that survive multiple collisions",
        "   * Add support for projectiles that only play animation once",
        '   * Disable margin after printing, that allows to printing "endless" pictures',
        "   * Optimise actors_update() function",
        "   * Optimise vm_actor_move_to() function",
      ].join("\n"),
    modifiedFiles: [
      "include/gbs_types.h",
      "include/projectiles.h",
      "include/vm.h",
      "include/vm.i",
      "src/core/actor.c",
      "src/core/gbprinter.c",
      "src/core/projectiles.c",
      "src/core/vm.c",
      "src/core/vm_actor.c",
      "src/core/vm_camera.c",
      "src/core/vm_projectiles.c",
    ],
  },
  {
    version: "3.1.0-e11",
    description:
      "Updates:\n" +
      [
        "   * Fix issue where actors would switch direction at last frame of vm_actor_move_to",
        "   * Moved all actor flags instructions into single VM_ACTOR_SET_FLAGS with macros for compatibility with old instructions",
        "   * Tidied actor and camera manipulation structs",
      ].join("\n"),
    modifiedFiles: [
      "include/actor.h",
      "include/vm.i",
      "include/vm_actor.h",
      "src/core/vm_actor.c",
      "src/core/vm_camera.c",
      "src/core/vm_instructions.c",
    ],
  },
  {
    version: "3.1.0-e12",
    description:
      "Updates:\n" +
      [
        "   * Allow VM instructions to be stored outside of bank 2 as we were running out of space",
        "   * Add VM_PROJECTILE_LOAD_TYPE instruction to replace projectile def in current scene",
        "   * Fix issue with VM_SET_FONT not correctly updating vwf_current_font_idx value",
      ].join("\n"),
    modifiedFiles: [
      "include/bankdata.h",
      "include/data_manager.h",
      "include/load_save.h",
      "include/ui.h",
      "include/vm.h",
      "include/vm.i",
      "include/vm_actor.h",
      "include/vm_camera.h",
      "include/vm_gameboy.h",
      "include/vm_gbprinter.h",
      "include/vm_load_save.h",
      "include/vm_math.h",
      "include/vm_music.h",
      "include/vm_palette.h",
      "include/vm_projectiles.h",
      "include/vm_rtc.h",
      "include/vm_scene.h",
      "include/vm_sgb.h",
      "include/vm_sio.h",
      "include/vm_ui.h",
      "src/core/bankdata.c",
      "src/core/data_manager.c",
      "src/core/vm.c",
      "src/core/vm_actor.c",
      "src/core/vm_camera.c",
      "src/core/vm_gameboy.c",
      "src/core/vm_gbprinter.c",
      "src/core/vm_instructions.c",
      "src/core/vm_load_save.c",
      "src/core/vm_math.c",
      "src/core/vm_music.c",
      "src/core/vm_palette.c",
      "src/core/vm_projectiles.c",
      "src/core/vm_rtc.c",
      "src/core/vm_scene.c",
      "src/core/vm_sgb.c",
      "src/core/vm_sio.c",
      "src/core/vm_ui.c",
    ],
  },
  {
    version: "3.1.0-e13",
    description:
      "Updates\n" +
      [
        "   * Update most files to be autobanked allowing tighter packed and smaller ROMs",
      ].join("\n"),
    modifiedFiles: [
      "include/actor.h",
      "src/core/actor.c",
      "src/core/camera.c",
      "src/core/core.c",
      "src/core/crash_handler.s",
      "src/core/data_manager.c",
      "src/core/events.c",
      "src/core/fade_manager.c",
      "src/core/flasher.c",
      "src/core/flasher_s.s",
      "src/core/gbprinter.c",
      "src/core/input.c",
      "src/core/interrupts.c",
      "src/core/load_save.c",
      "src/core/music_manager.c",
      "src/core/palette.c",
      "src/core/parallax.c",
      "src/core/projectiles.c",
      "src/core/scroll.c",
      "src/core/scroll_a.s",
      "src/core/sfx_player.c",
      "src/core/sgb_border.c",
      "src/core/sio.c",
      "src/core/trigger.c",
      "src/core/ui.c",
      "src/core/ui_a.s",
      "src/core/vm.c",
      "src/core/vm_actor.c",
      "src/core/vm_camera.c",
      "src/core/vm_gameboy.c",
      "src/core/vm_gbprinter.c",
      "src/core/vm_load_save.c",
      "src/core/vm_math.c",
      "src/core/vm_music.c",
      "src/core/vm_palette.c",
      "src/core/vm_projectiles.c",
      "src/core/vm_rtc.c",
      "src/core/vm_scene.c",
      "src/core/vm_sgb.c",
      "src/core/vm_sio.c",
      "src/core/vm_ui.c",
      "src/core/vm_ui_a.s",
      "src/states/adventure.c",
      "src/states/logo.c",
      "src/states/platform.c",
      "src/states/pointnclick.c",
      "src/states/shmup.c",
      "src/states/topdown.c",
    ],
  },
  {
    version: "3.1.0-e14",
    description:
      "Updates\n" +
      [
        "   * VM_PRINT_OVERLAY now accept MARGIN paremeter: feed N lines after printing, use 0x03 for the last print in the batch",
        "   * Add ability to start text rendering from the arbitrary tile != 0 (in the VRAM bank 0 only if CGB)",
        "   * Fix back resolving of base tile when loading projectile default",
      ].join("\n"),
    modifiedFiles: [
      "include/gbprinter.h",
      "include/ui.h",
      "include/vm.i",
      "include/vm_gbprinter.h",
      "include/vm_ui.h",
      "src/core/actor.c",
      "src/core/gbprinter.c",
      "src/core/ui.c",
      "src/core/vm_gbprinter.c",
      "src/core/vm_instructions.c",
      "src/core/vm_projectiles.c",
      "src/core/vm_ui.c",
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
