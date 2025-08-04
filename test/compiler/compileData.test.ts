/* eslint-disable @typescript-eslint/no-explicit-any */
import compile, {
  precompileBackgrounds,
  precompileScenes,
} from "../../src/lib/compiler/compileData";
import {
  compileSceneProjectiles,
  PrecompiledBackground,
  PrecompiledScene,
  PrecompiledSprite,
} from "../../src/lib/compiler/generateGBVMData";
import { EVENT_TEXT, EVENT_IF_TRUE } from "../../src/consts";
import { projectileStateTest } from "./_files/data/projectiles";
import { getTestScriptHandlers } from "../getTestScriptHandlers";
import { ProjectResources } from "shared/lib/resources/types";
import { Scene, TilesetData } from "shared/lib/entities/entitiesTypes";
import {
  dummyActor,
  dummyBackground,
  dummyScene,
  dummyScriptEvent,
} from "../dummydata";
import os from "os";
import { ReferencedBackground } from "lib/compiler/precompile/determineUsedAssets";

test("should take into account state value when building projectiles", () => {
  const scene = projectileStateTest.scene as unknown as PrecompiledScene;
  const sprites = projectileStateTest.sprites as unknown as PrecompiledSprite[];
  const out = compileSceneProjectiles(scene, 0, sprites);
  expect(out).toEqual(projectileStateTest.expectedOutput);
});

