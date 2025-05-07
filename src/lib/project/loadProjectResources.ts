import path from "path";
import {
  ActorPrefabResource,
  ActorResource,
  AvatarResource,
  CompressedBackgroundResource,
  CompressedProjectResources,
  CompressedSceneResource,
  CompressedSceneResourceWithChildren,
  EmoteResource,
  EngineFieldValuesResource,
  FontResource,
  MinimalResource,
  MusicResource,
  PaletteResource,
  ProjectMetadataResource,
  ScriptResource,
  SettingsResource,
  SoundResource,
  SpriteResource,
  TilesetResource,
  TriggerPrefabResource,
  TriggerResource,
  VariablesResource,
} from "shared/lib/resources/types";
import glob from "glob";
import { promisify } from "util";
import promiseLimit from "lib/helpers/promiseLimit";
import groupBy from "lodash/groupBy";
import { identity } from "lodash";
import { defaultProjectSettings } from "consts";
import { readJson } from "lib/helpers/fs/readJson";
import { Value } from "@sinclair/typebox/value";
import { TSchema } from "@sinclair/typebox/build/cjs/type/schema";
import { Static } from "@sinclair/typebox";
import { naturalSortPaths, pathToPosix } from "shared/lib/helpers/path";

const globAsync = promisify(glob);

const CONCURRENT_RESOURCE_LOAD_COUNT = 8;

const sortByIndex = (
  a: { data: { _index: number } },
  b: { data: { _index: number } }
) => {
  if (a.data._index < b.data._index) {
    return -1;
  }
  if (a.data._index > b.data._index) {
    return 1;
  }
  return 0;
};

interface RawResource {
  path: string;
  data: unknown;
}

type ResourceWithPath<T> = {
  path: string;
  data: T;
};

interface ResourceLookup {
  actors: ResourceWithPath<ActorResource>[];
  triggers: ResourceWithPath<TriggerResource>[];
  scenes: ResourceWithPath<CompressedSceneResource>[];
  actorPrefabs: ResourceWithPath<ActorPrefabResource>[];
  triggerPrefabs: ResourceWithPath<TriggerPrefabResource>[];
  scripts: ResourceWithPath<ScriptResource>[];
  backgrounds: ResourceWithPath<CompressedBackgroundResource>[];
  sprites: ResourceWithPath<SpriteResource>[];
  palettes: ResourceWithPath<PaletteResource>[];
  music: ResourceWithPath<MusicResource>[];
  emotes: ResourceWithPath<EmoteResource>[];
  avatars: ResourceWithPath<AvatarResource>[];
  tilesets: ResourceWithPath<TilesetResource>[];
  fonts: ResourceWithPath<FontResource>[];
  sounds: ResourceWithPath<SoundResource>[];
  variables: ResourceWithPath<VariablesResource>[];
  engineFieldValues: ResourceWithPath<EngineFieldValuesResource>[];
  settings: ResourceWithPath<Partial<SettingsResource>>[];
}

