import {
  TILE_DEFAULT_UNSET,
  TILE_COLOR_PALETTE,
  TILE_COLOR_PROPS,
  TILE_SIZE,
} from "consts";
import {
  buildSceneTilesetLookup,
  decodeSceneTileRef,
  encodeSceneTileRef,
  isAutotileDefinitionWithinBounds,
  isTileWithinAutotileDefinition,
  isSceneAutotileDefinitionValid,
  remapSceneAutotileDefinitions,
} from "shared/lib/tiles/sceneTilemapData";
import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import {
  ensureSymbolsUnique,
  upsertAssetEntity,
  updateEntitySymbol,
} from "shared/lib/entities/entitiesHelpers";
import {
  AutotileDefinition,
  AutotileType,
  CompressedTilesetResourceAsset,
} from "shared/lib/resources/types";
import {
  localSceneSelectById,
  localTilesetSelectById,
} from "store/features/entities/helpers";
import {
  scenesAdapter,
  tilesetsAdapter,
} from "store/features/entities/adapters";
import { normalizeGridSize, resizeGrid } from "shared/lib/tiles/grid";

const setTilesetSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ tilesetId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.tilesets,
    tilesetsAdapter,
    action.payload.tilesetId,
    action.payload.symbol,
  );
};

const loadTileset: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: CompressedTilesetResourceAsset;
  }>
> = (state, action) => {
  upsertAssetEntity(
    state.tilesets,
    tilesetsAdapter,
    {
      ...action.payload.data,
      tileCollisions: [],
      tileColors: [],
      autotiles: [],
    },
    [
      "id",
      "symbol",
      "width",
      "height",
      "tileCollisions",
      "tileColors",
      "autotiles",
    ],
  );
  updateTilemapReferencesForTilesets(state, [action.payload.data.id]);
  ensureSymbolsUnique(state);
};

interface TilesetResize {
  width: number;
  height: number;
}

