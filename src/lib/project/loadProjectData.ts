import path from "path";
import uuid from "uuid/v4";
import loadAllBackgroundData, {
  BackgroundAssetData,
} from "./loadBackgroundData";
import loadAllSpriteData, { SpriteAssetData } from "./loadSpriteData";
import loadAllMusicData, { MusicAssetData } from "./loadMusicData";
import loadAllFontData from "./loadFontData";
import loadAllAvatarData from "./loadAvatarData";
import loadAllEmoteData from "./loadEmoteData";
import loadAllSoundData from "./loadSoundData";
import loadAllScriptEventHandlers, {
  ScriptEventDef,
} from "./loadScriptEventHandlers";
import type {
  EngineFieldSchema,
  SceneTypeSchema,
} from "store/features/engine/engineState";
import type { Asset } from "shared/lib/helpers/assets";
import keyBy from "lodash/keyBy";
import { cloneDictionary } from "lib/helpers/clone";
import { loadEngineFields } from "lib/project/engineFields";
import { loadSceneTypes } from "lib/project/sceneTypes";
import loadAllTilesetData from "lib/project/loadTilesetData";
import {
  CompressedBackgroundResource,
  CompressedProjectResources,
  CompressedSceneResourceWithChildren,
  EngineFieldValuesResource,
  MusicResource,
  PaletteResource,
  ProjectMetadataResource,
  SettingsResource,
  SpriteResource,
  VariablesResource,
  isProjectMetadataResource,
} from "shared/lib/resources/types";
import { defaultPalettes } from "consts";
import { migrateLegacyProject } from "./migrateLegacyProject";
import { loadProjectResources } from "./loadProjectResources";
import { readJson } from "lib/helpers/fs/readJson";
import type { ProjectData } from "store/features/project/projectActions";
import { migrateProjectResources } from "./migrateProjectResources";

export interface LoadProjectResult {
  resources: CompressedProjectResources;
  scriptEventDefs: Record<string, ScriptEventDef>;
  engineFields: EngineFieldSchema[];
  sceneTypes: SceneTypeSchema[];
  modifiedSpriteIds: string[];
  isMigrated: boolean;
}

const toUnixFilename = (filename: string) => {
  return filename.replace(/\\/g, "/");
};

const toAssetFilename = (elem: Asset) => {
  return (elem.plugin ? `${elem.plugin}/` : "") + toUnixFilename(elem.filename);
};

const indexResourceByFilename = <T extends Asset>(
  arr: T[]
): Record<string, T> => keyBy(arr || [], (data) => toAssetFilename(data));

const sortByName = (a: { name: string }, b: { name: string }) => {
  const aName = a.name.toUpperCase();
  const bName = b.name.toUpperCase();
  if (aName < bName) {
    return -1;
  }
  if (aName > bName) {
    return 1;
  }
  return 0;
};

