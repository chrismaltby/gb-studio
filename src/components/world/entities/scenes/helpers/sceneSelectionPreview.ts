import type { ScenePaintSelection } from "store/features/editor/editorState";
import {
  isTilemapLayerCellTopmost,
  moveTilemapLayerSelection,
  resolveSceneAutotiles,
} from "shared/lib/tiles/sceneTilemapData";
import type { SceneTilemapData } from "shared/lib/resources/types";
import {
  GridOffset,
  moveGridSelection,
  moveGridSelectionMasked,
} from "shared/lib/tiles/grid";

type SceneSelectionPreviewScene = {
  width: number;
  height: number;
  collisions: number[];
  tilemap?: SceneTilemapData;
};

type TileSelectionPreview = {
  tilemap: SceneTilemapData;
};

type LinkedTileSelectionPreviewMasks = {
  shouldMoveSource: (sourceIndex: number) => boolean;
  shouldWriteTarget: (targetIndex: number, sourceIndex: number) => boolean;
};

const hasOffset = (offset: GridOffset) => offset.x !== 0 || offset.y !== 0;

export const shouldPreviewCollisionSelection = (
  mode: ScenePaintSelection["mode"],
) => mode === "collisions" || mode === "tiles";

export const getTileSelectionPreview = ({
  scene,
  selection,
  offset,
}: {
  scene?: SceneSelectionPreviewScene;
  selection?: ScenePaintSelection;
  offset: GridOffset;
}): TileSelectionPreview | undefined => {
  if (
    !scene?.tilemap ||
    !selection ||
    selection.mode !== "tiles" ||
    !hasOffset(offset)
  ) {
    return undefined;
  }

  const layerIndex = scene.tilemap.layers.findIndex(
    (layer) => layer.id === selection.layerId,
  );
  const layer = scene.tilemap.layers[layerIndex];
  if (!layer) {
    return undefined;
  }

  const layers = [...scene.tilemap.layers];
  layers[layerIndex] = moveTilemapLayerSelection(
    layer,
    scene.width,
    scene.height,
    selection.selection,
    offset,
  );
  if (layers[layerIndex]?.autotiles) {
    const resolvedTiles = resolveSceneAutotiles(
      layers[layerIndex].autotiles ?? [],
      scene.width,
      scene.height,
      scene.tilemap,
    );
    layers[layerIndex].tiles = layers[layerIndex].tiles.map(
      (tile, index) => resolvedTiles[index] || tile,
    );
  }

  const tilemap = { ...scene.tilemap, layers };
  return { tilemap };
};

export const getLinkedTileSelectionPreviewMasks = ({
  scene,
  selection,
  tileSelectionPreview,
}: {
  scene?: SceneSelectionPreviewScene;
  selection?: ScenePaintSelection;
  tileSelectionPreview?: TileSelectionPreview;
}): LinkedTileSelectionPreviewMasks | undefined => {
  if (
    !scene?.tilemap ||
    !selection ||
    selection.mode !== "tiles" ||
    !tileSelectionPreview
  ) {
    return undefined;
  }

  const layerIndex = scene.tilemap.layers.findIndex(
    (layer) => layer.id === selection.layerId,
  );

  if (layerIndex < 0) {
    return undefined;
  }

  const tilemap = scene.tilemap;

  return {
    shouldMoveSource: (sourceIndex: number) =>
      isTilemapLayerCellTopmost(tilemap, layerIndex, sourceIndex),
    shouldWriteTarget: (targetIndex: number) =>
      isTilemapLayerCellTopmost(
        tileSelectionPreview.tilemap,
        layerIndex,
        targetIndex,
      ),
  };
};

export const getCollisionSelectionPreview = ({
  scene,
  selection,
  offset,
  linkedMasks,
}: {
  scene?: SceneSelectionPreviewScene;
  selection?: ScenePaintSelection;
  offset: GridOffset;
  linkedMasks?: LinkedTileSelectionPreviewMasks;
}): number[] | undefined => {
  if (
    !scene ||
    !selection ||
    !hasOffset(offset) ||
    !shouldPreviewCollisionSelection(selection.mode)
  ) {
    return undefined;
  }

  if (selection.mode === "tiles") {
    if (!linkedMasks) {
      return undefined;
    }
    return moveGridSelectionMasked(
      scene.collisions,
      scene.width,
      scene.height,
      selection.selection,
      offset,
      0,
      linkedMasks.shouldMoveSource,
      linkedMasks.shouldWriteTarget,
    );
  }

  return moveGridSelection(
    scene.collisions,
    scene.width,
    scene.height,
    selection.selection,
    offset,
    0,
  );
};

export const getColorSelectionPreview = ({
  scene,
  selection,
  offset,
  linkedMasks,
  tileColors,
}: {
  scene?: SceneSelectionPreviewScene;
  selection?: ScenePaintSelection;
  offset: GridOffset;
  linkedMasks?: LinkedTileSelectionPreviewMasks;
  tileColors: number[];
}): number[] | undefined => {
  if (
    !scene ||
    !selection ||
    !hasOffset(offset) ||
    (selection.mode !== "colors" && selection.mode !== "tiles")
  ) {
    return undefined;
  }

  const sourceColors =
    (scene.tilemap ? scene.tilemap.tileColors : tileColors) ?? [];
  if (selection.mode === "tiles") {
    if (!linkedMasks) {
      return undefined;
    }

    return moveGridSelectionMasked(
      sourceColors,
      scene.width,
      scene.height,
      selection.selection,
      offset,
      0,
      linkedMasks.shouldMoveSource,
      linkedMasks.shouldWriteTarget,
    );
  }

  return moveGridSelection(
    sourceColors,
    scene.width,
    scene.height,
    selection.selection,
    offset,
    0,
  );
};
