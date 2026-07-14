import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import l10n from "shared/lib/lang/l10n";
import { v4 as uuid } from "uuid";
import {
  EntitiesState,
  SpriteSheetNormalized,
  MetaspriteNormalized,
  SpriteAnimationNormalized,
  SpriteStateNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  updateEntitySymbol,
  getMetaspriteTilesForSpriteSheet,
  normalizeSprite,
  upsertAssetEntity,
  ensureSymbolsUnique,
} from "shared/lib/entities/entitiesHelpers";
import {
  MetaspriteTile,
  ObjPalette,
  SpriteResourceAsset,
} from "shared/lib/resources/types";
import {
  insertAfterElement,
  moveArrayElement,
  moveArrayElements,
  sortSubsetStringArray,
} from "shared/lib/helpers/array";
import {
  spriteSheetsAdapter,
  metaspritesAdapter,
  metaspriteTilesAdapter,
  spriteAnimationsAdapter,
  spriteStatesAdapter,
} from "store/features/entities/adapters";
import {
  localSpriteSheetSelectAll,
  localSpriteSheetSelectById,
} from "store/features/entities/helpers";

const loadSprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: SpriteResourceAsset;
  }>
> = (state, action) => {
  const normalizedSpriteData = normalizeSprite(action.payload.data);
  const normalizedSprite =
    normalizedSpriteData.entities.spriteSheets[normalizedSpriteData.result];

  const didInsert = upsertAssetEntity(
    state.spriteSheets,
    spriteSheetsAdapter,
    normalizedSprite,
    [
      "id",
      "symbol",
      "states",
      "canvasOriginX",
      "canvasOriginY",
      "canvasWidth",
      "canvasHeight",
      "boundsX",
      "boundsY",
      "boundsWidth",
      "boundsHeight",
      "animSpeed",
      "numTiles",
    ],
  );

  if (didInsert) {
    // If inserted also insert metasprite + animation data
    metaspriteTilesAdapter.addMany(
      state.metaspriteTiles,
      normalizedSpriteData.entities.metaspriteTiles ?? {},
    );
    metaspritesAdapter.addMany(
      state.metasprites,
      normalizedSpriteData.entities.metasprites ?? {},
    );
    spriteAnimationsAdapter.addMany(
      state.spriteAnimations,
      normalizedSpriteData.entities.spriteAnimations ?? {},
    );
    spriteStatesAdapter.addMany(
      state.spriteStates,
      normalizedSpriteData.entities.spriteStates ?? {},
    );
  }

  fixAllSpritesWithMissingStates(state);
  ensureSymbolsUnique(state);
};

export const loadDetectedSprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteAnimations: SpriteAnimationNormalized[];
    spriteStates: SpriteStateNormalized[];
    metasprites: MetaspriteNormalized[];
    metaspriteTiles: MetaspriteTile[];
    state: SpriteStateNormalized;
    changes: Partial<SpriteSheetNormalized>;
  }>
> = (state, action) => {
  const spriteSheet = localSpriteSheetSelectById(
    state,
    action.payload.spriteSheetId,
  );

  if (!spriteSheet) {
    return;
  }

  metaspriteTilesAdapter.addMany(
    state.metaspriteTiles,
    action.payload.metaspriteTiles,
  );

  metaspritesAdapter.addMany(state.metasprites, action.payload.metasprites);

  spriteAnimationsAdapter.addMany(
    state.spriteAnimations,
    action.payload.spriteAnimations,
  );

  spriteStatesAdapter.upsertOne(state.spriteStates, action.payload.state);

  const numStates = spriteSheet.states?.length || 0;

  spriteSheetsAdapter.updateOne(state.spriteSheets, {
    id: action.payload.spriteSheetId,
    changes: {
      ...action.payload.changes,
      states: numStates === 0 ? [action.payload.state.id] : spriteSheet.states,
    },
  });
};

const createDefaultSpriteStateData = (): {
  metasprites: MetaspriteNormalized[];
  animations: SpriteAnimationNormalized[];
  spriteState: SpriteStateNormalized;
} => {
  const metasprites: MetaspriteNormalized[] = Array.from(Array(8)).map(() => ({
    id: uuid(),
    tiles: [],
  }));

  const animations: SpriteAnimationNormalized[] = metasprites.map(
    (metasprite) => ({
      id: uuid(),
      frames: [metasprite.id],
    }),
  );

  const spriteState: SpriteStateNormalized = {
    id: uuid(),
    name: "",
    animationType: "multi_movement",
    flipLeft: true,
    animations: animations.map((animation) => animation.id),
  };

  return {
    metasprites,
    animations,
    spriteState,
  };
};

