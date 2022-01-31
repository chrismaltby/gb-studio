import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
  ThunkDispatch,
  AnyAction,
  createSelector,
  CaseReducer,
  Dictionary,
} from "@reduxjs/toolkit";
import {
  DMG_PALETTE,
  COLLISION_ALL,
  TILE_PROPS,
  DRAG_PLAYER,
  DRAG_DESTINATION,
  DRAG_TRIGGER,
  DRAG_ACTOR,
} from "../../../consts";
import { isVariableField, isPropertyField } from "lib/helpers/eventSystem";
import clamp from "lib/helpers/clamp";
import { RootState } from "store/configureStore";
import settingsActions from "../settings/settingsActions";
import uuid from "uuid";
import { paint, paintLine, floodFill } from "lib/helpers/paint";
import { Brush } from "../editor/editorState";
import projectActions from "../project/projectActions";
import {
  EntitiesState,
  Actor,
  Trigger,
  Scene,
  Background,
  SpriteSheet,
  Palette,
  Music,
  Variable,
  CustomEvent,
  ScriptEvent,
  CustomEventVariable,
  CustomEventActor,
  ProjectEntitiesData,
  MusicSettings,
  EngineFieldValue,
  Metasprite,
  MetaspriteTile,
  SpriteAnimation,
  Font,
  ObjPalette,
  Avatar,
  Emote,
  SpriteState,
  ScriptEventsRef,
  ScriptEventParentType,
} from "./entitiesTypes";
import {
  normalizeEntities,
  sortByFilename,
  swap,
  matchAsset,
  isUnionVariableValue,
  isUnionPropertyValue,
  walkNormalisedScriptEvents,
} from "./entitiesHelpers";
import { clone } from "lib/helpers/clone";
import spriteActions from "../sprite/spriteActions";

const MIN_SCENE_X = 60;
const MIN_SCENE_Y = 30;
const MIN_SCENE_WIDTH = 20;
const MIN_SCENE_HEIGHT = 18;

const inodeToRecentBackground: Dictionary<Background> = {};
const inodeToRecentMusic: Dictionary<Music> = {};
const inodeToRecentFont: Dictionary<Font> = {};
const inodeToRecentAvatar: Dictionary<Avatar> = {};
const inodeToRecentEmote: Dictionary<Emote> = {};

const scriptEventsAdapter = createEntityAdapter<ScriptEvent>();
const actorsAdapter = createEntityAdapter<Actor>();
const triggersAdapter = createEntityAdapter<Trigger>();
const scenesAdapter = createEntityAdapter<Scene>();
const backgroundsAdapter = createEntityAdapter<Background>({
  sortComparer: sortByFilename,
});
const spriteSheetsAdapter = createEntityAdapter<SpriteSheet>({
  sortComparer: sortByFilename,
});
const metaspritesAdapter = createEntityAdapter<Metasprite>();
const metaspriteTilesAdapter = createEntityAdapter<MetaspriteTile>();
const spriteAnimationsAdapter = createEntityAdapter<SpriteAnimation>();
const spriteStatesAdapter = createEntityAdapter<SpriteState>();
const palettesAdapter = createEntityAdapter<Palette>();
const customEventsAdapter = createEntityAdapter<CustomEvent>();
const musicAdapter = createEntityAdapter<Music>({
  sortComparer: sortByFilename,
});
const fontsAdapter = createEntityAdapter<Font>({
  sortComparer: sortByFilename,
});
const avatarsAdapter = createEntityAdapter<Avatar>({
  sortComparer: sortByFilename,
});
const emotesAdapter = createEntityAdapter<Emote>({
  sortComparer: sortByFilename,
});
const variablesAdapter = createEntityAdapter<Variable>();
const engineFieldValuesAdapter = createEntityAdapter<EngineFieldValue>();

export const initialState: EntitiesState = {
  actors: actorsAdapter.getInitialState(),
  triggers: triggersAdapter.getInitialState(),
  scenes: scenesAdapter.getInitialState(),
  scriptEvents: scriptEventsAdapter.getInitialState(),
  backgrounds: backgroundsAdapter.getInitialState(),
  spriteSheets: spriteSheetsAdapter.getInitialState(),
  metasprites: metaspritesAdapter.getInitialState(),
  metaspriteTiles: metaspriteTilesAdapter.getInitialState(),
  spriteAnimations: spriteAnimationsAdapter.getInitialState(),
  spriteStates: spriteStatesAdapter.getInitialState(),
  palettes: palettesAdapter.getInitialState(),
  customEvents: customEventsAdapter.getInitialState(),
  music: musicAdapter.getInitialState(),
  fonts: fontsAdapter.getInitialState(),
  avatars: avatarsAdapter.getInitialState(),
  emotes: emotesAdapter.getInitialState(),
  variables: variablesAdapter.getInitialState(),
  engineFieldValues: engineFieldValuesAdapter.getInitialState(),
};

const moveSelectedEntity =
  ({ sceneId, x, y }: { sceneId: string; x: number; y: number }) =>
  (
    dispatch: ThunkDispatch<RootState, unknown, AnyAction>,
    getState: () => RootState
  ) => {
    const state = getState();
    const { dragging, scene, eventId, entityId } = state.editor;
    if (dragging === DRAG_PLAYER) {
      dispatch(settingsActions.editPlayerStartAt({ sceneId, x, y }));
    } else if (dragging === DRAG_DESTINATION) {
      dispatch(
        actions.editScriptEventDestination({
          scriptEventId: eventId,
          destSceneId: sceneId,
          x,
          y,
        })
      );
    } else if (dragging === DRAG_ACTOR) {
      dispatch(
        actions.moveActor({
          actorId: entityId,
          sceneId: scene,
          newSceneId: sceneId,
          x,
          y,
        })
      );
    } else if (dragging === DRAG_TRIGGER) {
      dispatch(
        actions.moveTrigger({
          sceneId: scene,
          triggerId: entityId,
          newSceneId: sceneId,
          x,
          y,
        })
      );
    }
  };

const removeSelectedEntity =
  () =>
  (
    dispatch: ThunkDispatch<RootState, unknown, AnyAction>,
    getState: () => RootState
  ) => {
    const state = getState();
    const { scene, entityId, type: editorType } = state.editor;
    if (editorType === "scene") {
      dispatch(actions.removeScene({ sceneId: scene }));
    } else if (editorType === "trigger") {
      dispatch(actions.removeTrigger({ sceneId: scene, triggerId: entityId }));
    } else if (editorType === "actor") {
      dispatch(actions.removeActor({ sceneId: scene, actorId: entityId }));
    }
  };

const first = <T>(array: T[]): T | undefined => {
  if (array[0]) {
    return array[0];
  }
  return undefined;
};

/**************************************************************************
 * Project
 */

const loadProject: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: ProjectEntitiesData;
  }>