export const loadProjectResources = async (
  projectRoot: string,
  metadataResource: ProjectMetadataResource
): Promise<CompressedProjectResources> => {
  const projectResources = naturalSortPaths(
    await globAsync(
      path.join(projectRoot, "{project,assets,plugins}", "**/*.gbsres")
    )
  );

  const resources = (
    await promiseLimit(
      CONCURRENT_RESOURCE_LOAD_COUNT,
      projectResources.map((projectResourcePath) => async () => {
        try {
          const resourceData = await readJson(projectResourcePath);
          return {
            path: pathToPosix(path.relative(projectRoot, projectResourcePath)),
            data: resourceData,
          };
        } catch (e) {
          console.error("Failed to load resource: " + projectResourcePath);
          return undefined;
        }
      })
    )
  ).filter(identity) as RawResource[];

  const resourcesLookup: ResourceLookup = {
    actors: [],
    triggers: [],
    scenes: [],
    actorPrefabs: [],
    triggerPrefabs: [],
    scripts: [],
    backgrounds: [],
    sprites: [],
    palettes: [],
    music: [],
    emotes: [],
    avatars: [],
    tilesets: [],
    fonts: [],
    sounds: [],
    variables: [],
    engineFieldValues: [],
    settings: [],
  };
  const cast =
    <T extends TSchema, D extends MinimalResource>(
      schema: T,
      arr: ResourceWithPath<Static<T>>[]
    ) =>
    ({ path, data }: { path: string; data: D }): boolean => {
      if (data._resourceType === schema?.properties?._resourceType?.const) {
        const castData = Value.Cast(schema, data);
        arr.push({
          path,
          data: castData,
        });
        return true;
      }
      return false;
    };
  const partial =
    <T extends TSchema, D extends MinimalResource>(
      schema: T,
      arr: ResourceWithPath<Partial<Static<T>>>[]
    ) =>
    ({ path, data }: { path: string; data: D }): boolean => {
      if (data._resourceType === schema?.properties?._resourceType?.const) {
        // Filter out any invalid keys, returning a valid partial resource
        const keys = Object.keys(data) as (keyof D)[];
        const newResource: Partial<Static<T>> = {};
        for (const key of keys) {
          const keySchema = schema?.properties?.[key] as TSchema;
          const keyData = data[key] as Static<T>[keyof Static<T>];
          if (keySchema && Value.Check(keySchema, keyData)) {
            newResource[key as keyof Static<T>] = keyData;
          }
        }
        arr.push({
          path,
          data: newResource,
        });
        return true;
      }
      return false;
    };
  const castFns = [
    cast(ActorResource, resourcesLookup.actors),
    cast(TriggerResource, resourcesLookup.triggers),
    cast(CompressedSceneResource, resourcesLookup.scenes),
    cast(ActorPrefabResource, resourcesLookup.actorPrefabs),
    cast(TriggerPrefabResource, resourcesLookup.triggerPrefabs),
    cast(ScriptResource, resourcesLookup.scripts),
    cast(CompressedBackgroundResource, resourcesLookup.backgrounds),
    cast(SpriteResource, resourcesLookup.sprites),
    cast(PaletteResource, resourcesLookup.palettes),
    cast(MusicResource, resourcesLookup.music),
    cast(EmoteResource, resourcesLookup.emotes),
    cast(AvatarResource, resourcesLookup.avatars),
    cast(TilesetResource, resourcesLookup.tilesets),
    cast(FontResource, resourcesLookup.fonts),
    cast(SoundResource, resourcesLookup.sounds),
    cast(VariablesResource, resourcesLookup.variables),
    cast(EngineFieldValuesResource, resourcesLookup.engineFieldValues),
    partial(SettingsResource, resourcesLookup.settings),
  ] as const;

  for (const resource of resources) {
    if (!Value.Check(MinimalResource, resource.data)) {
      // Invalid resource - skipping
      continue;
    }
    for (const castFunction of castFns) {
      if (castFunction(resource as ResourceWithPath<MinimalResource>)) {
        break;
      }
    }
  }

  resourcesLookup.scenes.sort(sortByIndex);
  resourcesLookup.actors.sort(sortByIndex);
  resourcesLookup.triggers.sort(sortByIndex);

  const actorSubFolder = `${path.posix.sep}actors${path.posix.sep}`;
  const actorsBySceneFolderLookup = groupBy(resourcesLookup.actors, (row) => {
    const actorFolderIndex = row.path.lastIndexOf(actorSubFolder);
    return row.path.substring(0, actorFolderIndex);
  });

  const triggerSubFolder = `${path.posix.sep}triggers${path.posix.sep}`;
  const triggersBySceneFolderLookup = groupBy(
    resourcesLookup.triggers,
    (row) => {
      const triggerFolderIndex = row.path.lastIndexOf(triggerSubFolder);
      return row.path.substring(0, triggerFolderIndex);
    }
  );

  const extractData = <T>(value: { data: T }): T => value.data;
  const extractDataArray = <T>(arr: { data: T }[] | undefined): T[] =>
    arr?.map(extractData) ?? [];

  const sceneResources: CompressedSceneResourceWithChildren[] =
    resourcesLookup.scenes.map((row) => {
      const sceneDir = path.posix.dirname(row.path);
      return {
        ...row.data,
        actors: (actorsBySceneFolderLookup[sceneDir] ?? []).map(extractData),
        triggers: (triggersBySceneFolderLookup[sceneDir] ?? []).map(
          extractData
        ),
      };
    });

  const variablesResource: VariablesResource =
    resourcesLookup.variables[0]?.data ??
    ({
      _resourceType: "variables",
      variables: [],
      constants: [],
    } as VariablesResource);

  const engineFieldValuesResource: EngineFieldValuesResource =
    (resourcesLookup.engineFieldValues ?? [])[0]?.data ?? {
      _resourceType: "engineFieldValues",
      engineFieldValues: [],
    };

  const settingsResource: SettingsResource = (
    resourcesLookup.settings ?? []
  ).reduce(
    (memo, resource) => {
      return {
        ...memo,
        ...resource.data,
      };
    },
    { _resourceType: "settings", ...defaultProjectSettings }
  );

  return {
    scenes: sceneResources,
    actorPrefabs: extractDataArray(resourcesLookup.actorPrefabs),
    triggerPrefabs: extractDataArray(resourcesLookup.triggerPrefabs),
    scripts: extractDataArray(resourcesLookup.scripts),
    sprites: extractDataArray(resourcesLookup.sprites),
    backgrounds: extractDataArray(resourcesLookup.backgrounds),
    emotes: extractDataArray(resourcesLookup.emotes),
    avatars: extractDataArray(resourcesLookup.avatars),
    tilesets: extractDataArray(resourcesLookup.tilesets),
    fonts: extractDataArray(resourcesLookup.fonts),
    sounds: extractDataArray(resourcesLookup.sounds),
    music: extractDataArray(resourcesLookup.music),
    palettes: extractDataArray(resourcesLookup.palettes),
    variables: variablesResource,
    engineFieldValues: engineFieldValuesResource,
    settings: settingsResource,
    metadata: metadataResource,
  };
};
