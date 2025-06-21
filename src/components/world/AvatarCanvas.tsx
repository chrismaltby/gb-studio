import React, { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { DMG_PALETTE } from "consts";
import { avatarSelectors } from "store/features/entities/entitiesState";
import SpriteSliceCanvasWorker, {
  SpriteSliceCanvasResult,
} from "components/sprites/preview/SpriteSliceCanvas.worker";
import { assetURL } from "shared/lib/helpers/assets";

interface AvatarCanvasProps {
  avatarId: string;
}

const worker = new SpriteSliceCanvasWorker();

export const AvatarCanvas = ({ avatarId }: AvatarCanvasProps) => {
  const width = 16;
  const height = 16;
  const [workerId] = useState(Math.random());
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const avatar = useAppSelector((state) =>
    avatarSelectors.selectById(state, avatarId),
  );

  const onWorkerComplete = useCallback(
    (e: MessageEvent<SpriteSliceCanvasResult>) => {
      if (e.data.id === workerId) {
        const offscreenCanvas = document.createElement("canvas");
        const offscreenCtx = offscreenCanvas.getContext("bitmaprenderer");
        if (!canvasRef.current || !avatar || !offscreenCtx) {
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
    [avatar, workerId],
  );

  useEffect(() => {
    worker.addEventListener("message", onWorkerComplete);
    return () => {
      worker.removeEventListener("message", onWorkerComplete);
    };
  }, [onWorkerComplete]);

  useEffect(() => {
    if (!canvasRef.current || !avatar) {
      return;
    }
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      return;
    }
    const avatarURL = assetURL("avatars", avatar);

    worker.postMessage({
      id: workerId,
      src: avatarURL,
      offsetX: 0,
      offsetY: 0,
      width: 16,
      height: 16,
      flipX: false,
      flipY: false,
      objPalette: "OBP0",
      palette: DMG_PALETTE.colors,
    });
  }, [canvasRef, avatar, workerId]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: "pixelated" }}
    />
  );
};
