import clamp from "shared/lib/helpers/clamp";
import {
  buildSceneTilesetLookup,
  clearTilemapLayerSelection,
  decodeSceneTileRef,
  encodeSceneTileRef,
  getTilemapLayersTileColors,
  isTilemapLayerCellTopmost,
  moveTilemapLayerSelection,
  normalizeTilemapLayersSize,
  resolveSceneAutotiles,
  resolveSceneAutotilesForCells,
  sceneStampLinePositions,
} from "shared/lib/tiles/sceneTilemapData";
import { moveArrayElement } from "shared/lib/helpers/array";
import { ResizeTilemapLayersPayload } from "store/features/entities/entitiesActionMatchers";
import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
  original,
} from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";
import {
  EntitiesState,
  SceneNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  genEntitySymbol,
  updateEntitySymbol,
  defaultLocalisedSceneName,
  applyReparentEntityToCollection,
} from "shared/lib/entities/entitiesHelpers";
import {
  AutotileDefinition,
  Palette,
  TilesetSnapshot,
  Variable,
} from "shared/lib/resources/types";
import {
  actorsAdapter,
  triggersAdapter,
  scenesAdapter,
  backgroundsAdapter,
  palettesAdapter,
} from "store/features/entities/adapters";
import {
  localSceneSelectAll,
  localSceneSelectTotal,
  localBackgroundSelectAll,
  localActorSelectEntities,
  localTriggerSelectEntities,
  localSceneSelectById,
  localBackgroundSelectById,
  localTilesetSelectById,
  localScriptEventSelectAll,
} from "store/features/entities/helpers";
import { Brush, SlopeIncline } from "store/features/editor/editorState";
import {
  COLLISION_BOTTOM,
  COLLISION_TOP,
  COLLISION_RIGHT,
  COLLISION_LEFT,
  COLLISION_SLOPE_45_LEFT,
  COLLISION_SLOPE_45_RIGHT,
  COLLISION_SLOPE_22_LEFT_TOP,
  COLLISION_SLOPE_22_LEFT_BOT,
  COLLISION_SLOPE_22_RIGHT_TOP,
  COLLISION_SLOPE_22_RIGHT_BOT,
  COLLISION_ALL,
  TILE_COLOR_PROPS,
  TILE_COLOR_PALETTE,
  MIN_WORLD_ENTITY_X,
  MIN_WORLD_ENTITY_Y,
  TILE_SIZE,
  EVENT_SWITCH_SCENE,
  TILE_DEFAULT_UNSET,
} from "consts";
import {
  paintMagic,
  paintLine,
  paint,
  floodFill,
} from "shared/lib/helpers/paint";
import {
  clearGridSelection,
  clearGridSelectionMasked,
  moveGridSelection,
  moveGridSelectionMasked,
  pasteGridSelection,
  normalizeGridSize,
  resizeGridWithOffset,
} from "shared/lib/tiles/grid";
import type { GridOffset, GridSelection } from "shared/lib/tiles/grid";
import { isScriptValue } from "shared/lib/scriptValue/types";

const MIN_SCENE_WIDTH = 20;
const MIN_SCENE_HEIGHT = 18;

const addScene: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    x: number;
    y: number;
    defaults?: Partial<SceneNormalized>;
    variables?: Variable[];
    tilemap?: boolean;
  }>
> = (state, action) => {
  const scenesTotal = localSceneSelectTotal(state);
  const backgrounds = localBackgroundSelectAll(state);
  const background = backgrounds.find((bg) => !bg.name.endsWith(".mono"));
  const backgroundId = background ? background.id : "";

  const newScene: SceneNormalized = {
    name: defaultLocalisedSceneName(scenesTotal),
    backgroundId,
    tilesetId: "",
    width: Math.max(MIN_SCENE_WIDTH, background?.width || 0),
    height: Math.max(MIN_SCENE_HEIGHT, background?.height || 0),
    type: "TOPDOWN",
    colorModeOverride: "none",
    paletteIds: [],
    spritePaletteIds: [],
    collisions: [],
    autoFadeSpeed: 1,
    ...(action.payload.defaults || {}),
    id: action.payload.sceneId,
    symbol: genEntitySymbol(state, `scene_${scenesTotal + 1}`),
    x: Math.max(MIN_WORLD_ENTITY_X, action.payload.x),
    y: Math.max(MIN_WORLD_ENTITY_Y, action.payload.y),
    actors: [],
    triggers: [],
    script: [],
    playerHit1Script: [],
    playerHit2Script: [],
    playerHit3Script: [],
  };

  if (action.payload.tilemap) {
    newScene.tilemap = {
      tilesets: [],
      tileColors: new Array(newScene.width * newScene.height).fill(0),
      layers: [
        {
          id: uuid(),
          name: "Layer 1",
          visible: true,
          tiles: new Array(newScene.width * newScene.height).fill(0),
        },
      ],
    };
  }

  scenesAdapter.addOne(state.scenes, newScene);
};

const editScene: CaseReducer<
  EntitiesState,
  PayloadAction<{ sceneId: string; changes: Partial<SceneNormalized> }>
> = (state, action) => {
  const scene = state.scenes.entities[action.payload.sceneId];
  const patch = { ...action.payload.changes };

  if (!scene) {
    return;
  }

  if (patch.backgroundId) {
    const otherScene = localSceneSelectAll(state).find((s) => {
      return s.backgroundId === patch.backgroundId;
    });

    const actors = localActorSelectEntities(state);
    const triggers = localTriggerSelectEntities(state);

    const oldBackground =
      scene && state.backgrounds.entities[scene.backgroundId];
    const background = state.backgrounds.entities[patch.backgroundId];

    if (background) {
      if (otherScene) {
        patch.collisions = otherScene.collisions;
      } else if (
        oldBackground &&
        background &&
        oldBackground.width === background.width
      ) {
        const collisionsSize = Math.ceil(background.width * background.height);
        patch.collisions = scene.collisions.slice(0, collisionsSize);
      } else if (background) {
        const collisionsSize = Math.ceil(background.width * background.height);
        patch.collisions = [];
        for (let i = 0; i < collisionsSize; i++) {
          patch.collisions[i] = 0;
        }
      }

      patch.width = background.width;
      patch.height = background.height;

      scene.actors.forEach((actorId) => {
        const actor = actors[actorId];
        if (actor) {
          const x = Math.min(actor.x, background.width - 2);
          const y = Math.min(actor.y, background.height - 1);
          if (actor.x !== x || actor.y !== y) {
            actorsAdapter.updateOne(state.actors, {
              id: actor.id,
              changes: { x, y },
            });
          }
        }
      });

      scene.triggers.forEach((triggerId) => {
        const trigger = triggers[triggerId];
        if (trigger) {
          const x = Math.min(trigger.x, background.width - 1);
          const y = Math.min(trigger.y, background.height - 1);
          const width = Math.min(trigger.width, background.width - x);
          const height = Math.min(trigger.height, background.height - y);
          if (
            trigger.x !== x ||
            trigger.y !== y ||
            trigger.width !== width ||
            trigger.height !== height
          ) {
            triggersAdapter.updateOne(state.triggers, {
              id: trigger.id,
              changes: { x, y, width, height },
            });
          }
        }
      });
    }
  }

  scenesAdapter.updateOne(state.scenes, {
    id: action.payload.sceneId,
    changes: patch,
  });
};

