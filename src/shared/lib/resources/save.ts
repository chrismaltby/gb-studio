import Path from "path";
import {
  ActorPrefabResource,
  ActorResource,
  AvatarResource,
  CompressedBackgroundResource,
  CompressedProjectResources,
  CompressedSceneResource,
  EmoteResource,
  EngineFieldValuesResource,
  FontResource,
  MusicResource,
  PaletteResource,
  ScriptResource,
  SettingsResource,
  SoundResource,
  SpriteResource,
  TilesetResource,
  TriggerPrefabResource,
  TriggerResource,
  VariablesResource,
  WriteFile,
} from "shared/lib/resources/types";
import {
  getActorPrefabResourcePath,
  getActorResourcePath,
  getPaletteResourcePath,
  getSceneFolderPath,
  getSceneResourcePath,
  getScriptResourcePath,
  getTriggerPrefabResourcePath,
  getTriggerResourcePath,
  projectResourcesFolder,
} from "shared/lib/resources/paths";
import SparkMD5 from "spark-md5";
import { omit } from "shared/types";
import { assetPath } from "shared/lib/helpers/assets";

const userSettingKeys: (keyof SettingsResource)[] = [
  "worldScrollX",
  "worldScrollY",
  "zoom",
  "navigatorSplitSizes",
  "showNavigator",
  "showCollisions",
  "showConnections",
  "showSceneScreenGrid",
  "previewAsMono",
  "showCollisionSlopeTiles",
  "showCollisionSlopeTiles",
  "favoriteEvents",
  "debuggerEnabled",
  "debuggerScriptType",
  "debuggerVariablesFilter",
  "debuggerCollapsedPanes",
  "debuggerPauseOnScriptChanged",
  "debuggerPauseOnWatchedVariableChanged",
  "debuggerBreakpoints",
  "debuggerWatchedVariables",
  "openBuildLogOnWarnings",
];

export const encodeResource = <T extends Record<string, unknown>>(
  resourceType: string,
  data: T,
): string => {
  const {
    // Extract id so it can be moved to top of data
    id,
    // Remove internal data so it isn't stored to disk
    __type,
    // Extract remaining data to write to disk
    ...rest
  } = data;
  return JSON.stringify(
    {
      _resourceType: resourceType,
      id,
      ...rest,
    },
    null,
    2,
  );
};

