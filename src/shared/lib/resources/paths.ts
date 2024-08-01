import {
  ActorResource,
  BackgroundResource,
  CompressedSceneResourceWithChildren,
  PaletteResource,
  Resource,
  ScriptResource,
  TriggerResource,
} from "shared/lib/resources/types";
import Path from "path";
import { stripInvalidPathCharacters } from "shared/lib/helpers/stripInvalidFilenameCharacters";

type Entity = { id: string; name: string };

export const sceneName = (scene: Entity, _sceneIndex: number) =>
  scene.name || `Scene`;

export const actorName = (actor: Entity, _actorIndex: number) =>
  actor.name || `Actor`;

export const triggerName = (trigger: Entity, _triggerIndex: number) =>
  trigger.name || `Trigger`;

export const paletteName = (palette: Entity, _paletteIndex: number) =>
  palette.name || `Palette`;

export const scriptName = (script: Entity, _scriptIndex: number) =>
  script.name || `Script`;

const entityToFilePath = (entity: Entity, nameOverride?: string): string => {
  const name = nameOverride || entity.name;
  return `${stripInvalidPathCharacters(name)
    .toLocaleLowerCase()
    .replace(/\\/g, "/")
    .replace(/\s+/g, "_")}__${entity.id}`;
};

const actorToFileName = (actor: Entity, actorIndex: number): string => {
  const name = actorName(actor, actorIndex);
  return `${stripInvalidPathCharacters(name)
    .toLocaleLowerCase()
    .replace(/[/\\]/g, "_")
    .replace(/\s+/g, "_")}__${actor.id}`;
};

const triggerToFileName = (trigger: Entity, triggerIndex: number): string => {
  const name = triggerName(trigger, triggerIndex);
  return `${stripInvalidPathCharacters(name)
    .toLocaleLowerCase()
    .replace(/[/\\]/g, "_")
    .replace(/\s+/g, "_")}__${trigger.id}`;
};

export const getBackgroundResourceAssetPath = (
  background: BackgroundResource
): string => Path.join("backgrounds", `${entityToFilePath(background)}.gbsres`);

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
  scene: CompressedSceneResourceWithChildren,
  sceneIndex: number
): string =>
  Path.join(
    resourceTypeFolderLookup[scene._resourceType],
    `${entityToFilePath(scene, sceneName(scene, sceneIndex))}`
  );

export const getSceneResourcePath = (
  scene: CompressedSceneResourceWithChildren,
  sceneIndex: number
): string => Path.join(getSceneFolderPath(scene, sceneIndex), `scene.gbsres`);

export const getActorResourcePath = (
  sceneFolder: string,
  actor: ActorResource,
  actorIndex: number
): string =>
  Path.join(
    sceneFolder,
    resourceTypeFolderLookup[actor._resourceType],
    `${actorToFileName(actor, actorIndex)}.gbsres`
  );

export const curryActorResourcePath =
  (sceneFolder: string) =>
  (actor: ActorResource, actorIndex: number): string =>
    getActorResourcePath(sceneFolder, actor, actorIndex);

export const getTriggerResourcePath = (
  sceneFolder: string,
  trigger: TriggerResource,
  triggerIndex: number
): string =>
  Path.join(
    sceneFolder,
    resourceTypeFolderLookup[trigger._resourceType],
    `${triggerToFileName(trigger, triggerIndex)}.gbsres`
  );

export const curryTriggerResourcePath =
  (sceneFolder: string) =>
  (actor: TriggerResource, actorIndex: number): string =>
    getTriggerResourcePath(sceneFolder, actor, actorIndex);

export const getSceneResourcePaths = (
  scene: CompressedSceneResourceWithChildren,
  sceneIndex: number
): string[] => {
  const sceneFolder = getSceneFolderPath(scene, sceneIndex);
  const getActorPath = curryActorResourcePath(sceneFolder);
  const getTriggerPath = curryTriggerResourcePath(sceneFolder);
  return [
    getSceneResourcePath(scene, sceneIndex),
    scene.actors.map(getActorPath),
    scene.triggers.map(getTriggerPath),
  ].flat();
};

export const getPaletteResourcePath = (
  palette: PaletteResource,
  paletteIndex: number
) =>
  Path.join(
    resourceTypeFolderLookup[palette._resourceType],
    `${entityToFilePath(palette, paletteName(palette, paletteIndex))}.gbsres`
  );

export const getScriptResourcePath = (
  script: ScriptResource,
  scriptIndex: number
) =>
  Path.join(
    resourceTypeFolderLookup[script._resourceType],
    `${entityToFilePath(script, scriptName(script, scriptIndex))}.gbsres`
  );