export const updateTilemapReferencesForTilesets = (
  state: EntitiesState,
  tilesetIds: readonly string[],
) => {
  const resizes = new Map<string, TilesetResize>();

  for (const tilesetId of tilesetIds) {
    const tileset = localTilesetSelectById(state, tilesetId);
    if (!tileset) {
      continue;
    }

    const detectedWidth = Math.floor(tileset.imageWidth / TILE_SIZE);
    const detectedHeight = Math.floor(tileset.imageHeight / TILE_SIZE);
    if (
      !Number.isFinite(detectedWidth) ||
      !Number.isFinite(detectedHeight) ||
      detectedWidth <= 0 ||
      detectedHeight <= 0
    ) {
      continue;
    }

    const nextWidth = Math.min(detectedWidth, 255);
    const nextHeight = Math.min(detectedHeight, 255);
    if (nextWidth === tileset.width && nextHeight === tileset.height) {
      continue;
    }

    const oldWidth = Math.max(0, Math.floor(tileset.width));
    const oldHeight = Math.max(0, Math.floor(tileset.height));
    const tileColors = resizeGrid(
      tileset.tileColors,
      oldWidth,
      oldHeight,
      nextWidth,
      nextHeight,
      TILE_DEFAULT_UNSET,
    );
    const tileCollisions = resizeGrid(
      tileset.tileCollisions,
      oldWidth,
      oldHeight,
      nextWidth,
      nextHeight,
      TILE_DEFAULT_UNSET,
    );
    const autotiles =
      oldWidth > 0
        ? (tileset.autotiles ?? [])
            .map((definition) => {
              const x = definition.startTile % oldWidth;
              const y = Math.floor(definition.startTile / oldWidth);
              return isAutotileDefinitionWithinBounds(
                { ...definition, startTile: y * nextWidth + x },
                nextWidth,
                nextHeight,
              )
                ? { ...definition, startTile: y * nextWidth + x }
                : undefined;
            })
            .filter((value): value is NonNullable<typeof value> => !!value)
        : [];

    tilesetsAdapter.updateOne(state.tilesets, {
      id: tileset.id,
      changes: {
        width: nextWidth,
        height: nextHeight,
        tileColors,
        tileCollisions,
        autotiles,
      },
    });
    resizes.set(tileset.id, { width: nextWidth, height: nextHeight });
  }

  if (resizes.size === 0) {
    return;
  }

  const sceneUpdates = state.scenes.ids.reduce<
    Array<{
      id: string;
      changes: {
        tilemap: NonNullable<(typeof state.scenes.entities)[string]>["tilemap"];
      };
    }>
  >((memo, sceneId) => {
    const scene = localSceneSelectById(state, String(sceneId));
    const sceneTilemap = scene?.tilemap;

    if (!scene || !sceneTilemap?.tilesets.some(({ id }) => resizes.has(id))) {
      return memo;
    }

    const oldLookup = buildSceneTilesetLookup(sceneTilemap);
    const resizedTilesets = sceneTilemap.tilesets.map((snapshot) => {
      const resize = resizes.get(snapshot.id);
      return resize ? { ...snapshot, ...resize } : snapshot;
    });
    const newLookup = buildSceneTilesetLookup({
      tilesets: resizedTilesets,
    });

    const remapRef = (value: number) => {
      const ref = decodeSceneTileRef(value, oldLookup);

      if (!ref) {
        return 0;
      }

      const newEntry = newLookup.entries[ref.tilesetIndex];
      if (!newEntry) {
        return 0;
      }

      const resize = resizes.get(ref.tilesetId);
      let nextTileIndex = ref.tileIndex;
      if (resize) {
        const oldEntry = oldLookup.entries[ref.tilesetIndex];
        if (!oldEntry || oldEntry.width <= 0) {
          return 0;
        }
        const x = ref.tileIndex % oldEntry.width;
        const y = Math.floor(ref.tileIndex / oldEntry.width);
        if (x >= resize.width || y >= resize.height) {
          return 0;
        }
        nextTileIndex = y * resize.width + x;
      }

      return encodeSceneTileRef(newEntry.offset, nextTileIndex);
    };

    const layersWithRemappedTiles = sceneTilemap.layers.map((layer) => ({
      ...layer,
      tiles: layer.tiles.map(remapRef),
    }));
    const remappedAutotiles = remapSceneAutotileDefinitions(
      sceneTilemap.autotiles,
      layersWithRemappedTiles,
      (startTile, definition) => {
        const remappedStartTile = remapRef(startTile);
        return isSceneAutotileDefinitionValid(
          { ...definition, startTile: remappedStartTile },
          newLookup,
        )
          ? remappedStartTile
          : 0;
      },
    );

    memo.push({
      id: scene.id,
      changes: {
        tilemap: {
          ...sceneTilemap,
          tilesets: resizedTilesets,
          ...(sceneTilemap.autotiles
            ? { autotiles: remappedAutotiles.autotiles }
            : {}),
          layers: remappedAutotiles.layers,
        },
      },
    });

    return memo;
  }, []);

  if (sceneUpdates.length > 0) {
    scenesAdapter.updateMany(state.scenes, sceneUpdates);
  }
};

export const updateAllTilemapReferences = (state: EntitiesState) => {
  updateTilemapReferencesForTilesets(
    state,
    state.tilesets.ids.map((id) => String(id)),
  );
};

/**************************************************************************
 * Tile Defaults
 */

const paintTilesetColor: CaseReducer<
  EntitiesState,
  PayloadAction<{
    tilesetId: string;
    x: number;
    y: number;
    value: number;
    isTileProp: boolean;
    clear?: boolean;
  }>
