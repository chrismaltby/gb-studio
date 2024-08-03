import {
  ActorResource,
  BackgroundResource,
  CompressedSceneResourceWithChildren,
  PaletteResource,
  ScriptResource,
  TriggerResource,
} from "shared/lib/resources/types";
import {
  sceneResourceName,
  actorResourceName,
  triggerResourceName,
  paletteResourceName,
  scriptResourceName,
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
} from "shared/lib/resources/paths";

describe("paths", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("sceneResourceName should prefer scene's name", () => {
    expect(sceneResourceName({ id: "1", name: "Hello World" })).toEqual(
      "Hello World"
    );
  });

  test("sceneResourceName should use default scene name when name is empty", () => {
    expect(sceneResourceName({ id: "1", name: "" })).toEqual("Scene");
  });

  test("actorResourceName should prefer actor's name", () => {
    expect(actorResourceName({ id: "1", name: "Hero" })).toEqual("Hero");
  });

  test("actorResourceName should use default actor name when name is empty", () => {
    expect(actorResourceName({ id: "1", name: "" })).toEqual("Actor");
  });

  test("triggerResourceName should prefer trigger's name", () => {
    expect(triggerResourceName({ id: "1", name: "Trigger1" })).toEqual(
      "Trigger1"
    );
  });

  test("triggerResourceName should use default trigger name when name is empty", () => {
    expect(triggerResourceName({ id: "1", name: "" })).toEqual("Trigger");
  });

  test("paletteResourceName should prefer palette's name", () => {
    expect(paletteResourceName({ id: "1", name: "Palette1" })).toEqual(
      "Palette1"
    );
  });

  test("paletteResourceName should use default palette name when name is empty", () => {
    expect(paletteResourceName({ id: "1", name: "" })).toEqual("Palette");
  });

  test("scriptResourceName should prefer script's name", () => {
    expect(scriptResourceName({ id: "1", name: "Script1" })).toEqual("Script1");
  });

  test("scriptResourceName should use default script name when name is empty", () => {
    expect(scriptResourceName({ id: "1", name: "" })).toEqual("Script");
  });

  test("getResourceAssetPath should return correct path for background", () => {
    const resource = {
      id: "1",
      name: "Background1",
      _resourceType: "background",
    } as BackgroundResource;
    expect(getResourceAssetPath(resource)).toEqual(
      "backgrounds/background1__1.gbsres"
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
    expect(getSceneFolderPath(scene)).toEqual("scenes/scene1__1");
  });

  test("getSceneResourcePath should return correct resource path", () => {
    const scene = {
      id: "1",
      name: "Scene1",
      _resourceType: "scene",
      actors: [],
      triggers: [],
    } as unknown as CompressedSceneResourceWithChildren;
    expect(getSceneResourcePath(scene)).toEqual(
      "scenes/scene1__1/scene.gbsres"
    );
  });

  test("getActorResourcePath should return correct actor resource path", () => {
    const actor = {
      id: "1",
      name: "Actor1",
      _resourceType: "actor",
    } as ActorResource;
    const sceneFolder = "scenes/scene1__1";
    expect(getActorResourcePath(sceneFolder, actor)).toEqual(
      "scenes/scene1__1/actors/actor1__1.gbsres"
    );
  });

  test("curryActorResourcePath should return correct actor resource path", () => {
    const actor = {
      id: "1",
      name: "Actor1",
      _resourceType: "actor",
    } as ActorResource;
    const sceneFolder = "scenes/scene1__1";
    const getActorPath = curryActorResourcePath(sceneFolder);
    expect(getActorPath(actor)).toEqual(
      "scenes/scene1__1/actors/actor1__1.gbsres"
    );
  });

  test("getTriggerResourcePath should return correct trigger resource path", () => {
    const trigger = {
      id: "1",
      name: "Trigger1",
      _resourceType: "trigger",
    } as TriggerResource;
    const sceneFolder = "scenes/scene1__1";
    expect(getTriggerResourcePath(sceneFolder, trigger)).toEqual(
      "scenes/scene1__1/triggers/trigger1__1.gbsres"
    );
  });

  test("curryTriggerResourcePath should return correct trigger resource path", () => {
    const trigger = {
      id: "1",
      name: "Trigger1",
      _resourceType: "trigger",
    } as TriggerResource;
    const sceneFolder = "scenes/scene1__1";
    const getTriggerPath = curryTriggerResourcePath(sceneFolder);
    expect(getTriggerPath(trigger)).toEqual(
      "scenes/scene1__1/triggers/trigger1__1.gbsres"
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
      "scenes/scene1__1/scene.gbsres",
      "scenes/scene1__1/actors/actor1__2.gbsres",
      "scenes/scene1__1/triggers/trigger1__3.gbsres",
    ]);
  });

  test("getPaletteResourcePath should return correct palette resource path", () => {
    const palette = {
      id: "1",
      name: "Palette1",
      _resourceType: "palette",
    } as PaletteResource;
    expect(getPaletteResourcePath(palette)).toEqual(
      "palettes/palette1__1.gbsres"
    );
  });

  test("getScriptResourcePath should return correct script resource path", () => {
    const script = {
      id: "1",
      name: "Script1",
      _resourceType: "script",
    } as ScriptResource;
    expect(getScriptResourcePath(script)).toEqual("scripts/script1__1.gbsres");
  });
});