export const fixAllSpritesWithMissingStates = (state: EntitiesState) => {
  const sprites = localSpriteSheetSelectAll(state);

  for (const sprite of sprites) {
    const validStateIds = (sprite.states ?? []).filter((spriteStateId) => {
      return !!state.spriteStates.entities[spriteStateId];
    });

    if (validStateIds.length > 0) {
      if (validStateIds.length !== sprite.states?.length) {
        spriteSheetsAdapter.updateOne(state.spriteSheets, {
          id: sprite.id,
          changes: {
            states: validStateIds,
          },
        });
      }

      continue;
    }

    const { metasprites, animations, spriteState } =
      createDefaultSpriteStateData();

    metaspritesAdapter.addMany(state.metasprites, metasprites);
    spriteAnimationsAdapter.addMany(state.spriteAnimations, animations);
    spriteStatesAdapter.addOne(state.spriteStates, spriteState);

    spriteSheetsAdapter.updateOne(state.spriteSheets, {
      id: sprite.id,
      changes: {
        states: [spriteState.id],
      },
    });
  }
};

const editSpriteSheet: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    changes: Partial<SpriteSheetNormalized>;
  }>
> = (state, action) => {
  const spriteSheet = state.spriteSheets.entities[action.payload.spriteSheetId];
  const patch = { ...action.payload.changes };

  if (!spriteSheet) {
    return;
  }

  spriteSheetsAdapter.updateOne(state.spriteSheets, {
    id: action.payload.spriteSheetId,
    changes: patch,
  });
};

const setSpriteSheetSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ spriteSheetId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.spriteSheets,
    spriteSheetsAdapter,
    action.payload.spriteSheetId,
    action.payload.symbol,
  );
};

/**************************************************************************
 * Metasprites
 */

const addMetasprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    metaspriteId: string;
    spriteAnimationId: string;
    afterMetaspriteId: string;
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];

  if (!spriteAnimation) {
    return;
  }

  const newMetasprite: MetaspriteNormalized = {
    id: action.payload.metaspriteId,
    tiles: [],
  };

  spriteAnimation.frames = insertAfterElement(
    spriteAnimation.frames,
    newMetasprite.id,
    action.payload.afterMetaspriteId,
  );

  metaspritesAdapter.addOne(state.metasprites, newMetasprite);
};

const cloneMetasprites: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteAnimationId: string;
    metaspriteIds: string[];
    newMetaspriteIds: string[];
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];

  if (!spriteAnimation) {
    return;
  }

  const sortedMetaspriteIds = sortSubsetStringArray(
    action.payload.metaspriteIds,
    spriteAnimation.frames,
  );

  if (sortedMetaspriteIds.length > action.payload.newMetaspriteIds.length) {
    return;
  }

  for (let i = 0; i < sortedMetaspriteIds.length; i++) {
    const fromMetaspriteId = sortedMetaspriteIds[i];
    const toMetaspriteId = action.payload.newMetaspriteIds[i];

    const metasprite = state.metasprites.entities[fromMetaspriteId];

    if (!spriteAnimation || !metasprite) {
      continue;
    }

    const metaspriteTiles = metasprite.tiles
      .map((id) => state.metaspriteTiles.entities[id])
      .filter((i) => i) as MetaspriteTile[];

    const newMetaspriteTiles = metaspriteTiles.map((tile) => ({
      ...tile,
      id: uuid(),
    }));

    const newMetasprite = {
      ...metasprite,
      id: toMetaspriteId,
      tiles: newMetaspriteTiles.map((tile) => tile.id),
    };

    const insertAfterId =
      i === 0
        ? sortedMetaspriteIds[sortedMetaspriteIds.length - 1]
        : action.payload.newMetaspriteIds[i - 1];

    spriteAnimation.frames = insertAfterElement(
      spriteAnimation.frames,
      newMetasprite.id,
      insertAfterId,
    );

    metaspritesAdapter.addOne(state.metasprites, newMetasprite);
    metaspriteTilesAdapter.addMany(state.metaspriteTiles, newMetaspriteTiles);
  }
};

const removeMetasprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    metaspriteId: string;
    spriteAnimationId: string;
    spriteSheetId: string;
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];

  if (!spriteAnimation || spriteAnimation.frames.length <= 1) {
    // Remove tiles if only frame in animation
    metaspritesAdapter.updateOne(state.metasprites, {
      id: action.payload.metaspriteId,
      changes: {
        tiles: [],
      },
    });
    return;
  }

  spriteAnimation.frames = spriteAnimation.frames.filter(
    (frameId) => frameId !== action.payload.metaspriteId,
  );

  metaspritesAdapter.removeOne(state.metasprites, action.payload.metaspriteId);
};

const removeMetasprites: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteAnimationId: string;
    metaspriteIds: string[];
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];

  if (!spriteAnimation) {
    return;
  }

  const newFrames = spriteAnimation.frames.filter(
    (frameId) => !action.payload.metaspriteIds.includes(frameId),
  );

  if (newFrames.length > 0) {
    spriteAnimation.frames = newFrames;
    metaspritesAdapter.removeMany(
      state.metasprites,
      action.payload.metaspriteIds,
    );
  } else if (newFrames.length === 0 && spriteAnimation.frames[0]) {
    // if frames list would be empty keep first frame but clear tiles
    const keepId = spriteAnimation.frames[0];
    spriteAnimation.frames = [keepId];
    metaspritesAdapter.updateOne(state.metasprites, {
      id: keepId,
      changes: {
        tiles: [],
      },
    });
    metaspritesAdapter.removeMany(
      state.metasprites,
      action.payload.metaspriteIds.filter((id) => id !== keepId),
    );
  }
};

/**************************************************************************
 * Metasprite Tiles
 */

const addMetaspriteTile: CaseReducer<
  EntitiesState,
  PayloadAction<{
    metaspriteTileId: string;
    metaspriteId: string;
    x: number;
    y: number;
    sliceX: number;
    sliceY: number;
    flipX: boolean;
    flipY: boolean;
    objPalette: ObjPalette;
    paletteIndex: number;
    priority: boolean;
  }>
> = (state, action) => {
  const metasprite = state.metasprites.entities[action.payload.metaspriteId];

  if (!metasprite) {
    return;
  }

  const newMetaspriteTile: MetaspriteTile = {
    id: action.payload.metaspriteTileId,
    x: action.payload.x,
    y: action.payload.y,
    sliceX: action.payload.sliceX,
    sliceY: action.payload.sliceY,
    palette: 0,
    flipX: action.payload.flipX,
    flipY: action.payload.flipY,
    objPalette: action.payload.objPalette,
    paletteIndex: action.payload.paletteIndex,
    priority: action.payload.priority,
  };

  // Add to metasprite
  metasprite.tiles = ([] as string[]).concat(
    metasprite.tiles,
    newMetaspriteTile.id,
  );
  metaspriteTilesAdapter.addOne(state.metaspriteTiles, newMetaspriteTile);
};

const moveMetaspriteTiles: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    metaspriteTiles: {
      metaspriteTileId: string;
      x: number;
      y: number;
    }[];
  }>
> = (state, action) => {
  action.payload.metaspriteTiles.forEach(({ metaspriteTileId, x, y }) => {
    const tile = state.metaspriteTiles.entities[metaspriteTileId];
    if (tile) {
      tile.x = x;
      tile.y = y;
    }
  });
};

const moveMetaspriteTilesRelative: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    metaspriteTileIds: string[];
    x: number;
    y: number;
  }>
> = (state, action) => {
  const metaspriteTiles = action.payload.metaspriteTileIds
    .map((id) => state.metaspriteTiles.entities[id])
    .filter((i) => i);

  metaspriteTiles.forEach((tile) => {
    if (tile) {
      tile.x += action.payload.x;
      tile.y += action.payload.y;
    }
  });
};

const flipXMetaspriteTiles: CaseReducer<
  EntitiesState,
  PayloadAction<{ spriteSheetId: string; metaspriteTileIds: string[] }>
> = (state, action) => {
  const metaspriteTiles = action.payload.metaspriteTileIds
    .map((id) => state.metaspriteTiles.entities[id])
    .filter((i) => i);

  const leftEdge = metaspriteTiles.reduce((memo, tile) => {
    if (tile && tile.x < memo) {
      return tile.x;
    }
    return memo;
  }, Infinity);

  const rightEdge =
    metaspriteTiles.reduce((memo, tile) => {
      if (tile && tile.x > memo) {
        return tile.x;
      }
      return memo;
    }, -Infinity) + 8;

  const mirrorX = leftEdge + (rightEdge - leftEdge) / 2;

  metaspriteTiles.forEach((tile) => {
    if (tile) {
      tile.flipX = !tile.flipX;
      const middleX = tile.x + 4;
      const flippedMiddleX = mirrorX + (mirrorX - middleX);
      tile.x = flippedMiddleX - 4;
    }
  });
};

