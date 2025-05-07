import keyBy from "lodash/keyBy";
import uniq from "lodash/uniq";
import React, { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";
import { textNumNewlines } from "shared/lib/helpers/trimlines";
import {
  avatarSelectors,
  fontSelectors,
} from "store/features/entities/entitiesState";
import { loadFont, drawFrame, drawFill, drawText } from "./TextPreviewHelper";
import { assetURL } from "shared/lib/helpers/assets";
import { calculateTextBoxHeight } from "shared/lib/helpers/dialogue";
import { FontData } from "shared/lib/helpers/fonts";

interface DialoguePreviewProps {
  text: string;
  avatarId?: string;
  showFrame?: boolean;
  showFill?: boolean;
  textX?: number;
  textY?: number;
  textHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  scale?: number;
}

export const DialoguePreview: FC<DialoguePreviewProps> = ({
  text,
  avatarId,
  showFrame = true,
  showFill = true,
  textX = 1,
  textY = 1,
  textHeight = 3,
  minHeight = 4,
  maxHeight = 7,
  scale = 1,
}) => {
  const uiVersion = useAppSelector((state) => state.editor.uiVersion);
  const avatarAsset = useAppSelector((state) =>
    avatarId ? avatarSelectors.selectById(state, avatarId) : undefined
  );
  const fonts = useAppSelector((state) => fontSelectors.selectAll(state));
  const fontsLookup = useAppSelector((state) =>
    fontSelectors.selectEntities(state)
  );
  const defaultFontId = useAppSelector(
    (state) => state.project.present.settings.defaultFontId || fonts[0]?.id
  );

  const [frameImage, setFrameImage] = useState<HTMLImageElement>();
  const [avatarImage, setAvatarImage] = useState<HTMLCanvasElement>();
  const [fontsData, setFontsData] = useState<Record<string, FontData>>({});
  const [drawn, setDrawn] = useState<boolean>(false);
  const ref = useRef<HTMLCanvasElement>(null);
  const isMounted = useRef(true);

  const frameAsset = {
    id: "frame",
    name: "Window Frame",
    filename: `frame.png`,
    _v: uiVersion,
  };

  const frameAssetURL = assetURL("ui", frameAsset);
  const avatarAssetURL = avatarAsset ? assetURL("avatars", avatarAsset) : "";

  useEffect(() => {
    async function fetchData() {
      const usedFontIds = uniq(
        ([] as string[]).concat(
          defaultFontId,
          (String(text).match(/(!F:[0-9a-f-]+!)/g) || []) // Add fonts referenced in text
            .map((id) => id.substring(3).replace(/!$/, ""))
        )
      );
      const usedFonts = usedFontIds.map((id) => fontsLookup[id] || fonts[0]);
      const usedFontData = await Promise.all(usedFonts.map(loadFont));
      if (!isMounted.current) {
        return;
      }
      setFontsData(keyBy(usedFontData, "id"));
    }
    fetchData();
  }, [text, defaultFontId, fonts, fontsLookup]);

  // Load frame image
  useEffect(() => {
    const img = new Image();
    img.src = frameAssetURL;
    img.onload = () => {
      if (!isMounted.current) {
        return;
      }
      setFrameImage(img);
    };
  }, [frameAssetURL]);

  // Load frame image
  useEffect(() => {
    const img = new Image();
    img.src = frameAssetURL;
    img.onload = () => {
      if (!isMounted.current) {
        return;
      }
      setFrameImage(img);
    };
  }, [frameAssetURL]);

  // Load Avatar image
  useEffect(() => {
    if (avatarAssetURL) {
      const img = new Image();
      img.src = avatarAssetURL;
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
          for (let i = 0; i < imgData.data.length; i += 4) {
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
  }, [avatarAssetURL]);

  useLayoutEffect(() => {
    if (ref.current && frameImage && (!avatarId || avatarImage)) {
      const canvas = ref.current;
      const ctx = canvas.getContext("2d");
      // eslint-disable-next-line no-self-assign
      canvas.width = canvas.width;
      if (ctx) {
        const textLines = textNumNewlines(text);
        const tileWidth = 20;
        const tileHeight = calculateTextBoxHeight({
          textLines,
          textY,
          textHeight,
          minHeight,
          maxHeight,
          showFrame,
        });
        canvas.width = tileWidth * 8;
        canvas.height = tileHeight * 8;
        if (showFrame) {
          drawFrame(ctx, frameImage, tileWidth, tileHeight);
        } else if (showFill) {
          drawFill(ctx, frameImage, tileWidth, tileHeight);
        }
        if (avatarId) {
          if (avatarImage) {
            ctx.drawImage(avatarImage, 8, 8);
          }
          drawText(
            ctx,
            text,
            Math.max(0, 16 + 8 * textX),
            Math.max(0, 8 * textY),
            textHeight,
            fontsData,
            defaultFontId,
            fonts[0]?.id
          );
        } else {
          drawText(
            ctx,
            text,
            Math.max(0, 8 * textX),
            Math.max(0, 8 * textY),
            textHeight,
            fontsData,
            defaultFontId,
            fonts[0]?.id
          );
        }
      }
      setDrawn(true);
    }
  }, [
    ref,
    text,
    avatarId,
    frameImage,
    avatarImage,
    fontsData,
    defaultFontId,
    fonts,
    showFrame,
    textX,
    textY,
    maxHeight,
    minHeight,
    textHeight,
    showFill,
  ]);

  // Keep track of component's mounted state to allow detecting if component still mounted when
  // async data calls are complete to prevent React errors caused by setting state on unmounted component
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return (
    <canvas
      ref={ref}
      width={160}
      height={48}
      style={{
        width: 160 * scale,
        imageRendering: "pixelated",
        opacity: drawn ? 1 : 0,
      }}
    />
  );
};
