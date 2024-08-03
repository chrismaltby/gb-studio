import {
  ActorResource,
  CompressedSceneResourceWithChildren,
  PaletteResource,
  Resource,
  ScriptResource,
  TriggerResource,
} from "shared/lib/resources/types";
import Path from "path";
import { stripInvalidPathCharacters } from "shared/lib/helpers/stripInvalidFilenameCharacters";

type Entity = { id: string; name: string };

export const sceneResourceName = (scene: Entity) => scene.name || `Scene`;

export const actorResourceName = (actor: Entity) => actor.name || `Actor`;

export const triggerResourceName = (trigger: Entity) =>
  trigger.name || `Trigger`;

export const paletteResourceName = (palette: Entity) =>
  palette.name || `Palette`;

export const scriptResourceName = (script: Entity) => script.name || `Script`;

const entityToFilePath = (entity: Entity, nameOverride?: string): string => {
  const name = nameOverride || entity.name;
  return `${stripInvalidPathCharacters(name)
    .toLocaleLowerCase()
    .replace(/\\/g, "/")
    .replace(/\s+/g, "_")}__${entity.id}`;
};

const actorToFileName = (actor: Entity): string => {
  const name = actorResourceName(actor);
  return `${stripInvalidPathCharacters(name)
    .toLocaleLowerCase()
    .replace(/[/\\]/g, "_")
    .replace(/\s+/g, "_")}__${actor.id}`;
};

const triggerToFileName = (trigger: Entity): string => {
  const name = triggerResourceName(trigger);
  return `${stripInvalidPathCharacters(name)
    .toLocaleLowerCase()
    .replace(/[/\\]/g, "_")
    .replace(/\s+/g, "_")}__${trigger.id}`;
};

const resourceTypeFolderLookup = {
  background: "backgrounds",
  sprite: "sprites",
  tileset: "tilesets",
  emote: "emotes",
  avatar: "avatars",
  music: "music",
  sound: "sounds",
  font: "fonts",
  palette: "palettes",
  script: "scripts",
  scene: "scenes",
  actor: "actors",
  trigger: "triggers",
};

export const getResourceAssetPath = (resource: Resource): string =>
  Path.join(
    resourceTypeFolderLookup[resource._resourceType],
    `${entityToFilePath(resource)}.gbsres`
  );

export const getSceneFolderPath = (
  scene: CompressedSceneResourceWithChildren
): string =>
  Path.join(
    resourceTypeFolderLookup[scene._resourceType],
    `${entityToFilePath(scene, sceneResourceName(scene))}`
  );

export const getSceneResourcePath = (
  scene: CompressedSceneResourceWithChildren
): string => Path.join(getSceneFolderPath(scene), `scene.gbsres`);

export const getActorResourcePath = (
  sceneFolder: string,
  actor: ActorResource
): string =>
  Path.join(
    sceneFolder,
    resourceTypeFolderLookup[actor._resourceType],
    `${actorToFileName(actor)}.gbsres`
  );

export const curryActorResourcePath =
  (sceneFolder: string) =>
  (actor: ActorResource): string =>
    getActorResourcePath(sceneFolder, actor);

export const getTriggerResourcePath = (
  sceneFolder: string,
  trigger: TriggerResource
): string =>
  Path.join(
    sceneFolder,
    resourceTypeFolderLookup[trigger._resourceType],
    `${triggerToFileName(trigger)}.gbsres`
  );

export const curryTriggerResourcePath =
  (sceneFolder: string) =>
  (actor: TriggerResource): string =>
    getTriggerResourcePath(sceneFolder, actor);

export const getSceneResourcePaths = (
  scene: CompressedSceneResourceWithChildren
): string[] => {
  const sceneFolder = getSceneFolderPath(scene);
  const getActorPath = curryActorResourcePath(sceneFolder);
  const getTriggerPath = curryTriggerResourcePath(sceneFolder);
  return [
    getSceneResourcePath(scene),
    scene.actors.map(getActorPath),
    scene.triggers.map(getTriggerPath),
  ].flat();
};

export const getPaletteResourcePath = (palette: PaletteResource) =>
  Path.join(
    resourceTypeFolderLookup[palette._resourceType],
    `${entityToFilePath(palette, paletteResourceName(palette))}.gbsres`
  );

export const getScriptResourcePath = (script: ScriptResource) =>
  Path.join(
    resourceTypeFolderLookup[script._resourceType],
    `${entityToFilePath(script, scriptResourceName(script))}.gbsres`
  );
