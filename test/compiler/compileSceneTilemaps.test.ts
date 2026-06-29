import { compileTilemapLayers } from "lib/compiler/compileSceneTilemaps";
import { ColorModeSetting, Tileset } from "shared/lib/resources/types";
import { encodeSceneTileRef } from "shared/lib/tiles/sceneTilemapData";
import {
  TILE_COLOR_PROP_FLIP_HORIZONTAL as FLIP_H,
  TILE_COLOR_PROP_FLIP_VERTICAL as FLIP_V,
} from "consts";

const BYTES_PER_TILE = 16;
const FIXTURE_PROJECT_PATH = `${__dirname}/_files/`;
const DEFAULT_SCENE_WIDTH = 20;
const DEFAULT_SCENE_HEIGHT = 18;
const DEFAULT_SCENE_SIZE = DEFAULT_SCENE_WIDTH * DEFAULT_SCENE_HEIGHT;

const makeTileset = (
  id = "tiles",
  filename = "tile_img1.png",
  width = 4,
  height = 1,
) =>
  ({
    id,
    filename,
    width,
    height,
  }) as Tileset;

const makeScene = ({
  id = "tilemap",
  name = "Tilemap Scene",
  symbol = "scene_tilemap",
  type = "",
  width = DEFAULT_SCENE_WIDTH,
  height = DEFAULT_SCENE_HEIGHT,
  tilemap,
}: {
  id?: string;
  name?: string;
  symbol?: string;
  type?: string;
  width?: number;
  height?: number;
  tilemap: {
    tilesetIds: string[];
    tileColors?: number[];
    layers: Array<{
      id: string;
      name: string;
      visible?: boolean;
      tiles: number[];
    }>;
  };
}) =>
  ({
    id,
    name,
    symbol,
    type,
    width,
    height,
    colorModeOverride: "none",
    tilemap,
  }) as Parameters<typeof compileTilemapLayers>[0];

const compileScene = (
  scene: Parameters<typeof compileTilemapLayers>[0],
  tilesetsLookup: Record<string, Tileset>,
  {
    commonTileset,
    colorMode = "mono",
    autoTileFlipEnabled = false,
    warnings = () => {},
  }: {
    commonTileset?: Tileset;
    colorMode?: ColorModeSetting;
    autoTileFlipEnabled?: boolean;
    warnings?: (msg: string) => void;
  } = {},
) =>
  compileTilemapLayers(
    scene,
    tilesetsLookup,
    commonTileset,
    colorMode,
    FIXTURE_PROJECT_PATH,
    autoTileFlipEnabled,
    { warnings },
  );

test("should compile scene tilemap layer", async () => {
  const tileset = makeTileset("tiles", "tile_img3.png");
  const scene = makeScene({
    tilemap: {
      tilesetIds: [tileset.id],
      tileColors: [],
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: new Array(DEFAULT_SCENE_SIZE)
            .fill(0)
            .map((_, index) => encodeSceneTileRef(0, index % 4)),
        },
      ],
    },
  });

  const result = await compileScene(scene, { [tileset.id]: tileset });

  expect(result.tilemap).toHaveLength(DEFAULT_SCENE_SIZE);
  expect(result.attr).toHaveLength(DEFAULT_SCENE_SIZE);
  expect(result.tilesetLength).toEqual(4);
});

test("should include all tiles from common tileset", async () => {
  const tileset = makeTileset("tiles", "tile_img3.png");
  const scene = makeScene({
    tilemap: {
      tilesetIds: [tileset.id],
      tileColors: [],
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: new Array(DEFAULT_SCENE_SIZE).fill(0),
        },
      ],
    },
  });

  const result = await compileScene(
    scene,
    { [tileset.id]: tileset },
    {
      commonTileset: tileset,
    },
  );

  expect(result.tilemap).toHaveLength(DEFAULT_SCENE_SIZE);
  expect(result.attr).toHaveLength(DEFAULT_SCENE_SIZE);
  expect(result.tilesetLength).toEqual(5);
  expect(result.commonTilesetId).toEqual(tileset.id);
});

test("should create empty tile data/map for blank tilemap", async () => {
  const scene = makeScene({
    tilemap: {
      tilesetIds: [],
      tileColors: [],
      layers: [],
    },
  });

  const result = await compileScene(scene, {});

  expect(result.tilemap).toHaveLength(DEFAULT_SCENE_SIZE);
  expect(result.tilemap[0]).toEqual(0);
  expect(result.tilemap[1]).toEqual(0);
  expect(result.tilemap[2]).toEqual(0);
  expect(result.attr[0]).toEqual(0);
  expect(result.vramData[0]).toHaveLength(BYTES_PER_TILE);
  expect(result.vramData[0]).toEqual(new Array(BYTES_PER_TILE).fill(0));
  expect(result.tilesetLength).toEqual(1);
});