const flipYMetaspriteTiles: CaseReducer<
  EntitiesState,
  PayloadAction<{ spriteSheetId: string; metaspriteTileIds: string[] }>
> = (state, action) => {
  const metaspriteTiles = action.payload.metaspriteTileIds
    .map((id) => state.metaspriteTiles.entities[id])
    .filter((i) => i);

  const bottomEdge = metaspriteTiles.reduce((memo, tile) => {
    if (tile && tile.y < memo) {
      return tile.y;
    }
    return memo;
  }, Infinity);

  const topEdge =
    metaspriteTiles.reduce((memo, tile) => {
      if (tile && tile.y > memo) {
        return tile.y;
      }
      return memo;
    }, -Infinity) + 16;

  const mirrorY = bottomEdge + (topEdge - bottomEdge) / 2;

  metaspriteTiles.forEach((tile) => {
    if (tile) {
      tile.flipY = !tile.flipY;
      const middleY = tile.y + 8;
      const flippedMiddleY = mirrorY + (mirrorY - middleY);
      tile.y = flippedMiddleY - 8;
    }
  });
};

const editMetaspriteTile: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    metaspriteTileId: string;
    changes: Partial<MetaspriteTile>;
  }>
> = (state, action) => {
  const metaspriteTile =
    state.metaspriteTiles.entities[action.payload.metaspriteTileId];
  const patch = { ...action.payload.changes };

  if (!metaspriteTile) {
    return;
  }

  metaspriteTilesAdapter.updateOne(state.metaspriteTiles, {
    id: action.payload.metaspriteTileId,
    changes: patch,
  });
};

const editMetaspriteTiles: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    metaspriteTileIds: string[];
    changes: Partial<MetaspriteTile>;
  }>
> = (state, action) => {
  metaspriteTilesAdapter.updateMany(
    state.metaspriteTiles,
    action.payload.metaspriteTileIds.map((id) => ({
      id,
      changes: action.payload.changes,
    })),
  );
};

const sendMetaspriteTilesToFront: CaseReducer<
  EntitiesState,
  PayloadAction<{
    metaspriteId: string;
    metaspriteTileIds: string[];
    spriteSheetId: string;
  }>
> = (state, action) => {
  const metasprite = state.metasprites.entities[action.payload.metaspriteId];

  if (!metasprite) {
    return;
  }

  const newTiles = ([] as string[]).concat(
    metasprite.tiles.filter(
      (tileId) => !action.payload.metaspriteTileIds.includes(tileId),
    ),
    action.payload.metaspriteTileIds,
  );

  metaspritesAdapter.updateOne(state.metasprites, {
    id: action.payload.metaspriteId,
    changes: {
      tiles: newTiles,
    },
  });
};

const sendMetaspriteTilesToBack: CaseReducer<
  EntitiesState,
  PayloadAction<{
    metaspriteId: string;
    metaspriteTileIds: string[];
    spriteSheetId: string;
  }>
> = (state, action) => {
  const metasprite = state.metasprites.entities[action.payload.metaspriteId];

  if (!metasprite) {
    return;
  }

  const newTiles = ([] as string[]).concat(
    action.payload.metaspriteTileIds,
    metasprite.tiles.filter(
      (tileId) => !action.payload.metaspriteTileIds.includes(tileId),
    ),
  );

  metaspritesAdapter.updateOne(state.metasprites, {
    id: action.payload.metaspriteId,
    changes: {
      tiles: newTiles,
    },
  });
};

const replaceMetaspriteTilesPalettes: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    fromIndex: number;
    toIndex: number;
  }>
> = (state, action) => {
  const spriteTiles = getMetaspriteTilesForSpriteSheet(
    state,
    action.payload.spriteSheetId,
  );
  metaspriteTilesAdapter.updateMany(
    state.metaspriteTiles,
    spriteTiles
      .filter((tile) => tile.paletteIndex === action.payload.fromIndex)
      .map((tile) => ({
        id: tile.id,
        changes: {
          paletteIndex: action.payload.toIndex,
        },
      })),
  );
};

