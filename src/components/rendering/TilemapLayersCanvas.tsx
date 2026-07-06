import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useAppSelector, shallowEqualArray } from "store/hooks";
import { assetURL } from "shared/lib/helpers/assets";
import type {
  MonoBGPPalette,
  Palette,
  SceneTilemapData,
} from "shared/lib/resources/types";
import { TILE_SIZE } from "consts";
import { getSettings } from "store/features/settings/settingsState";
import type { RootState } from "store/configureStore";
import type {
  TilemapLayersCanvasResult,
  TilemapLayersWorkerTileset,
} from "./TilemapLayersCanvas.worker";
import { scheduleFlattenTilemap } from "./tilemapLayersScheduler";
import {
  createTilemapLayersWorkerHandle,
  TilemapLayersWorkerHandle,
} from "./tilemapLayersWorkerPool";

interface TilemapLayersCanvasProps {
  width: number;
  height: number;
  tilemap: SceneTilemapData;
  tileColors: number[];
  palettes: Palette[];
  previewAsMono?: boolean;
  monoBGP: MonoBGPPalette;
  priority?: boolean;
}

type TilemapLayersTileset = {
  id: string;
  width: number;
  height: number;
  filename: string;
  plugin?: string;
  _v?: number;
};

const sceneTilemapTilesetsSelector = (
  state: RootState,
  snapshotIds: string[],
): Array<TilemapLayersTileset | undefined> =>
  snapshotIds.map((tilesetId) => {
    const tileset = state.project.present.entities.tilesets.entities[tilesetId];
    if (!tileset) return undefined;
    return {
      id: tileset.id,
      width: tileset.width,
      height: tileset.height,
      filename: tileset.filename,
      plugin: tileset.plugin,
      _v: tileset._v,
    };
  });

const TilemapLayersCanvas = memo(
  ({
    width,
    height,
    tilemap,
    tileColors,
    palettes,
    previewAsMono,
    monoBGP,
    priority,
  }: TilemapLayersCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const canvasId = useRef(`${Date.now()}-${Math.random()}`);
    const nextRequestSequence = useRef(0);
    const lastRenderedSequence = useRef(0);

    const worker = useRef<TilemapLayersWorkerHandle | null>(null);
    if (!worker.current) {
      worker.current = createTilemapLayersWorkerHandle(canvasId.current);
    }
    const workerHandle = worker.current;
    const colorCorrection = useAppSelector(
      (state) => getSettings(state).colorCorrection,
    );
    const tilesets = useAppSelector(
      (state) =>
        sceneTilemapTilesetsSelector(
          state,
          tilemap.tilesets.map(({ id }) => id),
        ),
      shallowEqualArray,
    );
    const workerTilesets = useMemo(
      (): Array<TilemapLayersWorkerTileset | undefined> =>
        tilesets.map((tileset) =>
          tileset
            ? {
                id: tileset.id,
                width: tileset.width,
                src: assetURL("tilesets", tileset),
              }
            : undefined,
        ),
      [tilesets],
    );

    const onWorkerComplete = useCallback(
      (event: MessageEvent<TilemapLayersCanvasResult>) => {
        const { canvasId: resultCanvasId, sequence, canvasImage } = event.data;

        if (resultCanvasId !== canvasId.current) {
          return;
        }

        if (!canvasRef.current || sequence <= lastRenderedSequence.current) {
          canvasImage.close?.();
          return;
        }

        const ctx = canvasRef.current.getContext("2d");

        if (!ctx) {
          canvasImage.close?.();
          return;
        }

        ctx.clearRect(0, 0, width * TILE_SIZE, height * TILE_SIZE);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(canvasImage, 0, 0);
        canvasImage.close?.();
        lastRenderedSequence.current = sequence;
      },
      [height, width],
    );

    useEffect(() => {
      return workerHandle.subscribe(onWorkerComplete);
    }, [onWorkerComplete, workerHandle]);

    useEffect(() => {
      const sequence = ++nextRequestSequence.current;

      return scheduleFlattenTilemap(
        tilemap,
        width,
        height,
        (flattenedTiles) => {
          const tiles = new Uint32Array(flattenedTiles);
          const workerTileColors = Uint8Array.from(tileColors);
          workerHandle.request(
            {
              canvasId: canvasId.current,
              sequence,
              width,
              height,
              tiles,
              tileColors: workerTileColors,
              tilesetSnapshots: tilemap.tilesets,
              tilesets: workerTilesets,
              palettes: palettes.map((palette) => palette.colors),
              previewAsMono,
              monoBGP,
              colorCorrection,
            },
            [tiles.buffer, workerTileColors.buffer],
          );
        },
        priority,
      );
    }, [
      colorCorrection,
      height,
      monoBGP,
      palettes,
      priority,
      previewAsMono,
      tileColors,
      tilemap,
      width,
      workerHandle,
      workerTilesets,
    ]);

    return (
      <canvas
        ref={canvasRef}
        width={width * TILE_SIZE}
        height={height * TILE_SIZE}
        style={{ display: "block", imageRendering: "pixelated" }}
      />
    );
  },
);

export default TilemapLayersCanvas;
