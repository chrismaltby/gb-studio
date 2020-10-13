import React, { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { assetFilename } from "../../lib/helpers/gbstudio";
import { dummyText, textNumLines } from "../../lib/helpers/trimlines";
import { RootState } from "../../store/configureStore";
import { spriteSheetSelectors } from "../../store/features/entities/entitiesState";

interface DialoguePreviewProps {
  text: string;
  avatarId?: string;
}

const drawFrame = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number
) => {
  ctx.drawImage(img, 0, 0, 8, 8, 0, 0, 8, 8); // TL
  ctx.drawImage(img, 16, 0, 8, 8, (width - 1) * 8, 0, 8, 8); // TR
  ctx.drawImage(img, 0, 16, 8, 8, 0, (height - 1) * 8, 8, 8); // BL
  ctx.drawImage(img, 16, 16, 8, 8, (width - 1) * 8, (height - 1) * 8, 8, 8); // BR
  for (let i = 0; i < height - 2; i++) {
    ctx.drawImage(img, 0, 8, 8, 8, 0, (i + 1) * 8, 8, 8); // L
    ctx.drawImage(img, 16, 8, 8, 8, (width - 1) * 8, (i + 1) * 8, 8, 8); // R
  }
  for (let i = 0; i < width - 2; i++) {
    ctx.drawImage(img, 8, 0, 8, 8, (i + 1) * 8, 0, 8, 8); // T
    ctx.drawImage(img, 8, 16, 8, 8, (i + 1) * 8, (height - 1) * 8, 8, 8); // B
  }
  for (let i = 0; i < height - 2; i++) {
    for (let j = 0; j < width - 2; j++) {
      ctx.drawImage(img, 8, 8, 8, 8, (j + 1) * 8, (i + 1) * 8, 8, 8); // C
    }
  }
};

const drawText = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  text: string,
  xOffset: number,
  yOffset: number
) => {
  let drawX = 0;
  let drawY = 0;

  const string = dummyText(text);

  for (let i = 0; i < string.length; i++) {
    if (string[i] === "\n") {
      drawX = 0;
      drawY++;
      continue;
    }
    const char = string.charCodeAt(i) - 32;
    const lookupX = char % 16;
    const lookupY = Math.floor(char / 16);

    ctx.drawImage(
      img,
      lookupX * 8,
      lookupY * 8,
      8,
      8,
      (drawX + xOffset) * 8,
      (drawY + yOffset) * 8,
      8,
      8
    );

    drawX++;
  }
};

export const DialoguePreview: FC<DialoguePreviewProps> = ({
  text,
  avatarId,
}) => {
  const projectRoot = useSelector((state: RootState) => state.document.root);
  const uiVersion = useSelector((state: RootState) => state.editor.uiVersion);
  const avatarAsset = useSelector((state: RootState) => avatarId ? spriteSheetSelectors.selectById(state, avatarId) : undefined)
  const [frameImage, setFrameImage] = useState<HTMLImageElement>();
  const [asciiImage, setAsciiImage] = useState<HTMLImageElement>();
  const [avatarImage, setAvatarImage] = useState<HTMLCanvasElement>();
  const ref = useRef<HTMLCanvasElement>(null);

  const frameAsset = {
    id: "frame",
    name: "Window Frame",
    filename: `frame.png`,
    _v: uiVersion,
  };

  const asciiAsset = {
    id: "ascii",
    name: "ASCII Extended",
    filename: `ascii.png`,
    _v: uiVersion,
  };

  const frameFilename = `file:///${assetFilename(
    projectRoot,
    "ui",
    frameAsset
  )}?_v=${uiVersion}`;

  const asciiFilename = `file:///${assetFilename(
    projectRoot,
    "ui",
    asciiAsset
  )}?_v=${uiVersion}`;

  const avatarFilename = avatarAsset ? `file:///${assetFilename(
    projectRoot,
    "sprites",
    avatarAsset
  )}?_v=${avatarAsset._v || 0}` : "";

  // Load frame image
  useEffect(() => {
    let img = new Image();
    img.src = frameFilename;
    img.onload = () => {
      setFrameImage(img);
    };
  }, [frameFilename]);

  // Load ascii image
  useEffect(() => {
    let img = new Image();
    img.src = asciiFilename;
    img.onload = () => {
      setAsciiImage(img);
    };
  }, [asciiFilename]);

  // Load ASCII image
  useEffect(() => {
    let img = new Image();
    img.src = frameFilename;
    img.onload = () => {
      setFrameImage(img);
    };
  }, [frameFilename]);

  // Load Avatar image
  useEffect(() => {
    if (avatarFilename) {
      let img = new Image();
      img.src = avatarFilename;
      img.onload = () => {
        // Make green background color transparent
        const tmpCanvas = document.createElement("canvas");
        const tmpCtx = tmpCanvas.getContext("2d");
        if (!tmpCtx) {
          return;
        }
        tmpCtx.drawImage(img, 0, 0);
        const imgData = tmpCtx?.getImageData(0, 0, 16, 16);
        if (imgData) {
          for(let i=0; i<imgData.data.length; i+=4) {
            const g = imgData.data[i + 1];
            const b = imgData.data[i + 2];
            const a = imgData.data[i + 3];
            if ((g > 250 && b < 100) || a < 10) {
              imgData.data[i + 3] = 0;
            }                        
          }
          tmpCtx.putImageData(imgData, 0, 0);
        }
        setAvatarImage(tmpCanvas);
      };
    } else {
      setAvatarImage(undefined);
    }
  }, [avatarFilename]);  

  useLayoutEffect(() => {
    if (ref.current && frameImage && asciiImage && (!avatarId || avatarImage)) {
      const canvas = ref.current;
      const ctx = canvas.getContext("2d");
      canvas.width = canvas.width;
      if (ctx) {
        const tileWidth = 20;
        const tileHeight = textNumLines(text) + 2;
        canvas.width = tileWidth * 8;
        canvas.height = tileHeight * 8;
        drawFrame(ctx, frameImage, tileWidth, tileHeight);
        if (avatarId) {
          drawText(ctx, asciiImage, text, 3, 1);
          if (avatarImage) {
            ctx.drawImage(avatarImage, 8, 8);
          }
        } else {
          drawText(ctx, asciiImage, text, 1, 1);
        }
      }
    }
  }, [ref, text, avatarId, frameImage, asciiImage, avatarImage]);

  return (
    <canvas
      ref={ref}
      width={160}
      height={48}
      style={{
        width: 240,
        imageRendering: "pixelated",
        boxShadow: "5px 5px 10px 0px rgba(0,0,0,0.5)",
        borderRadius: 4,
      }}
    />
  );
};