test("should compile scene tilemaps using only visible topmost tiles", async () => {
  const tileset = makeTileset("tiles", "tile_img1.png");
  const scene = makeScene({
    tilemap: {
      tilesetIds: [tileset.id],
      tileColors: [0x83],
      layers: [
        {
          id: "bottom",
          name: "Bottom",
          visible: true,
          tiles: new Array(DEFAULT_SCENE_SIZE).fill(encodeSceneTileRef(0, 1)),
        },
        {
          id: "top",
          name: "Top",
          visible: true,
          tiles: [encodeSceneTileRef(0, 2)],
        },
      ],
    },
  });

  const result = await compileScene(scene, { [tileset.id]: tileset });

  expect(result.tilemap).toHaveLength(DEFAULT_SCENE_SIZE);
  expect(result.attr).toHaveLength(DEFAULT_SCENE_SIZE);
  expect(result.tilemap[0]).toEqual(0);
  expect(result.tilemap[1]).toEqual(1);
  expect(result.tilemap[2]).toEqual(1);
  expect(result.attr[0]).toEqual(0x83);
  expect(result.tilesetLength).toEqual(2);
});

test("should compile logo scenes using tilemaps as 360 unique tiles", async () => {
  const tileset = makeTileset("tiles", "tile_img1.png");
  const scene = makeScene({
    id: "tilemap_logo",
    name: "Tilemap Logo Scene",
    symbol: "scene_tilemap_logo",
    type: "LOGO",
    tilemap: {
      tilesetIds: [tileset.id],
      tileColors: [3],
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: new Array(DEFAULT_SCENE_SIZE).fill(encodeSceneTileRef(0, 1)),
        },
      ],
    },
  });

  const result = await compileScene(scene, { [tileset.id]: tileset });

  expect(result.width).toBe(20);
  expect(result.height).toBe(18);
  expect(result.is360).toBe(true);
  expect(result.tilesetLength).toBe(360);
  expect(result.tilemap).toEqual(
    Array.from({ length: 360 }, (_, index) => index),
  );
  expect(result.vramData[0]).toHaveLength(360 * BYTES_PER_TILE);
  expect(result.vramData[1]).toHaveLength(0);
  expect(result.attr).toHaveLength(360);
  expect(result.attr[0]).toBe(3);
});

test("should generate deterministic tileset data regardless of tile placement order", async () => {
  const tileset = makeTileset("tiles", "tile_img1.png");

  const makeOrderedScene = (id: string, tiles: number[]) =>
    makeScene({
      id,
      name: id,
      symbol: id,
      tilemap: {
        tilesetIds: [tileset.id],
        tileColors: [],
        layers: [{ id: "layer", name: "Layer", visible: true, tiles }],
      },
    });

  const first = await compileScene(
    makeOrderedScene("first", [
      encodeSceneTileRef(0, 1),
      encodeSceneTileRef(0, 2),
    ]),
    { [tileset.id]: tileset },
  );

  const second = await compileScene(
    makeOrderedScene("second", [
      encodeSceneTileRef(0, 2),
      encodeSceneTileRef(0, 1),
    ]),
    { [tileset.id]: tileset },
  );

  expect(second.vramData).toEqual(first.vramData);
});

test("should auto flip scene tilemap tiles in Color Only mode", async () => {
  const tileset = makeTileset(
    "autoflip_tiles",
    "../../test/autoflip1.png",
    20,
    18,
  );
  const scene = makeScene({
    id: "tilemap_autoflip",
    name: "Tilemap Scene Autoflip",
    symbol: "tilemap_autoflip",
    tilemap: {
      tilesetIds: [tileset.id],
      tileColors: [],
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: Array.from({ length: 360 }, (_, index) =>
            encodeSceneTileRef(0, index),
          ),
        },
      ],
    },
  });

  const result = await compileScene(
    scene,
    { [tileset.id]: tileset },
    {
      colorMode: "color",
      autoTileFlipEnabled: true,
    },
  );

  expect(result.tilesetLength).toBe(4);
  expect(result.attr[0]).toBe(0);
  expect(result.attr[1]).toBe(FLIP_H);
  expect(result.attr[2]).toBe(FLIP_V);
  expect(result.attr[5]).toBe(FLIP_H | FLIP_V);
});

test("should truncate overlong scene tile color data without expanding emitted tilemap", async () => {
  const tileset = makeTileset();
  const scene = makeScene({
    tilemap: {
      tilesetIds: [tileset.id],
      tileColors: new Array(DEFAULT_SCENE_SIZE + 12).fill(0x83),
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: new Array(DEFAULT_SCENE_SIZE).fill(encodeSceneTileRef(0, 1)),
        },
      ],
    },
  });

  const result = await compileScene(scene, { [tileset.id]: tileset });

  expect(result.tilemap).toHaveLength(DEFAULT_SCENE_SIZE);
  expect(result.attr).toHaveLength(DEFAULT_SCENE_SIZE);
  expect(result.attr).toEqual(new Array(DEFAULT_SCENE_SIZE).fill(0x83));
});

