import path from "path";
import {
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
import { Type, Static } from "@sinclair/typebox";
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
  console.time("loadProjectData.loadProject globResources");
  const projectResources = naturalSortPaths(
    await globAsync(path.join(projectRoot, "project", "**/*.gbsres"))
  );
  console.timeEnd("loadProjectData.loadProject globResources");

  console.time("loadProjectData.loadProject readResources2");
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
  console.timeEnd("loadProjectData.loadProject readResources2");

  console.time("loadProjectData.loadProject build resourcesLookup");
  const resourcesLookup: ResourceLookup = {
    actors: [],
    triggers: [],
    scenes: [],
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
        if (Value.Check(Type.Partial(schema), data)) {
          arr.push({
            path,
            data: data as Partial<Static<T>>,
          });
          return true;
        }
      }
      return false;
    };
  const castFns = [
    cast(ActorResource, resourcesLookup.actors),
    cast(TriggerResource, resourcesLookup.triggers),
    cast(CompressedSceneResource, resourcesLookup.scenes),
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

  console.timeEnd("loadProjectData.loadProject build resourcesLookup");

  console.time("loadProjectData.loadProject build sortActors");
  resourcesLookup.actors.sort(sortByIndex);
  console.timeEnd("loadProjectData.loadProject build sortActors");

  console.time("loadProjectData.loadProject build sortTriggers");
  resourcesLookup.triggers.sort(sortByIndex);
  console.timeEnd("loadProjectData.loadProject build sortTriggers");

  console.time("loadProjectData.loadProject build actorsBySceneFolderLookup");
  const actorSubFolder = `${path.posix.sep}actors${path.posix.sep}`;
  const actorsBySceneFolderLookup = groupBy(resourcesLookup.actors, (row) => {
    const actorFolderIndex = row.path.lastIndexOf(actorSubFolder);
    return row.path.substring(0, actorFolderIndex);
  });
  console.timeEnd(
    "loadProjectData.loadProject build actorsBySceneFolderLookup"
  );

  console.time("loadProjectData.loadProject build triggersBySceneFolderLookup");
  const triggerSubFolder = `${path.posix.sep}triggers${path.posix.sep}`;
  const triggersBySceneFolderLookup = groupBy(
    resourcesLookup.triggers,
    (row) => {
      const triggerFolderIndex = row.path.lastIndexOf(triggerSubFolder);
      return row.path.substring(0, triggerFolderIndex);
    }
  );
  console.timeEnd(
    "loadProjectData.loadProject build triggersBySceneFolderLookup"
  );

  console.time("loadProjectData.loadProject build sceneResources");

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

  console.timeEnd("loadProjectData.loadProject build sceneResources");

  console.time("loadProjectData.loadProject build variablesResource");
  const variablesResource: VariablesResource = resourcesLookup.variables[0]
    ?.data ?? { _resourceType: "variables", variables: [] };
  console.timeEnd("loadProjectData.loadProject build variablesResource");

  console.time("loadProjectData.loadProject build engineFieldValuesResource");
  const engineFieldValuesResource: EngineFieldValuesResource =
    (resourcesLookup.engineFieldValues ?? [])[0]?.data ?? {
      _resourceType: "engineFieldValues",
      engineFieldValues: [],
    };
  console.timeEnd(
    "loadProjectData.loadProject build engineFieldValuesResource"
  );

  console.time("loadProjectData.loadProject build settingsResource");
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
  console.timeEnd("loadProjectData.loadProject build settingsResource");

  return {
    scenes: sceneResources,
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
