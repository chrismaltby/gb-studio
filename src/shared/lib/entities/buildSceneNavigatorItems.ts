import { actorName, sceneName, triggerName, noteName } from "./entitiesHelpers";
import {
  ColorModeOverrideSetting,
  LabelColor,
} from "shared/lib/resources/types";

type Entity = {
  id: string;
  name: string;
};

export type SceneNavigatorScene = {
  id: string;
  name: string;
  labelColor?: LabelColor;
  colorModeOverride: ColorModeOverrideSetting;
  actors: string[];
  triggers: string[];
};

export type SceneNavigatorNote = {
  id: string;
  name: string;
  labelColor?: LabelColor;
};

export type SceneNavigatorActor = {
  id: string;
  name: string;
};

export type SceneNavigatorTrigger = {
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
      scene: SceneNavigatorScene;
    }
  | {
      type: "note";
      note: SceneNavigatorNote;
    }
  | {
      type: "actor";
      actor: SceneNavigatorActor;
      sceneId: string;
    }
  | {
      type: "trigger";
      trigger: SceneNavigatorTrigger;
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

export const sceneParentFolders = (name: string): string[] => {
  const parts = name.split(/[/\\]/).slice(0, -1);
  const folders: string[] = [];
  while (parts.length > 0) {
    folders.push(parts.join("/"));
    folders.push(parts.join("\\"));
    parts.pop();
  }
  return folders;
};

export const sceneIdsInFolder = (
  folder: string,
  scenes: SceneNavigatorScene[],
): string[] => {
  const regex = new RegExp("^" + folder.split(/[/\\]/).join("[/\\\\]"));
  return scenes
    .filter((scene) => scene.name.match(regex))
    .map((scene) => scene.id);
};

export const noteIdsInFolder = (
  folder: string,
  notes: SceneNavigatorNote[],
): string[] => {
  const regex = new RegExp("^" + folder.split(/[/\\]/).join("[/\\\\]"));
  return notes
    .filter((scene) => scene.name.match(regex))
    .map((note) => note.id);
};

export const buildSceneNavigatorItems = (
  scenes: SceneNavigatorScene[],
  notes: SceneNavigatorNote[],
  actorsLookup: Record<string, SceneNavigatorActor | undefined>,
  triggersLookup: Record<string, SceneNavigatorTrigger | undefined>,
  openFolders: string[],
  searchTerm: string,
): SceneNavigatorItem[] => {
  const result: SceneNavigatorItem[] = [];
  const uniqueFolders = new Set<string>();

  const isVisible = (filename: string, nestLevel?: number): boolean => {
    if (searchTerm.length > 0) return true;
    if (nestLevel === undefined || nestLevel === 0) return true;
    const pathSegments = filename.split(/[\\/]/);
    pathSegments.pop();
    let pathCheck = "";
    return pathSegments.every((segment, index) => {
      pathCheck += (index ? "/" : "") + segment;
      return openFolders.includes(pathCheck);
    });
  };

  const sceneAndNotes = [
    ...scenes.map((scene, index) => ({
      ...scene,
      type: "scene" as const,
      name: sceneName(scene, index),
    })),
    ...notes.map((note, index) => ({
      ...note,
      type: "note" as const,
      name: noteName(note, index),
    })),
  ].sort(sortByName);

  const addScene = (scene: SceneNavigatorScene, nestLevel: number) => {
    result.push({
      id: scene.id,
      type: "scene",
      name: scene.name,
      filename: scene.name.replace(/.*[/\\]/, ""),
      nestLevel,
      labelColor: scene.labelColor,
      scene,
    });
    if (!openFolders.includes(scene.id)) {
      return;
    }

    scene.actors.forEach((actorId, actorIndex) => {
      const actor = actorsLookup[actorId];

      if (actor) {
        const name = actorName(actor, actorIndex);

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

    scene.triggers.forEach((triggerId, triggerIndex) => {
      const trigger = triggersLookup[triggerId];

      if (trigger) {
        const name = triggerName(trigger, triggerIndex);

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
  };

  const addNote = (note: SceneNavigatorNote, nestLevel: number) => {
    result.push({
      id: note.id,
      type: "note",
      name: note.name,
      filename: note.name.replace(/.*[/\\]/, ""),
      nestLevel,
      labelColor: note.labelColor,
      note,
    });
    if (!openFolders.includes(note.id)) {
      return;
    }
  };

  if (searchTerm.length > 0) {
    const searchTermUpperCase = searchTerm.toLocaleUpperCase();
    sceneAndNotes
      .filter((item) =>
        item.name.toLocaleUpperCase().includes(searchTermUpperCase),
      )
      .forEach((item) => {
        if (item.type === "note") {
          addNote(item, 0);
        } else {
          addScene(item, 0);
        }
      });

    return result;
  }

  sceneAndNotes.forEach((value) => {
    const path = value.name;
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
        if (value.type === "note") {
          addNote(value, nestLevel);
        } else {
          addScene(value, nestLevel);
        }
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