const setTilemapLayersEnabled: CaseReducer<
  EntitiesState,
  PayloadAction<{ sceneId: string; enabled: boolean; tilesetId?: string }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const width = scene.width;
  const height = scene.height;
  const initialTileset = action.payload.tilesetId
    ? localTilesetSelectById(state, action.payload.tilesetId)
    : undefined;
  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      width,
      height,
      tilemap: action.payload.enabled
        ? (scene.tilemap ?? {
            tilesets: initialTileset
              ? [
                  {
                    id: initialTileset.id,
                    width: initialTileset.width,
                    height: initialTileset.height,
                  },
                ]
              : [],
            tileColors: new Array(width * height).fill(0),
            layers: [
              {
                id: uuid(),
                name: "Layer 1",
                visible: true,
                tiles: new Array(width * height).fill(0),
              },
            ],
          })
        : undefined,
    },
  });
};

const resizeTilemapLayers: CaseReducer<
  EntitiesState,
  PayloadAction<ResizeTilemapLayersPayload>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene?.tilemap) {
    return;
  }

  const resizeAxis = action.payload.resizeAxis;

  const { width, height } = normalizeTilemapLayersSize({
    width: action.payload.width,
    height: action.payload.height,
    resizeAxis,
  });

  const shiftX = action.payload.shiftX ?? 0;
  const shiftY = action.payload.shiftY ?? 0;
  const x = scene.x - shiftX * TILE_SIZE;
  const y = scene.y - shiftY * TILE_SIZE;

  const resizeAndShift = (values: readonly number[]) =>
    resizeGridWithOffset(
      values,
      scene.width,
      scene.height,
      width,
      height,
      shiftX,
      shiftY,
      0,
    );

  const actors = localActorSelectEntities(state);
  const triggers = localTriggerSelectEntities(state);
  const scriptEvents = localScriptEventSelectAll(state);

  // Shift scene actors
  scene.actors.forEach((actorId) => {
    const actor = actors[actorId];
    if (actor) {
      actorsAdapter.updateOne(state.actors, {
        id: actorId,
        changes: {
          x: clamp(actor.x + shiftX, 0, width - 2),
          y: clamp(actor.y + shiftY, 0, height - 1),
        },
      });
    }
  });

  // Shift scene triggers
  scene.triggers.forEach((triggerId) => {
    const trigger = triggers[triggerId];
    if (trigger) {
      const triggerX = clamp(trigger.x + shiftX, 0, width - 1);
      const triggerY = clamp(trigger.y + shiftY, 0, height - 1);
      triggersAdapter.updateOne(state.triggers, {
        id: triggerId,
        changes: {
          x: triggerX,
          y: triggerY,
          width: Math.min(trigger.width, width - triggerX),
          height: Math.min(trigger.height, height - triggerY),
        },
      });
    }
  });

  // Shift scene switch events referencing the scene
  scriptEvents.forEach((scriptEvent) => {
    if (
      scriptEvent.command !== EVENT_SWITCH_SCENE ||
      !scriptEvent.args ||
      scriptEvent.args.sceneId !== scene.id
    ) {
      return;
    }

    if (
      scriptEvent.args.x &&
      isScriptValue(scriptEvent.args.x) &&
      scriptEvent.args.x.type === "number"
    ) {
      scriptEvent.args.x.value = clamp(
        scriptEvent.args.x.value + shiftX,
        0,
        width - 1,
      );
    }

    if (
      scriptEvent.args.y &&
      isScriptValue(scriptEvent.args.y) &&
      scriptEvent.args.y.type === "number"
    ) {
      scriptEvent.args.y.value = clamp(
        scriptEvent.args.y.value + shiftY,
        0,
        height - 1,
      );
    }
  });

  const sceneTilemap = scene.tilemap;
  const resizedTilemap = {
    ...sceneTilemap,
    tileColors: resizeAndShift(sceneTilemap.tileColors ?? []),
    layers: sceneTilemap.layers.map((layer) => {
      const autotiles = layer.autotiles
        ? resizeAndShift(layer.autotiles)
        : undefined;
      const tiles = resizeAndShift(layer.tiles);
      const resolvedAutotiles = autotiles
        ? resolveSceneAutotiles(autotiles, width, height, sceneTilemap)
        : undefined;
      return {
        ...layer,
        tiles: resolvedAutotiles
          ? tiles.map((tile, index) => resolvedAutotiles[index] || tile)
          : tiles,
        autotiles,
      };
    }),
  };

  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      width,
      height,
      x,
      y,
      collisions: resizeAndShift(scene.collisions),
      tilemap: resizedTilemap,
    },
  });
};

const addTilemapLayer: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    layerId: string;
    afterLayerId?: string;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene?.tilemap) {
    return;
  }
  const layerNumber = scene.tilemap.layers.length + 1;
  const selectedLayerIndex = action.payload.afterLayerId
    ? scene.tilemap.layers.findIndex(
        (layer) => layer.id === action.payload.afterLayerId,
      )
    : -1;
  const insertIndex =
    selectedLayerIndex >= 0
      ? selectedLayerIndex + 1
      : scene.tilemap.layers.length;
  const layers = [...scene.tilemap.layers];
  layers.splice(insertIndex, 0, {
    id: action.payload.layerId,
    name: `Layer ${layerNumber}`,
    visible: true,
    tiles: new Array(scene.width * scene.height).fill(0),
  });
  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      tilemap: {
        ...scene.tilemap,
        layers,
      },
    },
  });
};

const editTilemapLayer: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    layerId: string;
    changes: { name?: string; visible?: boolean };
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene?.tilemap) {
    return;
  }
  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      tilemap: {
        ...scene.tilemap,
        layers: scene.tilemap.layers.map((layer) =>
          layer.id === action.payload.layerId
            ? { ...layer, ...action.payload.changes }
            : layer,
        ),
      },
    },
  });
};

const removeTilemapLayer: CaseReducer<
  EntitiesState,
  PayloadAction<{ sceneId: string; layerId: string }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene?.tilemap || scene.tilemap.layers.length <= 1) {
    return;
  }
  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      tilemap: {
        ...scene.tilemap,
        layers: scene.tilemap.layers.filter(
          (layer) => layer.id !== action.payload.layerId,
        ),
      },
    },
  });
};

const moveTilemapLayer: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    layerId: string;
    direction: number | "top" | "bottom";
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene?.tilemap) {
    return;
  }
  const index = scene.tilemap.layers.findIndex(
    (layer) => layer.id === action.payload.layerId,
  );
  const newIndex =
    action.payload.direction === "top"
      ? scene.tilemap.layers.length - 1
      : action.payload.direction === "bottom"
        ? 0
        : index + action.payload.direction;
  if (index < 0 || newIndex < 0 || newIndex >= scene.tilemap.layers.length) {
    return;
  }
  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      tilemap: {
        ...scene.tilemap,
        layers: moveArrayElement(index, newIndex, scene.tilemap.layers),
      },
    },
  });
};

const mergeTilemapLayerDown: CaseReducer<
  EntitiesState,
  PayloadAction<{ sceneId: string; layerId: string }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene?.tilemap) {
    return;
  }

  const tilemap = scene.tilemap;

  const layerIndex = tilemap.layers.findIndex(
    (layer) => layer.id === action.payload.layerId,
  );
  const sourceLayer = scene.tilemap.layers[layerIndex];
  const lowerLayer = scene.tilemap.layers[layerIndex - 1];
  if (!sourceLayer || !lowerLayer) {
    return;
  }

  const size = scene.width * scene.height;
  const tiles = Array.from({ length: size }, (_, index) => {
    return sourceLayer.tiles[index] || lowerLayer.tiles[index] || 0;
  });
  const hasAutotiles = Boolean(sourceLayer.autotiles || lowerLayer.autotiles);
  const autotiles = hasAutotiles
    ? Array.from({ length: size }, (_, index) => {
        return sourceLayer.tiles[index]
          ? (sourceLayer.autotiles?.[index] ?? 0)
          : (lowerLayer.autotiles?.[index] ?? 0);
      })
    : undefined;
  const mergedLayer = {
    ...lowerLayer,
    tiles,
    ...(autotiles ? { autotiles } : {}),
  };
  const layers = [...scene.tilemap.layers];
  layers.splice(layerIndex - 1, 2, mergedLayer);

  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      tilemap: {
        ...scene.tilemap,
        layers,
      },
    },
  });
};

