import { defaultProjectSettings } from "consts";
import {
  buildResourceExportBuffer,
  encodeResource,
} from "shared/lib/resources/save";
import { CompressedProjectResources } from "shared/lib/resources/types";
import SparkMD5 from "spark-md5";
import {
  dummyActorPrefabResource,
  dummyTriggerPrefabResource,
  dummyActorResource,
  dummyAvatarResource,
  dummyBackgroundResource,
  dummyCompressedSceneResource,
  dummyEmoteResource,
  dummyEngineFieldValuesResource,
  dummyFontResource,
  dummyMusicResource,
  dummyPaletteResource,
  dummyScriptResource,
  dummySoundResource,
  dummySpriteResource,
  dummyTilesetResource,
  dummyTriggerResource,
  dummyVariablesResource,
} from "../dummydata";

describe("save.ts", () => {
  describe("encodeResource", () => {
    it("should encode resource correctly", () => {
      const resource = {
        id: "1",
        name: "Test Resource",
        __type: "internal",
        other: "data",
      };
      const encoded = encodeResource("testType", resource);
      const expected = JSON.stringify(
        {
          _resourceType: "testType",
          id: "1",
          name: "Test Resource",
          other: "data",
        },
        null,
        2
      );
      expect(encoded).toEqual(expected);
    });
  });

  describe("buildResourceExportBuffer", () => {
    const mockProjectResources: CompressedProjectResources = {
      scenes: [
        {
          ...dummyCompressedSceneResource,
          _resourceType: "scene",
          id: "scene1",
          name: "Scene 1",
          actors: [
            {
              ...dummyActorResource,
              id: "actor1",
              name: "Actor 1",
            },
          ],
          triggers: [
            {
              ...dummyTriggerResource,
              id: "trigger1",
              name: "Trigger 1",
            },
          ],
        },
      ],
      backgrounds: [
        {
          ...dummyBackgroundResource,
          id: "bg1",
          name: "Background 1",
        },
      ],
      sprites: [
        {
          ...dummySpriteResource,
          id: "sprite1",
          name: "Sprite 1",
        },
      ],
      palettes: [
        {
          ...dummyPaletteResource,
          id: "palette1",
          name: "Palette 1",
        },
      ],
      actorPrefabs: [
        {
          ...dummyActorPrefabResource,
          id: "actorPrefab1",
          name: "Actor Prefab 1",
        },
      ],
      triggerPrefabs: [
        {
          ...dummyTriggerPrefabResource,
          id: "actorTrigger1",
          name: "Trigger Prefab 1",
        },
      ],
      scripts: [
        {
          ...dummyScriptResource,
          id: "script1",
          name: "Script 1",
        },
      ],
      music: [
        {
          ...dummyMusicResource,
          id: "music1",
          name: "Music 1",
        },
      ],
      sounds: [
        {
          ...dummySoundResource,
          id: "sound1",
          name: "Sound 1",
        },
      ],
      emotes: [
        {
          ...dummyEmoteResource,
          id: "emote1",
          name: "Emote 1",
        },
      ],
      avatars: [
        {
          ...dummyAvatarResource,
          id: "avatar1",
          name: "Avatar 1",
        },
      ],
      tilesets: [
        {
          ...dummyTilesetResource,
          id: "tileset1",
          name: "Tileset 1",
        },
      ],
      fonts: [
        {
          ...dummyFontResource,
          id: "font1",
        },
      ],
      settings: {
        _resourceType: "settings",
        ...defaultProjectSettings,
      },
      variables: {
        ...dummyVariablesResource,
        variables: [{ id: "var1", name: "Variable 1", symbol: "symbol" }],
      },
      engineFieldValues: {
        ...dummyEngineFieldValuesResource,
        engineFieldValues: [{ id: "field1", value: "someValue" }],
      },
      metadata: {
        _resourceType: "project",
        name: "",
        author: "",
        notes: "",
        _version: "",
        _release: "",
      },
    };

    it("should build resource export buffer correctly", () => {
      const buffer = buildResourceExportBuffer(mockProjectResources);

      expect(buffer).toHaveLength(17);

      // Verify one of the encoded resources
      const actorResource = buffer.find((file) =>
        file.path.includes("actor_1.gbsres")
      );
      expect(actorResource).toBeDefined();
      if (actorResource) {
        expect(actorResource.path).toBe(
          "project/scenes/scene_1/actors/actor_1.gbsres"
        );
        expect(actorResource.checksum).toBe(SparkMD5.hash(actorResource.data));
        expect(JSON.parse(actorResource.data)._resourceType).toBe("actor");
      }

      const sceneResource = buffer.find((file) =>
        file.path.includes("scene_1/scene.gbsres")
      );
      expect(sceneResource).toBeDefined();
      if (sceneResource) {
        expect(sceneResource.path).toBe("project/scenes/scene_1/scene.gbsres");
        expect(sceneResource.checksum).toBe(SparkMD5.hash(sceneResource.data));
        expect(JSON.parse(sceneResource.data)._resourceType).toBe("scene");
      }
    });
  });
});