> = (state, action) => {
  const data = normalizeEntities(action.payload.data);
  const entities = data.entities;
  actorsAdapter.setAll(state.actors, entities.actors || {});
  triggersAdapter.setAll(state.triggers, entities.triggers || {});
  scenesAdapter.setAll(state.scenes, entities.scenes || {});
  scriptEventsAdapter.setAll(state.scriptEvents, entities.scriptEvents || {});
  backgroundsAdapter.setAll(state.backgrounds, entities.backgrounds || {});
  spriteSheetsAdapter.setAll(state.spriteSheets, entities.spriteSheets || {});
  metaspritesAdapter.setAll(state.metasprites, entities.metasprites || {});
  metaspriteTilesAdapter.setAll(
    state.metaspriteTiles,
    entities.metaspriteTiles || {}
  );
  spriteAnimationsAdapter.setAll(
    state.spriteAnimations,
    entities.spriteAnimations || {}
  );
  spriteStatesAdapter.setAll(state.spriteStates, entities.spriteStates || {});
  palettesAdapter.setAll(state.palettes, entities.palettes || {});
  musicAdapter.setAll(state.music, entities.music || {});
  fontsAdapter.setAll(state.fonts, entities.fonts || {});
  avatarsAdapter.setAll(state.avatars, entities.avatars || {});
  emotesAdapter.setAll(state.emotes, entities.emotes || {});
  customEventsAdapter.setAll(state.customEvents, entities.customEvents || {});
  variablesAdapter.setAll(state.variables, entities.variables || {});
  engineFieldValuesAdapter.setAll(
    state.engineFieldValues,
    entities.engineFieldValues || {}
  );
  fixAllScenesWithModifiedBackgrounds(state);
};

const loadBackground: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: Background;
  }>
> = (state, action) => {
  const backgrounds = localBackgroundSelectors.selectAll(state);
  const existingAsset =
    backgrounds.find(matchAsset(action.payload.data)) ||
    inodeToRecentBackground[action.payload.data.inode];
  const existingId = existingAsset?.id;

  if (existingId) {
    delete inodeToRecentBackground[action.payload.data.inode];
    backgroundsAdapter.upsertOne(state.backgrounds, {
      ...existingAsset,
      ...action.payload.data,
      id: existingId,
    });
    fixAllScenesWithModifiedBackgrounds(state);
  } else {
    backgroundsAdapter.addOne(state.backgrounds, action.payload.data);
  }
};

const removeBackground: CaseReducer<
  EntitiesState,
  PayloadAction<{
    filename: string;
    plugin: string | undefined;
  }>
> = (state, action) => {
  const backgrounds = localBackgroundSelectors.selectAll(state);
  const existingAsset = backgrounds.find(matchAsset(action.payload));
  if (existingAsset) {
    inodeToRecentBackground[existingAsset.inode] = clone(existingAsset);
    backgroundsAdapter.removeOne(state.backgrounds, existingAsset.id);
  }
};

const loadSprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: SpriteSheet;
  }>
> = (state, action) => {
  if (action.payload.data.states.length === 0) {
    // Create default state for newly added spritesheets
    const metasprites: Metasprite[] = Array.from(Array(8)).map(() => ({
      id: uuid(),
      tiles: [],
    }));
    const animations: SpriteAnimation[] = metasprites.map((metasprite) => ({
      id: uuid(),
      frames: [metasprite.id],
    }));
    const animationIds = animations.map((a) => a.id);
    const spriteState: SpriteState = {
      id: uuid(),
      name: "",
      animationType: "multi_movement",
      flipLeft: true,
      animations: animationIds,
    };
    metaspritesAdapter.addMany(state.metasprites, metasprites);
    spriteAnimationsAdapter.addMany(state.spriteAnimations, animations);
    spriteStatesAdapter.addOne(state.spriteStates, spriteState);
    spriteSheetsAdapter.upsertOne(state.spriteSheets, {
      ...action.payload.data,
      states: [spriteState.id],
    });
  } else {
    spriteSheetsAdapter.upsertOne(state.spriteSheets, action.payload.data);
  }
};

const loadDetectedSprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteAnimations: SpriteAnimation[];
    spriteStates: SpriteState[];
    metasprites: Metasprite[];
    metaspriteTiles: MetaspriteTile[];
    state: SpriteState;
    changes: Partial<SpriteSheet>;
  }>
> = (state, action) => {
  const spriteSheet = localSpriteSheetSelectors.selectById(
    state,
    action.payload.spriteSheetId
  );

  if (!spriteSheet) {
    return;
  }

  metaspriteTilesAdapter.addMany(
    state.metaspriteTiles,
    action.payload.metaspriteTiles
  );

  metaspritesAdapter.addMany(state.metasprites, action.payload.metasprites);

  spriteAnimationsAdapter.addMany(
    state.spriteAnimations,
    action.payload.spriteAnimations
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

const removeSprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    filename: string;
    plugin: string | undefined;
  }>
> = (state, action) => {
  const spriteSheets = localSpriteSheetSelectors.selectAll(state);
  const existingAsset = spriteSheets.find(matchAsset(action.payload));
  if (existingAsset) {
    spriteSheetsAdapter.removeOne(state.spriteSheets, existingAsset.id);
  }
};

const loadMusic: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: Music;
  }>
> = (state, action) => {
  const music = localMusicSelectors.selectAll(state);
  const existingAsset =
    music.find(matchAsset(action.payload.data)) ||
    inodeToRecentMusic[action.payload.data.inode];
  const existingId = existingAsset?.id;

  if (existingId) {
    delete inodeToRecentMusic[action.payload.data.inode];
    musicAdapter.upsertOne(state.music, {
      ...existingAsset,
      ...action.payload.data,
      id: existingId,
      settings: {
        ...existingAsset?.settings,
        ...action.payload.data.settings,
      },
    });
  } else {
    musicAdapter.addOne(state.music, action.payload.data);
  }
};

const editMusicSettings: CaseReducer<
  EntitiesState,
  PayloadAction<{ musicId: string; changes: Partial<MusicSettings> }>
> = (state, action) => {
  const music = localMusicSelectors.selectById(state, action.payload.musicId);
  if (music) {
    musicAdapter.updateOne(state.music, {
      id: music.id,
      changes: {
        settings: {
          ...music.settings,
          ...action.payload.changes,
        },
      },
    });
  }
};

const removeMusic: CaseReducer<
  EntitiesState,
  PayloadAction<{
    filename: string;
    plugin: string | undefined;
  }>
> = (state, action) => {
  const music = localMusicSelectors.selectAll(state);
  const existingAsset = music.find(matchAsset(action.payload));
  if (existingAsset) {
    inodeToRecentMusic[existingAsset.inode] = clone(existingAsset);
    musicAdapter.removeOne(state.music, existingAsset.id);
  }
};

const loadFont: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: Font;
  }>
> = (state, action) => {
  const fonts = localFontSelectors.selectAll(state);
  const existingAsset =
    fonts.find(matchAsset(action.payload.data)) ||
    inodeToRecentFont[action.payload.data.inode];
  const existingId = existingAsset?.id;

  if (existingId) {
    delete inodeToRecentFont[action.payload.data.inode];
    fontsAdapter.upsertOne(state.fonts, {
      ...existingAsset,
      ...action.payload.data,
      id: existingId,
    });
  } else {
    fontsAdapter.addOne(state.fonts, action.payload.data);
  }
};

