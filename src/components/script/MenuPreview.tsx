import keyBy from "lodash/keyBy";
import uniq from "lodash/uniq";
import React, { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { assetFilename } from "lib/helpers/gbstudio";
import { RootState } from "store/configureStore";
import { fontSelectors } from "store/features/entities/entitiesState";
import { loadFont, drawFrame, drawText, FontData } from "./TextPreviewHelper";

interface MenuPreviewProps {
  items: string[];
  layout: "dialogue" | "menu";
}

export const MenuPreview: FC<MenuPreviewProps> = ({ items, layout }) => {
  const projectRoot = useSelector((state: RootState) => state.document.root);
  const uiVersion = useSelector((state: RootState) => state.editor.uiVersion);
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
  const [cursorImage, setCursorImage] = useState<HTMLImageElement>();
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

  const cursorAsset = {
    id: "cursor",
    name: "Window Cursor",
    filename: `cursor.png`,
    _v: uiVersion,
  };

  const cursorFilename = `file:///${assetFilename(
    projectRoot,
    "ui",
    cursorAsset
  )}?_v=${uiVersion}`;

  useEffect(() => {
    async function fetchData() {
      const usedFontIds = uniq(
        items.flatMap((item) =>
          ([] as string[]).concat(
            defaultFontId,
            (String(item).match(/(!F:[0-9a-f-]+!)/g) || []) // Add fonts referenced in text
              .map((id) => id.substring(3).replace(/!$/, ""))
          )
        )
      );
      const usedFonts = usedFontIds.map((id) => fontsLookup[id] || fonts[0]);
      const usedFontData = await Promise.all(
        usedFonts.map((font) => loadFont(projectRoot, font))
      );
      setFontsData(keyBy(usedFontData, "id"));
    }
    fetchData();
  }, [defaultFontId, fonts, fontsLookup, items, projectRoot]);

  // Load frame image
  useEffect(() => {
    const img = new Image();
    img.src = frameFilename;
    img.onload = () => {
      setFrameImage(img);
    };
  }, [frameFilename]);

  // Load cursor image
  useEffect(() => {
    const img = new Image();
    img.src = cursorFilename;
    img.onload = () => {
      setCursorImage(img);
    };
  }, [cursorFilename]);

  useLayoutEffect(() => {
    if (ref.current && frameImage && cursorImage) {
      const canvas = ref.current;
      const ctx = canvas.getContext("2d");
      // eslint-disable-next-line no-self-assign
      canvas.width = canvas.width;
      if (ctx) {
        const tileWidth = layout === "dialogue" ? 20 : 10;
        const tileHeight =
          (layout === "dialogue" ? Math.min(items.length, 4) : items.length) +
          2;
        canvas.width = tileWidth * 8;
        canvas.height = tileHeight * 8;
        drawFrame(ctx, frameImage, tileWidth, tileHeight);
        items.forEach((item, i) => {
          const x = layout === "dialogue" ? 16 + 9 * 8 * Math.floor(i / 4) : 16;
          const y = layout === "dialogue" ? 8 + (i % 4) * 8 : 8 + i * 8;
          drawText(
            ctx,
            item || `Item ${i + 1}`,
            x,
            y,
            fontsData,
            defaultFontId,
            fonts[0]?.id
          );
        });
        ctx.drawImage(cursorImage, 8, 8);
      }
      setDrawn(true);
    }
  }, [
    ref,
    frameImage,
    fontsData,
    defaultFontId,
    fonts,
    layout,
    items,
    cursorImage,
  ]);

  return (
    <canvas
      ref={ref}
      width={160}
      height={48}
      style={{
        width: layout === "dialogue" ? 240 : 120,
        imageRendering: "pixelated",
        boxShadow: "5px 5px 10px 0px rgba(0,0,0,0.5)",
        borderRadius: 4,
        opacity: drawn ? 1 : 0,
      }}
    />
  );
};