> = (state, action) => {
  const tileset = localTilesetSelectById(state, action.payload.tilesetId);
  if (!tileset) {
    return;
  }

  const { x, y, value, isTileProp, clear } = action.payload;

  if (x < 0 || y < 0 || x >= tileset.width || y >= tileset.height) {
    return;
  }

  const size = tileset.width * tileset.height;
  const tileColors =
    tileset.tileColors.length === size
      ? tileset.tileColors
      : normalizeGridSize(tileset.tileColors, size, TILE_DEFAULT_UNSET);

  const index = y * tileset.width + x;
  const current = tileColors[index] ?? TILE_DEFAULT_UNSET;

  if (clear) {
    tileColors[index] = TILE_DEFAULT_UNSET;
  } else if (isTileProp) {
    const palette =
      current === TILE_DEFAULT_UNSET ? 0 : current & TILE_COLOR_PALETTE;

    tileColors[index] = palette | (value & TILE_COLOR_PROPS);
  } else {
    const props =
      current === TILE_DEFAULT_UNSET ? 0 : current & TILE_COLOR_PROPS;

    tileColors[index] = props | (value & TILE_COLOR_PALETTE);
  }

  tilesetsAdapter.updateOne(state.tilesets, {
    id: tileset.id,
    changes: { tileColors },
  });
};

const paintTilesetCollision: CaseReducer<
  EntitiesState,
  PayloadAction<{
    tilesetId: string;
    x: number;
    y: number;
    value: number;
    mask: number;
    clear?: boolean;
  }>
> = (state, action) => {
  const tileset = localTilesetSelectById(state, action.payload.tilesetId);
  if (!tileset) {
    return;
  }

  const { x, y, value, mask, clear } = action.payload;

  if (x < 0 || y < 0 || x >= tileset.width || y >= tileset.height) {
    return;
  }

  const size = tileset.width * tileset.height;
  const tileCollisions =
    tileset.tileCollisions.length === size
      ? tileset.tileCollisions
      : normalizeGridSize(tileset.tileCollisions, size, TILE_DEFAULT_UNSET);

  const index = y * tileset.width + x;

  if (clear) {
    tileCollisions[index] = TILE_DEFAULT_UNSET;
  } else {
    const current =
      tileCollisions[index] === TILE_DEFAULT_UNSET
        ? 0
        : (tileCollisions[index] ?? 0);

    tileCollisions[index] = (current & ~mask) | (value & mask);
  }

  tilesetsAdapter.updateOne(state.tilesets, {
    id: tileset.id,
    changes: { tileCollisions },
  });
};

const toggleTilesetAutotileGroup: CaseReducer<
  EntitiesState,
  PayloadAction<{
    tilesetId: string;
    tileIndex: number;
    type?: AutotileType;
  }>
> = (state, action) => {
  const tileset = localTilesetSelectById(state, action.payload.tilesetId);
  if (!tileset) {
    return;
  }

  const autotiles = tileset.autotiles ?? [];
  const type = action.payload.type ?? "2x2";

  // Find existing overlapping autotile
  const existingDefinition = autotiles.find((definition) =>
    isTileWithinAutotileDefinition(
      action.payload.tileIndex,
      tileset.width,
      definition,
    ),
  );

  const nextDefinition = { type, startTile: action.payload.tileIndex };
  const isValidAutotile = isAutotileDefinitionWithinBounds(
    nextDefinition,
    tileset.width,
    tileset.height,
  );

  let nextAutotiles: AutotileDefinition[] = autotiles;

  if (existingDefinition) {
    // Autotile already existed, remove it
    nextAutotiles = autotiles.filter(
      (definition) => definition !== existingDefinition,
    );
  } else if (isValidAutotile) {
    // Autotile didn't exist but is valid, add it
    nextAutotiles = [...autotiles, nextDefinition];
  }

  if (nextAutotiles !== autotiles) {
    tilesetsAdapter.updateOne(state.tilesets, {
      id: tileset.id,
      changes: { autotiles: nextAutotiles },
    });
  }
};

const tilesetsReducers = {
  loadTileset,
  setTilesetSymbol,
  paintTilesetColor,
  paintTilesetCollision,
  toggleTilesetAutotileGroup,
} satisfies SliceCaseReducers<EntitiesState>;

export default tilesetsReducers;