const removeFont: CaseReducer<
  EntitiesState,
  PayloadAction<{
    filename: string;
    plugin: string | undefined;
  }>
> = (state, action) => {
  const fonts = localFontSelectors.selectAll(state);
  const existingAsset = fonts.find(matchAsset(action.payload));
  if (existingAsset) {
    inodeToRecentFont[existingAsset.inode] = clone(existingAsset);
    fontsAdapter.removeOne(state.fonts, existingAsset.id);
  }
};

const loadAvatar: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: Avatar;
  }>
> = (state, action) => {
  const avatars = localAvatarSelectors.selectAll(state);
  const existingAsset =
    avatars.find(matchAsset(action.payload.data)) ||
    inodeToRecentAvatar[action.payload.data.inode];
  const existingId = existingAsset?.id;

  if (existingId) {
    delete inodeToRecentAvatar[action.payload.data.inode];
    avatarsAdapter.upsertOne(state.avatars, {
      ...existingAsset,
      ...action.payload.data,
      id: existingId,
    });
  } else {
    avatarsAdapter.addOne(state.avatars, action.payload.data);
  }
};

const removeAvatar: CaseReducer<
  EntitiesState,
  PayloadAction<{
    filename: string;
    plugin: string | undefined;
  }>
> = (state, action) => {
  const avatars = localAvatarSelectors.selectAll(state);
  const existingAsset = avatars.find(matchAsset(action.payload));
  if (existingAsset) {
    inodeToRecentAvatar[existingAsset.inode] = clone(existingAsset);
    avatarsAdapter.removeOne(state.avatars, existingAsset.id);
  }
};

const loadEmote: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: Emote;
  }>
> = (state, action) => {
  const emotes = localEmoteSelectors.selectAll(state);
  const existingAsset =
    emotes.find(matchAsset(action.payload.data)) ||
    inodeToRecentEmote[action.payload.data.inode];
  const existingId = existingAsset?.id;

  if (existingId) {
    delete inodeToRecentEmote[action.payload.data.inode];
    emotesAdapter.upsertOne(state.emotes, {
      ...existingAsset,
      ...action.payload.data,
      id: existingId,
    });
  } else {
    emotesAdapter.addOne(state.emotes, action.payload.data);
  }
};

const removeEmote: CaseReducer<
  EntitiesState,
  PayloadAction<{
    filename: string;
    plugin: string | undefined;
  }>
> = (state, action) => {
  const emotes = localEmoteSelectors.selectAll(state);
  const existingAsset = emotes.find(matchAsset(action.payload));
  if (existingAsset) {
    inodeToRecentEmote[existingAsset.inode] = clone(existingAsset);
    emotesAdapter.removeOne(state.emotes, existingAsset.id);
  }
};

const fixAllScenesWithModifiedBackgrounds = (state: EntitiesState) => {
  const scenes = localSceneSelectors.selectAll(state);
  for (const scene of scenes) {
    const background = localBackgroundSelectors.selectById(
      state,
      scene.backgroundId
    );
    if (
      !background ||
      scene.width !== background.width ||
      scene.height !== background.height
    ) {
      scene.width = background ? background.width : 32;
      scene.height = background ? background.height : 32;
      scene.collisions = [];
    }
  }
};

/**************************************************************************
 * Scenes
 */

const addScene: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    x: number;
    y: number;
    defaults?: Partial<Scene>;
    variables?: Variable[];
  }>
> = (state, action) => {
  const scenesTotal = localSceneSelectors.selectTotal(state);
  const backgroundId = String(localBackgroundSelectors.selectIds(state)[0]);
  const background = localBackgroundSelectors.selectById(state, backgroundId);

  const newScene: Scene = {
    name: `Scene ${scenesTotal + 1}`,
    backgroundId,
    width: Math.max(MIN_SCENE_WIDTH, background?.width || 0),
    height: Math.max(MIN_SCENE_HEIGHT, background?.height || 0),
    type: "TOPDOWN",
    paletteIds: [],
    spritePaletteIds: [],
    collisions: [],
    autoFadeSpeed: 1,
    ...(action.payload.defaults || {}),
    id: action.payload.sceneId,
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

const moveScene: CaseReducer<
  EntitiesState,
  PayloadAction<{ sceneId: string; x: number; y: number }>
> = (state, action) => {
  scenesAdapter.updateOne(state.scenes, {
    id: action.payload.sceneId,
    changes: {
      x: Math.max(MIN_SCENE_X, action.payload.x),
      y: Math.max(MIN_SCENE_Y, action.payload.y),
    },
  });
};

const editScene: CaseReducer<
  EntitiesState,
  PayloadAction<{ sceneId: string; changes: Partial<Scene> }>
> = (state, action) => {
  const scene = state.scenes.entities[action.payload.sceneId];
  const patch = { ...action.payload.changes };

  if (!scene) {
    return;
  }

  if (patch.backgroundId) {
    const otherScene = localSceneSelectors.selectAll(state).find((s) => {
      return s.backgroundId === patch.backgroundId;
    });

    const actors = localActorSelectors.selectEntities(state);
    const triggers = localTriggerSelectors.selectEntities(state);

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

const removeScene: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
  }>
> = (state, action) => {
  scenesAdapter.removeOne(state.scenes, action.payload.sceneId);
};

/**************************************************************************
 * Actors
 */

const addActor: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    sceneId: string;
    x: number;
    y: number;
    defaults?: Partial<Actor>;
    variables?: Variable[];
  }>
> = (state, action) => {
  const scene = localSceneSelectors.selectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  const spriteSheetId = first(localSpriteSheetSelectors.selectAll(state))?.id;
  if (!spriteSheetId) {
    return;
  }

  // Add any variables from clipboard
  if (action.payload.defaults?.id && action.payload.variables) {
    const newVariables = action.payload.variables.map((variable) => {
      return {
        ...variable,
        id: variable.id.replace(
          action.payload.defaults?.id || "",
          action.payload.actorId
        ),
      };
    });
    variablesAdapter.upsertMany(state.variables, newVariables);
  }

  const newActor: Actor = {
    name: "",
    frame: 0,
    animate: false,
    spriteSheetId,
    direction: "down",
    moveSpeed: 1,
    animSpeed: 15,
    paletteId: "",
    isPinned: false,
    collisionGroup: "",
    ...(action.payload.defaults || {}),
    script: [],
    startScript: [],
    updateScript: [],
    hit1Script: [],
    hit2Script: [],
    hit3Script: [],
    id: action.payload.actorId,
    x: clamp(action.payload.x, 0, scene.width - 2),
    y: clamp(action.payload.y, 0, scene.height - 1),
  };

  // Add to scene
  scene.actors = ([] as string[]).concat(scene.actors, newActor.id);
  actorsAdapter.addOne(state.actors, newActor);
};

const editActor: CaseReducer<
  EntitiesState,
  PayloadAction<{ actorId: string; changes: Partial<Actor> }>
> = (state, action) => {
  const actor = localActorSelectors.selectById(state, action.payload.actorId);
  const patch = { ...action.payload.changes };

  if (!actor) {
    return;
  }

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: patch,
  });
};

