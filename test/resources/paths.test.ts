import {
  ActorPrefabResource,
  ActorResource,
  BackgroundResource,
  CompressedSceneResourceWithChildren,
  PaletteResource,
  ScriptResource,
  TriggerPrefabResource,
  TriggerResource,
} from "shared/lib/resources/types";
import {
  getResourceAssetPath,
  getSceneFolderPath,
  getSceneResourcePath,
  getActorResourcePath,
  curryActorResourcePath,
  getTriggerResourcePath,
  curryTriggerResourcePath,
  getSceneResourcePaths,
  getPaletteResourcePath,
  getScriptResourcePath,
  getActorPrefabResourcePath,
  getTriggerPrefabResourcePath,
} from "shared/lib/resources/paths";

describe("paths", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getResourceAssetPath should return correct path for background", () => {
    const resource = {
      id: "1",
      name: "Background1",
      _resourceType: "background",
    } as BackgroundResource;
    expect(getResourceAssetPath(resource)).toEqual(
      "backgrounds/background1.gbsres"
    );
  });

  test("getSceneFolderPath should return correct folder path", () => {
    const scene = {
      id: "1",
      name: "Scene1",
      _resourceType: "scene",
      actors: [],
      triggers: [],
    } as unknown as CompressedSceneResourceWithChildren;
    expect(getSceneFolderPath(scene)).toEqual("project/scenes/scene1");
  });

  test("getSceneResourcePath should return correct resource path", () => {
    expect(getSceneResourcePath("project/scenes/scene1")).toEqual(
      "project/scenes/scene1/scene.gbsres"
    );
  });

  test("getActorResourcePath should return correct actor resource path", () => {
    const actor = {
      id: "1",
      name: "Actor1",
      _resourceType: "actor",
    } as ActorResource;
    const sceneFolder = "project/scenes/scene1";
    expect(getActorResourcePath(sceneFolder, actor)).toEqual(
      "project/scenes/scene1/actors/actor1.gbsres"
    );
  });

  test("curryActorResourcePath should return correct actor resource path", () => {
    const actor = {
      id: "1",
      name: "Actor1",
      _resourceType: "actor",
    } as ActorResource;
    const sceneFolder = "project/scenes/scene1";
    const getActorPath = curryActorResourcePath(sceneFolder);
    expect(getActorPath(actor)).toEqual(
      "project/scenes/scene1/actors/actor1.gbsres"
    );
  });

  test("getTriggerResourcePath should return correct trigger resource path", () => {
    const trigger = {
      id: "1",
      name: "Trigger1",
      _resourceType: "trigger",
    } as TriggerResource;
    const sceneFolder = "project/scenes/scene1";
    expect(getTriggerResourcePath(sceneFolder, trigger)).toEqual(
      "project/scenes/scene1/triggers/trigger1.gbsres"
    );
  });

  test("curryTriggerResourcePath should return correct trigger resource path", () => {
    const trigger = {
      id: "1",
      name: "Trigger1",
      _resourceType: "trigger",
    } as TriggerResource;
    const sceneFolder = "project/scenes/scene1";
    const getTriggerPath = curryTriggerResourcePath(sceneFolder);
    expect(getTriggerPath(trigger)).toEqual(
      "project/scenes/scene1/triggers/trigger1.gbsres"
    );
  });

  test("getSceneResourcePaths should return correct scene resource paths", () => {
    const scene = {
      id: "1",
      name: "Scene1",
      _resourceType: "scene",
      actors: [{ id: "2", name: "Actor1", _resourceType: "actor" }],
      triggers: [{ id: "3", name: "Trigger1", _resourceType: "trigger" }],
    } as CompressedSceneResourceWithChildren;
    expect(getSceneResourcePaths(scene)).toEqual([
      "project/scenes/scene1/scene.gbsres",
      "project/scenes/scene1/actors/actor1.gbsres",
      "project/scenes/scene1/triggers/trigger1.gbsres",
    ]);
  });

  test("getPaletteResourcePath should return correct palette resource path", () => {
    const palette = {
      id: "1",
      name: "Palette1",
      _resourceType: "palette",
    } as PaletteResource;
    expect(getPaletteResourcePath(palette)).toEqual(
      "project/palettes/palette1.gbsres"
    );
  });

  test("getScriptResourcePath should return correct script resource path", () => {
    const script = {
      id: "1",
      name: "Script1",
      _resourceType: "script",
    } as ScriptResource;
    expect(getScriptResourcePath(script)).toEqual(
      "project/scripts/script1.gbsres"
    );
  });

  test("getActorPrefabResourcePath should return correct actor prefab resource path", () => {
    const actorPrefab = {
      id: "1",
      name: "ActorPrefab1",
      _resourceType: "actorPrefab",
    } as ActorPrefabResource;

    expect(getActorPrefabResourcePath(actorPrefab)).toEqual(
      "project/prefabs/actors/actorprefab1.gbsres"
    );
  });

  test("getTriggerPrefabResourcePath should return correct trigger prefab resource path", () => {
    const triggerPrefab = {
      id: "1",
      name: "TriggerPrefab1",
      _resourceType: "triggerPrefab",
    } as TriggerPrefabResource;

    expect(getTriggerPrefabResourcePath(triggerPrefab)).toEqual(
      "project/prefabs/triggers/triggerprefab1.gbsres"
    );
  });
});
