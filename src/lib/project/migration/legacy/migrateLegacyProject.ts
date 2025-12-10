import { Static, TSchema } from "@sinclair/typebox";
import migrateProject from "./migrateLegacyProjectVersions";
import identity from "lodash/identity";
import { BackgroundData } from "shared/lib/entities/entitiesTypes";
import {
  compressSceneResource,
  compressBackgroundResource,
} from "shared/lib/resources/compression";
import {
  ActorResource,
  AvatarResource,
  BackgroundResource,
  CompressedBackgroundResource,
  CompressedProjectResources,
  CompressedSceneResourceWithChildren,
  EmoteResource,
  EngineFieldValuesResource,
  FontResource,
  MusicResource,
  PaletteResource,
  ProjectMetadataResource,
  Scene,
  SceneResource,
  ScriptResource,
  SettingsResource,
  SoundResource,
  SpriteResource,
  TilesetResource,
  TriggerResource,
  VariablesResource,
} from "shared/lib/resources/types";
import type { ScriptEventDefs } from "shared/lib/scripts/eventHelpers";
import type { ProjectData } from "store/features/project/projectActions";
import { Value } from "@sinclair/typebox/value";
import { defaultProjectSettings } from "consts";
import { toValidSymbol } from "shared/lib/helpers/symbols";

const chain =
  <T, U>(fn1: (input: T) => T, fn2: (input: T) => U) =>
  (input: T) =>
    fn2(fn1(input));

export const migrateLegacyProject = (
  project: ProjectData,
  projectRoot: string,
  scriptEventDefs: ScriptEventDefs,
): CompressedProjectResources => {
  const migratedProject = migrateProject(project, projectRoot, scriptEventDefs);

  const encodeResource =
    <T extends TSchema, D extends object>(castAs: T) =>
    (data: Partial<D>): Static<T> =>
      Value.Cast(castAs, {
        ...data,
      });

  const encodeScene = (
    scene: Scene,
    sceneIndex: number,
  ): CompressedSceneResourceWithChildren => {
    const encodeSceneResource = encodeResource(SceneResource);
    const encodeActor = encodeResource(ActorResource);
    const encodeTrigger = encodeResource(TriggerResource);
    return compressSceneResource(
      encodeSceneResource({
        ...scene,
        _index: sceneIndex,
        actors: scene.actors
          .filter(identity)
          .map((actor, actorIndex) =>
            encodeActor({ ...actor, _index: actorIndex }),
          ),
        triggers: scene.triggers
          .filter(identity)
          .map((trigger, triggerIndex) =>
            encodeTrigger({ ...trigger, _index: triggerIndex }),
          ),
      }),
    );
  };

  const encodeBackground = (
    background: BackgroundData,
  ): CompressedBackgroundResource => {
    const encodeBackground = encodeResource(BackgroundResource);
    return compressBackgroundResource(encodeBackground(background));
  };

  const map = <A, B>(
    arr: A[] | undefined,
    mapFn: (a: A, index: number) => B,
  ): B[] => {
    if (!arr) {
      return [];
    }
    return arr.filter(identity).map(mapFn);
  };

  const fixMissingSymbols =
    <T extends { name: string; symbol: string }>(prefix: string) =>
    (resource: T): T => {
      if (!resource.symbol) {
        return {
          ...resource,
          symbol: toValidSymbol(`${prefix}_${resource.name}`),
        };
      }
      return resource;
    };

  return {
    scenes: map(migratedProject.scenes, encodeScene),
    actorPrefabs: [],
    triggerPrefabs: [],
    scripts: map(migratedProject.customEvents, encodeResource(ScriptResource)),
    sprites: map(
      migratedProject.spriteSheets,
      chain(fixMissingSymbols("sprite"), encodeResource(SpriteResource)),
    ),
    backgrounds: map(
      migratedProject.backgrounds,
      chain(fixMissingSymbols("bg"), encodeBackground),
    ),
    emotes: map(
      migratedProject.emotes,
      chain(fixMissingSymbols("emote"), encodeResource(EmoteResource)),
    ),
    avatars: map(migratedProject.avatars, encodeResource(AvatarResource)),
    tilesets: map(
      migratedProject.tilesets,
      chain(fixMissingSymbols("tileset"), encodeResource(TilesetResource)),
    ),
    fonts: map(
      migratedProject.fonts,
      chain(fixMissingSymbols("font"), encodeResource(FontResource)),
    ),
    sounds: map(
      migratedProject.sounds,
      chain(fixMissingSymbols("sound"), encodeResource(SoundResource)),
    ),
    music: map(
      migratedProject.music,
      chain(fixMissingSymbols("song"), encodeResource(MusicResource)),
    ),
    palettes: map(migratedProject.palettes, encodeResource(PaletteResource)),
    variables: encodeResource(VariablesResource)({
      _resourceType: "variables",
      variables: migratedProject.variables,
    }),
    engineFieldValues: encodeResource(EngineFieldValuesResource)({
      _resourceType: "engineFieldValues",
      engineFieldValues: migratedProject.engineFieldValues,
    }),
    settings: encodeResource(SettingsResource)({
      _resourceType: "settings",
      ...defaultProjectSettings,
      ...migratedProject.settings,
    }),
    metadata: encodeResource(ProjectMetadataResource)({
      _resourceType: "project",
      name: migratedProject.name,
      author: migratedProject.author,
      notes: migratedProject.notes,
      _version: migratedProject._version,
      _release: migratedProject._release,
    }),
  };
};