const moveActor: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    sceneId: string;
    newSceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const newScene = localSceneSelectors.selectById(
    state,
    action.payload.newSceneId
  );
  if (!newScene) {
    return;
  }

  if (action.payload.sceneId !== action.payload.newSceneId) {
    const prevScene = localSceneSelectors.selectById(
      state,
      action.payload.sceneId
    );
    if (!prevScene) {
      return;
    }

    // Remove from previous scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.sceneId,
      changes: {
        actors: prevScene.actors.filter((actorId) => {
          return actorId !== action.payload.actorId;
        }),
      },
    });

    // Add to new scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.newSceneId,
      changes: {
        actors: ([] as string[]).concat(
          newScene.actors,
          action.payload.actorId
        ),
      },
    });
  }

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      x: clamp(action.payload.x, 0, newScene.width - 2),
      y: clamp(action.payload.y, 0, newScene.height - 1),
    },
  });
};

const removeActor: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    sceneId: string;
  }>
> = (state, action) => {
  const scene = localSceneSelectors.selectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  // Remove from scene
  scenesAdapter.updateOne(state.scenes, {
    id: action.payload.sceneId,
    changes: {
      actors: scene.actors.filter((actorId) => {
        return actorId !== action.payload.actorId;
      }),
    },
  });

  actorsAdapter.removeOne(state.actors, action.payload.actorId);
};

const removeActorAt: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const scene = localSceneSelectors.selectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  const removeActorId = scene.actors.find((actorId) => {
    const actor = localActorSelectors.selectById(state, actorId);
    return (
      actor &&
      (actor.x === action.payload.x || actor.x === action.payload.x - 1) &&
      (actor.y === action.payload.y || actor.y === action.payload.y + 1)
    );
  });

  if (removeActorId) {
    // Remove from scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.sceneId,
      changes: {
        actors: scene.actors.filter((actorId) => {
          return actorId !== removeActorId;
        }),
      },
    });
    // Remove actor
    actorsAdapter.removeOne(state.actors, removeActorId);
  }
};

/**************************************************************************
 * Triggers
 */

const addTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    sceneId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    defaults?: Partial<Trigger>;
    // variables?: Variable[];
  }>
> = (state, action) => {
  const scene = localSceneSelectors.selectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const width = Math.min(action.payload.width, scene.width);
  const height = Math.min(action.payload.height, scene.height);

  const newTrigger: Trigger = {
    name: "",
    ...(action.payload.defaults || {}),
    id: action.payload.triggerId,
    x: clamp(action.payload.x, 0, scene.width - width),
    y: clamp(action.payload.y, 0, scene.height - height),
    width,
    height,
    script: [],
    leaveScript: [],
  };

  // Add to scene
  scene.triggers = ([] as string[]).concat(scene.triggers, newTrigger.id);
  triggersAdapter.addOne(state.triggers, newTrigger);
};

const editTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{ triggerId: string; changes: Partial<Trigger> }>
> = (state, action) => {
  const patch = { ...action.payload.changes };

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: patch,
  });
};

const moveTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    sceneId: string;
    newSceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectors.selectById(
    state,
    action.payload.triggerId
  );
  if (!trigger) {
    return;
  }

  const newScene = localSceneSelectors.selectById(
    state,
    action.payload.newSceneId
  );
  if (!newScene) {
    return;
  }

  if (action.payload.sceneId !== action.payload.newSceneId) {
    const prevScene = localSceneSelectors.selectById(
      state,
      action.payload.sceneId
    );
    if (!prevScene) {
      return;
    }

    // Remove from previous scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.sceneId,
      changes: {
        triggers: prevScene.triggers.filter((triggerId) => {
          return triggerId !== action.payload.triggerId;
        }),
      },
    });

    // Add to new scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.newSceneId,
      changes: {
        triggers: ([] as string[]).concat(
          newScene.triggers,
          action.payload.triggerId
        ),
      },
    });
  }

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      x: clamp(action.payload.x, 0, newScene.width - trigger.width),
      y: clamp(action.payload.y, 0, newScene.height - trigger.height),
    },
  });
};

const resizeTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    x: number;
    y: number;
    startX: number;
    startY: number;
  }>
> = (state, action) => {
  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      x: Math.min(action.payload.x, action.payload.startX),
      y: Math.min(action.payload.y, action.payload.startY),
      width: Math.abs(action.payload.x - action.payload.startX) + 1,
      height: Math.abs(action.payload.y - action.payload.startY) + 1,
    },
  });
};

const removeTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    sceneId: string;
  }>
> = (state, action) => {
  const scene = localSceneSelectors.selectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  // Remove from scene
  scenesAdapter.updateOne(state.scenes, {
    id: action.payload.sceneId,
    changes: {
      triggers: scene.triggers.filter((triggerId) => {
        return triggerId !== action.payload.triggerId;
      }),
    },
  });

  triggersAdapter.removeOne(state.triggers, action.payload.triggerId);
};

const removeTriggerAt: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const scene = localSceneSelectors.selectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const removeTriggerId = scene.triggers.find((triggerId) => {
    const trigger = localTriggerSelectors.selectById(state, triggerId);
    return (
      trigger &&
      action.payload.x >= trigger.x &&
      action.payload.x < trigger.x + trigger.width &&
      action.payload.y >= trigger.y &&
      action.payload.y < trigger.y + trigger.height
    );
  });

  if (removeTriggerId) {
    // Remove from scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.sceneId,
      changes: {
        triggers: scene.triggers.filter((triggerId) => {
          return triggerId !== removeTriggerId;
        }),
      },
    });

    triggersAdapter.removeOne(state.triggers, removeTriggerId);
  }
};

/**************************************************************************
 * Sprite Sheets
 */

const editSpriteSheet: CaseReducer<
  EntitiesState,
  PayloadAction<{ spriteSheetId: string; changes: Partial<SpriteSheet> }>
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

/**************************************************************************
 * Metasprites
 */

const addMetasprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    metaspriteId: string;
    spriteAnimationId: string;
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];

  if (!spriteAnimation) {
    return;
  }

  const newMetasprite: Metasprite = {
    id: action.payload.metaspriteId,
    tiles: [],
  };

  // Add to sprite animation
  spriteAnimation.frames = ([] as string[]).concat(
    spriteAnimation.frames,
    newMetasprite.id
  );
  metaspritesAdapter.addOne(state.metasprites, newMetasprite);
};

const cloneMetasprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteAnimationId: string;
    metaspriteId: string;
    newMetaspriteId: string;
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];
  const metasprite = state.metasprites.entities[action.payload.metaspriteId];

  if (!spriteAnimation || !metasprite) {
    return;
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
    id: action.payload.newMetaspriteId,
    tiles: newMetaspriteTiles.map((tile) => tile.id),
  };

  // Add to sprite animation
  spriteAnimation.frames = ([] as string[]).concat(
    spriteAnimation.frames,
    newMetasprite.id
  );
  metaspritesAdapter.addOne(state.metasprites, newMetasprite);
  metaspriteTilesAdapter.addMany(state.metaspriteTiles, newMetaspriteTiles);
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
      (tileId) => !action.payload.metaspriteTileIds.includes(tileId)
    ),
    action.payload.metaspriteTileIds
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
      (tileId) => !action.payload.metaspriteTileIds.includes(tileId)
    )
  );

  metaspritesAdapter.updateOne(state.metasprites, {
    id: action.payload.metaspriteId,
    changes: {
      tiles: newTiles,
    },
  });
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
    (frameId) => frameId !== action.payload.metaspriteId
  );

  metaspritesAdapter.removeOne(state.metasprites, action.payload.metaspriteId);
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
    newMetaspriteTile.id
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
    }))
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
    (tileId) => !action.payload.metaspriteTileIds.includes(tileId)
  );

  metaspriteTilesAdapter.removeMany(
    state.metaspriteTiles,
    action.payload.metaspriteTileIds
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
        tile.x <= minX || tile.x >= maxX || tile.y <= minY || tile.y >= maxY
    )
    .map((tile) => tile.id);

  metasprite.tiles = metasprite.tiles.filter(
    (tileId) => !removeMetaspriteTiles.includes(tileId)
  );

  metaspriteTilesAdapter.removeMany(
    state.metaspriteTiles,
    removeMetaspriteTiles
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
    changes: Partial<SpriteAnimation>;
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

const swapSpriteAnimationFrames: CaseReducer<
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

  const newFrames = swap(
    action.payload.fromIndex,
    action.payload.toIndex,
    spriteAnimation.frames
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

  const newMetasprites: Metasprite[] = eightElements.map(() => ({
    id: uuid(),
    tiles: [],
  }));

  metaspritesAdapter.addMany(state.metasprites, newMetasprites);

  const newAnimations: SpriteAnimation[] = eightElements.map((_, index) => ({
    id: uuid(),
    frames: [newMetasprites[index].id],
  }));

  spriteAnimationsAdapter.addMany(state.spriteAnimations, newAnimations);

  const newSpriteState: SpriteState = {
    id: action.payload.spriteStateId,
    name: sprite.states.length > 0 ? "New State" : "",
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
  PayloadAction<{ spriteStateId: string; changes: Partial<SpriteState> }>
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
  const spriteSheet = localSpriteSheetSelectors.selectById(
    state,
    action.payload.spriteSheetId
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
    action.payload.spriteStateId
  );
};

/**************************************************************************
 * Paint Helpers
 */

const paintCollision: CaseReducer<
  EntitiesState,
  PayloadAction<
    {
      sceneId: string;
      x: number;
      y: number;
      value: number;
      brush: Brush;
      isTileProp: boolean;
    } & ({ drawLine: false } | { drawLine: true; endX: number; endY: number })
  >
> = (state, action) => {
  const scene = localSceneSelectors.selectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const background = localBackgroundSelectors.selectById(
    state,
    scene.backgroundId
  );
  if (!background) {
    return;
  }

  const isTileProp = action.payload.isTileProp;
  const brush = action.payload.brush;
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
    let newValue = value;
    if (isTileProp) {
      // If is prop keep previous collision value
      newValue = (collisions[tileIndex] & COLLISION_ALL) + (value & TILE_PROPS);
    } else if (value !== 0) {
      // If is collision keep prop unless erasing
      newValue = (value & COLLISION_ALL) + (collisions[tileIndex] & TILE_PROPS);
    }
    collisions[tileIndex] = newValue;
  };

  const isInBounds = (x: number, y: number) => {
    return x >= 0 && x < background.width && y >= 0 && y < background.height;
  };

  const equal = (a: number, b: number) => a === b;

  if (brush === "fill") {
    floodFill(
      action.payload.x,
      action.payload.y,
      action.payload.value,
      getValue,
      setValue,
      isInBounds,
      equal
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
      isInBounds
    );
  } else {
    paint(
      action.payload.x,
      action.payload.y,
      drawSize,
      action.payload.value,
      setValue,
      isInBounds
    );
  }

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
      x: number;
      y: number;
      paletteIndex: number;
      brush: Brush;
    } & ({ drawLine: false } | { drawLine: true; endX: number; endY: number })
  >
> = (state, action) => {
  const background = localBackgroundSelectors.selectById(
    state,
    action.payload.backgroundId
  );
  if (!background) {
    return;
  }

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
    return tileColors[tileColorIndex];
  };

  const setValue = (x: number, y: number, value: number) => {
    const tileColorIndex = background.width * y + x;
    tileColors[tileColorIndex] = value;
  };

  const isInBounds = (x: number, y: number) => {
    return x >= 0 && x < background.width && y >= 0 && y < background.height;
  };

  const equal = (a: number, b: number) => a === b;

  if (brush === "fill") {
    floodFill(
      action.payload.x,
      action.payload.y,
      action.payload.paletteIndex,
      getValue,
      setValue,
      isInBounds,
      equal
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
      isInBounds
    );
  } else {
    paint(
      action.payload.x,
      action.payload.y,
      drawSize,
      action.payload.paletteIndex,
      setValue,
      isInBounds
    );
  }

  backgroundsAdapter.updateOne(state.backgrounds, {
    id: action.payload.backgroundId,
    changes: {
      tileColors,
    },
  });
};

/**************************************************************************
 * Variables
 */

const renameVariable: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string; name: string }>
> = (state, action) => {
  if (action.payload.name) {
    variablesAdapter.upsertOne(state.variables, {
      id: action.payload.variableId,
      name: action.payload.name,
    });
  } else {
    variablesAdapter.removeOne(state.variables, action.payload.variableId);
  }
};

/**************************************************************************
 * Palettes
 */

const addPalette: CaseReducer<
  EntitiesState,
  PayloadAction<{ paletteId: string }>
> = (state, action) => {
  const newPalette: Palette = {
    id: action.payload.paletteId,
    name: `Palette ${localPaletteSelectors.selectTotal(state) + 1}`,
    colors: [
      DMG_PALETTE.colors[0],
      DMG_PALETTE.colors[1],
      DMG_PALETTE.colors[2],
      DMG_PALETTE.colors[3],
    ],
  };
  palettesAdapter.addOne(state.palettes, newPalette);
};

const editPalette: CaseReducer<
  EntitiesState,
  PayloadAction<{ paletteId: string; changes: Partial<Palette> }>
> = (state, action) => {
  const patch = { ...action.payload.changes };

  palettesAdapter.updateOne(state.palettes, {
    id: action.payload.paletteId,
    changes: patch,
  });
};

const removePalette: CaseReducer<
  EntitiesState,
  PayloadAction<{ paletteId: string }>
> = (state, action) => {
  palettesAdapter.removeOne(state.palettes, action.payload.paletteId);
};

/**************************************************************************
 * Custom Events
 */

const addCustomEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{ customEventId: string; defaults?: Partial<CustomEvent> }>
> = (state, action) => {
  const newCustomEvent: CustomEvent = {
    id: action.payload.customEventId,
    name: "",
    description: "",
    variables: {},
    actors: {},
    ...(action.payload.defaults || {}),
    script: [],
  };
  customEventsAdapter.addOne(state.customEvents, newCustomEvent);
};

const editCustomEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    customEventId: string;
    changes: Partial<CustomEvent>;
  }>