export const buildResourceExportBuffer = (
  projectResources: CompressedProjectResources,
): WriteFile[] => {
  const variablesResFilename = Path.join(
    projectResourcesFolder,
    `variables.gbsres`,
  );
  const settingsResFilename = Path.join(
    projectResourcesFolder,
    `settings.gbsres`,
  );
  const userSettingsResFilename = Path.join(
    projectResourcesFolder,
    `user_settings.gbsres`,
  );
  const engineFieldValuesResFilename = Path.join(
    projectResourcesFolder,
    `engine_field_values.gbsres`,
  );

  const writeBuffer: WriteFile[] = [];

  const seenPaths = new Set<string>();

  const getUniquePath = (path: string): string => {
    if (!seenPaths.has(path)) {
      seenPaths.add(path);
      return path;
    }
    const basename = Path.basename(path);
    const dirname = Path.dirname(path);
    const newPath = Path.join(
      dirname,
      basename.replace(
        /([0-9]*)(\.[^.]+|)$/,
        (_, number, ext) => `${number ? parseInt(number) + 1 : `_2`}${ext}`,
      ),
    );
    return getUniquePath(newPath);
  };

  const writeResource = <T extends Record<string, unknown>>(
    filename: string,
    resourceType: string,
    resource: T,
  ) => {
    const data = encodeResource(resourceType, resource);
    writeBuffer.push({
      path: filename,
      checksum: SparkMD5.hash(data),
      data,
    });
  };

  let sceneIndex = 0;
  for (const scene of projectResources.scenes) {
    const sceneFolder = getUniquePath(getSceneFolderPath(scene));
    const sceneFilename = getUniquePath(getSceneResourcePath(sceneFolder));
    // Scene Actors
    if (scene.actors.length > 0) {
      let actorIndex = 0;
      for (const actor of scene.actors) {
        if (actor) {
          const actorFilename = getUniquePath(
            getActorResourcePath(sceneFolder, actor),
          );
          writeResource<ActorResource>(actorFilename, "actor", {
            ...actor,
            _index: actorIndex,
          });
          actorIndex++;
        }
      }
    }
    // Scene Triggers
    if (scene.triggers.length > 0) {
      let triggerIndex = 0;
      for (const trigger of scene.triggers) {
        if (trigger) {
          const triggerFilename = getUniquePath(
            getTriggerResourcePath(sceneFolder, trigger),
          );
          writeResource<TriggerResource>(triggerFilename, "trigger", {
            ...trigger,
            _index: triggerIndex,
          });
          triggerIndex++;
        }
      }
    }

    writeResource<CompressedSceneResource>(sceneFilename, "scene", {
      ...omit(scene, "actors", "triggers"),
      _index: sceneIndex,
    });
    sceneIndex++;
  }

  for (const background of projectResources.backgrounds) {
    const assetFilename = assetPath("backgrounds", background);
    const resFilename = assetFilename + ".gbsres";
    writeResource<CompressedBackgroundResource>(
      resFilename,
      "background",
      background,
    );
  }

  for (const sprite of projectResources.sprites) {
    const assetFilename = assetPath("sprites", sprite);
    const resFilename = assetFilename + ".gbsres";
    writeResource<SpriteResource>(resFilename, "sprite", sprite);
  }

  for (const palette of projectResources.palettes) {
    const paletteFilename = getUniquePath(getPaletteResourcePath(palette));
    writeResource<PaletteResource>(paletteFilename, "palette", palette);
  }

  for (const actorPrefab of projectResources.actorPrefabs) {
    const actorPrefabFilename = getUniquePath(
      getActorPrefabResourcePath(actorPrefab),
    );
    writeResource<ActorPrefabResource>(
      actorPrefabFilename,
      "actorPrefab",
      actorPrefab,
    );
  }

  for (const triggerPrefab of projectResources.triggerPrefabs) {
    const triggerPrefabFilename = getUniquePath(
      getTriggerPrefabResourcePath(triggerPrefab),
    );
    writeResource<TriggerPrefabResource>(
      triggerPrefabFilename,
      "triggerPrefab",
      triggerPrefab,
    );
  }

  for (const script of projectResources.scripts) {
    const scriptFilename = getUniquePath(getScriptResourcePath(script));
    writeResource<ScriptResource>(scriptFilename, "script", script);
  }

  for (const song of projectResources.music) {
    const assetFilename = assetPath("music", song);
    const resFilename = assetFilename + ".gbsres";
    writeResource<MusicResource>(resFilename, "music", song);
  }

  for (const sound of projectResources.sounds) {
    const assetFilename = assetPath("sounds", sound);
    const resFilename = assetFilename + ".gbsres";
    writeResource<SoundResource>(resFilename, "sound", sound);
  }

  for (const emote of projectResources.emotes) {
    const assetFilename = assetPath("emotes", emote);
    const resFilename = assetFilename + ".gbsres";
    writeResource<EmoteResource>(resFilename, "emote", emote);
  }

  for (const avatar of projectResources.avatars) {
    const assetFilename = assetPath("avatars", avatar);
    const resFilename = assetFilename + ".gbsres";
    writeResource<AvatarResource>(resFilename, "avatar", avatar);
  }

  for (const tileset of projectResources.tilesets) {
    const assetFilename = assetPath("tilesets", tileset);
    const resFilename = assetFilename + ".gbsres";
    writeResource<TilesetResource>(resFilename, "tileset", tileset);
  }

  for (const font of projectResources.fonts) {
    const assetFilename = assetPath("fonts", font);
    const resFilename = assetFilename + ".gbsres";
    writeResource<FontResource>(resFilename, "font", font);
  }

  const clearedSettings = userSettingKeys.reduce((acc, key) => {
    acc[key] = undefined;
    return acc;
  }, {} as Partial<SettingsResource>);

  const userSettings = userSettingKeys.reduce(
    <T extends keyof SettingsResource>(
      acc: Partial<SettingsResource>,
      key: T,
    ) => {
      acc[key] = projectResources.settings[key] as SettingsResource[T];
      return acc;
    },
    {} as Partial<SettingsResource>,
  );

  writeResource<Partial<SettingsResource>>(settingsResFilename, "settings", {
    ...projectResources.settings,
    ...clearedSettings,
  });

  writeResource<Partial<SettingsResource>>(
    userSettingsResFilename,
    "settings",
    userSettings,
  );

  writeResource<VariablesResource>(
    variablesResFilename,
    "variables",
    projectResources.variables,
  );

  writeResource<EngineFieldValuesResource>(
    engineFieldValuesResFilename,
    "engineFieldValues",
    projectResources.engineFieldValues,
  );

  return writeBuffer;
};