const moveSceneTileSelection: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    layerId: string;
    selection: GridSelection;
    offset: GridOffset;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene?.tilemap) {
    return;
  }

  const tilemap = scene.tilemap;
  const layerIndex = tilemap.layers.findIndex(
    (layer) => layer.id === action.payload.layerId,
  );

  const layer = tilemap.layers[layerIndex];
  if (!layer) {
    return;
  }

  const movedLayer = moveTilemapLayerSelection(
    layer,
    scene.width,
    scene.height,
    action.payload.selection,
    action.payload.offset,
  );

  if (movedLayer.autotiles) {
    const resolvedTiles = resolveSceneAutotiles(
      movedLayer.autotiles,
      scene.width,
      scene.height,
      tilemap,
    );
    movedLayer.tiles = movedLayer.tiles.map(
      (tile, index) => resolvedTiles[index] || tile,
    );
  }

  const layers = [...tilemap.layers];
  layers[layerIndex] = movedLayer;

  const movedTilemap = { ...tilemap, layers };

  const linkedSourceCache = new Map<number, boolean>();
  const shouldMoveLinkedSource = (sourceIndex: number) => {
    const cached = linkedSourceCache.get(sourceIndex);
    if (cached !== undefined) {
      return cached;
    }
    const shouldMove = isTilemapLayerCellTopmost(
      tilemap,
      layerIndex,
      sourceIndex,
    );
    linkedSourceCache.set(sourceIndex, shouldMove);
    return shouldMove;
  };

  const shouldWriteLinkedTarget = (targetIndex: number) =>
    isTilemapLayerCellTopmost(movedTilemap, layerIndex, targetIndex);

  const tileColors = moveGridSelectionMasked(
    getTilemapLayersTileColors(tilemap, scene.width, scene.height),
    scene.width,
    scene.height,
    action.payload.selection,
    action.payload.offset,
    0,
    shouldMoveLinkedSource,
    shouldWriteLinkedTarget,
  );

  const collisions = moveGridSelectionMasked(
    scene.collisions,
    scene.width,
    scene.height,
    action.payload.selection,
    action.payload.offset,
    0,
    shouldMoveLinkedSource,
    shouldWriteLinkedTarget,
  );

  const tilesetLookup = buildSceneTilesetLookup(movedTilemap);
  const defaultsByTileRef = new Map<
    number,
    { color?: number; collision?: number }
  >();
  const getTileDefaults = (tileRef: number) => {
    const cached = defaultsByTileRef.get(tileRef);
    if (cached) {
      return cached;
    }
    const ref = decodeSceneTileRef(tileRef, tilesetLookup);
    const tileset = ref
      ? localTilesetSelectById(state, ref.tilesetId)
      : undefined;
    const defaults = {
      color: ref && tileset ? tileset.tileColors[ref.tileIndex] : undefined,
      collision:
        ref && tileset ? tileset.tileCollisions[ref.tileIndex] : undefined,
    };
    defaultsByTileRef.set(tileRef, defaults);
    return defaults;
  };
  const applyTileDefaults = (cellIndex: number, tileRef: number) => {
    const { color: colorDefault, collision: collisionDefault } =
      getTileDefaults(tileRef);

    if (colorDefault !== undefined && colorDefault !== TILE_DEFAULT_UNSET) {
      tileColors[cellIndex] = colorDefault;
    }
    if (
      collisionDefault !== undefined &&
      collisionDefault !== TILE_DEFAULT_UNSET
    ) {
      collisions[cellIndex] = collisionDefault;
    }
  };
  const selectionXEnd = Math.min(
    scene.width,
    action.payload.selection.x + action.payload.selection.width,
  );
  const selectionYEnd = Math.min(
    scene.height,
    action.payload.selection.y + action.payload.selection.height,
  );

  for (
    let y = Math.max(0, action.payload.selection.y);
    y < selectionYEnd;
    y++
  ) {
    for (
      let x = Math.max(0, action.payload.selection.x);
      x < selectionXEnd;
      x++
    ) {
      const sourceIndex = y * scene.width + x;
      const sourceWasTopmost = shouldMoveLinkedSource(sourceIndex);

      if (sourceWasTopmost && !movedLayer.tiles[sourceIndex]) {
        let revealedTile = 0;
        for (let index = layerIndex - 1; index >= 0; index--) {
          const lowerLayer = layers[index];
          if (lowerLayer?.visible && lowerLayer.tiles[sourceIndex]) {
            revealedTile = lowerLayer.tiles[sourceIndex] ?? 0;
            break;
          }
        }
        if (revealedTile) {
          applyTileDefaults(sourceIndex, revealedTile);
        }
      }

      if (sourceWasTopmost || !layer.tiles[sourceIndex]) {
        continue;
      }

      const targetX = x + action.payload.offset.x;
      const targetY = y + action.payload.offset.y;
      if (
        targetX < 0 ||
        targetX >= scene.width ||
        targetY < 0 ||
        targetY >= scene.height
      ) {
        continue;
      }
      const targetIndex = targetY * scene.width + targetX;
      const movedTile = movedLayer.tiles[targetIndex] ?? 0;
      if (movedTile && shouldWriteLinkedTarget(targetIndex)) {
        applyTileDefaults(targetIndex, movedTile);
      }
    }
  }

  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      collisions,
      tilemap: { ...tilemap, tileColors, layers },
    },
  });
};

const moveSceneCollisionSelection: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    selection: GridSelection;
    offset: GridOffset;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      collisions: moveGridSelection(
        scene.collisions,
        scene.width,
        scene.height,
        action.payload.selection,
        action.payload.offset,
        0,
      ),
    },
  });
};

const moveSceneColorSelection: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    selection: GridSelection;
    offset: GridOffset;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  const background = scene?.backgroundId
    ? localBackgroundSelectById(state, scene.backgroundId)
    : undefined;

  const width = scene?.tilemap ? scene.width : background?.width;
  const height = scene?.tilemap ? scene.height : background?.height;

  if (!width || !height) {
    return;
  }

  if (scene?.tilemap) {
    scenesAdapter.updateOne(state.scenes, {
      id: scene.id,
      changes: {
        tilemap: {
          ...scene.tilemap,
          tileColors: moveGridSelection(
            getTilemapLayersTileColors(scene.tilemap, width, height),
            width,
            height,
            action.payload.selection,
            action.payload.offset,
            0,
          ),
        },
      },
    });
  } else if (background) {
    backgroundsAdapter.updateOne(state.backgrounds, {
      id: background.id,
      changes: {
        tileColors: moveGridSelection(
          background.tileColors,
          width,
          height,
          action.payload.selection,
          action.payload.offset,
          0,
        ),
      },
    });
  }
};