> = (state, action) => {
  const patch = { ...action.payload.changes };
  customEventsAdapter.updateOne(state.customEvents, {
    id: action.payload.customEventId,
    changes: patch,
  });
};

const removeCustomEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{ customEventId: string }>
> = (state, action) => {
  customEventsAdapter.removeOne(
    state.customEvents,
    action.payload.customEventId
  );
};

const refreshCustomEventArgs: CaseReducer<
  EntitiesState,
  PayloadAction<{ customEventId: string }>
> = (state, action) => {
  const customEvent = state.customEvents.entities[action.payload.customEventId];
  if (!customEvent) {
    return;
  }

  const variables = {} as Dictionary<CustomEventVariable>;
  const actors = {} as Dictionary<CustomEventActor>;
  const oldVariables = customEvent.variables;
  const oldActors = customEvent.actors;

  walkNormalisedScriptEvents(
    customEvent.script,
    state.scriptEvents.entities,
    undefined,
    (scriptEvent) => {
      const args = scriptEvent.args;
      if (!args) return;
      if (args.__comment) return;
      if (
        args.actorId &&
        args.actorId !== "player" &&
        args.actorId !== "$self$" &&
        typeof args.actorId === "string"
      ) {
        const letter = String.fromCharCode(
          "A".charCodeAt(0) + parseInt(args.actorId)
        );
        actors[args.actorId] = {
          id: args.actorId,
          name: oldActors[args.actorId]?.name || `Actor ${letter}`,
        };
      }
      if (
        args.otherActorId &&
        args.otherActorId !== "player" &&
        args.otherActorId !== "$self$" &&
        typeof args.otherActorId === "string"
      ) {
        const letter = String.fromCharCode(
          "A".charCodeAt(0) + parseInt(args.otherActorId)
        );
        actors[args.otherActorId] = {
          id: args.otherActorId,
          name: oldActors[args.otherActorId]?.name || `Actor ${letter}`,
        };
      }
      Object.keys(args).forEach((arg) => {
        if (isVariableField(scriptEvent.command, arg, args)) {
          const addVariable = (variable: string) => {
            const letter = String.fromCharCode(
              "A".charCodeAt(0) + parseInt(variable)
            );
            variables[variable] = {
              id: variable,
              name: oldVariables[variable]?.name || `Variable ${letter}`,
            };
          };
          const variable = args[arg];
          if (isUnionVariableValue(variable) && variable.value) {
            addVariable(variable.value);
          } else if (typeof variable === "string") {
            addVariable(variable);
          }
        }
        if (isPropertyField(scriptEvent.command, arg, args)) {
          const addPropertyActor = (property: string) => {
            const actor = property && property.replace(/:.*/, "");
            if (actor !== "player" && actor !== "$self$") {
              const letter = String.fromCharCode(
                "A".charCodeAt(0) + parseInt(actor)
              );
              actors[actor] = {
                id: actor,
                name: oldActors[actor]?.name || `Actor ${letter}`,
              };
            }
          };
          const property = args[arg];
          if (isUnionPropertyValue(property) && property.value) {
            addPropertyActor(property.value);
          } else if (typeof property === "string") {
            addPropertyActor(property);
          }
        }
      });
      if (args.text || args.expression) {
        let text;
        if (args.text) {
          text = Array.isArray(args.text) ? args.text.join() : args.text;
        } else if (args.expression) {
          text = args.expression;
        }
        if (text && typeof text === "string") {
          const variablePtrs = text.match(/\$V[0-9]\$/g);
          if (variablePtrs) {
            variablePtrs.forEach((variablePtr: string) => {
              const variable = variablePtr[2];
              const letter = String.fromCharCode(
                "A".charCodeAt(0) + parseInt(variable, 10)
              ).toUpperCase();
              variables[variable] = {
                id: variable,
                name: oldVariables[variable]?.name || `Variable ${letter}`,
              };
            });
          }
        }
      }
    }
  );

  customEvent.variables = variables;
  customEvent.actors = actors;
};

/**************************************************************************
 * Script Events
 */

const selectScriptIds = (
  state: EntitiesState,
  parentType: ScriptEventParentType,
  parentId: string,
  parentKey: string
): string[] | undefined => {
  if (parentType === "scene") {
    const scene = state.scenes.entities[parentId];
    if (!scene) return;
    const script = scene[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (scene[parentKey as "script"] = []);
    return newScript;
  } else if (parentType === "scriptEvent") {
    const scriptEvent = state.scriptEvents.entities[parentId];
    if (!scriptEvent) return;
    const script = scriptEvent.children?.[parentKey];
    if (script) {
      return script;
    }
    if (!scriptEvent.children) {
      scriptEvent.children = {
        [parentKey]: [],
      };
      return scriptEvent.children?.[parentKey];
    } else {
      scriptEvent.children[parentKey] = [];
      return scriptEvent.children[parentKey];
    }
  } else if (parentType === "actor") {
    const actor = state.actors.entities[parentId];
    if (!actor) return;
    const script = actor[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (actor[parentKey as "script"] = []);
    return newScript;
  } else if (parentType === "trigger") {
    const trigger = state.triggers.entities[parentId];
    if (!trigger) return;
    const script = trigger[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (trigger[parentKey as "script"] = []);
    return newScript;
  } else if (parentType === "customEvent") {
    const customEvent = state.customEvents.entities[parentId];
    if (!customEvent) return;
    const script = customEvent[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (customEvent[parentKey as "script"] = []);
    return newScript;
  }
};

const selectScriptIdsByRef = (
  state: EntitiesState,
  location: ScriptEventsRef
): string[] | undefined => {
  return selectScriptIds(
    state,
    location.parentType,
    location.parentId,
    location.parentKey
  );
};

const addScriptEvents: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventIds: string[];
    entityId: string;
    type: ScriptEventParentType;
    key: string;
    insertId?: string;
    before?: boolean;
    data: Omit<ScriptEvent, "id">[];
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.type,
    action.payload.entityId,
    action.payload.key
  );

  if (!script) {
    return;
  }

  const newScriptEvents = action.payload.data.map(
    (scriptEventData, scriptEventIndex) => {
      const newScriptEvent: ScriptEvent = {
        ...scriptEventData,
        id: action.payload.scriptEventIds[scriptEventIndex],
      };
      if (scriptEventData.children) {
        newScriptEvent.children = Object.keys(scriptEventData.children).reduce(
          (memo, key) => {
            memo[key] = [];
            return memo;
          },
          {} as Dictionary<string[]>
        );
      }
      return newScriptEvent;
    }
  );

  const insertIndex = action.payload.insertId
    ? Math.max(
        0,
        script.indexOf(action.payload.insertId || "") +
          (action.payload.before ? 0 : 1)
      )
    : script.length;

  scriptEventsAdapter.addMany(state.scriptEvents, newScriptEvents);
  script.splice(insertIndex, 0, ...action.payload.scriptEventIds);
};

const moveScriptEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    from: ScriptEventsRef;
    to: ScriptEventsRef;
  }>
> = (state, action) => {
  const from = selectScriptIdsByRef(state, action.payload.from);
  const to = selectScriptIdsByRef(state, action.payload.to);
  if (!from || !to) {
    return;
  }

  const fromIndex = from.indexOf(action.payload.from.scriptEventId);
  let toIndex = to.indexOf(action.payload.to.scriptEventId);
  if (fromIndex === -1) {
    return;
  }
  if (toIndex === -1) {
    toIndex = to.length;
  }

  from.splice(fromIndex, 1);
  if (from === to && fromIndex < toIndex) {
    toIndex--;
  }
  to.splice(
    Math.min(Math.max(toIndex, 0), to.length),
    0,
    action.payload.from.scriptEventId
  );
};

const editScriptEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    changes: Partial<ScriptEvent>;
  }>
