import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { DMG_PALETTE } from "../../consts";
import { assetFilename } from "lib/helpers/gbstudio";
import { RootState } from "store/configureStore";
import { emoteSelectors } from "store/features/entities/entitiesState";
import SpriteSliceCanvasWorker, {
  SpriteSliceCanvasResult,
} from "../sprites/preview/SpriteSliceCanvas.worker";

interface EmoteCanvasProps {
  emoteId: string;
}

const worker = new SpriteSliceCanvasWorker();

export const EmoteCanvas = ({ emoteId }: EmoteCanvasProps) => {
  const width = 16;
  const height = 16;
  const [workerId] = useState(Math.random());
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const emote = useSelector((state: RootState) =>
    emoteSelectors.selectById(state, emoteId)
  );
  const projectRoot = useSelector((state: RootState) => state.document.root);

  const onWorkerComplete = useCallback(
    (e: MessageEvent<SpriteSliceCanvasResult>) => {
      if (e.data.id === workerId) {
        const offscreenCanvas = document.createElement("canvas");
        const offscreenCtx = offscreenCanvas.getContext("bitmaprenderer");
        if (!canvasRef.current || !emote || !offscreenCtx) {
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
    [emote, workerId]
  );

  useEffect(() => {
    worker.addEventListener("message", onWorkerComplete);
    return () => {
      worker.removeEventListener("message", onWorkerComplete);
    };
  }, [onWorkerComplete]);

  useEffect(() => {
    if (!canvasRef.current || !emote) {
      return;
    }
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      return;
    }
    const filename = `file://${assetFilename(
      projectRoot,
      "emotes",
      emote
    )}?_v=${emote._v}`;

    worker.postMessage({
      id: workerId,
      src: filename,
      offsetX: 0,
      offsetY: 0,
      width: 16,
      height: 16,
      flipX: false,
      flipY: false,
      objPalette: "OBP0",
      palette: DMG_PALETTE.colors,
    });
  }, [canvasRef, emote, projectRoot, workerId]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: "pixelated" }}
    />
  );
};
