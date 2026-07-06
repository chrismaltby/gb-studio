/** @jest-environment jsdom */

import { scheduleFlattenTilemap } from "components/rendering/tilemapLayersScheduler";
import type { SceneTilemapData } from "shared/lib/resources/types";

const flatten = (tilemap: SceneTilemapData, width: number, height: number) =>
  new Promise<Uint32Array>((resolve) => {
    scheduleFlattenTilemap(tilemap, width, height, resolve);
  });

test("cooperatively flattens visible layers", async () => {
  const tilemap: SceneTilemapData = {
    tilesets: [],
    layers: [
      {
        id: "bottom",
        name: "Bottom",
        visible: true,
        tiles: [1, 2, 3, 4],
      },
      {
        id: "hidden",
        name: "Hidden",
        visible: false,
        tiles: [9, 9, 9, 9],
      },
      {
        id: "top",
        name: "Top",
        visible: true,
        tiles: [0, 5, 0, 6],
      },
    ],
  };

  await expect(flatten(tilemap, 2, 2)).resolves.toEqual(
    Uint32Array.from([1, 5, 3, 6]),
  );
});

test("reuses a completed result for the same tilemap", async () => {
  const tilemap: SceneTilemapData = {
    tilesets: [],
    layers: [{ id: "layer", name: "Layer", visible: true, tiles: [1, 2] }],
  };

  const first = await flatten(tilemap, 2, 1);
  const second = await flatten(tilemap, 2, 1);

  expect(second).toBe(first);
});