test("should pad short scene tile color data to emitted tilemap length", async () => {
  const tileset = makeTileset();
  const scene = makeScene({
    tilemap: {
      tilesetIds: [tileset.id],
      tileColors: [0x81, 0x82],
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: new Array(DEFAULT_SCENE_SIZE).fill(encodeSceneTileRef(0, 1)),
        },
      ],
    },
  });

  const result = await compileScene(scene, { [tileset.id]: tileset });

  expect(result.attr).toHaveLength(DEFAULT_SCENE_SIZE);
  expect(result.attr[0]).toBe(0x81);
  expect(result.attr[1]).toBe(0x82);
  expect(result.attr[2]).toBe(0);
  expect(result.attr[DEFAULT_SCENE_SIZE - 1]).toBe(0);
});

test("should ignore layers with visible explicitly set to false", async () => {
  const tileset = makeTileset();
  const scene = makeScene({
    tilemap: {
      tilesetIds: [tileset.id],
      tileColors: [],
      layers: [
        {
          id: "bottom",
          name: "Bottom",
          visible: true,
          tiles: Array.from({ length: DEFAULT_SCENE_SIZE }, (_, index) =>
            encodeSceneTileRef(0, index % 2 === 0 ? 1 : 2),
          ),
        },
        {
          id: "hidden-top",
          name: "Hidden Top",
          visible: false,
          tiles: new Array(DEFAULT_SCENE_SIZE).fill(encodeSceneTileRef(0, 3)),
        },
      ],
    },
  });

  const result = await compileScene(scene, { [tileset.id]: tileset });

  expect(result.tilesetLength).toBe(2);
  expect(new Set(result.tilemap).size).toBe(2);
});

test("should use the referenced tileset when compiling refs after the first tileset offset", async () => {
  const firstTileset = makeTileset("first", "tile_img1.png", 4, 1);
  const secondTileset = makeTileset("second", "tile_img3.png", 4, 1);
  const secondTilesetOffset = firstTileset.width * firstTileset.height;

  const firstTilesetScene = makeScene({
    id: "first_tileset_scene",
    symbol: "first_tileset_scene",
    tilemap: {
      tilesetIds: [firstTileset.id, secondTileset.id],
      tileColors: [],
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: new Array(DEFAULT_SCENE_SIZE).fill(encodeSceneTileRef(0, 2)),
        },
      ],
    },
  });

  const secondTilesetScene = makeScene({
    id: "second_tileset_scene",
    symbol: "second_tileset_scene",
    tilemap: {
      tilesetIds: [firstTileset.id, secondTileset.id],
      tileColors: [],
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: new Array(DEFAULT_SCENE_SIZE).fill(
            encodeSceneTileRef(secondTilesetOffset, 2),
          ),
        },
      ],
    },
  });

  const firstResult = await compileScene(firstTilesetScene, {
    [firstTileset.id]: firstTileset,
    [secondTileset.id]: secondTileset,
  });

  const secondResult = await compileScene(secondTilesetScene, {
    [firstTileset.id]: firstTileset,
    [secondTileset.id]: secondTileset,
  });

  expect(firstResult.tilemap).toEqual(new Array(DEFAULT_SCENE_SIZE).fill(0));
  expect(secondResult.tilemap).toEqual(new Array(DEFAULT_SCENE_SIZE).fill(0));
  expect(firstResult.tilesetLength).toBe(1);
  expect(secondResult.tilesetLength).toBe(1);
  expect(secondResult.vramData).not.toEqual(firstResult.vramData);
});

test.each([
  {
    name: "width smaller than screen",
    width: 19,
    height: 18,
  },
  {
    name: "height smaller than screen",
    width: 20,
    height: 17,
  },
  {
    name: "width larger than 255",
    width: 256,
    height: 18,
  },
  {
    name: "height larger than 255",
    width: 20,
    height: 256,
  },
])(
  "should emit a blank 20x18 tilemap and warn when scene dimensions are invalid: $name",
  async ({ width, height }) => {
    const warnings = jest.fn();
    const tileset = makeTileset();
    const scene = makeScene({
      width,
      height,
      tilemap: {
        tilesetIds: [tileset.id],
        tileColors: new Array(width * height).fill(3),
        layers: [
          {
            id: "layer",
            name: "Layer",
            visible: true,
            tiles: new Array(width * height).fill(encodeSceneTileRef(0, 1)),
          },
        ],
      },
    });

    const result = await compileScene(
      scene,
      { [tileset.id]: tileset },
      {
        warnings,
      },
    );

    expect(warnings).toHaveBeenCalled();

    expect(result.width).toBe(DEFAULT_SCENE_WIDTH);
    expect(result.height).toBe(DEFAULT_SCENE_HEIGHT);
    expect(result.tilemap).toEqual(new Array(DEFAULT_SCENE_SIZE).fill(0));
    expect(result.attr).toEqual(new Array(DEFAULT_SCENE_SIZE).fill(0));
    expect(result.tilesetLength).toBe(1);
    expect(result.vramData[0]).toEqual(new Array(BYTES_PER_TILE).fill(0));
    expect(result.vramData[1]).toEqual([]);
  },
);

