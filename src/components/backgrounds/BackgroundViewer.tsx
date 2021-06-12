import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styled, { css } from "styled-components";
import { RootState } from "store/configureStore";
import {
  backgroundSelectors,
  paletteSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import ColorizedImage from "components/world/ColorizedImage";
import { assetFilename } from "lib/helpers/gbstudio";
import { DMG_PALETTE } from "../../consts";
import { Palette } from "store/features/entities/entitiesTypes";

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
  const projectRoot = useSelector((state: RootState) => state.document.root);
  const background = useSelector((state: RootState) =>
    backgroundSelectors.selectById(state, backgroundId)
  );
  const zoom = useSelector((state: RootState) => state.editor.zoomImage) / 100;
  const previewAsSceneId = useSelector(
    (state: RootState) => state.editor.previewAsSceneId
  );
  const scene = useSelector((state: RootState) =>
    sceneSelectors.selectById(state, previewAsSceneId)
  );
  const palettesLookup = useSelector((state: RootState) =>
    paletteSelectors.selectEntities(state)
  );
  const defaultPaletteIds = useSelector(
    (state: RootState) =>
      state.project.present.settings.defaultBackgroundPaletteIds
  );

  const [palettes, setPalettes] = useState<Palette[]>(emptyPalettes);

  useEffect(() => {
    setPalettes(
      Array.from(Array(8).keys()).map((paletteIndex) => {
        const paletteId =
          scene?.paletteIds?.[paletteIndex] || defaultPaletteIds[paletteIndex];
        return palettesLookup[paletteId] || (DMG_PALETTE as Palette);
      })
    );
  }, [scene, palettesLookup, defaultPaletteIds]);

  if (!background) {
    return <div />;
  }

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
            <ColorizedImage
              className="Scene__Background"
              alt=""
              width={background.width}
              height={background.height}
              src={`file://${assetFilename(
                projectRoot,
                "backgrounds",
                background
              )}?_v=${background._v}`}
              tiles={background.tileColors}
              palettes={palettes}
            />
          </ImageScale>
        </ImageContainer>
      </ContentWrapper>
    </ScrollWrapper>
  );
};

export default BackgroundViewer;