const deleteSceneTileSelection: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    layerId: string;
    selection: GridSelection;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene?.tilemap) {
    return;
  }

  const tilemap = scene.tilemap;

  const layerIndex = tilemap.layers.findIndex(
    (layer) => layer.id === action.payload.layerId,
  );

  const layer = tilemap.layers[layerIndex];
  if (!layer) {
    return;
  }

  const shouldClearLinkedCell = (cellIndex: number) =>
    isTilemapLayerCellTopmost(tilemap, layerIndex, cellIndex);
  const tileColors = clearGridSelectionMasked(
    getTilemapLayersTileColors(tilemap, scene.width, scene.height),
    scene.width,
    scene.height,
    action.payload.selection,
    0,
    shouldClearLinkedCell,
  );
  const collisions = clearGridSelectionMasked(
    scene.collisions,
    scene.width,
    scene.height,
    action.payload.selection,
    0,
    shouldClearLinkedCell,
  );

  const layers = [...tilemap.layers];
  layers[layerIndex] = clearTilemapLayerSelection(
    layer,
    scene.width,
    scene.height,
    action.payload.selection,
  );

  if (layers[layerIndex]?.autotiles) {
    const resolvedTiles = resolveSceneAutotiles(
      layers[layerIndex].autotiles ?? [],
      scene.width,
      scene.height,
      tilemap,
    );
    layers[layerIndex].tiles = layers[layerIndex].tiles.map(
      (tile, index) => resolvedTiles[index] || tile,
    );
  }

  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      collisions,
      tilemap: { ...tilemap, tileColors, layers },
    },
  });
};

const deleteSceneCollisionSelection: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    selection: GridSelection;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      collisions: clearGridSelection(
        scene.collisions,
        scene.width,
        scene.height,
        action.payload.selection,
        0,
      ),
    },
  });
};

const deleteSceneColorSelection: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    selection: GridSelection;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  if (scene.tilemap) {
    scenesAdapter.updateOne(state.scenes, {
      id: scene.id,
      changes: {
        tilemap: {
          ...scene.tilemap,
          tileColors: clearGridSelection(
            getTilemapLayersTileColors(
              scene.tilemap,
              scene.width,
              scene.height,
            ),
            scene.width,
            scene.height,
            action.payload.selection,
            0,
          ),
        },
      },
    });
    return;
  }

  const background = localBackgroundSelectById(state, scene.backgroundId);
  if (!background) {
    return;
  }

  backgroundsAdapter.updateOne(state.backgrounds, {
    id: background.id,
    changes: {
      tileColors: clearGridSelection(
        background.tileColors,
        background.width,
        background.height,
        action.payload.selection,
        0,
      ),
    },
  });
};

const pasteSceneGridSelection: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    layerId?: string;
    mode: "tiles" | "collisions" | "colors";
    x: number;
    y: number;
    width: number;
    height: number;
    values: number[];
    autotiles?: number[];
    tileColors?: number[];
    collisions?: number[];
    linkedCells?: boolean[];
    tilesets?: TilesetSnapshot[];
    autotileDefinitions?: AutotileDefinition[];
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) return;
  const p = action.payload;
  if (p.mode === "collisions") {
    scenesAdapter.updateOne(state.scenes, {
      id: scene.id,
      changes: {
        collisions: pasteGridSelection(
          scene.collisions,
          scene.width,
          scene.height,
          p.x,
          p.y,
          p.width,
          p.height,
          p.values,
          0,
        ),
      },
    });
  } else if (p.mode === "colors") {
    if (scene.tilemap) {
      scenesAdapter.updateOne(state.scenes, {
        id: scene.id,
        changes: {
          tilemap: {
            ...scene.tilemap,
            tileColors: pasteGridSelection(
              getTilemapLayersTileColors(
                scene.tilemap,
                scene.width,
                scene.height,
              ),
              scene.width,
              scene.height,
              p.x,
              p.y,
              p.width,
              p.height,
              p.values,
              0,
            ),
          },
        },
      });
    } else {
      const background = localBackgroundSelectById(state, scene.backgroundId);
      if (background)
        backgroundsAdapter.updateOne(state.backgrounds, {
          id: background.id,
          changes: {
            tileColors: pasteGridSelection(
              background.tileColors,
              background.width,
              background.height,
              p.x,
              p.y,
              p.width,
              p.height,
              p.values,
              0,
            ),
          },
        });
    }
  } else if (scene.tilemap && p.layerId) {
    const index = scene.tilemap.layers.findIndex(
      (layer) => layer.id === p.layerId,
    );
    const layer = scene.tilemap.layers[index];
    if (!layer) return;

    let pasteTiles = p.values;
    let pasteAutotiles = p.autotiles;
    let destinationTilesets = scene.tilemap.tilesets;
    let destinationAutotileDefinitions = scene.tilemap.autotiles;

    if (p.tilesets) {
      const sourceLookup = buildSceneTilesetLookup({ tilesets: p.tilesets });
      const usedTilesetIds = new Set<string>();
      const collectTilesetId = (value: number) => {
        const ref = decodeSceneTileRef(value, sourceLookup);
        if (ref) usedTilesetIds.add(ref.tilesetId);
      };
      p.values.forEach(collectTilesetId);
      p.autotiles?.forEach((definitionId) => {
        const definition = p.autotileDefinitions?.[definitionId - 1];
        if (definition) collectTilesetId(definition.startTile);
      });

      destinationTilesets = [...scene.tilemap.tilesets];
      for (const sourceTileset of p.tilesets) {
        if (
          usedTilesetIds.has(sourceTileset.id) &&
          !destinationTilesets.some(
            (destination) => destination.id === sourceTileset.id,
          )
        ) {
          const currentTileset = localTilesetSelectById(
            state,
            sourceTileset.id,
          );
          if (!currentTileset) {
            continue;
          }
          destinationTilesets.push({
            id: currentTileset.id,
            width: currentTileset.width,
            height: currentTileset.height,
          });
        }
      }

      const destinationLookup = buildSceneTilesetLookup({
        tilesets: destinationTilesets,
      });
      const remapTileRef = (value: number) => {
        const sourceRef = decodeSceneTileRef(value, sourceLookup);
        if (!sourceRef) return 0;
        const sourceEntry = sourceLookup.entries[sourceRef.tilesetIndex];
        const destinationEntry = destinationLookup.entryByTilesetId.get(
          sourceRef.tilesetId,
        );
        if (!sourceEntry || !destinationEntry || sourceEntry.width <= 0) {
          return 0;
        }
        const tileX = sourceRef.tileIndex % sourceEntry.width;
        const tileY = Math.floor(sourceRef.tileIndex / sourceEntry.width);
        if (
          tileX >= destinationEntry.width ||
          tileY >= destinationEntry.height
        ) {
          return 0;
        }
        return encodeSceneTileRef(
          destinationEntry.offset,
          tileY * destinationEntry.width + tileX,
        );
      };

      pasteTiles = p.values.map(remapTileRef);
      if (p.autotiles && p.autotileDefinitions) {
        const nextAutotileDefinitions = [...(scene.tilemap.autotiles ?? [])];
        destinationAutotileDefinitions = nextAutotileDefinitions;
        const definitionIdMap = new Map<number, number>();
        pasteAutotiles = p.autotiles.map((sourceDefinitionId) => {
          if (!sourceDefinitionId) return 0;
          const cached = definitionIdMap.get(sourceDefinitionId);
          if (cached !== undefined) return cached;
          const sourceDefinition =
            p.autotileDefinitions?.[sourceDefinitionId - 1];
          if (!sourceDefinition) return 0;
          const startTile = remapTileRef(sourceDefinition.startTile);
          if (!startTile) return 0;
          let destinationIndex = nextAutotileDefinitions.findIndex(
            (definition) =>
              definition.type === sourceDefinition.type &&
              definition.startTile === startTile,
          );
          if (destinationIndex < 0) {
            nextAutotileDefinitions.push({
              ...sourceDefinition,
              startTile,
            });
            destinationIndex = nextAutotileDefinitions.length - 1;
          }
          const destinationId = destinationIndex + 1;
          definitionIdMap.set(sourceDefinitionId, destinationId);
          return destinationId;
        });
      }
    }

    const tilemapForPaste = {
      ...scene.tilemap,
      tilesets: destinationTilesets,
      ...(destinationAutotileDefinitions
        ? { autotiles: destinationAutotileDefinitions }
        : {}),
    };
    const layers = [...scene.tilemap.layers];
    const nextLayer = {
      ...layer,
      tiles: pasteGridSelection(
        layer.tiles,
        scene.width,
        scene.height,
        p.x,
        p.y,
        p.width,
        p.height,
        pasteTiles,
        0,
      ),
      ...(layer.autotiles || pasteAutotiles
        ? {
            autotiles: pasteGridSelection(
              layer.autotiles ?? [],
              scene.width,
              scene.height,
              p.x,
              p.y,
              p.width,
              p.height,
              pasteAutotiles ?? [],
              0,
            ),
          }
        : {}),
    };
    if (nextLayer.autotiles) {
      const resolved = resolveSceneAutotiles(
        nextLayer.autotiles,
        scene.width,
        scene.height,
        tilemapForPaste,
      );
      nextLayer.tiles = nextLayer.tiles.map(
        (tile, cell) => resolved[cell] || tile,
      );
    }
    layers[index] = nextLayer;
    const nextTilemap = { ...tilemapForPaste, layers };
    const tileColors = [
      ...getTilemapLayersTileColors(scene.tilemap, scene.width, scene.height),
    ];
    const collisions = [...scene.collisions];
    if (p.tileColors && p.collisions && p.linkedCells) {
      for (let sourceY = 0; sourceY < p.height; sourceY++) {
        for (let sourceX = 0; sourceX < p.width; sourceX++) {
          const sourceIndex = sourceY * p.width + sourceX;
          const targetX = p.x + sourceX;
          const targetY = p.y + sourceY;
          if (
            !p.linkedCells[sourceIndex] ||
            targetX < 0 ||
            targetY < 0 ||
            targetX >= scene.width ||
            targetY >= scene.height
          ) {
            continue;
          }
          const targetIndex = targetY * scene.width + targetX;
          if (isTilemapLayerCellTopmost(nextTilemap, index, targetIndex)) {
            tileColors[targetIndex] = p.tileColors[sourceIndex] ?? 0;
            collisions[targetIndex] = p.collisions[sourceIndex] ?? 0;
          }
        }
      }
    }
    scenesAdapter.updateOne(state.scenes, {
      id: scene.id,
      changes: {
        collisions,
        tilemap: { ...nextTilemap, tileColors },
      },
    });
  }
};

