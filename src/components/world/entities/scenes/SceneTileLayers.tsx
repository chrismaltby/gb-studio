import React, { useMemo } from "react";
import styled from "styled-components";
import {
  TILE_COLOR_PROP_PRIORITY,
  TILE_SIZE,
  TOOL_COLLISIONS,
  TOOL_COLORS,
  TOOL_TILES,
} from "consts";
import AutoColorizedImage from "components/rendering/AutoColorizedImage";
import ColorizedImage from "components/rendering/ColorizedImage";
import { assetURL } from "shared/lib/helpers/assets";
import {
  backgroundSelectors,
  paletteSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesSelectors";
import { useAppSelector, useAppSelectorPick } from "store/hooks";
import ScenePriorityMap from "./ScenePriorityMap";
import SceneCollisions from "./SceneCollisions";
import SceneSlopePreview from "./SceneSlopePreview";
import { resolveScenePalettes } from "components/world/entities/scenes/helpers/scenePalettes";
import TilemapLayersCanvas from "components/rendering/TilemapLayersCanvas";
import {
  getCollisionSelectionPreview,
  getColorSelectionPreview,
  getLinkedTileSelectionPreviewMasks,
  getTileSelectionPreview,
} from "components/world/entities/scenes/helpers/sceneSelectionPreview";

const SceneOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const ZERO_SELECTION_OFFSET = { x: 0, y: 0 };

interface SceneTileLayersProps {
  sceneId: string;
}

export const SceneTileLayers = ({ sceneId }: SceneTileLayersProps) => {
  const scene = useAppSelectorPick(
    (state) => sceneSelectors.selectById(state, sceneId),
    [
      "type",
      "width",
      "height",
      "backgroundId",
      "tilemap",
      "collisions",
      "paletteIds",
      "monoBGP",
    ],
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
      ((tool !== TOOL_COLORS && tool !== TOOL_TILES) || showLayers) &&
      (state.project.present.settings.showCollisions ||
        tool === TOOL_COLLISIONS ||
        (tool === TOOL_TILES && state.editor.selectedBrush === "selection")),
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

  const tileColors = useMemo(
    () => scene?.tilemap?.tileColors ?? background?.tileColors ?? [],
    [background?.tileColors, scene?.tilemap?.tileColors],
  );

  const selectionOffset = scenePaintSelection?.offset ?? ZERO_SELECTION_OFFSET;

  const tileSelectionPreview = useMemo(
    () =>
      getTileSelectionPreview({
        scene,
        selection: scenePaintSelection,
        offset: selectionOffset,
      }),
    [scene, scenePaintSelection, selectionOffset],
  );

  const linkedTileSelectionPreviewMasks = useMemo(
    () =>
      getLinkedTileSelectionPreviewMasks({
        scene,
        selection: scenePaintSelection,
        tileSelectionPreview,
      }),
    [scene, scenePaintSelection, tileSelectionPreview],
  );

  const collisionSelectionPreview = useMemo(
    () =>
      getCollisionSelectionPreview({
        scene,
        selection: scenePaintSelection,
        offset: selectionOffset,
        linkedMasks: linkedTileSelectionPreviewMasks,
      }),
    [
      linkedTileSelectionPreviewMasks,
      scene,
      scenePaintSelection,
      selectionOffset,
    ],
  );

  const colorSelectionPreview = useMemo(
    () =>
      getColorSelectionPreview({
        scene,
        selection: scenePaintSelection,
        offset: selectionOffset,
        linkedMasks: linkedTileSelectionPreviewMasks,
        tileColors,
      }),
    [
      linkedTileSelectionPreviewMasks,
      scene,
      scenePaintSelection,
      selectionOffset,
      tileColors,
    ],
  );

  const palettes = useMemo(
    () =>
      resolveScenePalettes(
        scene?.paletteIds,
        defaultBackgroundPaletteIds,
        palettesLookup,
        gbcEnabled,
      ),
    [
      gbcEnabled,
      scene?.paletteIds,
      defaultBackgroundPaletteIds,
      palettesLookup,
    ],
  );

  if (!scene) {
    return null;
  }

  const width = scene.width * TILE_SIZE;
  const height = scene.height * TILE_SIZE;
  const monoBGP = scene.monoBGP || defaultMonoBGP;
  const displayCollisions = collisionSelectionPreview ?? scene.collisions;
  const displayTileColors = colorSelectionPreview ?? tileColors;

  return (
    <>
      {scene.tilemap ? (
        <TilemapLayersCanvas
          width={scene.width}
          height={scene.height}
          tilemap={tileSelectionPreview?.tilemap ?? scene.tilemap}
          tileColors={displayTileColors}
          palettes={palettes}
          previewAsMono={previewAsMono}
          monoBGP={monoBGP}
          priority={selected}
        />
      ) : (
        background &&
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
        ))
      )}

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