const replaceMetaspriteTilesObjPalettes: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    fromPalette: ObjPalette;
    toPalette: ObjPalette;
  }>
> = (state, action) => {
  const spriteTiles = getMetaspriteTilesForSpriteSheet(
    state,
    action.payload.spriteSheetId,
  );
  metaspriteTilesAdapter.updateMany(
    state.metaspriteTiles,
    spriteTiles
      .filter((tile) => tile.objPalette === action.payload.fromPalette)
      .map((tile) => ({
        id: tile.id,
        changes: {
          objPalette: action.payload.toPalette,
        },
      })),
  );
};

const removeMetaspriteTiles: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    metaspriteTileIds: string[];
    metaspriteId: string;
  }>
> = (state, action) => {
  const metasprite = state.metasprites.entities[action.payload.metaspriteId];

  if (!metasprite) {
    return;
  }

  metasprite.tiles = metasprite.tiles.filter(
    (tileId) => !action.payload.metaspriteTileIds.includes(tileId),
  );

  metaspriteTilesAdapter.removeMany(
    state.metaspriteTiles,
    action.payload.metaspriteTileIds,
  );
};

const removeMetaspriteTilesOutsideCanvas: CaseReducer<
  EntitiesState,
  PayloadAction<{
    metaspriteId: string;
    spriteSheetId: string;
  }>
> = (state, action) => {
  const spriteSheet = state.spriteSheets.entities[action.payload.spriteSheetId];
  const metasprite = state.metasprites.entities[action.payload.metaspriteId];

  if (!spriteSheet || !metasprite) {
    return;
  }

  const minX = -spriteSheet.canvasWidth / 2;
  const maxX = spriteSheet.canvasWidth / 2 + 8;
  const minY = -16;
  const maxY = spriteSheet.canvasHeight;

  const removeMetaspriteTiles = (
    metasprite.tiles
      .map((id) => state.metaspriteTiles.entities[id])
      .filter((i) => !!i) as MetaspriteTile[]
  )
    .filter(
      (tile) =>
        tile.x <= minX || tile.x >= maxX || tile.y <= minY || tile.y >= maxY,
    )
    .map((tile) => tile.id);

  metasprite.tiles = metasprite.tiles.filter(
    (tileId) => !removeMetaspriteTiles.includes(tileId),
  );

  metaspriteTilesAdapter.removeMany(
    state.metaspriteTiles,
    removeMetaspriteTiles,
  );
};

/**************************************************************************
 * Sprite Animations
 */

const editSpriteAnimation: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteAnimationId: string;
    changes: Partial<SpriteAnimationNormalized>;
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];
  const patch = { ...action.payload.changes };

  if (!spriteAnimation) {
    return;
  }

  spriteAnimationsAdapter.updateOne(state.spriteAnimations, {
    id: action.payload.spriteAnimationId,
    changes: patch,
  });
};

const moveSpriteAnimationFrame: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteAnimationId: string;
    fromIndex: number;
    toIndex: number;
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];

  if (!spriteAnimation) {
    return;
  }

  const newFrames = moveArrayElement(
    action.payload.fromIndex,
    action.payload.toIndex,
    spriteAnimation.frames,
  );

  spriteAnimationsAdapter.updateOne(state.spriteAnimations, {
    id: action.payload.spriteAnimationId,
    changes: {
      frames: newFrames,
    },
  });
};

const moveSpriteAnimationFrames: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteAnimationId: string;
    fromIndexes: number[];
    toIndex: number;
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];

  if (!spriteAnimation) {
    return;
  }

  const newFrames = moveArrayElements(
    action.payload.fromIndexes,
    action.payload.toIndex,
    spriteAnimation.frames,
  );

  spriteAnimationsAdapter.updateOne(state.spriteAnimations, {
    id: action.payload.spriteAnimationId,
    changes: {
      frames: newFrames,
    },
  });
};

/**************************************************************************
 * Sprite State
 */

const addSpriteState: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteStateId: string;
  }>