const paintSceneTile: CaseReducer<
  EntitiesState,
  PayloadAction<
    {
      sceneId: string;
      layerId?: string;
      tilesetId: string;
      tileIndex: number;
      autotile?: boolean;
      erase?: boolean;
      stamp?: { width: number; height: number; tilesetWidth: number };
      brush?: Brush;
      x: number;
      y: number;
    } & ({ drawLine?: false } | { drawLine: true; endX: number; endY: number })
  >
> = (state, action) => {
  const sourceState = original(state) ?? state;
  const scene = localSceneSelectById(sourceState, action.payload.sceneId);
  if (
    !scene?.tilemap ||
    action.payload.x < 0 ||
    action.payload.y < 0 ||
    action.payload.x >= scene.width ||
    action.payload.y >= scene.height
  ) {
    return;
  }

  const tilemap = scene.tilemap;
  const layerIndex = Math.max(
    0,
    tilemap.layers.findIndex((layer) => layer.id === action.payload.layerId),
  );
  const layer = tilemap.layers[layerIndex];
  if (!layer) {
    return;
  }

  const sceneSize = scene.width * scene.height;
  const brush = action.payload.brush ?? "8px";
  const isErasing = Boolean(action.payload.erase);
  const tilesets = [...tilemap.tilesets];
  let didAddTileset = false;
  const activeTileset = !isErasing
    ? localTilesetSelectById(sourceState, action.payload.tilesetId)
    : undefined;
  const hasTileset = tilesets.some(
    (tileset) => tileset.id === action.payload.tilesetId,
  );

  if (!isErasing && action.payload.tileIndex >= 0 && !hasTileset) {
    if (!activeTileset) {
      return;
    }
    tilesets.push({
      id: activeTileset.id,
      width: activeTileset.width,
      height: activeTileset.height,
    });
    didAddTileset = true;
  }

  let tilesetOffset = 0;
  let activeTilesetCount = 0;
  for (const tileset of tilesets) {
    const count =
      Math.max(0, Math.floor(tileset.width)) *
      Math.max(0, Math.floor(tileset.height));
    if (tileset.id === action.payload.tilesetId) {
      activeTilesetCount = count;
      break;
    }
    tilesetOffset += count;
  }

  const tileRef =
    isErasing || action.payload.tileIndex < 0
      ? 0
      : encodeSceneTileRef(tilesetOffset, action.payload.tileIndex);
  const autotileDefinitions: AutotileDefinition[] = [
    ...(tilemap.autotiles ?? []),
  ];
  let didAddAutotileDefinition = false;
  let autotileDefinitionId = 0;
  if (!isErasing && action.payload.autotile && tileRef) {
    const sourceDefinition = activeTileset?.autotiles?.find(
      (definition) => definition.startTile === action.payload.tileIndex,
    ) ?? { type: "2x2" as const, startTile: action.payload.tileIndex };
    const existingIndex = autotileDefinitions.findIndex(
      (definition) =>
        definition.type === sourceDefinition.type &&
        definition.startTile === tileRef,
    );
    if (existingIndex >= 0) {
      autotileDefinitionId = existingIndex + 1;
    } else {
      autotileDefinitions.push({
        ...sourceDefinition,
        startTile: tileRef,
      });
      autotileDefinitionId = autotileDefinitions.length;
      didAddAutotileDefinition = true;
    }
  }
  const tilemapWithTileset = {
    ...tilemap,
    tilesets,
    autotiles: autotileDefinitions,
  };
  const drawSize = brush === "16px" ? 2 : 1;
  const changedCells = new Set<number>();
  let tiles: number[] | undefined;
  let autotiles: number[] | undefined;
  let tileColors: number[] | undefined;
  let collisions: number[] | undefined;
  let tilesetLookup: ReturnType<typeof buildSceneTilesetLookup> | undefined;

  const copyGrid = (values: readonly number[]) =>
    values.length >= sceneSize
      ? values.slice(0, sceneSize)
      : normalizeGridSize(values, sceneSize, 0);
  const isInBounds = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < scene.width && y < scene.height;
  const getTile = (cellIndex: number) =>
    tiles?.[cellIndex] ?? layer.tiles[cellIndex] ?? 0;
  const ensureTiles = () => {
    if (!tiles) {
      tiles = copyGrid(layer.tiles);
    }
    return tiles;
  };
  const getAutotile = (cellIndex: number) =>
    autotiles?.[cellIndex] ?? layer.autotiles?.[cellIndex] ?? 0;
  const ensureAutotiles = () => {
    if (!autotiles) {
      autotiles = copyGrid(layer.autotiles ?? []);
    }
    return autotiles;
  };
  const getTileColor = (cellIndex: number) =>
    tileColors?.[cellIndex] ?? tilemap.tileColors?.[cellIndex] ?? 0;
  const ensureTileColors = () => {
    if (!tileColors) {
      tileColors = copyGrid(tilemap.tileColors ?? []);
    }
    return tileColors;
  };
  const getCollision = (cellIndex: number) =>
    collisions?.[cellIndex] ?? scene.collisions[cellIndex] ?? 0;
  const ensureCollisions = () => {
    if (!collisions) {
      collisions = copyGrid(scene.collisions);
    }
    return collisions;
  };
  const getTilesetLookup = () => {
    if (!tilesetLookup) {
      tilesetLookup = buildSceneTilesetLookup(tilemapWithTileset);
    }
    return tilesetLookup;
  };

  const hasVisibleTileAbove = (cellIndex: number) => {
    for (let index = layerIndex + 1; index < tilemap.layers.length; index++) {
      const tileLayer = tilemap.layers[index];
      if (tileLayer?.visible && tileLayer.tiles[cellIndex]) {
        return true;
      }
    }
    return false;
  };
  const shouldApplyTileDefaults = (cellIndex: number) =>
    layer.visible && !hasVisibleTileAbove(cellIndex);

  type TileDefaults = { color?: number; collision?: number };
  const defaultByTileRef = new Map<number, TileDefaults>();
  const getDefaultsForTileRef = (value: number): TileDefaults => {
    const cached = defaultByTileRef.get(value);
    if (cached || defaultByTileRef.has(value)) {
      return cached ?? {};
    }

    const absoluteIndex = value - 1;
    let tilesetId: string | undefined;
    let tileIndex: number | undefined;
    if (
      value > 0 &&
      absoluteIndex >= tilesetOffset &&
      absoluteIndex < tilesetOffset + activeTilesetCount
    ) {
      tilesetId = action.payload.tilesetId;
      tileIndex = absoluteIndex - tilesetOffset;
    } else {
      const ref = decodeSceneTileRef(value, getTilesetLookup());
      tilesetId = ref?.tilesetId;
      tileIndex = ref?.tileIndex;
    }

    const sourceTileset = tilesetId
      ? localTilesetSelectById(sourceState, tilesetId)
      : undefined;
    const defaults = {
      color:
        tileIndex !== undefined
          ? sourceTileset?.tileColors[tileIndex]
          : undefined,
      collision:
        tileIndex !== undefined
          ? sourceTileset?.tileCollisions[tileIndex]
          : undefined,
    };
    defaultByTileRef.set(value, defaults);
    return defaults;
  };

  const applyTileDefaults = (cellIndex: number, value: number) => {
    if (!shouldApplyTileDefaults(cellIndex) || !value) {
      return;
    }
    const defaults = getDefaultsForTileRef(value);
    if (
      defaults.color !== undefined &&
      defaults.color !== TILE_DEFAULT_UNSET &&
      defaults.color !== getTileColor(cellIndex)
    ) {
      ensureTileColors()[cellIndex] = defaults.color;
    }
    if (
      defaults.collision !== undefined &&
      defaults.collision !== TILE_DEFAULT_UNSET &&
      defaults.collision !== getCollision(cellIndex)
    ) {
      ensureCollisions()[cellIndex] = defaults.collision;
    }
  };

  const writeCell = (
    x: number,
    y: number,
    value: number,
    nextAutotile: number,
  ) => {
    const cellIndex = y * scene.width + x;
    const currentTile = getTile(cellIndex);
    const currentAutotile = getAutotile(cellIndex);
    let changed = false;

    if (currentAutotile !== nextAutotile) {
      ensureAutotiles()[cellIndex] = nextAutotile;
      changed = true;
    }
    const shouldWriteTile = nextAutotile
      ? currentAutotile !== nextAutotile
      : currentTile !== value;
    if (shouldWriteTile) {
      ensureTiles()[cellIndex] = value;
      changed = true;
    }
    if (changed) {
      changedCells.add(cellIndex);
    }

    if (nextAutotile) {
      if (!changed && !changedCells.has(cellIndex)) {
        applyTileDefaults(cellIndex, currentTile);
      }
    } else {
      applyTileDefaults(cellIndex, value);
    }
  };

  const setValue = (x: number, y: number, value: number) =>
    writeCell(x, y, value, autotileDefinitionId);
  const getValue = (x: number, y: number) => getTile(y * scene.width + x);
  const equal = (a: number, b: number) => a === b;
  const stamp = action.payload.stamp;
  const isStamp = Boolean(
    !isErasing &&
    brush !== "magic" &&
    stamp &&
    stamp.tilesetWidth > 0 &&
    (stamp.width > 1 || stamp.height > 1),
  );

  const paintStamp = (originX: number, originY: number) => {
    if (!stamp) return;
    for (let stampY = 0; stampY < stamp.height; stampY++) {
      for (let stampX = 0; stampX < stamp.width; stampX++) {
        const x = originX + stampX;
        const y = originY + stampY;
        if (!isInBounds(x, y)) continue;
        writeCell(
          x,
          y,
          encodeSceneTileRef(
            tilesetOffset,
            action.payload.tileIndex + stampY * stamp.tilesetWidth + stampX,
          ),
          0,
        );
      }
    }
  };

  const paintStampCell = (
    x: number,
    y: number,
    originX: number,
    originY: number,
  ) => {
    if (!stamp) return;
    const stampX = (((x - originX) % stamp.width) + stamp.width) % stamp.width;
    const stampY =
      (((y - originY) % stamp.height) + stamp.height) % stamp.height;
    writeCell(
      x,
      y,
      encodeSceneTileRef(
        tilesetOffset,
        action.payload.tileIndex + stampY * stamp.tilesetWidth + stampX,
      ),
      0,
    );
  };

  const runFill = (setFillValue: (x: number, y: number) => void) => {
    const visited = new Set<number>();
    const getFillValue = (x: number, y: number) => {
      const index = y * scene.width + x;
      return visited.has(index) ? -1 : getTile(index);
    };
    const visitAndSet = (x: number, y: number) => {
      visited.add(y * scene.width + x);
      setFillValue(x, y);
    };
    floodFill(
      action.payload.x,
      action.payload.y,
      -1,
      getFillValue,
      visitAndSet,
      isInBounds,
      equal,
    );
  };

  if (isStamp && brush === "fill") {
    runFill((x, y) => paintStampCell(x, y, action.payload.x, action.payload.y));
  } else if (isStamp && action.payload.drawLine) {
    sceneStampLinePositions(
      action.payload.x,
      action.payload.y,
      action.payload.endX,
      action.payload.endY,
      stamp?.width ?? 1,
      stamp?.height ?? 1,
    ).forEach(({ x, y }) => paintStamp(x, y));
  } else if (isStamp) {
    paintStamp(action.payload.x, action.payload.y);
  } else if (brush === "magic") {
    paintMagic(
      scene.width,
      layer.tiles,
      action.payload.x,
      action.payload.y,
      tileRef,
      setValue,
      isInBounds,
    );
  } else if (brush === "fill") {
    const targetIndex = action.payload.y * scene.width + action.payload.x;
    const targetIsAutotile = Boolean(getAutotile(targetIndex));
    const replacementIsAutotile = Boolean(action.payload.autotile && tileRef);
    if (
      getValue(action.payload.x, action.payload.y) !== tileRef ||
      targetIsAutotile !== replacementIsAutotile
    ) {
      runFill((x, y) => setValue(x, y, tileRef));
    }
  } else if (action.payload.drawLine) {
    paintLine(
      action.payload.x,
      action.payload.y,
      action.payload.endX,
      action.payload.endY,
      drawSize,
      tileRef,
      setValue,
      isInBounds,
    );
  } else {
    paint(
      action.payload.x,
      action.payload.y,
      drawSize,
      tileRef,
      setValue,
      isInBounds,
    );
  }

  const cellsToResolve = new Set<number>();
  if (changedCells.size && (autotiles || layer.autotiles)) {
    for (const cellIndex of changedCells) {
      const changedX = cellIndex % scene.width;
      const changedY = Math.floor(cellIndex / scene.width);
      for (let y = changedY - 1; y <= changedY + 1; y++) {
        for (let x = changedX - 1; x <= changedX + 1; x++) {
          if (isInBounds(x, y)) {
            cellsToResolve.add(y * scene.width + x);
          }
        }
      }
    }
  }

  const autotileValues = autotiles ?? layer.autotiles;
  if (autotileValues && cellsToResolve.size) {
    const resolved =
      cellsToResolve.size > sceneSize / 3
        ? resolveSceneAutotiles(
            autotileValues,
            scene.width,
            scene.height,
            tilemapWithTileset,
          )
        : resolveSceneAutotilesForCells(
            autotileValues,
            scene.width,
            scene.height,
            tilemapWithTileset,
            cellsToResolve,
          );

    for (const index of cellsToResolve) {
      if (!autotileValues[index]) continue;
      const value =
        resolved instanceof Map
          ? (resolved.get(index) ?? 0)
          : (resolved[index] ?? 0);
      const resolvedChanged = getTile(index) !== value;
      if (resolvedChanged) {
        ensureTiles()[index] = value;
      }
      if (resolvedChanged || changedCells.has(index)) {
        applyTileDefaults(index, value);
      }
    }
  }

  const layerChanged = Boolean(tiles || autotiles);
  if (
    !layerChanged &&
    !tileColors &&
    !collisions &&
    !didAddTileset &&
    !didAddAutotileDefinition
  ) {
    return;
  }

  const layers = layerChanged ? [...tilemap.layers] : tilemap.layers;
  if (layerChanged) {
    layers[layerIndex] = {
      ...layer,
      ...(tiles ? { tiles } : {}),
      ...(autotiles ? { autotiles } : {}),
    };
  }

  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      ...(collisions ? { collisions } : {}),
      tilemap: {
        ...tilemap,
        ...(didAddTileset ? { tilesets } : {}),
        ...(didAddAutotileDefinition ? { autotiles: autotileDefinitions } : {}),
        ...(tileColors ? { tileColors } : {}),
        layers,
      },
    },
  });
};

