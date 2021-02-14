import React, { createRef, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { DMG_PALETTE } from "../../../consts";
import { assetFilename } from "../../../lib/helpers/gbstudio";
import { RootState } from "../../../store/configureStore";
import { spriteSheetSelectors } from "../../../store/features/entities/entitiesState";
import SpriteSliceCanvasWorker from "./SpriteSliceCanvas.worker";

interface SpriteSliceCanvasProps {
  spriteSheetId: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  flipX?: boolean;
  flipY?: boolean;
}

const worker = new SpriteSliceCanvasWorker();

export const SpriteSliceCanvas = ({
  spriteSheetId,
  offsetX,
  offsetY,
  width,
  height,
  flipX,
  flipY,
}: SpriteSliceCanvasProps) => {
  const [workerId] = useState(Math.random());
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const spriteSheet = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, spriteSheetId)
  );
  const projectRoot = useSelector((state: RootState) => state.document.root);

  useEffect(() => {
    worker.addEventListener("message", onWorkerComplete);
    return () => {
      worker.removeEventListener("message", onWorkerComplete);
    };
  }, []);

  useEffect(() => {
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
      offsetX,
      offsetY,
      width,
      height,
      flipX,
      flipY,
      palette: DMG_PALETTE.colors,
    });

    // ctx.fillRect(0, 0, 2, 20);
    // console.log(spriteSheet);

    // const img = new Image();

    // img.onload = () => {
    //   ctx.drawImage(img, 0, 0);
    // };
    // img.src = filename;
  }, [canvasRef, spriteSheet, offsetX, offsetY, width, height]);

  const onWorkerComplete = (e: any) => {
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
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: "pixelated" }}
    />
  );
};