test("should compile simple project into files object", async () => {
  const scriptEventHandlers = await getTestScriptHandlers();
  const project = {
    startSceneId: "1",
    startX: 5,
    startY: 6,
    startDirection: "down",
    settings: {
      playerSpriteSheetId: "SPRITE_1",
      defaultPlayerSprites: {},
    },
    scenes: [
      {
        id: "1",
        name: "first_scene",
        symbol: "scene_1",
        backgroundId: "2",
        width: 20,
        height: 18,
        // prettier-ignore
        collisions: [
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0
        ],
        actors: [
          {
            id: "9",
            symbol: "actor_9",
            spriteSheetId: "SPRITE_1",
            script: [
              {
                command: EVENT_TEXT,
                args: {
                  text: 'HELLO "WORLD',
                },
              },
              {
                command: EVENT_TEXT,
                args: {
                  text: "LOREM IPSUM",
                },
              },
            ],
          },
          {
            id: "12",
            symbol: "actor_12",
            spriteSheetId: "SPRITE_2",
            script: [
              {
                command: EVENT_TEXT,
                args: {
                  text: 'HELLO "WORLD',
                },
              },
            ],
          },
        ],
        triggers: [
          {
            id: "92",
            symbol: "trigger_92",
            x: 1,
            y: 2,
            width: 5,
            height: 1,
            trigger: "walk",
            script: [
              {
                command: EVENT_TEXT,
                args: {
                  text: "TRIGGER TEST",
                },
              },
            ],
            leaveScript: [],
          },
        ],
        script: [],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
      {
        id: "5",
        name: "second_scene",
        symbol: "scene_2",
        backgroundId: "3",
        width: 32,
        height: 32,
        // prettier-ignore
        collisions: [
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0
        ],
        actors: [
          {
            id: "10",
            symbol: "actor_10",
            spriteSheetId: "SPRITE_1",
            script: [
              {
                command: EVENT_IF_TRUE,
                args: {
                  variable: "1",
                },
                children: {
                  true: [
                    {
                      command: EVENT_TEXT,
                      args: {
                        text: "LOREM IPSUM",
                      },
                    },
                  ],
                  false: [
                    {
                      command: EVENT_TEXT,
                      args: {
                        text: "NOT YET",
                      },
                    },
                    {
                      command: "EVENT_SET_VALUE",
                      args: {
                        variable: "1",
                        value: { type: "true" },
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
        triggers: [],
        script: [],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
      {
        id: "6",
        name: "third_scene",
        symbol: "scene_3",
        backgroundId: "4",
        width: 20,
        height: 18,
        // prettier-ignore
        collisions: [
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0
        ],
        actors: [
          {
            id: "99",
            spriteSheetId: "SPRITE_1",
            script: [],
          },
        ],
        triggers: [],
        script: [],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
      {
        id: "9",
        name: "fourth_scene",
        symbol: "scene_4",
        backgroundId: "7",
        width: 20,
        height: 18,
        // prettier-ignore
        collisions: [
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0
        ],
        actors: [],
        triggers: [],
        script: [],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
      {
        id: "10",
        name: "fifth_scene",
        symbol: "scene_5",
        backgroundId: "8",
        width: 20,
        height: 18,
        // prettier-ignore
        collisions: [
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0
        ],
        actors: [],
        triggers: [
          {
            id: "91",
            symbol: "trigger_91",
            x: 1,
            y: 2,
            width: 5,
            height: 1,
            trigger: "walk",
            script: [
              {
                command: EVENT_TEXT,
                args: {
                  text: "TRIGGER TEST",
                },
              },
            ],
            leaveScript: [],
          },
        ],
        script: [],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
    ],
    backgrounds: [
      {
        id: "2",
        symbol: "bg_1",
        width: 20,
        height: 32,
        imageWidth: 160,
        imageHeight: 256,
        filename: "forest_clearing.png",
      },
      {
        id: "3",
        symbol: "bg_2",
        width: 20,
        height: 18,
        imageWidth: 160,
        imageHeight: 256,
        filename: "mabe_house.png",
      },
      {
        id: "4",
        symbol: "bg_3",
        width: 32,
        height: 32,
        imageWidth: 256,
        imageHeight: 256,
        filename: "village_street_night.png",
      },
      {
        id: "7",
        symbol: "bg_4",
        width: 20,
        height: 18,
        imageWidth: 160,
        imageHeight: 256,
        filename: "home_bedroom_night.png",
      },
      {
        id: "8",
        symbol: "bg_5",
        width: 20,
        height: 18,
        imageWidth: 160,
        imageHeight: 256,
        filename: "boss.png",
      },
    ],
    spriteSheets: [
      {
        id: "SPRITE_1",
        symbol: "sprite_1",
        filename: "sprite_1.png",
        states: [
          {
            id: "SPRITE_STATE_1",
            name: "",
            animations: [
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
            ],
          },
        ],
      },
      {
        id: "SPRITE_2",
        symbol: "sprite_2",
        filename: "sprite_2.png",
        states: [
          {
            id: "SPRITE_STATE_2",
            name: "",
            animations: [
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
            ],
          },
        ],
      },
      {
        id: "SPRITE_3",
        symbol: "sprite_3",
        filename: "sprite_3.png",
        states: [
          {
            id: "SPRITE_STATE_3",
            name: "",
            animations: [
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
            ],
          },
        ],
      },
    ],
    music: [],
    fonts: [
      {
        id: "font1",
        symbol: "font_1",
        filename: "gbs-mono.png",
      },
    ],
    palettes: [],
    avatars: [],
    emotes: [],
    variables: {
      variables: [],
      constants: [],
    },
    engineFieldValues: {
      engineFieldValues: [],
    },
  } as unknown as ProjectResources;
  const compiled = await compile(project, {
    projectRoot: `${__dirname}/_files`,
    scriptEventHandlers,
    engineSchema: {
      fields: [],
      sceneTypes: [],
      consts: {},
    },
    tmpPath: os.tmpdir(),
    debugEnabled: false,
    progress: (_msg: string) => {},
    warnings: (_msg: string) => {},
  });
  expect(compiled).toBeInstanceOf(Object);
});

test("should precompile image data", async () => {
  const backgrounds = [
    {
      id: "2b",
      name: "test_img",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "test_img.png",
      is360: false,
    },
  ] as ReferencedBackground[];
  const scenes = [
    {
      ...dummyScene,
      id: "1",
      name: "first_scene",
      backgroundId: "2b",
      actors: [],
      triggers: [],
    },
  ] as Scene[];
  const tilesets = [] as TilesetData[];
  const { usedBackgrounds, backgroundLookup } = await precompileBackgrounds(
    backgrounds,
    scenes,
    tilesets,
    "default",
    `${__dirname}/_files`,
    { warnings: () => {} },
  );
  expect(usedBackgrounds).toHaveLength(1);
  expect(backgroundLookup["2b"]).toMatchObject(backgrounds[0]);
  expect(backgroundLookup["3b"]).toBeUndefined();
});

test("should precompile scenes", async () => {
  const scenes = [
    {
      ...dummyScene,
      id: "1",
      backgroundId: "3",
      type: "TOPDOWN",
      actors: [
        {
          ...dummyActor,
          spriteSheetId: "5",
        },
      ],
      triggers: [],
    },
    {
      ...dummyScene,
      id: "2",
      backgroundId: "4",
      type: "TOPDOWN",
      actors: [
        {
          ...dummyActor,
          spriteSheetId: "5",
        },
        {
          ...dummyActor,
          spriteSheetId: "6",
        },
      ],
      triggers: [],
    },
  ] as Scene[];
  const usedBackgrounds = [
    {
      ...dummyBackground,
      id: "3",
    },
    {
      ...dummyBackground,
      id: "4",
    },
  ] as unknown as PrecompiledBackground[];
  const spriteData = [
    {
      id: "5",
    },
    {
      id: "6",
    },
  ] as unknown as PrecompiledSprite[];
  const defaultPlayerSprites = {
    TOPDOWN: "5",
  };
  const sceneData = precompileScenes(
    scenes,
    {},
    defaultPlayerSprites,
    "8x16",
    usedBackgrounds,
    spriteData,
    { warnings: () => {} },
  );

  expect(sceneData).toHaveLength(scenes.length);
  expect(sceneData[0].sprites).toHaveLength(1);
  expect(sceneData[1].sprites).toHaveLength(2);
});

test("should precompile script", async () => {});

test("should include extra backgrounds when using common tilesets", async () => {
  const backgrounds = [
    {
      id: "2b",
      name: "test_img",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "test_img.png",
      symbol: "bg2",
      is360: false,
    },
  ] as ReferencedBackground[];
  const scenes = [
    {
      ...dummyScene,
      id: "1",
      name: "first_scene",
      backgroundId: "2b",
      tilesetId: "t1",
      actors: [],
      triggers: [],
    },
    {
      ...dummyScene,
      id: "1",
      name: "second_scene",
      backgroundId: "2b",
      tilesetId: "t2",
      actors: [],
      triggers: [],
    },
  ] as Scene[];
  const tilesets = [
    {
      id: "t1",
      name: "tile_img1",
      width: 2,
      height: 2,
      imageWidth: 16,
      imageHeight: 16,
      filename: "tile_img1.png",
      symbol: "t1",
    },
    {
      id: "t2",
      name: "tile_img2",
      width: 2,
      height: 2,
      imageWidth: 16,
      imageHeight: 16,
      filename: "tile_img2.png",
      symbol: "t2",
    },
  ] as TilesetData[];
  const { usedBackgrounds, backgroundLookup } = await precompileBackgrounds(
    backgrounds,
    scenes,
    tilesets,
    "default",
    `${__dirname}/_files`,
    { warnings: () => {} },
  );
  expect(usedBackgrounds).toHaveLength(2);
  expect(usedBackgrounds[0].id).toBe(backgrounds[0].id);
  expect(usedBackgrounds[0].symbol).toBe(`bg2_t1`);
  expect(usedBackgrounds[0].tilemap.symbol).toBe(`bg2_t1_tilemap`);
  expect(usedBackgrounds[0].tileset.symbol).toBe(`bg2_t1_tileset`);
  expect(usedBackgrounds[1].id).toBe(backgrounds[0].id);
  expect(usedBackgrounds[1].symbol).toBe(`bg2_t2`);
  expect(usedBackgrounds[1].tilemap.symbol).toBe(`bg2_t2_tilemap`);
  expect(usedBackgrounds[1].tileset.symbol).toBe(`bg2_t2_tileset`);
  expect(backgroundLookup["2b"].id).toBe(backgrounds[0].id);
  expect(backgroundLookup["3b"]).toBeUndefined();
});

test("should include tileset for background when also used without common tileset", async () => {
  const backgrounds = [
    {
      id: "2b",
      name: "test_img",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "test_img.png",
      symbol: "bg2",
      is360: false,
      forceTilesetGeneration: true,
    },
  ] as ReferencedBackground[];
  const scenes = [
    {
      ...dummyScene,
      id: "1",
      name: "first_scene",
      backgroundId: "2b",
      tilesetId: "t1",
      actors: [],
      triggers: [],
    },
    {
      ...dummyScene,
      id: "1",
      name: "second_scene",
      backgroundId: "2b",
      tilesetId: "t2",
      actors: [],
      triggers: [],
    },
    {
      ...dummyScene,
      id: "2",
      name: "third_scene",
      backgroundId: "2b",
      actors: [],
      triggers: [],
    },
  ] as Scene[];
  const tilesets = [
    {
      id: "t1",
      name: "tile_img1",
      width: 2,
      height: 2,
      imageWidth: 16,
      imageHeight: 16,
      filename: "tile_img1.png",
      symbol: "t1",
    },
    {
      id: "t2",
      name: "tile_img2",
      width: 2,
      height: 2,
      imageWidth: 16,
      imageHeight: 16,
      filename: "tile_img2.png",
      symbol: "t2",
    },
  ] as TilesetData[];
  const { usedBackgrounds, backgroundLookup } = await precompileBackgrounds(
    backgrounds,
    scenes,
    tilesets,
    "default",
    `${__dirname}/_files`,
    { warnings: () => {} },
  );
  expect(usedBackgrounds).toHaveLength(3);
  expect(usedBackgrounds[0].id).toBe(backgrounds[0].id);
  expect(usedBackgrounds[0].symbol).toBe(`bg2`);
  expect(usedBackgrounds[0].tilemap.symbol).toBe(`bg2_tilemap`);
  expect(usedBackgrounds[0].tileset.symbol).toBe(`bg2_tileset`);
  expect(usedBackgrounds[1].id).toBe(backgrounds[0].id);
  expect(usedBackgrounds[1].symbol).toBe(`bg2_t1`);
  expect(usedBackgrounds[1].tilemap.symbol).toBe(`bg2_t1_tilemap`);
  expect(usedBackgrounds[1].tileset.symbol).toBe(`bg2_t1_tileset`);
  expect(usedBackgrounds[2].id).toBe(backgrounds[0].id);
  expect(usedBackgrounds[2].symbol).toBe(`bg2_t2`);
  expect(usedBackgrounds[2].tilemap.symbol).toBe(`bg2_t2_tilemap`);
  expect(usedBackgrounds[2].tileset.symbol).toBe(`bg2_t2_tileset`);
  expect(backgroundLookup["2b"].id).toBe(backgrounds[0].id);
  expect(backgroundLookup["3b"]).toBeUndefined();
});

test("should share tilesets if possible when multiple backgrounds include common tileset", async () => {
  const backgrounds = [
    {
      id: "2b",
      name: "bg_ad",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "bg_ad.png",
      symbol: "bg_ad",
      is360: false,
    },
    {
      id: "3b",
      name: "bg_bc",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "bg_bc.png",
      symbol: "bg_bc",
      is360: false,
    },
  ] as ReferencedBackground[];
  const scenes = [
    {
      ...dummyScene,
      id: "1",
      name: "first_scene",
      backgroundId: "2b",
      tilesetId: "t1",
      actors: [],
      triggers: [],
    },
    {
      ...dummyScene,
      id: "1",
      name: "second_scene",
      backgroundId: "3b",
      tilesetId: "t1",
      actors: [],
      triggers: [],
    },
  ] as Scene[];
  const tilesets = [
    {
      id: "t1",
      name: "tile_img1",
      width: 2,
      height: 2,
      imageWidth: 16,
      imageHeight: 16,
      filename: "tile_img3.png",
      symbol: "t1",
    },
  ] as TilesetData[];
  const { usedBackgrounds } = await precompileBackgrounds(
    backgrounds,
    scenes,
    tilesets,
    "default",
    `${__dirname}/_files`,
    { warnings: () => {} },
  );
  expect(usedBackgrounds).toHaveLength(2);
  expect(usedBackgrounds[0].id).toBe(backgrounds[0].id);
  expect(usedBackgrounds[0].symbol).toBe(`bg_ad_t1`);
  expect(usedBackgrounds[0].tilemap.symbol).toBe(`bg_ad_t1_tilemap`);
  expect(usedBackgrounds[0].tileset.symbol).toBe(`bg_ad_t1_tileset`);
  expect(usedBackgrounds[1].id).toBe(backgrounds[1].id);
  expect(usedBackgrounds[1].symbol).toBe(`bg_bc_t1`);
  expect(usedBackgrounds[1].tilemap.symbol).toBe(`bg_bc_t1_tilemap`);
  // Second background can reuse tileset from first as it uses common tilesets
  // and the first background's tileset includes all tiles for this background
  expect(usedBackgrounds[1].tileset.symbol).toBe(`bg_ad_t1_tileset`);
});

test("should generate unique tileset for background if used without common tileset even if a match in common tilesets could be found", async () => {
  const backgrounds = [
    {
      id: "2b",
      name: "bg_ad",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "bg_ad.png",
      symbol: "bg_ad",
      is360: false,
    },
    {
      id: "3b",
      name: "bg_bc",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "bg_bc.png",
      symbol: "bg_bc",
      is360: false,
      forceTilesetGeneration: true,
    },
  ] as ReferencedBackground[];
  const scenes = [
    {
      ...dummyScene,
      id: "1",
      name: "first_scene",
      backgroundId: "2b",
      tilesetId: "t1",
      actors: [],
      triggers: [],
    },
    {
      ...dummyScene,
      id: "2",
      name: "second_scene",
      backgroundId: "3b",
      tilesetId: "t1",
      actors: [],
      triggers: [],
    },
    {
      ...dummyScene,
      id: "3",
      name: "third_scene",
      backgroundId: "3b",
      actors: [],
      triggers: [],
    },
  ] as Scene[];
  const tilesets = [
    {
      id: "t1",
      name: "tile_img1",
      width: 2,
      height: 2,
      imageWidth: 16,
      imageHeight: 16,
      filename: "tile_img3.png",
      symbol: "t1",
    },
  ] as TilesetData[];
  const { usedBackgrounds } = await precompileBackgrounds(
    backgrounds,
    scenes,
    tilesets,
    "default",
    `${__dirname}/_files`,
    { warnings: () => {} },
  );
  expect(usedBackgrounds).toHaveLength(3);
  expect(usedBackgrounds[0].id).toBe(backgrounds[0].id);
  expect(usedBackgrounds[0].symbol).toBe(`bg_ad_t1`);
  expect(usedBackgrounds[0].tilemap.symbol).toBe(`bg_ad_t1_tilemap`);
  expect(usedBackgrounds[0].tileset.symbol).toBe(`bg_ad_t1_tileset`);

  // Background was used in a scene without common tileset
  // so should have unique tileset generated
  expect(usedBackgrounds[1].id).toBe(backgrounds[1].id);
  expect(usedBackgrounds[1].symbol).toBe(`bg_bc`);
  expect(usedBackgrounds[1].tilemap.symbol).toBe(`bg_bc_tilemap`);
  expect(usedBackgrounds[1].tileset.symbol).toBe(`bg_bc_tileset`);

  // Background with shared common tileset should
  // still share tiles with first image
  expect(usedBackgrounds[2].id).toBe(backgrounds[1].id);
  expect(usedBackgrounds[2].symbol).toBe(`bg_bc_t1`);
  expect(usedBackgrounds[2].tilemap.symbol).toBe(`bg_bc_t1_tilemap`);
  expect(usedBackgrounds[2].tileset.symbol).toBe(`bg_ad_t1_tileset`);
});

test("should generate unique tileset for background if referenced from script even if a match in common tilesets could be found", async () => {
  const backgrounds = [
    {
      id: "2b",
      name: "bg_ad",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "bg_ad.png",
      symbol: "bg_ad",
      is360: false,
      forceTilesetGeneration: true,
    },
    {
      id: "3b",
      name: "bg_bc",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "bg_bc.png",
      symbol: "bg_bc",
      is360: false,
    },
  ] as ReferencedBackground[];
  const scenes = [
    {
      ...dummyScene,
      id: "1",
      name: "first_scene",
      backgroundId: "2b",
      tilesetId: "t1",
      actors: [],
      triggers: [],
    },
    {
      ...dummyScene,
      id: "2",
      name: "second_scene",
      backgroundId: "3b",
      tilesetId: "t1",
      actors: [],
      triggers: [],
      script: [
        {
          ...dummyScriptEvent,
          args: {
            references: [
              {
                type: "background",
                id: "2b",
              },
            ],
          },
        },
      ],
    },
  ] as Scene[];
  const tilesets = [
    {
      id: "t1",
      name: "tile_img1",
      width: 2,
      height: 2,
      imageWidth: 16,
      imageHeight: 16,
      filename: "tile_img3.png",
      symbol: "t1",
    },
  ] as TilesetData[];
  const { usedBackgrounds } = await precompileBackgrounds(
    backgrounds,
    scenes,
    tilesets,
    "default",
    `${__dirname}/_files`,
    { warnings: () => {} },
  );

  // Background was used in a scene without common tileset (in GBVM reference)
  // so should have unique tileset generated
  expect(usedBackgrounds).toHaveLength(3);
  expect(usedBackgrounds[0].id).toBe(backgrounds[0].id);
  expect(usedBackgrounds[0].symbol).toBe(`bg_ad`);
  expect(usedBackgrounds[0].tilemap.symbol).toBe(`bg_ad_tilemap`);
  expect(usedBackgrounds[0].tileset.symbol).toBe(`bg_ad_tileset`);

  // First background + common tileset should get a unique tileset
  expect(usedBackgrounds[1].id).toBe(backgrounds[0].id);
  expect(usedBackgrounds[1].symbol).toBe(`bg_ad_t1`);
  expect(usedBackgrounds[1].tilemap.symbol).toBe(`bg_ad_t1_tilemap`);
  expect(usedBackgrounds[1].tileset.symbol).toBe(`bg_ad_t1_tileset`);

  // Background with shared common tileset should still share tiles with first image + common tileset
  expect(usedBackgrounds[2].id).toBe(backgrounds[1].id);
  expect(usedBackgrounds[2].symbol).toBe(`bg_bc_t1`);
  expect(usedBackgrounds[2].tilemap.symbol).toBe(`bg_bc_t1_tilemap`);
  expect(usedBackgrounds[2].tileset.symbol).toBe(`bg_ad_t1_tileset`);
});

test("should generate unique tileset for identical backgrounds if used without common tileset", async () => {
  const backgrounds = [
    {
      id: "2b",
      name: "bg_ad",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "bg_ad.png",
      symbol: "bg_ad",
      is360: false,
    },
    {
      id: "3b",
      name: "bg_ad_copy",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "bg_ad.png",
      symbol: "bg_ad_copy",
      is360: false,
    },
  ] as ReferencedBackground[];
  const scenes = [
    {
      ...dummyScene,
      id: "1",
      name: "first_scene",
      backgroundId: "2b",
      actors: [],
      triggers: [],
    },
    {
      ...dummyScene,
      id: "2",
      name: "second_scene",
      backgroundId: "3b",
      actors: [],
      triggers: [],
    },
  ] as Scene[];
  const { usedBackgrounds } = await precompileBackgrounds(
    backgrounds,
    scenes,
    [],
    "default",
    `${__dirname}/_files`,
    { warnings: () => {} },
  );

  expect(usedBackgrounds).toHaveLength(2);
  expect(usedBackgrounds[0].id).toBe(backgrounds[0].id);
  expect(usedBackgrounds[0].symbol).toBe(`bg_ad`);
  expect(usedBackgrounds[0].tilemap.symbol).toBe(`bg_ad_tilemap`);
  expect(usedBackgrounds[0].tileset.symbol).toBe(`bg_ad_tileset`);

  expect(usedBackgrounds[1].id).toBe(backgrounds[1].id);
  expect(usedBackgrounds[1].symbol).toBe(`bg_ad_copy`);
  expect(usedBackgrounds[1].tilemap.symbol).toBe(`bg_ad_copy_tilemap`);
  expect(usedBackgrounds[1].tileset.symbol).toBe(`bg_ad_copy_tileset`);
});

test("should allow reusing tileset for identical backgrounds if used with common tileset", async () => {
  const backgrounds = [
    {
      id: "2b",
      name: "bg_ad",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "bg_ad.png",
      symbol: "bg_ad",
      is360: false,
    },
    {
      id: "3b",
      name: "bg_ad_copy",
      width: 20,
      height: 18,
      imageWidth: 160,
      imageHeight: 144,
      filename: "bg_ad.png",
      symbol: "bg_ad_copy",
      is360: false,
    },
  ] as ReferencedBackground[];
  const scenes = [
    {
      ...dummyScene,
      id: "1",
      name: "first_scene",
      backgroundId: "2b",
      tilesetId: "t1",
      actors: [],
      triggers: [],
    },
    {
      ...dummyScene,
      id: "2",
      name: "second_scene",
      backgroundId: "3b",
      tilesetId: "t1",
      actors: [],
      triggers: [],
    },
  ] as Scene[];
  const tilesets = [
    {
      id: "t1",
      name: "tile_img1",
      width: 2,
      height: 2,
      imageWidth: 16,
      imageHeight: 16,
      filename: "tile_img1.png",
      symbol: "t1",
    },
  ] as TilesetData[];
  const { usedBackgrounds } = await precompileBackgrounds(
    backgrounds,
    scenes,
    tilesets,
    "default",
    `${__dirname}/_files`,
    { warnings: () => {} },
  );

  expect(usedBackgrounds).toHaveLength(2);
  expect(usedBackgrounds[0].id).toBe(backgrounds[0].id);
  expect(usedBackgrounds[0].symbol).toBe(`bg_ad_t1`);
  expect(usedBackgrounds[0].tilemap.symbol).toBe(`bg_ad_t1_tilemap`);
  expect(usedBackgrounds[0].tileset.symbol).toBe(`bg_ad_t1_tileset`);

  expect(usedBackgrounds[1].id).toBe(backgrounds[1].id);
  expect(usedBackgrounds[1].symbol).toBe(`bg_ad_copy_t1`);
  expect(usedBackgrounds[1].tilemap.symbol).toBe(`bg_ad_copy_t1_tilemap`);
  expect(usedBackgrounds[1].tileset.symbol).toBe(`bg_ad_t1_tileset`);
});
