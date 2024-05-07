import { Dictionary } from "@reduxjs/toolkit";
import {
  ActorNormalized,
  SceneNormalized,
  TriggerNormalized,
} from "./entitiesTypes";
import { actorName, sceneName, triggerName } from "./entitiesHelpers";

type Entity = {
  id: string;
  name: string;
};

export type SceneNavigatorItem = {
  id: string;
  name: string;
  filename: string;
  nestLevel?: number;
  labelColor?: string;
} & (
  | {
      type: "folder";
    }
  | {
      type: "scene";
      scene: SceneNormalized;
    }
  | {
      type: "actor";
      actor: ActorNormalized;
      sceneId: string;
    }
  | {
      type: "trigger";
      trigger: TriggerNormalized;
      sceneId: string;
    }
);

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (a: Entity, b: Entity) => {
  return collator.compare(a.name, b.name);
};

export const sceneParentFolders = (scene: SceneNormalized): string[] => {
  const parts = scene.name.split(/[/\\]/).slice(0, -1);
  const folders: string[] = [];
  while (parts.length > 0) {
    folders.push(parts.join("/"));
    folders.push(parts.join("\\"));
    parts.pop();
  }
  return folders;
};

export const scenesInFolder = (
  folder: string,
  scenes: SceneNormalized[]
): SceneNormalized[] => {
  const regex = new RegExp("^" + folder.split(/[/\\]/).join("[/\\\\]"));
  return scenes.filter((scene) => scene.name.match(regex));
};

export const buildSceneNavigatorItems = (
  scenes: SceneNormalized[],
  actorsLookup: Dictionary<ActorNormalized>,
  triggersLookup: Dictionary<TriggerNormalized>,
  openFolders: string[]
): SceneNavigatorItem[] => {
  const result: SceneNavigatorItem[] = [];
  const uniqueFolders = new Set<string>();

  const isVisible = (filename: string, nestLevel?: number): boolean => {
    if (nestLevel === undefined || nestLevel === 0) return true;
    const pathSegments = filename.split(/[\\/]/);
    pathSegments.pop();
    let pathCheck = "";
    return pathSegments.every((segment, index) => {
      pathCheck += (index ? "/" : "") + segment;
      return openFolders.includes(pathCheck);
    });
  };

  scenes
    .map((scene, index) => ({ ...scene, name: sceneName(scene, index) }))
    .sort(sortByName)
    .forEach((scene) => {
      const path = scene.name;
      const parts = path.split(/[\\/]/);
      let currentPath = "";

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        currentPath += (currentPath ? "/" : "") + part;
        if (isLast) {
          const nestLevel = parts.length > 1 ? parts.length - 1 : 0;
          if (!isVisible(currentPath, nestLevel)) {
            return;
          }
          result.push({
            id: scene.id,
            type: "scene",
            name: currentPath,
            filename: part,
            nestLevel,
            labelColor: scene.labelColor,
            scene,
          });
          if (!openFolders.includes(scene.id)) {
            return;
          }
          scene.actors.forEach((actorId) => {
            const actor = actorsLookup[actorId];
            if (actor) {
              const name = actorName(actor, scene.actors.indexOf(actorId));
              result.push({
                id: actor.id,
                type: "actor",
                name,
                filename: name,
                nestLevel: nestLevel + 1,
                actor,
                sceneId: scene.id,
              });
            }
          });

          scene.triggers.forEach((triggerId) => {
            const trigger = triggersLookup[triggerId];
            if (trigger) {
              const name = triggerName(
                trigger,
                scene.triggers.indexOf(triggerId)
              );
              result.push({
                id: trigger.id,
                type: "trigger",
                name,
                filename: name,
                nestLevel: nestLevel + 1,
                trigger,
                sceneId: scene.id,
              });
            }
          });
        } else if (!uniqueFolders.has(currentPath)) {
          if (!isVisible(currentPath, index)) {
            return;
          }
          uniqueFolders.add(currentPath);
          result.push({
            id: currentPath,
            type: "folder",
            name: currentPath,
            filename: part,
            nestLevel: index,
          });
        }
      });
    });

  return result;
};