const editScenes: CaseReducer<
  EntitiesState,
  PayloadAction<Array<{ id: string; changes: Partial<SceneNormalized> }>>
> = (state, action) => {
  scenesAdapter.updateMany(state.scenes, action.payload);
};

const setSceneSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ sceneId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.scenes,
    scenesAdapter,
    action.payload.sceneId,
    action.payload.symbol,
  );
};

const removeScene: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
  }>
> = (state, action) => {
  scenesAdapter.removeOne(state.scenes, action.payload.sceneId);
};

const removeScenes: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneIds: string[];
  }>
> = (state, action) => {
  scenesAdapter.removeMany(state.scenes, action.payload.sceneIds);
};

const reparentScene: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentEntityToCollection(
    state.scenes.entities,
    action.payload.sceneId,
    action.payload.toPath,
  );
};

const paintCollision: CaseReducer<
  EntitiesState,
  PayloadAction<
    {
      sceneId: string;
      tileLookup?: number[];
      x: number;
      y: number;
      value: number;
      brush: Brush;
      mask: number;
    } & ({ drawLine?: false } | { drawLine: true; endX: number; endY: number })
  >
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const background = localBackgroundSelectById(state, scene.backgroundId);
  if (!background && !scene.tilemap) {
    return;
  }

  const brush = action.payload.brush;
  const mask = action.payload.mask;
  const drawSize = brush === "16px" ? 2 : 1;
  const width = scene.tilemap
    ? scene.width
    : (background?.width ?? scene.width);
  const height = scene.tilemap
    ? scene.height
    : (background?.height ?? scene.height);
  const collisionsSize = Math.ceil(width * height);
  const collisions = scene.collisions.slice(0, collisionsSize);

  // Fill collisions array if too small for image
  if (collisions.length < collisionsSize) {
    for (let i = collisions.length; i < collisionsSize; i++) {
      collisions[i] = 0;
    }
  }

  const getValue = (x: number, y: number) => {
    const tileIndex = width * y + x;
    return collisions[tileIndex];
  };

  const setValue = (x: number, y: number, value: number) => {
    const tileIndex = width * y + x;
    const originalValue = collisions[tileIndex] ?? 0;
    const newValue = (originalValue & ~mask) | (value & mask);
    collisions[tileIndex] = newValue;
  };

  const isInBounds = (x: number, y: number) => {
    return x >= 0 && x < width && y >= 0 && y < height;
  };

  const equal = (a: number, b: number) => a === b;

  if (brush === "magic" && action.payload.tileLookup) {
    paintMagic(
      width,
      action.payload.tileLookup,
      action.payload.x,
      action.payload.y,
      action.payload.value,
      setValue,
      isInBounds,
    );
  } else if (brush === "fill") {
    floodFill(
      action.payload.x,
      action.payload.y,
      action.payload.value,
      getValue,
      setValue,
      isInBounds,
      equal,
    );
  } else if (action.payload.drawLine) {
    paintLine(
      action.payload.x,
      action.payload.y,
      action.payload.endX,
      action.payload.endY,
      drawSize,
      action.payload.value,
      setValue,
      isInBounds,
    );
  } else {
    paint(
      action.payload.x,
      action.payload.y,
      drawSize,
      action.payload.value,
      setValue,
      isInBounds,
    );
  }

  scenesAdapter.updateOne(state.scenes, {
    id: action.payload.sceneId,
    changes: {
      collisions,
    },
  });
};

