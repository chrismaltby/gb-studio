import { buildUsageItems } from "shared/lib/compiler/buildUsageItems";
import { clearL10NData, setL10NData } from "shared/lib/lang/l10n";

afterEach(() => {
  clearL10NData();
});

test("combines script contexts and generated asset modules into usage rows", () => {
  setL10NData({ SIDEBAR_ON_INTERACT: "On Interact" });

  expect(
    buildUsageItems({
      scripts: [
        {
          symbol: "scene_0_interact",
          size: 42,
          sources: [
            {
              sceneId: "scene-0",
              entityId: "actor-0",
              entityType: "actor",
              scriptKey: "script",
            },
          ],
        },
      ],
      sources: [
        {
          sourceFile: "src/data/scene_0_actors.c",
          usage: { bank0: 10, wram: 0, bankedRom: 20 },
        },
      ],
      entities: {
        scenes: [
          {
            id: "scene-0",
            name: "Town",
            symbol: "scene_0",
            actors: ["actor-0"],
            triggers: [],
          },
        ],
        actors: [{ id: "actor-0", name: "Shopkeeper" }],
        triggers: [],
        customEvents: [],
        sprites: [],
        backgrounds: [],
        music: [],
        sounds: [],
      },
    }),
  ).toEqual([
    {
      key: "script:scene_0_interact",
      type: "script",
      name: "Shopkeeper (On Interact)",
      symbol: "scene_0_interact",
      sourceFile: "scene_0_interact.s",
      size: 42,
      sources: [
        {
          sceneId: "scene-0",
          entityId: "actor-0",
          entityType: "actor",
          scriptKey: "script",
        },
      ],
      sourceLabels: ["Shopkeeper (On Interact)"],
    },
    {
      key: "scene:scene_0:src/data/scene_0_actors.c",
      type: "scene",
      name: "Town",
      symbol: "scene_0",
      sourceType: "actors",
      sourceFile: "scene_0_actors.c",
      size: 30,
    },
  ]);
});