const loadProject = async (projectPath: string): Promise<LoadProjectResult> => {
  const projectRoot = path.dirname(projectPath);

  const scriptEventDefs = await loadAllScriptEventHandlers(projectRoot);
  const originalJson = await readJson(projectPath);

  const unmigratedResources = !isProjectMetadataResource(originalJson)
    ? migrateLegacyProject(
        originalJson as ProjectData,
        projectRoot,
        scriptEventDefs
      )
    : await loadProjectResources(projectRoot, originalJson);

  const resources = await migrateProjectResources(unmigratedResources);

  const engineFields = await loadEngineFields(projectRoot);
  const sceneTypes = await loadSceneTypes(projectRoot);

  const { _version: originalVersion, _release: originalRelease } =
    originalJson as ProjectMetadataResource;

  const isMigrated =
    resources.metadata._version !== originalVersion ||
    resources.metadata._release !== originalRelease;

  const [
    backgrounds,
    sprites,
    music,
    sounds,
    fonts,
    avatars,
    emotes,
    tilesets,
  ] = await Promise.all([
    loadAllBackgroundData(projectRoot),
    loadAllSpriteData(projectRoot),
    loadAllMusicData(projectRoot),
    loadAllSoundData(projectRoot),
    loadAllFontData(projectRoot),
    loadAllAvatarData(projectRoot),
    loadAllEmoteData(projectRoot),
    loadAllTilesetData(projectRoot),
  ]);

  const modifiedSpriteIds: string[] = [];

  const addMissingEntityId = <T extends { id: string }>(entity: T) => {
    if (!entity.id) {
      return {
        ...entity,
        id: uuid(),
      };
    }
    return entity;
  };

  const sceneResources: CompressedSceneResourceWithChildren[] =
    resources.scenes.map((s) => {
      return addMissingEntityId({
        ...s,
        actors: s.actors.map(addMissingEntityId),
        triggers: s.triggers.map(addMissingEntityId),
      });
    });

  const scriptResources = resources.scripts.map(addMissingEntityId);

  const actorPrefabResources = resources.actorPrefabs.map(addMissingEntityId);

  const triggerPrefabResources =
    resources.triggerPrefabs.map(addMissingEntityId);

  const mergeAssetsWithResources = <
    R extends Asset & { name: string },
    A extends Asset
  >(
    assets: A[],
    resources: R[],
    mergeFn: (asset: A, resource: R | undefined) => R
  ) => {
    const oldResourceByFilename = indexResourceByFilename(resources || []);
    return assets
      .map((asset) => {
        const oldResource: R = oldResourceByFilename[toAssetFilename(asset)];
        return mergeFn(asset, oldResource);
      })
      .sort(sortByName);
  };

  const mergeAssetIdsWithResources = <
    A extends Asset & { id: string; name: string },
    B extends string
  >(
    assets: A[],
    resources: Omit<A & { _resourceType: B }, "inode" | "_v" | "plugin">[],
    resourceType: B
  ) => {
    return mergeAssetsWithResources(assets, resources, (asset, resource) => {
      return {
        _resourceType: resourceType,
        ...asset,
        id: resource?.id ?? asset.id,
      };
    });
  };

  const mergeAssetIdAndSymbolsWithResources = <
    A extends Asset & {
      id: string;
      symbol: string;
      name: string;
    },
    B extends string
  >(
    assets: A[],
    resources: Omit<
      A & { _resourceType: B },
      "inode" | "_v" | "plugin" | "mapping"
    >[],
    resourceType: B
  ) => {
    return mergeAssetsWithResources(assets, resources, (asset, resource) => {
      return {
        _resourceType: resourceType,
        ...asset,
        id: resource?.id ?? asset.id,
        symbol: resource?.symbol ?? asset.symbol,
      };
    });
  };

  const backgroundResources = mergeAssetsWithResources<
    CompressedBackgroundResource,
    BackgroundAssetData
  >(backgrounds, resources.backgrounds, (asset, resource) => {
    if (resource) {
      return {
        _resourceType: "background",
        ...asset,
        id: resource.id,
        symbol: resource?.symbol !== undefined ? resource.symbol : asset.symbol,
        tileColors:
          resource?.tileColors !== undefined ? resource.tileColors : "",
        autoColor:
          resource?.autoColor !== undefined ? resource.autoColor : false,
      };
    }
    return {
      _resourceType: "background",
      ...asset,
      tileColors: "",
    };
  });

  const spriteResources = mergeAssetsWithResources<
    SpriteResource,
    SpriteAssetData
  >(sprites, resources.sprites, (asset, resource) => {
    if (!resource || !resource.states || resource.numTiles === undefined) {
      modifiedSpriteIds.push(resource?.id ?? asset.id);
    }
    return {
      ...asset,
      ...resource,
      id: resource?.id ?? asset.id,
      symbol: resource?.symbol ?? asset.symbol,
      filename: asset.filename,
      name: resource?.name ?? asset.name,
      canvasWidth: resource?.canvasWidth || 32,
      canvasHeight: resource?.canvasHeight || 32,
      states: (
        resource?.states || [
          {
            id: uuid(),
            name: "",
            animationType: "multi_movement",
            flipLeft: true,
            animations: [],
          },
        ]
      ).map((oldState) => {
        return {
          ...oldState,
          animations: Array.from(Array(8)).map((_, animationIndex) => ({
            id:
              (oldState.animations &&
                oldState.animations[animationIndex] &&
                oldState.animations[animationIndex].id) ||
              uuid(),
            frames: (oldState.animations &&
              oldState.animations[animationIndex] &&
              oldState.animations[animationIndex].frames) || [
              {
                id: uuid(),
                tiles: [],
              },
            ],
          })),
        };
      }),
    } as SpriteResource;
  });

  const emoteResources = mergeAssetIdAndSymbolsWithResources(
    emotes,
    resources.emotes,
    "emote"
  );

  const avatarResources = mergeAssetIdsWithResources(
    avatars,
    resources.avatars,
    "avatar"
  );

  const tilesetResources = mergeAssetIdAndSymbolsWithResources(
    tilesets,
    resources.tilesets,
    "tileset"
  );

  const soundResources = mergeAssetIdAndSymbolsWithResources(
    sounds,
    resources.sounds,
    "sound"
  );

  const fontResources = mergeAssetIdAndSymbolsWithResources(
    fonts,
    resources.fonts,
    "font"
  );

  const musicResources = mergeAssetsWithResources<
    MusicResource,
    MusicAssetData
  >(music, resources.music, (asset, resource) => {
    if (resource) {
      return {
        _resourceType: "music",
        ...asset,
        id: resource.id,
        symbol: resource?.symbol !== undefined ? resource.symbol : asset.symbol,
        settings: {
          ...resource.settings,
        },
      };
    }
    return {
      _resourceType: "music",
      ...asset,
      settings: {},
    };
  });

  const paletteResources: PaletteResource[] =
    resources.palettes.map(addMissingEntityId);

  // Add any missing default palettes
  for (let i = 0; i < defaultPalettes.length; i++) {
    const defaultPalette = defaultPalettes[i];
    const existingPalette = paletteResources.find(
      (p) => p.id === defaultPalette.id
    );
    if (existingPalette) {
      existingPalette.defaultName = defaultPalette.name;
      existingPalette.defaultColors = defaultPalette.colors;
    } else {
      paletteResources.push({
        _resourceType: "palette",
        ...defaultPalette,
        defaultName: defaultPalette.name,
        defaultColors: defaultPalette.colors,
      });
    }
  }

  const variablesResource: VariablesResource = resources.variables;

  const engineFieldValuesResource: EngineFieldValuesResource =
    resources.engineFieldValues;

  const settingsResource: SettingsResource = resources.settings;

  return {
    resources: {
      scenes: sceneResources,
      actorPrefabs: actorPrefabResources,
      triggerPrefabs: triggerPrefabResources,
      scripts: scriptResources,
      sprites: spriteResources,
      backgrounds: backgroundResources,
      emotes: emoteResources,
      avatars: avatarResources,
      tilesets: tilesetResources,
      fonts: fontResources,
      sounds: soundResources,
      music: musicResources,
      palettes: paletteResources,
      variables: variablesResource,
      engineFieldValues: engineFieldValuesResource,
      settings: settingsResource,
      metadata: resources.metadata,
    },
    modifiedSpriteIds,
    isMigrated,
    scriptEventDefs: cloneDictionary(scriptEventDefs),
    engineFields,
    sceneTypes,
  };
};

export default loadProject;
