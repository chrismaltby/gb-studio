import migrateProject from "lib/project/migrateProject";
import identity from "lodash/identity";
import { BackgroundData, Scene } from "shared/lib/entities/entitiesTypes";
import {
  compressSceneResource,
  compressBackgroundResource,
} from "shared/lib/resources/compression";
import {
  CompressedBackgroundResource,
  CompressedProjectResources,
  CompressedSceneResourceWithChildren,
} from "shared/lib/resources/types";
import type { ScriptEventDefs } from "shared/lib/scripts/eventHelpers";
import type { ProjectData } from "store/features/project/projectActions";

export const migrateLegacyProject = (
  project: ProjectData,
  projectRoot: string,
  scriptEventDefs: ScriptEventDefs
): CompressedProjectResources => {
  console.time("loadProjectData.loadProject migrateProject");
  const migratedProject = migrateProject(project, projectRoot, scriptEventDefs);
  console.timeEnd("loadProjectData.loadProject migrateProject");

  const encodeResource =
    <T extends string>(type: T) =>
    <D>(data: D): D & { _resourceType: T } => ({
      _resourceType: type,
      ...data,
    });

  const encodeScene = (scene: Scene): CompressedSceneResourceWithChildren => {
    const encodeScene = encodeResource("scene");
    const encodeActor = encodeResource("actor");
    const encodeTrigger = encodeResource("trigger");
    return compressSceneResource(
      encodeScene({
        ...scene,
        actors: scene.actors
          .filter(identity)
          .map((actor, actorIndex) =>
            encodeActor({ ...actor, _index: actorIndex })
          ),
        triggers: scene.triggers
          .filter(identity)
          .map((trigger, triggerIndex) =>
            encodeTrigger({ ...trigger, _index: triggerIndex })
          ),
      })
    );
  };

  const encodeBackground = (
    background: BackgroundData
  ): CompressedBackgroundResource => {
    const encodeBackground = encodeResource("background");
    return compressBackgroundResource(encodeBackground(background));
  };

  return {
    scenes: migratedProject.scenes.filter(identity).map(encodeScene),
    scripts: migratedProject.customEvents
      .filter(identity)
      .map(encodeResource("script")),
    sprites: migratedProject.spriteSheets
      .filter(identity)
      .map(encodeResource("sprite")),
    backgrounds: migratedProject.backgrounds
      .filter(identity)
      .map(encodeBackground),
    emotes: migratedProject.emotes
      .filter(identity)
      .map(encodeResource("emote")),
    avatars: migratedProject.avatars
      .filter(identity)
      .map(encodeResource("avatar")),
    tilesets: migratedProject.tilesets
      .filter(identity)
      .map(encodeResource("tileset")),
    fonts: migratedProject.fonts.filter(identity).map(encodeResource("font")),
    sounds: migratedProject.sounds
      .filter(identity)
      .map(encodeResource("sound")),
    music: migratedProject.music.filter(identity).map(encodeResource("music")),
    palettes: migratedProject.palettes
      .filter(identity)
      .map(encodeResource("palette")),
    variables: {
      _resourceType: "variables",
      variables: migratedProject.variables,
    },
    engineFieldValues: {
      _resourceType: "engineFieldValues",
      engineFieldValues: migratedProject.engineFieldValues,
    },
    settings: {
      _resourceType: "settings",
      ...migratedProject.settings,
    },
    metadata: {
      _resourceType: "project",
      name: migratedProject.name,
      author: migratedProject.author,
      notes: migratedProject.notes,
      _version: migratedProject._version,
      _release: migratedProject._release,
    },
  };
};
