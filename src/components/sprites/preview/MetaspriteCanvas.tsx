import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { DMG_PALETTE } from "../../../consts";
import { assetFilename } from "lib/helpers/gbstudio";
import { RootState } from "store/configureStore";
import {
  metaspriteSelectors,
  metaspriteTileSelectors,
  spriteSheetSelectors,
} from "store/features/entities/entitiesState";
import { MetaspriteTile, Palette } from "store/features/entities/entitiesTypes";
import MetaspriteCanvasWorker, {
  MetaspriteCanvasResult,
} from "./MetaspriteCanvas.worker";

interface MetaspriteCanvasProps {
  spriteSheetId: string;
  metaspriteId: string;
  flipX?: boolean;
  palettes?: Palette[];
}

const worker = new MetaspriteCanvasWorker();

export const MetaspriteCanvas = ({
  spriteSheetId,
  metaspriteId,
  flipX = false,
  palettes,
}: MetaspriteCanvasProps) => {
  const [workerId] = useState(Math.random());
  const [tiles, setTiles] = useState<MetaspriteTile[]>([]);
  const [paletteColors, setPaletteColors] =
    useState<[string, string, string, string][] | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const spriteSheet = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, spriteSheetId)
  );
  const metasprite = useSelector((state: RootState) =>
    metaspriteSelectors.selectById(state, metaspriteId)
  );
  const tilesLookup = useSelector((state: RootState) =>
    metaspriteTileSelectors.selectEntities(state)
  );
  const projectRoot = useSelector((state: RootState) => state.document.root);
  const width = spriteSheet?.canvasWidth || 0;
  const height = spriteSheet?.canvasHeight || 0;

  // Cache metasprite tiles
  useEffect(() => {
    const tiles =
      (metasprite?.tiles
        ?.map((tileId) => tilesLookup[tileId])
        .filter((i) => i) as MetaspriteTile[]) || [];
    setTiles(tiles);
  }, [metasprite, tilesLookup]);

  // Cache scene palettes
  useEffect(() => {
    setPaletteColors(palettes ? palettes.map((p) => p.colors) : null);
  }, [palettes]);

  const onWorkerComplete = useCallback(
    (e: MessageEvent<MetaspriteCanvasResult>) => {
      if (e.data.id === workerId) {
        const offscreenCanvas = document.createElement("canvas");
        const offscreenCtx = offscreenCanvas.getContext("bitmaprenderer");
        if (!canvasRef.current || !spriteSheet || !offscreenCtx) {
          return;
        }
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) {
          return;
        }
        offscreenCtx.transferFromImageBitmap(e.data.canvasImage);
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(offscreenCanvas, 0, 0);
      }
    },
    [height, spriteSheet, width, workerId]
  );

  useEffect(() => {
    worker.addEventListener("message", onWorkerComplete);
    return () => {
      worker.removeEventListener("message", onWorkerComplete);
    };
  }, [width, height, onWorkerComplete]);

  useEffect(() => {
    if (tiles.length === 0) {
      return;
    }
    if (!canvasRef.current || !spriteSheet) {
      return;
    }
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      return;
    }
    const filename = `file://${assetFilename(
      projectRoot,
      "sprites",
      spriteSheet
    )}?_v=${spriteSheet._v}`;

    worker.postMessage({
      id: workerId,
      src: filename,
      width,
      height,
      tiles,
      flipX,
      palette: DMG_PALETTE.colors,
      palettes: paletteColors,
    });
  }, [
    canvasRef,
    spriteSheet,
    paletteColors,
    tiles,
    width,
    height,
    flipX,
    projectRoot,
    workerId,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: "pixelated" }}
    />
  );
};
