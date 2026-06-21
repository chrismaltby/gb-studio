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
} from "consts";
import {
  paintMagic,
  paintLine,
  paint,
  floodFill,
} from "shared/lib/helpers/paint";

const MIN_SCENE_X = 60;
const MIN_SCENE_Y = 30;
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
    x: Math.max(MIN_SCENE_X, action.payload.x),
    y: Math.max(MIN_SCENE_Y, action.payload.y),
    actors: [],
    triggers: [],
    script: [],
    playerHit1Script: [],
    playerHit2Script: [],
    playerHit3Script: [],
  };

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
  if (!background) {
    return;
  }

  const brush = action.payload.brush;
  const mask = action.payload.mask;
  const drawSize = brush === "16px" ? 2 : 1;
  const collisionsSize = Math.ceil(background.width * background.height);
  const collisions = scene.collisions.slice(0, collisionsSize);

  // Fill collisions array if too small for image
  if (collisions.length < collisionsSize) {
    for (let i = collisions.length; i < collisionsSize; i++) {
      collisions[i] = 0;
    }
  }

  const getValue = (x: number, y: number) => {
    const tileIndex = background.width * y + x;
    return collisions[tileIndex];
  };

  const setValue = (x: number, y: number, value: number) => {
    const tileIndex = background.width * y + x;
    const originalValue = collisions[tileIndex] ?? 0;
    const newValue = (originalValue & ~mask) | (value & mask);
    collisions[tileIndex] = newValue;
  };

  const isInBounds = (x: number, y: number) => {
    return x >= 0 && x < background.width && y >= 0 && y < background.height;
  };

  const equal = (a: number, b: number) => a === b;

  if (brush === "magic" && action.payload.tileLookup) {
    paintMagic(
      background.width,
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
  if (!background) {
    return;
  }

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

  const collisionsSize = Math.ceil(background.width * background.height);
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

    const tileIndex = background.width * y + x;
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
    return x >= 0 && x < background.width && y >= 0 && y < background.height;
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
    } & ({ drawLine?: false } | { drawLine: true; endX: number; endY: number })
  >
> = (state, action) => {
  const background = localBackgroundSelectById(
    state,
    action.payload.backgroundId,
  );
  if (!background) {
    return;
  }

  const isTileProp = action.payload.isTileProp;
  const brush = action.payload.brush;
  const drawSize = brush === "16px" ? 2 : 1;
  const tileColorsSize = Math.ceil(background.width * background.height);
  const tileColors = (background.tileColors || []).slice(0, tileColorsSize);

  if (tileColors.length < tileColorsSize) {
    for (let i = tileColors.length; i < tileColorsSize; i++) {
      tileColors[i] = 0;
    }
  }

  const getValue = (x: number, y: number) => {
    const tileColorIndex = background.width * y + x;
    if (isTileProp) {
      return tileColors[tileColorIndex] & TILE_COLOR_PROPS;
    }
    return tileColors[tileColorIndex] & TILE_COLOR_PALETTE;
  };

  const setValue = (x: number, y: number, value: number) => {
    const tileColorIndex = background.width * y + x;
    let newValue = value;
    if (isTileProp) {
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
    return x >= 0 && x < background.width && y >= 0 && y < background.height;
  };

  const equal = (a: number, b: number) => a === b;

  if (brush === "magic" && action.payload.tileLookup) {
    paintMagic(
      background.width,
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

  backgroundsAdapter.updateOne(state.backgrounds, {
    id: action.payload.backgroundId,
    changes: {
      tileColors,
    },
  });
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