const paintSlopeCollision: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    offset: boolean;
    slopeIncline: SlopeIncline;
    slopeDirection: "left" | "right";
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const background = localBackgroundSelectById(state, scene.backgroundId);
  if (!background && !scene.tilemap) {
    return;
  }
  const width = scene.tilemap
    ? scene.width
    : (background?.width ?? scene.width);
  const height = scene.tilemap
    ? scene.height
    : (background?.height ?? scene.height);

  const { slopeIncline, slopeDirection, offset } = action.payload;

  let startX = action.payload.startX;
  let startY = action.payload.startY;
  let endX = action.payload.endX;
  let endY = action.payload.endY;
  let skipFirstTile = false;

  // If slope is offset (holding shift key) then modify the
  // line start/end tiles to ensure the line is painted correctly
  if (offset && slopeIncline === "steep") {
    endX += endX < startX ? -0.5 : 0.5;
    startY += endY > startY ? -1 : 1;
    skipFirstTile = true;
  } else if (offset && slopeIncline === "shallow") {
    endY += endY < startY ? -0.5 : 0.5;
    startX += endX > startX ? -1 : 1;
    skipFirstTile = true;
  }

  const roundEndX = endX > startX ? Math.floor(endX) : Math.ceil(endX);
  const roundEndY = endY > startY ? Math.floor(endY) : Math.ceil(endY);

  const collisionsSize = Math.ceil(width * height);
  const collisions = scene.collisions.slice(0, collisionsSize);

  // Fill collisions array if too small for image
  if (collisions.length < collisionsSize) {
    for (let i = collisions.length; i < collisionsSize; i++) {
      collisions[i] = 0;
    }
  }

  const setValue = (x: number, y: number, value: number) => {
    // Don't draw last tile
    if (x === roundEndX && y === roundEndY) {
      return;
    }

    // Don't draw first tile when offsetting shallow & steep slopes
    if (skipFirstTile && x === startX && y === startY) {
      return;
    }

    const tileIndex = width * y + x;
    let newValue = value;

    if (
      startY === endY &&
      // Drag left to right for top collision
      // Drag right to left for bottom collision
      // Shift to toggle
      ((startX > endX && !offset) || (startX <= endX && offset))
    ) {
      newValue = COLLISION_BOTTOM;
    } else if (startY === endY) {
      newValue = COLLISION_TOP;
    } else if (
      startX === endX &&
      // Drag top to bottom for left collision
      // Drag bottom to top for right collision
      // Shift to toggle
      ((startY > endY && !offset) || (startY <= endY && offset))
    ) {
      newValue = COLLISION_RIGHT;
    } else if (startX === endX) {
      newValue = COLLISION_LEFT;
    } else if (slopeIncline === "medium") {
      // Medium incline slope uses 45deg tiles using slope direction
      if (slopeDirection === "left") {
        newValue = COLLISION_SLOPE_45_LEFT;
      } else {
        newValue = COLLISION_SLOPE_45_RIGHT;
      }
    } else if (slopeIncline === "shallow") {
      // Shallow incline slope uses the 22deg tiles using slope direction
      // alternating between the two 22deg tiles depending on position on line
      const oddTile = (startX % 2 !== x % 2) !== endY > startY;

      if (slopeDirection === "left") {
        newValue = oddTile
          ? COLLISION_SLOPE_22_LEFT_TOP
          : COLLISION_SLOPE_22_LEFT_BOT;
      } else {
        newValue = oddTile
          ? COLLISION_SLOPE_22_RIGHT_TOP
          : COLLISION_SLOPE_22_RIGHT_BOT;
      }
    }

    collisions[tileIndex] = newValue;
  };

  const isInBounds = (x: number, y: number) => {
    return x >= 0 && x < width && y >= 0 && y < height;
  };

  paintLine(
    startX,
    startY,
    roundEndX,
    roundEndY,
    1,
    COLLISION_ALL,
    setValue,
    isInBounds,
  );

  scenesAdapter.updateOne(state.scenes, {
    id: action.payload.sceneId,
    changes: {
      collisions,
    },
  });
};