> = (state, action) => {
  scriptEventsAdapter.updateOne(state.scriptEvents, {
    id: action.payload.scriptEventId,
    changes: action.payload.changes,
  });
};

const toggleScriptEventOpen: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  scriptEvent.args.__collapse = !scriptEvent.args.__collapse;
};

const toggleScriptEventComment: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  scriptEvent.args.__comment = !scriptEvent.args.__comment;
};

const toggleScriptEventDisableElse: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  scriptEvent.args.__disableElse = !scriptEvent.args.__disableElse;
};

const editScriptEventArg: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    key: string;
    value: unknown;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  scriptEvent.args[action.payload.key] = action.payload.value;
};

const editScriptEventDestination: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    destSceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  scriptEvent.args = {
    ...scriptEvent.args,
    sceneId: action.payload.destSceneId,
    x: action.payload.x,
    y: action.payload.y,
  };
};

const editScriptEventLabel: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    value: string;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  scriptEvent.args.__label = action.payload.value;
};

const resetScript: CaseReducer<
  EntitiesState,
  PayloadAction<{
    entityId: string;
    type: ScriptEventParentType;
    key: string;
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.type,
    action.payload.entityId,
    action.payload.key
  );
  if (script) {
    script.splice(0, script.length);
  }
};

const removeScriptEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    entityId: string;
    type: ScriptEventParentType;
    key: string;
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.type,
    action.payload.entityId,
    action.payload.key
  );

  if (!script) {
    return;
  }

  const eventIndex = script.indexOf(action.payload.scriptEventId);
  if (eventIndex === -1) {
    return;
  }

  script.splice(eventIndex, 1);
  scriptEventsAdapter.removeOne(
    state.scriptEvents,
    action.payload.scriptEventId
  );
};

/**************************************************************************
 * Engine Field Values
 */

const editEngineFieldValue: CaseReducer<
  EntitiesState,
  PayloadAction<{
    engineFieldId: string;
    value: string | number | boolean | undefined;
  }>
> = (state, action) => {
  engineFieldValuesAdapter.upsertOne(state.engineFieldValues, {
    id: action.payload.engineFieldId,
    value: action.payload.value,
  });
};

const removeEngineFieldValue: CaseReducer<
  EntitiesState,
  PayloadAction<{ engineFieldId: string }>
> = (state, action) => {
  engineFieldValuesAdapter.removeOne(
    state.engineFieldValues,
    action.payload.engineFieldId
  );
};

/**************************************************************************
 * General Assets
 */

const reloadAssets: CaseReducer<EntitiesState> = (state) => {
  const now = Date.now();

  const updateTimestamp = <T extends { _v: number }>(obj: T): T => {
    obj._v = now;
    return obj;
  };

  const backgrounds = localBackgroundSelectors
    .selectAll(state)
    .map(updateTimestamp);
  const spriteSheets = localSpriteSheetSelectors
    .selectAll(state)
    .map(updateTimestamp);
  const music = localMusicSelectors.selectAll(state).map(updateTimestamp);

  backgroundsAdapter.setAll(state.backgrounds, backgrounds);
  spriteSheetsAdapter.setAll(state.spriteSheets, spriteSheets);
  musicAdapter.setAll(state.music, music);
};

// Reducer ---------------------------------------------------------------------

