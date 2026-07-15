import React, { useCallback, useEffect, useRef } from "react";
import { useAppSelector, useAppSelectorPick } from "store/hooks";
import { DMG_PALETTE, TILE_SIZE } from "consts";
import { tilesetSelectors } from "store/features/entities/entitiesSelectors";
import type { TilePreviewResult } from "./TilePreview.worker";
import { assetURL } from "shared/lib/helpers/assets";
import { GridUnitType } from "shared/lib/entities/entitiesTypes";
import { getSettings } from "store/features/settings/settingsState";

interface TileCanvasProps {
  tilesetId: string;
  tileIndex?: number;
  tileSize?: GridUnitType;
}

const worker = new Worker(new URL("./TilePreview.worker.ts", import.meta.url));

export const TileCanvas = ({
  tilesetId,
  tileIndex,
  tileSize,
}: TileCanvasProps) => {
  const colorCorrection = useAppSelector(
    (state) => getSettings(state).colorCorrection,
  );

  const size = tileSize === "16px" ? 2 : 1;
  const width = TILE_SIZE * size;
  const height = TILE_SIZE * size;
  const workerId = useRef(Math.random()).current;
  const requestIdRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tileset = useAppSelectorPick(
    (state) => tilesetSelectors.selectById(state, tilesetId),
    ["filename", "plugin", "_v"],
  );
  const onWorkerComplete = useCallback(
    (e: MessageEvent<TilePreviewResult>) => {
      if (e.data.id !== workerId) {
        return;
      }

      if (e.data.requestId !== requestIdRef.current) {
        e.data.canvasImage.close();
        return;
      }

      if (!canvasRef.current || !tileset) {
        e.data.canvasImage.close();
        return;
      }

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) {
        e.data.canvasImage.close();
        return;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(e.data.canvasImage, 0, 0);
      e.data.canvasImage.close();
    },
    [height, tileset, width, workerId],
  );

  useEffect(() => {
    worker.addEventListener("message", onWorkerComplete);
    return () => {
      worker.removeEventListener("message", onWorkerComplete);
    };
  }, [onWorkerComplete]);

  useEffect(() => {
    if (!canvasRef.current || !tileset) {
      return;
    }
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      return;
    }
    const tilesetURL = assetURL("tilesets", tileset);

    const requestId = ++requestIdRef.current;
    worker.postMessage({
      id: workerId,
      requestId,
      src: tilesetURL,
      palette: DMG_PALETTE.colors,
      tileIndex,
      tileSize,
      colorCorrection,
    });
  }, [tileIndex, tileSize, colorCorrection, tileset, workerId]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: "pixelated", width: 16 }}
    />
  );
};