const paintColor: CaseReducer<
  EntitiesState,
  PayloadAction<
    {
      backgroundId: string;
      sceneId: string;
      tileLookup?: number[];
      x: number;
      y: number;
      paletteIndex: number;
      brush: Brush;
      isTileProp: boolean;
      erase?: boolean;
    } & ({ drawLine?: false } | { drawLine: true; endX: number; endY: number })
  >
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  const background = localBackgroundSelectById(
    state,
    action.payload.backgroundId,
  );
  if (!background && !scene?.tilemap) {
    return;
  }

  const isTileProp = action.payload.isTileProp;
  const brush = action.payload.brush;
  const drawSize = brush === "16px" ? 2 : 1;
  const width = scene?.tilemap ? scene.width : (background?.width ?? 0);
  const height = scene?.tilemap ? scene.height : (background?.height ?? 0);
  const tileColorsSize = Math.ceil(width * height);
  const tileColors = (
    scene?.tilemap
      ? getTilemapLayersTileColors(scene.tilemap, width, height)
      : (background?.tileColors ?? [])
  ).slice(0, tileColorsSize);

  if (tileColors.length < tileColorsSize) {
    for (let i = tileColors.length; i < tileColorsSize; i++) {
      tileColors[i] = 0;
    }
  }

  const getValue = (x: number, y: number) => {
    const tileColorIndex = width * y + x;
    if (isTileProp) {
      return tileColors[tileColorIndex] & TILE_COLOR_PROPS;
    }
    return tileColors[tileColorIndex] & TILE_COLOR_PALETTE;
  };

  const setValue = (x: number, y: number, value: number) => {
    const tileColorIndex = width * y + x;
    let newValue = value;
    if (action.payload.erase) {
      newValue = 0;
    } else if (isTileProp) {
      // If is prop keep previous color value
      newValue =
        (tileColors[tileColorIndex] & TILE_COLOR_PALETTE) +
        (value & TILE_COLOR_PROPS);
    } else {
      // If is color keep prop unless erasing
      newValue =
        (value & TILE_COLOR_PALETTE) +
        (tileColors[tileColorIndex] & TILE_COLOR_PROPS);
    }
    tileColors[tileColorIndex] = newValue;
  };

  const isInBounds = (x: number, y: number) => {
    return x >= 0 && x < width && y >= 0 && y < height;
  };

  const equal = (a: number, b: number) => a === b;

  if (brush === "magic" && action.payload.tileLookup) {
    paintMagic(
      width,
      action.payload.tileLookup,
      action.payload.x,
      action.payload.y,
      action.payload.paletteIndex,
      setValue,
      isInBounds,
    );
  } else if (brush === "fill") {
    floodFill(
      action.payload.x,
      action.payload.y,
      action.payload.paletteIndex,
      getValue,
      setValue,
      isInBounds,
      equal,
    );
  } else if (action.payload.drawLine) {
    paintLine(
      action.payload.x,
      action.payload.y,
      action.payload.endX,
      action.payload.endY,
      drawSize,
      action.payload.paletteIndex,
      setValue,
      isInBounds,
    );
  } else {
    paint(
      action.payload.x,
      action.payload.y,
      drawSize,
      action.payload.paletteIndex,
      setValue,
      isInBounds,
    );
  }

  if (scene?.tilemap) {
    scenesAdapter.updateOne(state.scenes, {
      id: scene.id,
      changes: { tilemap: { ...scene.tilemap, tileColors } },
    });
  } else if (background) {
    backgroundsAdapter.updateOne(state.backgrounds, {
      id: action.payload.backgroundId,
      changes: { tileColors },
    });
  }
};

const setSceneExtractedPalettes: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    palettes: Palette[];
    tileColors: number[];
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const background = localBackgroundSelectById(state, scene.backgroundId);
  if (!background) {
    return;
  }

  const generatePaletteKey = (p: Palette) => p.colors.join("_").toUpperCase();
  const paletteLookup = state.palettes.ids.reduce(
    (memo, id) => {
      const palette = state.palettes.entities[id];
      memo[generatePaletteKey(palette)] = id;
      return memo;
    },
    {} as Record<string, string>,
  );

  const newPaletteIds: string[] = [];
  for (const palette of action.payload.palettes) {
    const existingId = paletteLookup[generatePaletteKey(palette)];
    let id = existingId;
    if (!id) {
      id = uuid();
      const newPalette: Palette = { ...palette, id };
      palettesAdapter.addOne(state.palettes, newPalette);
      paletteLookup[generatePaletteKey(newPalette)] = id;
    }
    newPaletteIds.push(id);
  }

  backgroundsAdapter.updateOne(state.backgrounds, {
    id: background.id,
    changes: {
      tileColors: action.payload.tileColors,
      autoColor: false,
    },
  });

  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      paletteIds: newPaletteIds,
    },
  });
};

const scenesReducers = {
  addScene: {
    reducer: addScene,
    prepare: (payload: {
      x: number;
      y: number;
      defaults?: Partial<SceneNormalized>;
      variables?: Variable[];
      tilemap?: boolean;
    }) => {
      return {
        payload: {
          ...payload,
          sceneId: uuid(),
        },
      };
    },
  },

  editScene,
  setTilemapLayersEnabled,
  resizeTilemapLayers,
  paintSceneTile,
  addTilemapLayer: {
    reducer: addTilemapLayer,
    prepare: (payload: { sceneId: string; afterLayerId?: string }) => ({
      payload: { ...payload, layerId: uuid() },
    }),
  },
  editTilemapLayer,
  removeTilemapLayer,
  moveTilemapLayer,
  mergeTilemapLayerDown,
  moveSceneTileSelection,
  moveSceneCollisionSelection,
  moveSceneColorSelection,
  deleteSceneTileSelection,
  deleteSceneCollisionSelection,
  deleteSceneColorSelection,
  pasteSceneGridSelection,
  editScenes,
  setSceneSymbol,
  removeScene,
  removeScenes,
  paintCollision,
  paintSlopeCollision,
  paintColor,
  setSceneExtractedPalettes,
  reparentScene,
} satisfies SliceCaseReducers<EntitiesState>;

export default scenesReducers;