const entitiesSlice = createSlice({
  name: "entities",
  initialState,
  reducers: {
    /**************************************************************************
     * Scenes
     */

    addScene: {
      reducer: addScene,
      prepare: (payload: {
        x: number;
        y: number;
        defaults?: Partial<Scene>;
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
    removeScene,
    moveScene,
    paintCollision,
    paintColor,

    /**************************************************************************
     * Actors
     */

    addActor: {
      reducer: addActor,
      prepare: (payload: {
        sceneId: string;
        x: number;
        y: number;
        defaults?: Partial<Actor>;
        variables?: Variable[];
      }) => {
        return {
          payload: {
            ...payload,
            actorId: uuid(),
          },
        };
      },
    },

    editActor,
    removeActor,
    removeActorAt,
    moveActor,

    /**************************************************************************
     * Triggers
     */

    addTrigger: {
      reducer: addTrigger,
      prepare: (payload: {
        sceneId: string;
        x: number;
        y: number;
        width: number;
        height: number;
        defaults?: Partial<Trigger>;
        variables?: Variable[];
      }) => {
        return {
          payload: {
            ...payload,
            triggerId: uuid(),
          },
        };
      },
    },

    editTrigger,
    removeTrigger,
    removeTriggerAt,
    moveTrigger,
    resizeTrigger,

    /**************************************************************************
     * Sprites
     */

    editSpriteSheet,

    /**************************************************************************
     * Metasprites
     */

    addMetasprite: {
      reducer: addMetasprite,
      prepare: (payload: {
        spriteAnimationId: string;
        spriteSheetId: string;
      }) => {
        return {
          payload: {
            ...payload,
            metaspriteId: uuid(),
          },
        };
      },
    },

    cloneMetasprite: {
      reducer: cloneMetasprite,
      prepare: (payload: {
        spriteSheetId: string;
        spriteAnimationId: string;
        metaspriteId: string;
      }) => {
        return {
          payload: {
            ...payload,
            newMetaspriteId: uuid(),
          },
        };
      },
    },

    sendMetaspriteTilesToFront,
    sendMetaspriteTilesToBack,
    removeMetasprite,

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
    removeMetaspriteTiles,
    removeMetaspriteTilesOutsideCanvas,

    /**************************************************************************
     * Sprite Animations
     */

    editSpriteAnimation,
    swapSpriteAnimationFrames,

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

    /**************************************************************************
     * Variables
     */

    renameVariable,

    /**************************************************************************
     * Palettes
     */

    addPalette: {
      reducer: addPalette,
      prepare: () => {
        return {
          payload: {
            paletteId: uuid(),
          },
        };
      },
    },
    editPalette,
    removePalette,

    /**************************************************************************
     * Custom Events
     */

    addCustomEvent: {
      reducer: addCustomEvent,
      prepare: (payload?: {
        customEventId?: string;
        defaults?: Partial<CustomEvent>;
      }) => {
        return {
          payload: {
            customEventId: payload?.customEventId ?? uuid(),
            defaults: payload?.defaults,
          },
        };
      },
    },

    editCustomEvent,
    removeCustomEvent,
    refreshCustomEventArgs: {
      reducer: refreshCustomEventArgs,
      prepare: (payload: { customEventId: string }) => {
        return {
          payload: {
            customEventId: payload.customEventId,
          },
          meta: {
            throttle: 1000,
            key: `refresh_${payload.customEventId}`,
          },
        };
      },
    },

    /**************************************************************************
     * Script Events
     */

    addScriptEvents: {
      reducer: addScriptEvents,
      prepare: (payload: {
        entityId: string;
        type: ScriptEventParentType;
        key: string;
        insertId?: string;
        before?: boolean;
        data: Omit<ScriptEvent, "id">[];
      }) => {
        return {
          payload: {
            ...payload,
            scriptEventIds: payload.data.map(() => uuid()),
          },
        };
      },
    },

    moveScriptEvent,
    editScriptEvent,
    resetScript,
    toggleScriptEventOpen,
    toggleScriptEventComment,
    toggleScriptEventDisableElse,
    editScriptEventArg,
    editScriptEventDestination,
    editScriptEventLabel,
    removeScriptEvent,

    /**************************************************************************
     * Music
     */

    editMusicSettings,

    /**************************************************************************
     * Engine Field Values
     */

    editEngineFieldValue,
    removeEngineFieldValue,
  },
  extraReducers: (builder) =>
    builder
      .addCase(projectActions.loadProject.fulfilled, loadProject)
      .addCase(projectActions.loadBackground.fulfilled, loadBackground)
      .addCase(projectActions.removeBackground.fulfilled, removeBackground)
      .addCase(projectActions.loadSprite.fulfilled, loadSprite)
      .addCase(projectActions.removeSprite.fulfilled, removeSprite)
      .addCase(spriteActions.detectSpriteComplete, loadDetectedSprite)
      .addCase(projectActions.loadMusic.fulfilled, loadMusic)
      .addCase(projectActions.removeMusic.fulfilled, removeMusic)
      .addCase(projectActions.loadFont.fulfilled, loadFont)
      .addCase(projectActions.removeFont.fulfilled, removeFont)
      .addCase(projectActions.loadAvatar.fulfilled, loadAvatar)
      .addCase(projectActions.removeAvatar.fulfilled, removeAvatar)
      .addCase(projectActions.loadEmote.fulfilled, loadEmote)
      .addCase(projectActions.removeEmote.fulfilled, removeEmote)
      .addCase(projectActions.reloadAssets, reloadAssets),
});

export const { reducer } = entitiesSlice;

export const actions = {
  ...entitiesSlice.actions,
  moveSelectedEntity,
  removeSelectedEntity,
};

/**************************************************************************
 * Action Generators
 */

export const generateScriptEventInsertActions = (
  scriptEventIds: string[],
  scriptEventsLookup: Dictionary<ScriptEvent>,
  entityId: string,
  type: ScriptEventParentType,
  key: string,
  insertId?: string,
  before?: boolean
) => {
  const insertActions: ReturnType<
    typeof entitiesSlice.actions.addScriptEvents
  >[] = [];

  const collectInsertActions = (
    scriptEventIds: string[],
    entityId: string,
    type: ScriptEventParentType,
    key: string,
    insertId?: string,
    before?: boolean
  ) => {
    const insertEvents: ScriptEvent[] = [];
    for (let i = 0; i < scriptEventIds.length; i++) {
      const scriptEvent = scriptEventsLookup[scriptEventIds[i]];
      if (!scriptEvent) {
        continue;
      }
      insertEvents.push(scriptEvent);
    }

    const action = entitiesSlice.actions.addScriptEvents({
      entityId,
      type,
      key,
      insertId,
      before,
      data: insertEvents,
    });

    if (insertEvents.length > 0) {
      insertActions.push(action);
    }

    // Child events
    for (let i = 0; i < insertEvents.length; i++) {
      const insertedEvent = insertEvents[i];
      if (insertedEvent.children) {
        Object.keys(insertedEvent.children).forEach((key) => {
          const childIds = insertedEvent?.children?.[key] || [];
          const newParentId = action.payload.scriptEventIds[i];
          collectInsertActions(childIds, newParentId, "scriptEvent", key);
        });
      }
    }
  };

  collectInsertActions(scriptEventIds, entityId, type, key, insertId, before);

  return insertActions;
};

/**************************************************************************
 * Selectors
 */

// Local (only for use in reducers within this file)
const localActorSelectors = actorsAdapter.getSelectors(
  (state: EntitiesState) => state.actors
);
const localTriggerSelectors = triggersAdapter.getSelectors(
  (state: EntitiesState) => state.triggers
);
const localSceneSelectors = scenesAdapter.getSelectors(
  (state: EntitiesState) => state.scenes
);
const localSpriteSheetSelectors = spriteSheetsAdapter.getSelectors(
  (state: EntitiesState) => state.spriteSheets
);
const localBackgroundSelectors = backgroundsAdapter.getSelectors(
  (state: EntitiesState) => state.backgrounds
);
const localPaletteSelectors = palettesAdapter.getSelectors(
  (state: EntitiesState) => state.palettes
);
const localMusicSelectors = musicAdapter.getSelectors(
  (state: EntitiesState) => state.music
);
const localFontSelectors = fontsAdapter.getSelectors(
  (state: EntitiesState) => state.fonts
);
const localAvatarSelectors = avatarsAdapter.getSelectors(
  (state: EntitiesState) => state.avatars
);
const localEmoteSelectors = emotesAdapter.getSelectors(
  (state: EntitiesState) => state.emotes
);

// Global
export const actorSelectors = actorsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.actors
);
export const triggerSelectors = triggersAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.triggers
);
export const sceneSelectors = scenesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.scenes
);
export const scriptEventSelectors = scriptEventsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.scriptEvents
);
export const spriteSheetSelectors = spriteSheetsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.spriteSheets
);
export const metaspriteSelectors = metaspritesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.metasprites
);
export const metaspriteTileSelectors = metaspriteTilesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.metaspriteTiles
);
export const spriteAnimationSelectors = spriteAnimationsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.spriteAnimations
);
export const spriteStateSelectors = spriteStatesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.spriteStates
);
export const backgroundSelectors = backgroundsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.backgrounds
);
export const paletteSelectors = palettesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.palettes
);
export const customEventSelectors = customEventsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.customEvents
);
export const musicSelectors = musicAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.music
);
export const fontSelectors = fontsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.fonts
);
export const avatarSelectors = avatarsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.avatars
);
export const emoteSelectors = emotesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.emotes
);
export const variableSelectors = variablesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.variables
);
export const engineFieldValueSelectors = engineFieldValuesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.engineFieldValues
);

export const getMaxSceneRight = createSelector(
  [sceneSelectors.selectAll],
  (scenes) =>
    scenes.reduce((memo, scene) => {
      const sceneRight = scene.x + scene.width * 8;
      if (sceneRight > memo) {
        return sceneRight;
      }
      return memo;
    }, 0)
);

export const getMaxSceneBottom = createSelector(
  [sceneSelectors.selectAll],
  (scenes) =>
    scenes.reduce((memo, scene) => {
      const sceneBottom = scene.y + scene.height * 8;
      if (sceneBottom > memo) {
        return sceneBottom;
      }
      return memo;
    }, 0)
);

export const getSceneActorIds = (state: RootState, { id }: { id: string }) =>
  sceneSelectors.selectById(state, id)?.actors;

export default reducer;