> = (state, action) => {
  const sprite = state.spriteSheets.entities[action.payload.spriteSheetId];

  if (!sprite) {
    return;
  }

  const eightElements = Array.from(Array(8));

  const newMetasprites: MetaspriteNormalized[] = eightElements.map(() => ({
    id: uuid(),
    tiles: [],
  }));

  metaspritesAdapter.addMany(state.metasprites, newMetasprites);

  const newAnimations: SpriteAnimationNormalized[] = eightElements.map(
    (_, index) => ({
      id: uuid(),
      frames: [newMetasprites[index].id],
    }),
  );

  spriteAnimationsAdapter.addMany(state.spriteAnimations, newAnimations);

  const newSpriteState: SpriteStateNormalized = {
    id: action.payload.spriteStateId,
    name: sprite.states.length > 0 ? l10n("FIELD_STATE_NEW_STATE_NAME") : "",
    animations: newAnimations.map((anim) => anim.id),
    animationType: "fixed",
    flipLeft: true,
  };

  // Add to sprite
  sprite.states = ([] as string[]).concat(sprite.states, newSpriteState.id);
  spriteStatesAdapter.addOne(state.spriteStates, newSpriteState);
};

const editSpriteState: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteStateId: string;
    changes: Partial<SpriteStateNormalized>;
  }>
> = (state, action) => {
  const spriteState = state.spriteStates.entities[action.payload.spriteStateId];

  const patch = { ...action.payload.changes };

  if (!spriteState) {
    return;
  }

  spriteStatesAdapter.updateOne(state.spriteStates, {
    id: action.payload.spriteStateId,
    changes: patch,
  });
};

const removeSpriteState: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteStateId: string;
  }>
> = (state, action) => {
  const spriteSheet = localSpriteSheetSelectById(
    state,
    action.payload.spriteSheetId,
  );
  if (!spriteSheet) {
    return;
  }

  // Remove from sprite
  spriteSheetsAdapter.updateOne(state.spriteSheets, {
    id: action.payload.spriteSheetId,
    changes: {
      states: spriteSheet.states.filter((spriteStateId) => {
        return spriteStateId !== action.payload.spriteStateId;
      }),
    },
  });

  spriteStatesAdapter.removeOne(
    state.spriteStates,
    action.payload.spriteStateId,
  );
};

const spritesReducers = {
  /**************************************************************************
   * Sprites
   */

  loadSprite,
  editSpriteSheet,
  setSpriteSheetSymbol,

  /**************************************************************************
   * Metasprites
   */

  addMetasprite: {
    reducer: addMetasprite,
    prepare: (payload: {
      spriteAnimationId: string;
      spriteSheetId: string;
      afterMetaspriteId: string;
    }) => {
      return {
        payload: {
          ...payload,
          metaspriteId: uuid(),
        },
      };
    },
  },

  cloneMetasprites: {
    reducer: cloneMetasprites,
    prepare: (payload: {
      spriteSheetId: string;
      spriteAnimationId: string;
      metaspriteIds: string[];
    }) => {
      return {
        payload: {
          ...payload,
          newMetaspriteIds: payload.metaspriteIds.map(() => uuid()),
        },
      };
    },
  },

  sendMetaspriteTilesToFront,
  sendMetaspriteTilesToBack,
  removeMetasprite,
  removeMetasprites,

  /**************************************************************************
   * Metasprite Tiles
   */

  addMetaspriteTile: {
    reducer: addMetaspriteTile,
    prepare: (payload: {
      spriteSheetId: string;
      metaspriteId: string;
      x: number;
      y: number;
      sliceX: number;
      sliceY: number;
      flipX: boolean;
      flipY: boolean;
      objPalette: ObjPalette;
      paletteIndex: number;
      priority: boolean;
    }) => {
      return {
        payload: {
          ...payload,
          metaspriteTileId: uuid(),
        },
      };
    },
  },

  moveMetaspriteTiles,
  moveMetaspriteTilesRelative,
  flipXMetaspriteTiles,
  flipYMetaspriteTiles,
  editMetaspriteTile,
  editMetaspriteTiles,
  replaceMetaspriteTilesPalettes,
  replaceMetaspriteTilesObjPalettes,
  removeMetaspriteTiles,
  removeMetaspriteTilesOutsideCanvas,

  /**************************************************************************
   * Sprite Animations
   */

  editSpriteAnimation,
  moveSpriteAnimationFrame,
  moveSpriteAnimationFrames,

  /**************************************************************************
   * Sprite States
   */

  addSpriteState: {
    reducer: addSpriteState,
    prepare: (payload: { spriteSheetId: string }) => {
      return {
        payload: {
          ...payload,
          spriteStateId: uuid(),
        },
      };
    },
  },

  editSpriteState,
  removeSpriteState,
} satisfies SliceCaseReducers<EntitiesState>;

export default spritesReducers;
