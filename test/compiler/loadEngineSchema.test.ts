import { mergeSceneTypes } from "lib/project/loadEngineSchema";
import { SceneTypeSchema } from "store/features/engine/engineState";

describe("mergeSceneTypes", () => {
  test("returns base scene types if no extra scene types provided", () => {
    const baseSceneTypes: SceneTypeSchema[] = [
      {
        key: "scene1",
        label: "Scene 1",
      },
      {
        key: "scene2",
        label: "Scene 2",
      },
    ];

    const merged = mergeSceneTypes(baseSceneTypes, []);

    expect(merged).toEqual(baseSceneTypes);
  });

  test("appends extra scene types if not found in base", () => {
    const baseSceneTypes: SceneTypeSchema[] = [
      {
        key: "scene1",
        label: "Scene 1",
      },
    ];

    const extraSceneTypes: Partial<SceneTypeSchema>[] = [
      {
        key: "scene2",
        label: "Scene 2",
      },
    ];

    const merged = mergeSceneTypes(baseSceneTypes, extraSceneTypes);

    expect(merged).toEqual([
      {
        key: "scene1",
        label: "Scene 1",
      },
      {
        key: "scene2",
        label: "Scene 2",
      },
    ]);
  });

  test("merges scene types with overrides", () => {
    const baseSceneTypes: SceneTypeSchema[] = [
      {
        key: "scene1",
        label: "Scene 1",
        collisionTiles: [
          {
            key: "solid",
            color: "#FA2828FF",
            mask: 15,
            flag: 15,
            name: "FIELD_SOLID",
            icon: "FFFFFFFFFFFFFFFF",
          },
        ],
      },
      {
        key: "scene2",
        label: "Scene 2",
      },
    ];

    const extraSceneTypes: Partial<SceneTypeSchema>[] = [
      {
        key: "scene1",
        collisionTiles: [
          {
            key: "water",
            color: "#00008080",
            mask: 240,
            flag: 128,
            name: "Water",
            icon: "0036480036480000",
          },
        ],
      },
      {
        key: "scene2",
        label: "Overridden Scene 2",
      },
      {
        key: "scene3",
        label: "Scene 3",
      },
    ];

    const merged = mergeSceneTypes(baseSceneTypes, extraSceneTypes);

    expect(merged).toEqual([
      {
        key: "scene1",
        label: "Scene 1",
        collisionTiles: [
          {
            key: "water",
            color: "#00008080",
            mask: 240,
            flag: 128,
            name: "Water",
            icon: "0036480036480000",
          },
        ],
      },
      {
        key: "scene2",
        label: "Overridden Scene 2",
      },
      {
        key: "scene3",
        label: "Scene 3",
      },
    ]);
  });
});