test("should preserve valid scene dimensions larger than the screen", async () => {
  const tileset = makeTileset();
  const scene = makeScene({
    width: 21,
    height: 19,
    tilemap: {
      tilesetIds: [tileset.id],
      tileColors: [],
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: new Array(21 * 19).fill(encodeSceneTileRef(0, 1)),
        },
      ],
    },
  });

  const result = await compileScene(scene, { [tileset.id]: tileset });

  expect(result.width).toBe(21);
  expect(result.height).toBe(19);
  expect(result.tilemap).toHaveLength(21 * 19);
  expect(result.attr).toHaveLength(21 * 19);
});

test("should not mutate input tilemap layers or tile colors during compilation", async () => {
  const tileset = makeTileset();
  const tileColors = [0x81, 0x82, 0x83];
  const layerTiles = [
    encodeSceneTileRef(0, 1),
    encodeSceneTileRef(0, 2),
    encodeSceneTileRef(0, 3),
  ];

  const scene = makeScene({
    tilemap: {
      tilesetIds: [tileset.id],
      tileColors,
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: layerTiles,
        },
      ],
    },
  });

  const originalTileColors = [...tileColors];
  const originalLayerTiles = [...layerTiles];

  await compileScene(scene, { [tileset.id]: tileset });

  expect(scene.tilemap.tileColors).toEqual(originalTileColors);
  expect(scene.tilemap.layers[0].tiles).toEqual(originalLayerTiles);
});

test("should keep logo scenes fixed to 20x18 and truncate overlong attrs", async () => {
  const tileset = makeTileset();
  const logoTileCount = 20 * 18;
  const scene = makeScene({
    id: "tilemap_logo",
    name: "Tilemap Logo Scene",
    symbol: "scene_tilemap_logo",
    type: "LOGO",
    width: 40,
    height: 30,
    tilemap: {
      tilesetIds: [tileset.id],
      tileColors: new Array(logoTileCount + 50).fill(3),
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: new Array(40 * 30).fill(encodeSceneTileRef(0, 1)),
        },
      ],
    },
  });

  const result = await compileScene(scene, { [tileset.id]: tileset });

  expect(result.width).toBe(20);
  expect(result.height).toBe(18);
  expect(result.is360).toBe(true);
  expect(result.tilemap).toHaveLength(logoTileCount);
  expect(result.attr).toHaveLength(logoTileCount);
  expect(result.vramData[0]).toHaveLength(logoTileCount * BYTES_PER_TILE);
});

test("should render missing tileset references as blank tiles", async () => {
  const scene = makeScene({
    tilemap: {
      tilesetIds: ["missing-tileset"],
      tileColors: [],
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: new Array(DEFAULT_SCENE_SIZE).fill(encodeSceneTileRef(0, 1)),
        },
      ],
    },
  });

  const result = await compileScene(scene, {});

  expect(result.tilemap).toEqual(new Array(DEFAULT_SCENE_SIZE).fill(0));
  expect(result.attr).toEqual(new Array(DEFAULT_SCENE_SIZE).fill(0));
  expect(result.tilesetLength).toBe(1);
  expect(result.vramData[0]).toEqual(new Array(BYTES_PER_TILE).fill(0));
  expect(result.vramData[1]).toEqual([]);
});

test("should render out-of-range tile references as blank tiles", async () => {
  const tileset = makeTileset("tiles", "tile_img1.png", 4, 1);
  const scene = makeScene({
    tilemap: {
      tilesetIds: [tileset.id],
      tileColors: [],
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: new Array(DEFAULT_SCENE_SIZE).fill(encodeSceneTileRef(0, 999)),
        },
      ],
    },
  });

  const result = await compileScene(scene, { [tileset.id]: tileset });

  expect(result.tilemap).toEqual(new Array(DEFAULT_SCENE_SIZE).fill(0));
  expect(result.attr).toEqual(new Array(DEFAULT_SCENE_SIZE).fill(0));
  expect(result.tilesetLength).toBe(1);
  expect(result.vramData[0]).toEqual(new Array(BYTES_PER_TILE).fill(0));
  expect(result.vramData[1]).toEqual([]);
});
