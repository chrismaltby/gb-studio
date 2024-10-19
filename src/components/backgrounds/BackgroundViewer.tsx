import React, { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import styled from "styled-components";
import {
  backgroundSelectors,
  paletteSelectors,
  sceneSelectors,
  tilesetSelectors,
} from "store/features/entities/entitiesState";
import ColorizedImage from "components/world/ColorizedImage";
import { DMG_PALETTE, TILE_SIZE } from "consts";
import { Palette } from "shared/lib/entities/entitiesTypes";
import { assetURL } from "shared/lib/helpers/assets";
import AutoColorizedImage from "components/world/AutoColorizedImage";

interface MetaspriteEditorProps {
  backgroundId: string;
}

const ScrollWrapper = styled.div`
  overflow-y: scroll;
  overflow-x: auto;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const ContentWrapper = styled.div`
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  canvas {
    image-rendering: pixelated;
  }
`;

const ImageContainer = styled.div`
  border: 1px solid ${(props) => props.theme.colors.sidebar.border};
`;

const ImageScale = styled.div`
  display: flex;
  transform-origin: top left;
`;

const emptyPalettes: Palette[] = [
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
] as Palette[];

const BackgroundViewer = ({ backgroundId }: MetaspriteEditorProps) => {
  const background = useAppSelector((state) =>
    backgroundSelectors.selectById(state, backgroundId)
  );
  const tileset = useAppSelector((state) =>
    tilesetSelectors.selectById(state, backgroundId)
  );

  const zoom = useAppSelector((state) => state.editor.zoomImage) / 100;
  const previewAsSceneId = useAppSelector(
    (state) => state.editor.previewAsSceneId
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, previewAsSceneId)
  );
  const palettesLookup = useAppSelector((state) =>
    paletteSelectors.selectEntities(state)
  );
  const defaultPaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultBackgroundPaletteIds
  );
  const gbcEnabled = useAppSelector(
    (state) => state.project.present.settings.colorMode !== "mono"
  );
  const [palettes, setPalettes] = useState<Palette[]>(emptyPalettes);
  const previewAsMono = useAppSelector((state) =>
    !gbcEnabled || state.project.present.settings.previewAsMono
  );
  const defaultBGP = useAppSelector((state) =>
    state.project.present.settings.defaultBGP
  );

  useEffect(() => {
    setPalettes(
      Array.from(Array(8).keys()).map((paletteIndex) => {
        const paletteId =
          scene?.paletteIds?.[paletteIndex] || defaultPaletteIds[paletteIndex];
        return palettesLookup[paletteId] || (DMG_PALETTE as Palette);
      })
    );
  }, [scene, palettesLookup, defaultPaletteIds]);

  if (background) {
    return (
      <ScrollWrapper>
        <ContentWrapper
          style={{
            minWidth: background.imageWidth * zoom + 100,
            minHeight: background.imageHeight * zoom + 110,
          }}
        >
          <ImageContainer
            style={{
              width: background.imageWidth * zoom,
              height: background.imageHeight * zoom,
            }}
          >
            <ImageScale
              style={{
                transform: `translate3d(0px, 0px, 0px) scale(${zoom})`,
              }}
            >
              {gbcEnabled && background.autoColor ? (
                <AutoColorizedImage
                  width={background.width * TILE_SIZE}
                  height={background.height * TILE_SIZE}
                  src={assetURL("backgrounds", background)}
                />
              ) : (
                <ColorizedImage
                  width={background.width * TILE_SIZE}
                  height={background.height * TILE_SIZE}
                  src={assetURL("backgrounds", background)}
                  tiles={background.tileColors}
                  palettes={palettes}
                  previewAsMono={previewAsMono}
                  monoPalette={defaultBGP}
                />
              )}
            </ImageScale>
          </ImageContainer>
        </ContentWrapper>
      </ScrollWrapper>
    );
  }
  if (tileset) {
    return (
      <ScrollWrapper>
        <ContentWrapper
          style={{
            minWidth: tileset.imageWidth * zoom + 100,
            minHeight: tileset.imageHeight * zoom + 110,
          }}
        >
          <ImageContainer
            style={{
              width: tileset.imageWidth * zoom,
              height: tileset.imageHeight * zoom,
            }}
          >
            <ImageScale
              style={{
                transform: `translate3d(0px, 0px, 0px) scale(${zoom})`,
              }}
            >
              <ColorizedImage
                width={tileset.width * TILE_SIZE}
                height={tileset.height * TILE_SIZE}
                src={assetURL("tilesets", tileset)}
                tiles={[]}
                palettes={palettes}
                previewAsMono={previewAsMono}
                monoPalette={defaultBGP}
              />
            </ImageScale>
          </ImageContainer>
        </ContentWrapper>
      </ScrollWrapper>
    );
  }

  return <div />;
};

export default BackgroundViewer;
