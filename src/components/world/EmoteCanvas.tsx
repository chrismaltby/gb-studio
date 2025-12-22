import React, { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { defaultProjectSettings, DMG_PALETTE } from "consts";
import { emoteSelectors } from "store/features/entities/entitiesState";
import SpriteSliceCanvasWorker, {
  SpriteSliceCanvasResult,
} from "components/sprites/preview/SpriteSliceCanvas.worker";
import { assetURL } from "shared/lib/helpers/assets";

interface EmoteCanvasProps {
  emoteId: string;
}

const objPalette = defaultProjectSettings.defaultMonoOBP0;

const worker = new SpriteSliceCanvasWorker();

export const EmoteCanvas = ({ emoteId }: EmoteCanvasProps) => {
  const width = 16;
  const height = 16;
  const [workerId] = useState(Math.random());
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const emote = useAppSelector((state) =>
    emoteSelectors.selectById(state, emoteId),
  );

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
    [emote, workerId],
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
    const emoteURL = assetURL("emotes", emote);

    worker.postMessage({
      id: workerId,
      src: emoteURL,
      offsetX: 0,
      offsetY: 0,
      width: 16,
      height: 16,
      flipX: false,
      flipY: false,
      objPalette,
      palette: DMG_PALETTE.colors,
    });
  }, [canvasRef, emote, workerId]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: "pixelated" }}
    />
  );
};
