import type { Reference } from "components/forms/ReferencesSelect";
import { DMG_PALETTE, MAX_NESTED_SCRIPT_DEPTH } from "consts";
import { eventHasArg } from "lib/helpers/eventSystem";
import { walkScenesScripts } from "shared/lib/scripts/walk";
import { ScriptEventHandlers } from "lib/scriptEventsHandlers/handlerTypes";
import keyBy from "lodash/keyBy";
import {
  Background,
  ColorModeSetting,
  Emote,
  Font,
  ProjectResources,
  Scene,
  Script,
  Sound,
  Sprite,
  Tileset,
  Variable,
} from "shared/lib/resources/types";
import { ensureString } from "shared/types";
import { valuesOf } from "shared/lib/helpers/record";
import l10n from "shared/lib/lang/l10n";

type HexPalette = [string, string, string, string];

export type ReferencedBackground = Background & {
  is360: boolean;
  uiPalette: HexPalette;
  colorMode: ColorModeSetting;
  forceTilesetGeneration: boolean;
};

export type ReferencedSprite = Sprite & {
  colorMode: ColorModeSetting;
};

export type ReferencedEmote = Emote;

export type ReferencedTileset = Tileset;

export const determineUsedAssets = ({
  projectData,
  customEventsLookup,
  scriptEventHandlers,
  warnings,
}: {
  projectData: ProjectResources;
  customEventsLookup: Record<string, Script>;
  scriptEventHandlers: ScriptEventHandlers;
  warnings: (msg: string) => void;
}) => {
  const variablesLookup = keyBy(projectData.variables.variables, "id");
  const soundsLookup = keyBy(projectData.sounds, "id");
  const fontsLookup = keyBy(projectData.fonts, "id");
  const backgroundsLookup = keyBy(projectData.backgrounds, "id");
  const spritesLookup = keyBy(projectData.sprites, "id");
  const emotesLookup = keyBy(projectData.emotes, "id");
  const tilesetsLookup = keyBy(projectData.tilesets, "id");
  const palettesLookup = keyBy(projectData.palettes, "id");

  const defaultPlayerSprites = projectData.settings.defaultPlayerSprites;
  const projectColorMode = projectData.settings.colorMode;

  const usedVariablesLookup: Record<string, Variable> = {};
  const usedSoundsLookup: Record<string, Sound> = {};
  const usedFontsLookup: Record<string, Font> = {};
  const usedBackgroundsLookup: Record<string, ReferencedBackground> = {};
  const usedSpritesLookup: Record<string, ReferencedSprite> = {};
  const usedEmotesLookup: Record<string, ReferencedEmote> = {};
  const usedTilesetsLookup: Record<string, ReferencedTileset> = {};

  const getSceneColorMode = (scene: Scene): ColorModeSetting => {
    if (scene.colorModeOverride === "none" || projectColorMode === "mono") {
      return projectColorMode;
    }
    return scene.colorModeOverride;
  };

  const addAssetById =
    <T>(assetLookup: Record<string, T>, usedLookup: Record<string, T>) =>
    (id: string) => {
      const asset = assetLookup[id];
      if (asset && !usedLookup[id]) {
        usedLookup[id] = asset;
      }
      return !!asset;
    };

  const addVariableById = (id: string) => {
    if (!usedVariablesLookup[id]) {
      const variable = variablesLookup[id];
      if (variable) {
        usedVariablesLookup[id] = variable;
      } else {
        usedVariablesLookup[id] = {
          id,
          name: `VAR_${id}`,
          symbol: `VAR_${id}`,
        };
      }
    }
  };
  const addSoundById = addAssetById(soundsLookup, usedSoundsLookup);

  const addFontById = addAssetById(fontsLookup, usedFontsLookup);

  const addEmoteById = addAssetById(emotesLookup, usedEmotesLookup);

  const addTilesetById = addAssetById(tilesetsLookup, usedTilesetsLookup);

  const addFontsFromString = (s: string) => {
    (s.match(/(!F:[0-9a-f-]+!)/g) || [])
      .map((id) => id.substring(3).replace(/!$/, ""))
      .forEach(addFontById);
  };

  const addReferences = (
    references: Reference[],
    filterType: string,
    addFn: (id: string) => void,
  ) => {
    const referencedIds = references
      .filter((ref) => ref.type === filterType)
      .map((ref) => ref.id);
    for (const id of referencedIds) {
      addFn(id);
    }
  };

  // Add default font
  if (!addFontById(projectData.settings.defaultFontId)) {
    if (projectData.fonts.length > 0) {
      addFontById(projectData.fonts[0].id);
    }
  }

  const defaultBackgroundId = projectData.backgrounds?.[0]?.id ?? "";
  const defaultSpriteId = projectData.sprites?.[0]?.id ?? "";

  const isIncompatibleColorMode = (
    colorModeA: string,
    colorModeB: string,
  ): boolean => {
    return (
      colorModeA !== colorModeB &&
      (colorModeA === "color" || colorModeB === "color")
    );
  };

  const incompatibleWarnedIds = new Set<string>();

  const addBackgroundById = (
    backgroundId: string,
    is360: boolean,
    uiPalette: HexPalette,
    colorMode: ColorModeSetting,
    forceTilesetGeneration: boolean,
  ) => {
    const id = ensureString(backgroundId, defaultBackgroundId);
    const asset = backgroundsLookup[id];
    if (asset) {
      if (!usedBackgroundsLookup[id]) {
        usedBackgroundsLookup[id] = {
          ...asset,
          is360,
          uiPalette,
          colorMode,
          forceTilesetGeneration,
        };
      } else {
        if (
          isIncompatibleColorMode(
            colorMode,
            usedBackgroundsLookup[id].colorMode,
          )
        ) {
          if (!incompatibleWarnedIds.has(asset.id)) {
            warnings(
              l10n("WARNING_BACKGROUND_IN_MULTIPLE_COLOR_MODES", {
                filename: asset.filename,
              }),
            );
            incompatibleWarnedIds.add(asset.id);
          }
          usedBackgroundsLookup[id].colorMode = projectColorMode;
        }
      }
      if (forceTilesetGeneration) {
        usedBackgroundsLookup[id].forceTilesetGeneration = true;
      }
    }
  };

  const addSpriteById = (spriteId: string, colorMode: ColorModeSetting) => {
    const id = ensureString(spriteId, defaultSpriteId);
    const asset = spritesLookup[id];
    if (asset) {
      if (!usedSpritesLookup[id]) {
        usedSpritesLookup[id] = {
          ...asset,
          colorMode,
        };
      } else {
        if (
          isIncompatibleColorMode(colorMode, usedSpritesLookup[id].colorMode)
        ) {
          if (!incompatibleWarnedIds.has(asset.id)) {
            warnings(
              l10n("WARNING_SPRITE_IN_MULTIPLE_COLOR_MODES", {
                filename: asset.filename,
              }),
            );
            incompatibleWarnedIds.add(asset.id);
          }
          usedSpritesLookup[id].colorMode = projectColorMode;
        }
      }
    }
  };

  projectData.scenes.forEach((scene) => {
    const colorMode = getSceneColorMode(scene);

    const uiPalette = (
      scene.paletteIds?.[7] === "dmg"
        ? DMG_PALETTE
        : palettesLookup[
            scene.paletteIds?.[7] ||
              projectData.settings.defaultBackgroundPaletteIds?.[7]
          ]
    )?.colors as HexPalette;

    addBackgroundById(
      ensureString(scene.backgroundId, defaultBackgroundId),
      scene.type === "LOGO",
      uiPalette,
      colorMode,
      !scene.tilesetId,
    );

    addSpriteById(
      ensureString(
        scene.playerSpriteSheetId || defaultPlayerSprites[scene.type],
        "",
      ),
      colorMode,
    );
    for (let a = 0; a < scene.actors.length; a++) {
      const actor = scene.actors[a];
      addSpriteById(actor.spriteSheetId, colorMode);
    }
  });

  walkScenesScripts(
    projectData.scenes,
    {
      customEvents: {
        lookup: customEventsLookup,
        maxDepth: MAX_NESTED_SCRIPT_DEPTH,
      },
    },
    (cmd, scene) => {
      const uiPalette = projectData.palettes.find(
        (p) =>
          p.id ===
          (scene.paletteIds[7] ||
            projectData.settings.defaultBackgroundPaletteIds[7]),
      )?.colors as HexPalette;

      // Add Referenced Assets
      if (eventHasArg(cmd, "references") && cmd.args?.references) {
        const references = cmd.args?.references as Reference[];
        addReferences(references, "variable", addVariableById);
        addReferences(references, "sound", addSoundById);
        addReferences(references, "font", addFontById);
        addReferences(references, "emote", addEmoteById);
        addReferences(references, "tileset", addTilesetById);
        addReferences(references, "background", (id: string) => {
          const colorMode = getSceneColorMode(scene);
          addBackgroundById(id, false, uiPalette, colorMode, true);
        });
      }

      if (eventHasArg(cmd, "backgroundId")) {
        const id = ensureString(cmd.args?.backgroundId, "");
        const colorMode = getSceneColorMode(scene);
        addBackgroundById(id, false, uiPalette, colorMode, true);
      }

      if (eventHasArg(cmd, "spriteSheetId")) {
        const id = ensureString(cmd.args?.spriteSheetId, "");
        const colorMode = getSceneColorMode(scene);
        addSpriteById(id, colorMode);
      }

      if (eventHasArg(cmd, "emoteId")) {
        const id = ensureString(cmd.args?.emoteId, "");
        addEmoteById(id);
      }

      if (cmd.args) {
        for (const key in cmd.args) {
          const value = cmd.args[key];
          const fieldType =
            scriptEventHandlers[cmd.command]?.fieldsLookup[key]?.type;

          if (fieldType === "textarea" && typeof value === "string") {
            // String text fields
            addFontsFromString(value);
          } else if (fieldType === "textarea" && Array.isArray(value)) {
            // Multi value text fields
            for (const row of value) {
              if (typeof row === "string") {
                addFontsFromString(row);
              }
            }
          } else if (fieldType === "tileset" && typeof value === "string") {
            addTilesetById(value);
          } else if (fieldType === "soundEffect" && typeof value === "string") {
            // Sounds
            addSoundById(value);
          }
        }
      }
    },
  );

  return {
    referencedVariables: valuesOf(usedVariablesLookup),
    referencedSounds: valuesOf(usedSoundsLookup),
    referencedFonts: valuesOf(usedFontsLookup),
    referencedBackgrounds: valuesOf(usedBackgroundsLookup),
    referencedSprites: valuesOf(usedSpritesLookup),
    referencedEmotes: valuesOf(usedEmotesLookup),
    referencedTilesets: valuesOf(usedTilesetsLookup),
  };
};
