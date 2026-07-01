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
  sceneStampLinePositions,
} from "shared/lib/tiles/sceneTilemapData";
import { moveArrayElement } from "shared/lib/helpers/array";
import { ResizeTilemapLayersPayload } from "store/features/entities/entitiesActionMatchers";
import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import uuid from "uuid";
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
import { Palette, Variable } from "shared/lib/resources/types";
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
  moveGridSelection,
  moveGridSelectionMasked,
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
  PayloadAction<{ sceneId: string; layerId: string }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene?.tilemap) {
    return;
  }
  const layerNumber = scene.tilemap.layers.length + 1;
  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      tilemap: {
        ...scene.tilemap,
        layers: [
          ...scene.tilemap.layers,
          {
            id: action.payload.layerId,
            name: `Layer ${layerNumber}`,
            visible: true,
            tiles: new Array(scene.width * scene.height).fill(0),
          },
        ],
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
    direction: -1 | 1 | "top" | "bottom";
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

  const shouldMoveLinkedSource = (sourceIndex: number) =>
    isTilemapLayerCellTopmost(tilemap, layerIndex, sourceIndex);

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

  const layerIndex = scene.tilemap.layers.findIndex(
    (layer) => layer.id === action.payload.layerId,
  );

  const layer = scene.tilemap.layers[layerIndex];
  if (!layer) {
    return;
  }

  const layers = [...scene.tilemap.layers];
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
      scene.tilemap,
    );
    layers[layerIndex].tiles = layers[layerIndex].tiles.map(
      (tile, index) => resolvedTiles[index] || tile,
    );
  }

  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: { tilemap: { ...scene.tilemap, layers } },
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
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (
    !scene?.tilemap ||
    action.payload.x < 0 ||
    action.payload.y < 0 ||
    action.payload.x >= scene.width ||
    action.payload.y >= scene.height
  ) {
    return;
  }

  const layerIndex = Math.max(
    0,
    scene.tilemap.layers.findIndex(
      (layer) => layer.id === action.payload.layerId,
    ),
  );
  const layer = scene.tilemap.layers[layerIndex];
  if (!layer) {
    return;
  }

  const sceneSize = scene.width * scene.height;
  const tilesets = [...scene.tilemap.tilesets];
  let tileColors: number[] | undefined;
  let collisions: number[] | undefined;
  const brush = action.payload.brush ?? "8px";
  const isErasing = action.payload.erase;
  const hasTileset = tilesets.some(
    (tileset) => tileset.id === action.payload.tilesetId,
  );

  if (!isErasing && action.payload.tileIndex >= 0 && !hasTileset) {
    const tileset = localTilesetSelectById(state, action.payload.tilesetId);
    if (!tileset) {
      return;
    }
    tilesets.push({
      id: tileset.id,
      width: tileset.width,
      height: tileset.height,
    });
  }

  const tiles = [...layer.tiles];
  const autotiles = layer.autotiles
    ? [...layer.autotiles]
    : new Array(scene.width * scene.height).fill(0);

  const tilemapWithTileset = { ...scene.tilemap, tilesets };
  const tilesetLookup = buildSceneTilesetLookup(tilemapWithTileset);
  const tilesetOffset =
    tilesetLookup.entryByTilesetId.get(action.payload.tilesetId)?.offset ?? 0;

  const tileRef =
    isErasing || action.payload.tileIndex < 0
      ? 0
      : encodeSceneTileRef(tilesetOffset, action.payload.tileIndex);
  const autotileRef = tileRef;
  const drawSize = brush === "16px" ? 2 : 1;
  const changedCells: Array<{ x: number; y: number }> = [];
  const isInBounds = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < scene.width && y < scene.height;

  const getTileColor = (cellIndex: number) => {
    if (tileColors) {
      return tileColors[cellIndex] ?? 0;
    }
    if (scene.tilemap?.tileColors) {
      return scene.tilemap.tileColors[cellIndex] ?? 0;
    }
    return 0;
  };

  const ensureTileColors = () => {
    if (!tileColors) {
      tileColors = new Array<number>(sceneSize).fill(0);
      for (let index = 0; index < sceneSize; index++) {
        tileColors[index] = scene.tilemap?.tileColors
          ? (scene.tilemap.tileColors[index] ?? 0)
          : 0;
      }
    }
    return tileColors;
  };

  const getCollision = (cellIndex: number) =>
    collisions?.[cellIndex] ?? scene.collisions[cellIndex] ?? 0;

  const ensureCollisions = () => {
    if (!collisions) {
      const nextCollisions = new Array<number>(sceneSize).fill(0);
      scene.collisions.slice(0, sceneSize).forEach((value, index) => {
        nextCollisions[index] = value;
      });
      collisions = nextCollisions;
    }
    return collisions;
  };

  const hasVisibleTileAbove = (cellIndex: number) => {
    if (!scene.tilemap) {
      return false;
    }
    for (
      let index = layerIndex + 1;
      index < scene.tilemap.layers.length;
      index++
    ) {
      const tileLayer = scene.tilemap.layers[index];

      if (tileLayer?.visible && tileLayer.tiles[cellIndex]) {
        return true;
      }
    }

    return false;
  };

  const shouldApplyTileDefaults = (cellIndex: number) =>
    layer.visible && !hasVisibleTileAbove(cellIndex);

  const applyTileDefaults = (cellIndex: number, value: number) => {
    if (!shouldApplyTileDefaults(cellIndex)) {
      return;
    }

    const ref = decodeSceneTileRef(value, tilesetLookup);
    const sourceTilesetId = ref?.tilesetId;
    const sourceTileset = sourceTilesetId
      ? localTilesetSelectById(state, sourceTilesetId)
      : undefined;

    const defaultColor = ref && sourceTileset?.tileColors[ref.tileIndex];

    if (
      defaultColor !== undefined &&
      defaultColor !== TILE_DEFAULT_UNSET &&
      defaultColor !== getTileColor(cellIndex)
    ) {
      ensureTileColors()[cellIndex] = defaultColor;
    }

    const defaultCollision =
      ref && sourceTileset?.tileCollisions[ref.tileIndex];

    if (
      defaultCollision !== undefined &&
      defaultCollision !== TILE_DEFAULT_UNSET &&
      defaultCollision !== getCollision(cellIndex)
    ) {
      ensureCollisions()[cellIndex] = defaultCollision;
    }
  };

  const setValue = (x: number, y: number, value: number) => {
    const cellIndex = y * scene.width + x;
    autotiles[cellIndex] =
      !isErasing && action.payload.autotile ? autotileRef : 0;
    tiles[cellIndex] = value;
    applyTileDefaults(cellIndex, value);
    changedCells.push({ x, y });
  };

  const getValue = (x: number, y: number) => tiles[y * scene.width + x] ?? 0;
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
    if (!stamp) {
      return;
    }
    for (let stampY = 0; stampY < stamp.height; stampY++) {
      for (let stampX = 0; stampX < stamp.width; stampX++) {
        const x = originX + stampX;
        const y = originY + stampY;
        if (!isInBounds(x, y)) continue;
        const value = isErasing
          ? 0
          : encodeSceneTileRef(
              tilesetOffset,
              action.payload.tileIndex + stampY * stamp.tilesetWidth + stampX,
            );
        const cellIndex = y * scene.width + x;
        autotiles[cellIndex] = 0;
        tiles[cellIndex] = value;
        applyTileDefaults(cellIndex, value);
        changedCells.push({ x, y });
      }
    }
  };

  const paintStampCell = (
    x: number,
    y: number,
    originX: number,
    originY: number,
  ) => {
    if (!stamp) {
      return;
    }
    const stampX = (((x - originX) % stamp.width) + stamp.width) % stamp.width;
    const stampY =
      (((y - originY) % stamp.height) + stamp.height) % stamp.height;
    const value = encodeSceneTileRef(
      tilesetOffset,
      action.payload.tileIndex + stampY * stamp.tilesetWidth + stampX,
    );
    const cellIndex = y * scene.width + x;
    autotiles[cellIndex] = 0;
    tiles[cellIndex] = value;
    applyTileDefaults(cellIndex, value);
    changedCells.push({ x, y });
  };

  if (isStamp && brush === "fill") {
    const fillLookup = [...tiles];
    const getFillValue = (x: number, y: number) =>
      fillLookup[y * scene.width + x] ?? 0;
    const setFillValue = (x: number, y: number) => {
      fillLookup[y * scene.width + x] = -1;
      paintStampCell(x, y, action.payload.x, action.payload.y);
    };
    floodFill(
      action.payload.x,
      action.payload.y,
      -1,
      getFillValue,
      setFillValue,
      isInBounds,
      equal,
    );
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
    const targetIsAutotile = Boolean(autotiles[targetIndex]);
    const replacementIsAutotile = Boolean(action.payload.autotile && tileRef);
    if (
      getValue(action.payload.x, action.payload.y) !== tileRef ||
      targetIsAutotile !== replacementIsAutotile
    ) {
      const fillLookup = [...tiles];
      const getFillValue = (x: number, y: number) =>
        fillLookup[y * scene.width + x] ?? 0;
      const setFillValue = (x: number, y: number) => {
        fillLookup[y * scene.width + x] = -1;
        setValue(x, y, tileRef);
      };
      floodFill(
        action.payload.x,
        action.payload.y,
        -1,
        getFillValue,
        setFillValue,
        isInBounds,
        equal,
      );
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
  for (const changedCell of changedCells) {
    for (let y = changedCell.y - 1; y <= changedCell.y + 1; y++) {
      for (let x = changedCell.x - 1; x <= changedCell.x + 1; x++) {
        if (isInBounds(x, y)) cellsToResolve.add(y * scene.width + x);
      }
    }
  }

  const resolvedLayerTiles = [...tiles];

  if (autotiles.some(Boolean)) {
    const resolvedAutotiles = resolveSceneAutotiles(
      autotiles,
      scene.width,
      scene.height,
      tilemapWithTileset,
    );

    for (const index of cellsToResolve) {
      if (autotiles[index]) {
        const value = resolvedAutotiles[index] ?? 0;
        resolvedLayerTiles[index] = value;
        applyTileDefaults(index, value);
      }
    }
  }

  const layers = [...scene.tilemap.layers];
  layers[layerIndex] = { ...layer, tiles: resolvedLayerTiles, autotiles };

  scenesAdapter.updateOne(state.scenes, {
    id: scene.id,
    changes: {
      ...(collisions ? { collisions } : {}),
      tilemap: {
        ...scene.tilemap,
        tilesets,
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
    prepare: (payload: { sceneId: string }) => ({
      payload: { ...payload, layerId: uuid() },
    }),
  },
  editTilemapLayer,
  removeTilemapLayer,
  moveTilemapLayer,
  moveSceneTileSelection,
  moveSceneCollisionSelection,
  moveSceneColorSelection,
  deleteSceneTileSelection,
  deleteSceneCollisionSelection,
  deleteSceneColorSelection,
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
