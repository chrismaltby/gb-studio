import keyBy from "lodash/keyBy";
import uniq from "lodash/uniq";
import React, { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { assetFilename } from "lib/helpers/gbstudio";
import { dummyText, textNumLines } from "lib/helpers/trimlines";
import { RootState } from "store/configureStore";
import {
  avatarSelectors,
  fontSelectors,
} from "store/features/entities/entitiesState";
import { Font } from "store/features/entities/entitiesTypes";

interface DialoguePreviewProps {
  text: string;
  avatarId?: string;
}

interface FontData {
  id: string;
  img: HTMLImageElement;
  isMono: boolean;
  widths: number[];
}

const isTransparent = (r: number, g: number, b: number): boolean => {
  return (
    (r === 255 && b === 255 && g === 0) || (g === 255 && r === 0 && b === 0)
  );
};

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

const loadImage = async (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (error) => {
      reject(error);
    };
  });
};

const loadFont = async (projectRoot: string, font: Font): Promise<FontData> => {
  const fontFilename = `file:///${assetFilename(
    projectRoot,
    "fonts",
    font
  )}?_v=${font._v || 0}`;
  const img = await loadImage(fontFilename);
  const widths: number[] = [];
  let isMono = true;

  // Make green background color transparent
  const tmpCanvas = document.createElement("canvas");
  const tmpCtx = tmpCanvas.getContext("2d");
  if (!tmpCtx) {
    throw new Error("Unable to get canvas context while loading font");
  }
  tmpCtx.drawImage(img, 0, 0);
  const imgData = tmpCtx?.getImageData(0, 0, img.width, img.height);
  if (imgData) {
    const charsX = Math.floor(img.width / 8);
    const charsY = Math.floor(img.height / 8);

    for (let yi = 0; yi < charsY; yi++) {
      for (let xi = 0; xi < charsX; xi++) {
        let width = 0;
        while (width < 8) {
          const i = 4 * (yi * 8 * img.width + xi * 8 + width);
          const r = imgData.data[i];
          const g = imgData.data[i + 1];
          const b = imgData.data[i + 2];
          if (isTransparent(r, g, b)) {
            isMono = false;
            break;
          }
          width++;
        }
        widths.push(width);
      }
    }
  }

  return {
    id: font.id,
    img,
    isMono,
    widths,
  };
};

const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  xOffset: number,
  yOffset: number,
  fontsData: Record<string, FontData>,
  defaultFontId: string
) => {
  let drawX = 0;
  let drawY = 0;

  let font = fontsData[defaultFontId];
  if (!font) {
    return;
  }
  const defaultFont = font;

  const string = dummyText(text);

  for (let i = 0; i < string.length; i++) {
    if (string[i] === "\n") {
      drawX = 0;
      drawY += 8;
      continue;
    }
    // Check for font change
    if (string[i] === "!" && string[i + 1] === "F" && string[i + 2] === ":") {
      const fontId = string.substring(i + 3, i + 40).replace(/!.*/, "");
      font = fontsData[fontId] || defaultFont;
      i += fontId.length + 3;
      if (font.isMono) {
        drawX = Math.floor(drawX / 8) * 8;
      }
      continue;
    }
    const char = (string.charCodeAt(i) - 32) % font.widths.length;
    const lookupX = char % 16;
    const lookupY = Math.floor(char / 16);

    ctx.drawImage(
      font.img,
      lookupX * 8,
      lookupY * 8,
      font.widths[char],
      8,
      drawX + xOffset,
      drawY + yOffset,
      font.widths[char],
      8
    );

    drawX += font.widths[char];
  }
};

export const DialoguePreview: FC<DialoguePreviewProps> = ({
  text,
  avatarId,
}) => {
  const projectRoot = useSelector((state: RootState) => state.document.root);
  const uiVersion = useSelector((state: RootState) => state.editor.uiVersion);
  const avatarAsset = useSelector((state: RootState) =>
    avatarId ? avatarSelectors.selectById(state, avatarId) : undefined
  );
  const fonts = useSelector((state: RootState) =>
    fontSelectors.selectAll(state)
  );
  const fontsLookup = useSelector((state: RootState) =>
    fontSelectors.selectEntities(state)
  );
  const defaultFontId = useSelector(
    (state: RootState) =>
      state.project.present.settings.defaultFontId || fonts[0]?.id
  );

  const [frameImage, setFrameImage] = useState<HTMLImageElement>();
  const [avatarImage, setAvatarImage] = useState<HTMLCanvasElement>();
  const [fontsData, setFontsData] = useState<Record<string, FontData>>({});
  const [drawn, setDrawn] = useState<boolean>(false);
  const ref = useRef<HTMLCanvasElement>(null);

  const frameAsset = {
    id: "frame",
    name: "Window Frame",
    filename: `frame.png`,
    _v: uiVersion,
  };

  const frameFilename = `file:///${assetFilename(
    projectRoot,
    "ui",
    frameAsset
  )}?_v=${uiVersion}`;

  const avatarFilename = avatarAsset
    ? `file:///${assetFilename(projectRoot, "avatars", avatarAsset)}?_v=${
        avatarAsset._v || 0
      }`
    : "";

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
      const usedFontData = await Promise.all(
        usedFonts.map((font) => loadFont(projectRoot, font))
      );
      setFontsData(keyBy(usedFontData, "id"));
    }
    fetchData();
  }, [text, defaultFontId, fonts, fontsLookup, projectRoot]);

  // Load frame image
  useEffect(() => {
    const img = new Image();
    img.src = frameFilename;
    img.onload = () => {
      setFrameImage(img);
    };
  }, [frameFilename]);

  // Load frame image
  useEffect(() => {
    const img = new Image();
    img.src = frameFilename;
    img.onload = () => {
      setFrameImage(img);
    };
  }, [frameFilename]);

  // Load Avatar image
  useEffect(() => {
    if (avatarFilename) {
      const img = new Image();
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
  }, [avatarFilename]);

  useLayoutEffect(() => {
    if (ref.current && frameImage && (!avatarId || avatarImage)) {
      const canvas = ref.current;
      const ctx = canvas.getContext("2d");
      // eslint-disable-next-line no-self-assign
      canvas.width = canvas.width;
      if (ctx) {
        const tileWidth = 20;
        const tileHeight = textNumLines(text) + 2;
        canvas.width = tileWidth * 8;
        canvas.height = tileHeight * 8;
        drawFrame(ctx, frameImage, tileWidth, tileHeight);
        if (avatarId) {
          drawText(ctx, text, 24, 8, fontsData, defaultFontId);
          if (avatarImage) {
            ctx.drawImage(avatarImage, 8, 8);
          }
        } else {
          drawText(ctx, text, 8, 8, fontsData, defaultFontId);
        }
      }
      setDrawn(true);
    }
  }, [ref, text, avatarId, frameImage, avatarImage, fontsData, defaultFontId]);

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
        opacity: drawn ? 1 : 0,
      }}
    />
  );
};
