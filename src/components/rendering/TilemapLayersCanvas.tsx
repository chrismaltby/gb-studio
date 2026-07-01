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
import TilemapLayersCanvasWorker, {
  TilemapLayersCanvasResult,
  TilemapLayersWorkerTileset,
} from "./TilemapLayersCanvas.worker";

const workerPool: TilemapLayersCanvasWorker[] = [];
const workerCount = Math.max(1, navigator.hardwareConcurrency || 1);
for (let index = 0; index < workerCount; index++) {
  workerPool.push(new TilemapLayersCanvasWorker());
}

interface TilemapLayersCanvasProps {
  width: number;
  height: number;
  tilemap: SceneTilemapData;
  tiles: number[];
  tileColors: number[];
  palettes: Palette[];
  previewAsMono?: boolean;
  monoBGP: MonoBGPPalette;
}

type TilemapLayersTileset = {
  id: string;
  width: number;
  height: number;
  filename: string;
  plugin?: string;
  _v?: number;
};

const paintedSceneTilesetsSelector = (
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
    tiles,
    tileColors,
    palettes,
    previewAsMono,
    monoBGP,
  }: TilemapLayersCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestId = useRef(Math.random());
    const worker = useRef(
      workerPool[Math.floor(workerPool.length * Math.random())],
    );
    const colorCorrection = useAppSelector(
      (state) => getSettings(state).colorCorrection,
    );
    const tilesets = useAppSelector(
      (state) =>
        paintedSceneTilesetsSelector(
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
        if (event.data.id !== requestId.current || !canvasRef.current) return;

        const offscreenCanvas = document.createElement("canvas");
        const offscreenCtx = offscreenCanvas.getContext("bitmaprenderer");
        if (!offscreenCtx) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;
        offscreenCtx.transferFromImageBitmap(event.data.canvasImage);
        ctx.clearRect(0, 0, width * TILE_SIZE, height * TILE_SIZE);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(offscreenCanvas, 0, 0);
      },
      [height, width],
    );

    useEffect(() => {
      const currentWorker = worker.current;
      currentWorker.addEventListener("message", onWorkerComplete);
      return () => {
        currentWorker.removeEventListener("message", onWorkerComplete);
      };
    }, [onWorkerComplete]);

    useEffect(() => {
      requestId.current = Math.random();
      worker.current.postMessage({
        id: requestId.current,
        width,
        height,
        tilemap,
        tiles,
        tileColors,
        tilesets: workerTilesets,
        palettes: palettes.map((palette) => palette.colors),
        previewAsMono,
        monoBGP,
        colorCorrection,
      });
    }, [
      colorCorrection,
      height,
      monoBGP,
      palettes,
      previewAsMono,
      tileColors,
      tilemap,
      tiles,
      width,
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
