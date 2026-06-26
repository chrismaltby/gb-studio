import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import {
  DMG_PALETTE,
  TILE_COLOR_PROP_PRIORITY,
  TILE_SIZE,
  TOOL_COLLISIONS,
  TOOL_COLORS,
} from "consts";
import AutoColorizedImage from "components/rendering/AutoColorizedImage";
import ColorizedImage from "components/rendering/ColorizedImage";
import { assetURL } from "shared/lib/helpers/assets";
import { moveGridSelection } from "shared/lib/tiles/gridSelection";
import {
  backgroundSelectors,
  paletteSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesSelectors";
import { useAppSelector } from "store/hooks";
import ScenePriorityMap from "./ScenePriorityMap";
import SceneCollisions from "./SceneCollisions";
import SceneSlopePreview from "./SceneSlopePreview";

const dmgPalettes = [
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
];

const SceneOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

interface SceneTileLayersProps {
  sceneId: string;
}

export const SceneTileLayers = ({ sceneId }: SceneTileLayersProps) => {
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId),
  );

  const background = useAppSelector((state) =>
    backgroundSelectors.selectById(state, scene?.backgroundId ?? ""),
  );

  const tilesOverride = useAppSelector((state) =>
    background?.monoOverrideId
      ? backgroundSelectors.selectById(state, background.monoOverrideId)
      : undefined,
  );

  const selected = useAppSelector((state) => state.editor.scene === sceneId);

  const gbcEnabled = useAppSelector(
    (state) => state.project.present.settings.colorMode !== "mono",
  );

  const previewAsMono = useAppSelector(
    (state) =>
      state.project.present.settings.colorMode === "mono" ||
      (state.project.present.settings.colorMode === "mixed" &&
        state.project.present.settings.previewAsMono),
  );

  const defaultMonoBGP = useAppSelector(
    (state) => state.project.present.settings.defaultMonoBGP,
  );

  const palettesLookup = useAppSelector((state) =>
    paletteSelectors.selectEntities(state),
  );

  const defaultBackgroundPaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultBackgroundPaletteIds ?? [],
  );

  const tool = useAppSelector((state) => state.editor.tool);

  const showLayers = useAppSelector((state) => state.editor.showLayers);

  const showCollisions = useAppSelector(
    (state) =>
      (tool !== TOOL_COLORS || showLayers) &&
      (state.project.present.settings.showCollisions ||
        tool === TOOL_COLLISIONS),
  );

  const showPriorityMap = useAppSelector(
    (state) =>
      state.editor.tool === TOOL_COLORS &&
      state.editor.selectedPalette === TILE_COLOR_PROP_PRIORITY,
  );

  const slopePreview = useAppSelector((state) => state.editor.slopePreview);

  const scenePaintSelection = useAppSelector((state) => {
    const selection = state.editor.scenePaintSelection;
    return selection?.sceneId === sceneId ? selection : undefined;
  });

  const selectionOffsetActive =
    !!scenePaintSelection &&
    (scenePaintSelection.offset.x !== 0 || scenePaintSelection.offset.y !== 0);

  const tileColors = useMemo(
    () => background?.tileColors ?? [],
    [background?.tileColors],
  );

  const displayTileColors = useMemo(() => {
    if (
      !scene ||
      !scenePaintSelection ||
      scenePaintSelection.mode !== "colors" ||
      tool !== TOOL_COLORS ||
      !selectionOffsetActive
    ) {
      return tileColors;
    }

    return moveGridSelection(
      tileColors,
      scene.width,
      scene.height,
      scenePaintSelection.selection,
      scenePaintSelection.offset,
      0,
    );
  }, [scene, scenePaintSelection, selectionOffsetActive, tileColors, tool]);

  const collisionSelectionPreview = useMemo(() => {
    if (
      !scene ||
      !scenePaintSelection ||
      scenePaintSelection.mode !== "collisions" ||
      !selectionOffsetActive
    ) {
      return undefined;
    }

    return moveGridSelection(
      scene.collisions,
      scene.width,
      scene.height,
      scenePaintSelection.selection,
      scenePaintSelection.offset,
      0,
    );
  }, [scene, scenePaintSelection, selectionOffsetActive]);

  const getPalette = useCallback(
    (paletteIndex: number) => {
      const sceneBackgroundPaletteIds = scene?.paletteIds ?? [];

      if (sceneBackgroundPaletteIds[paletteIndex] === "dmg") {
        return DMG_PALETTE;
      }

      return (
        palettesLookup[sceneBackgroundPaletteIds[paletteIndex]] ||
        palettesLookup[defaultBackgroundPaletteIds[paletteIndex]] ||
        DMG_PALETTE
      );
    },
    [defaultBackgroundPaletteIds, palettesLookup, scene?.paletteIds],
  );

  const palettes = useMemo(
    () =>
      gbcEnabled
        ? [
            getPalette(0),
            getPalette(1),
            getPalette(2),
            getPalette(3),
            getPalette(4),
            getPalette(5),
            getPalette(6),
            getPalette(7),
          ]
        : dmgPalettes,
    [gbcEnabled, getPalette],
  );

  if (!scene) {
    return null;
  }

  const width = scene.width * TILE_SIZE;
  const height = scene.height * TILE_SIZE;
  const monoBGP = scene.monoBGP || defaultMonoBGP;
  const displayCollisions = collisionSelectionPreview ?? scene.collisions;

  return (
    <>
      {background &&
        (gbcEnabled && background.autoColor ? (
          <AutoColorizedImage
            width={width}
            height={height}
            src={assetURL("backgrounds", background)}
            tilesSrc={
              tilesOverride ? assetURL("backgrounds", tilesOverride) : undefined
            }
            uiPalette={
              scene.paletteIds?.[7] === "auto" ? undefined : palettes[7]
            }
            previewAsMono={previewAsMono}
            monoBGP={monoBGP}
          />
        ) : (
          <ColorizedImage
            width={width}
            height={height}
            src={
              tilesOverride
                ? assetURL("backgrounds", tilesOverride)
                : assetURL("backgrounds", background)
            }
            tiles={displayTileColors}
            palettes={palettes}
            previewAsMono={previewAsMono}
            monoBGP={monoBGP}
          />
        ))}

      {showPriorityMap && (
        <SceneOverlay>
          <ScenePriorityMap
            width={scene.width}
            height={scene.height}
            tileColors={displayTileColors}
          />
        </SceneOverlay>
      )}

      {showCollisions && (
        <SceneOverlay>
          <SceneCollisions
            width={scene.width}
            height={scene.height}
            collisions={displayCollisions}
            sceneTypeKey={scene.type}
          />
          {selected && slopePreview && (
            <SceneSlopePreview
              width={scene.width}
              height={scene.height}
              slopePreview={slopePreview}
            />
          )}
        </SceneOverlay>
      )}
    </>
  );
};
