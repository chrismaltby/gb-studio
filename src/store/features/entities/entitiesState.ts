import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
  EntityState,
  ThunkDispatch,
  AnyAction,
  createSelector,
  CaseReducer,
  EntityId,
  Dictionary,
} from "@reduxjs/toolkit";
import { normalize, denormalize, schema } from "normalizr";
import {
  SPRITE_TYPE_STATIC,
  SPRITE_TYPE_ACTOR,
  DMG_PALETTE,
  COLLISION_ALL,
  TILE_PROPS,
  DRAG_PLAYER,
  DRAG_DESTINATION,
  DRAG_TRIGGER,
  DRAG_ACTOR,
} from "../../../consts";
import {
  regenerateEventIds,
  patchEvents,
  mapEvents,
  getField,
  isVariableField,
  isPropertyField,
  walkEvents,
  replaceEventActorIds,
} from "../../../lib/helpers/eventSystem";
import clamp from "../../../lib/helpers/clamp";
import { RootState } from "../../configureStore";
import settingsActions from "../settings/settingsActions";
import uuid from "uuid";
import {
  replaceInvalidCustomEventVariables,
  replaceInvalidCustomEventActors,
  replaceInvalidCustomEventProperties,
} from "../../../lib/compiler/helpers";
import { EVENT_CALL_CUSTOM_EVENT } from "../../../lib/compiler/eventTypes";
import { paint, paintLine, floodFill } from "../../../lib/helpers/paint";
import { Brush, EditorSelectionType } from "../editor/editorState";
import projectActions from "../project/projectActions";
import {
  Asset,
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
  SceneData,
  EntityKey,
  MusicSettings,
  EngineFieldValue,
  Metasprite,
  MetaspriteTile,
  SpriteAnimation,
} from "./entitiesTypes";
import { normalizeEntities } from "./entitiesHelpers";
import { clone } from "../../../lib/helpers/clone";

const MIN_SCENE_X = 60;
const MIN_SCENE_Y = 30;
const MIN_SCENE_WIDTH = 20;
const MIN_SCENE_HEIGHT = 18;

const inodeToRecentBackground: Dictionary<Background> = {};
const inodeToRecentSpriteSheet: Dictionary<SpriteSheet> = {};
const inodeToRecentMusic: Dictionary<Music> = {};

const matchAsset = (assetA: Asset) => (assetB: Asset) => {
  return assetA.filename === assetB.filename && assetA.plugin === assetB.plugin;
};

const sortByFilename = (a: Asset, b: Asset) => {
  if (a.filename > b.filename) return 1;
  if (a.filename < b.filename) return -1;
  return 0;
};

const swap = <T extends unknown>(x: number, y: number, [...xs]: T[]): T[] =>
  xs.length > 1 ? (([xs[x], xs[y]] = [xs[y], xs[x]]), xs) : xs;

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
const palettesAdapter = createEntityAdapter<Palette>();
const customEventsAdapter = createEntityAdapter<CustomEvent>();
const musicAdapter = createEntityAdapter<Music>({
  sortComparer: sortByFilename,
});
const variablesAdapter = createEntityAdapter<Variable>();
const engineFieldValuesAdapter = createEntityAdapter<EngineFieldValue>();

export const initialState: EntitiesState = {
  actors: actorsAdapter.getInitialState(),
  triggers: triggersAdapter.getInitialState(),
  scenes: scenesAdapter.getInitialState(),
  backgrounds: backgroundsAdapter.getInitialState(),
  spriteSheets: spriteSheetsAdapter.getInitialState(),
  metasprites: metaspritesAdapter.getInitialState(),
  metaspriteTiles: metaspriteTilesAdapter.getInitialState(),
  spriteAnimations: spriteAnimationsAdapter.getInitialState(),
  palettes: palettesAdapter.getInitialState(),
  customEvents: customEventsAdapter.getInitialState(),
  music: musicAdapter.getInitialState(),
  variables: variablesAdapter.getInitialState(),
  engineFieldValues: engineFieldValuesAdapter.getInitialState(),
};

const moveSelectedEntity = ({
  sceneId,
  x,
  y,
}: {
  sceneId: string;
  x: number;
  y: number;
}) => (
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>,
  getState: () => RootState
) => {
  const state = getState();
  const { dragging, scene, eventId, entityId, type: editorType } = state.editor;
  if (dragging === DRAG_PLAYER) {
    dispatch(settingsActions.editPlayerStartAt({ sceneId, x, y }));
  } else if (dragging === DRAG_DESTINATION) {
    dispatch(
      editDestinationPosition(
        eventId,
        scene,
        editorType,
        entityId,
        sceneId,
        x,
        y
      )
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

const removeSelectedEntity = () => (
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

const editDestinationPosition = (
  eventId: string,
  sceneId: string,
  selectionType: EditorSelectionType,
  id: string,
  destSceneId: string,
  x: number,
  y: number
) => {
  if (selectionType === "actor") {
    return actions.editActorEventDestinationPosition({
      eventId,
      actorId: id,
      destSceneId,
      x,
      y,
    });
  }
  if (selectionType === "trigger") {
    return actions.editTriggerEventDestinationPosition({
      eventId,
      triggerId: id,
      destSceneId,
      x,
      y,
    });
  }
  return actions.editSceneEventDestinationPosition({
    eventId,
    sceneId,
    destSceneId,
    x,
    y,
  });
};

const first = <T>(array: T[]): T | undefined => {
  if (array[0]) {
    return array[0];
  }
  return undefined;
};

const mapActorEvents = (
  actor: Actor,
  fn: (event: ScriptEvent) => ScriptEvent
): Actor => {
  return {
    ...actor,
    script: mapEvents(actor.script || [], fn),
    startScript: mapEvents(actor.startScript || [], fn),
    updateScript: mapEvents(actor.updateScript || [], fn),
    hit1Script: mapEvents(actor.hit1Script || [], fn),
    hit2Script: mapEvents(actor.hit2Script || [], fn),
    hit3Script: mapEvents(actor.hit3Script || [], fn),
  };
};

const mapTriggerEvents = (
  trigger: Trigger,
  fn: (event: ScriptEvent) => ScriptEvent
): Trigger => {
  return {
    ...trigger,
    script: mapEvents(trigger.script || [], fn),
  };
};

const mapSceneEvents = (
  scene: Scene,
  fn: (event: ScriptEvent) => ScriptEvent
): Scene => {
  return {
    ...scene,
    script: mapEvents(scene.script || [], fn),
    playerHit1Script: mapEvents(scene.playerHit1Script || [], fn),
    playerHit2Script: mapEvents(scene.playerHit2Script || [], fn),
    playerHit3Script: mapEvents(scene.playerHit3Script || [], fn),
  };
};

const mapActorsEvents = (
  actors: Actor[],
  fn: (event: ScriptEvent) => ScriptEvent
): Actor[] => {
  return actors.map((actor) => mapActorEvents(actor, fn));
};

const mapTriggersEvents = (
  triggers: Trigger[],
  fn: (event: ScriptEvent) => ScriptEvent
): Trigger[] => {
  return triggers.map((trigger) => mapTriggerEvents(trigger, fn));
};

const mapScenesEvents = (
  scenes: Scene[],
  fn: (event: ScriptEvent) => ScriptEvent
): Scene[] => {
  return scenes.map((scene) => mapSceneEvents(scene, fn));
};

const patchCustomEventCallArgs = (
  customEventId: string,
  script: ScriptEvent[],
  variables: Dictionary<CustomEventVariable>,
  actors: Dictionary<CustomEventActor>
) => {
  const usedVariables = Object.keys(variables).map((i) => `$variable[${i}]$`);
  const usedActors = Object.keys(actors).map((i) => `$actor[${i}]$`);

  return (event: ScriptEvent): ScriptEvent => {
    if (event.command !== EVENT_CALL_CUSTOM_EVENT) {
      return event;
    }
    if (event.args.customEventId !== customEventId) {
      return event;
    }
    const newArgs = Object.assign({ ...event.args });
    Object.keys(newArgs).forEach((k) => {
      if (
        k.startsWith("$") &&
        !usedVariables.find((v) => v === k) &&
        !usedActors.find((a) => a === k)
      ) {
        delete newArgs[k];
      }
    });
    return {
      ...event,
      args: newArgs,
      children: {
        script: [...script],
      },
    };
  };
};

const patchCustomEventCallName = (customEventId: string, name: string) => {
  return (event: ScriptEvent): ScriptEvent => {
    if (event.command !== EVENT_CALL_CUSTOM_EVENT) {
      return event;
    }
    if (event.args.customEventId !== customEventId) {
      return event;
    }
    return {
      ...event,
      args: {
        ...event.args,
        __name: name,
      },
    };
  };
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
  const fixedData = fixDefaultPalettes(data);
  const entities = fixedData.entities;
  actorsAdapter.setAll(state.actors, entities.actors || {});
  triggersAdapter.setAll(state.triggers, entities.triggers || {});
  scenesAdapter.setAll(state.scenes, entities.scenes || {});
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
  palettesAdapter.setAll(state.palettes, entities.palettes || {});
  musicAdapter.setAll(state.music, entities.music || {});
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
  const spriteSheets = localSpriteSheetSelectors.selectAll(state);
  const existingAsset =
    spriteSheets.find(matchAsset(action.payload.data)) ||
    inodeToRecentSpriteSheet[action.payload.data.inode];
  const existingId = existingAsset?.id;

  if (existingId) {
    delete inodeToRecentSpriteSheet[action.payload.data.inode];
    spriteSheetsAdapter.upsertOne(state.spriteSheets, {
      ...existingAsset,
      ...action.payload.data,
      id: existingId,
    });
  } else {
    spriteSheetsAdapter.addOne(state.spriteSheets, action.payload.data);
  }
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
    inodeToRecentSpriteSheet[existingAsset.inode] = clone(existingAsset);
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
      scene.tileColors = [];
    }
  }
};

const fixDefaultPalettes = (state: any) => {
  return {
    ...state,
    result: {
      ...state.result,
      settings: {
        ...state.result.settings,
        defaultBackgroundPaletteIds: state.result.settings
          .defaultBackgroundPaletteIds
          ? state.result.settings.defaultBackgroundPaletteIds.slice(-6)
          : [],
      },
    },
  };
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
    defaults?: Partial<SceneData>;
    variables?: Variable[];
  }>
> = (state, action) => {
  const scenesTotal = localSceneSelectors.selectTotal(state);
  const backgroundId = localBackgroundSelectors.selectIds(state)[0];
  const background = localBackgroundSelectors.selectById(state, backgroundId);

  const newScene: Scene = Object.assign(
    {
      name: `Scene ${scenesTotal + 1}`,
      backgroundId,
      width: Math.max(MIN_SCENE_WIDTH, background?.width || 0),
      height: Math.max(MIN_SCENE_HEIGHT, background?.height || 0),
      type: "0",
      paletteIds: [],
      collisions: [],
      tileColors: [],
      script: [],
      playerHit1Script: [],
      playerHit2Script: [],
      playerHit3Script: [],
    },
    action.payload.defaults || {},
    {
      id: action.payload.sceneId,
      x: Math.max(MIN_SCENE_X, action.payload.x),
      y: Math.max(MIN_SCENE_Y, action.payload.y),
      actors: [],
      triggers: [],
    }
  );

  // Generate new ids
  const idReplacements: Dictionary<string> = {};
  if (action.payload.defaults?.id) {
    idReplacements[action.payload.defaults.id] = action.payload.sceneId;
  }
  if (action.payload.defaults?.actors) {
    for (let actor of action.payload.defaults.actors) {
      idReplacements[actor.id] = uuid();
    }
  }
  if (action.payload.defaults?.triggers) {
    for (let trigger of action.payload.defaults.triggers) {
      idReplacements[trigger.id] = uuid();
    }
  }

  // Add any variables from clipboard
  if (action.payload.variables) {
    const newVariables = action.payload.variables.map((variable) => {
      let newId = variable.id;
      for (var id in idReplacements) {
        if (variable.id.startsWith(id)) {
          newId = variable.id.replace(id, idReplacements[id] || newId);
          break;
        }
      }
      return {
        ...variable,
        id: newId,
      };
    });

    variablesAdapter.upsertMany(state.variables, newVariables);
  }

  const fixedScene = mapSceneEvents(newScene, (event) =>
    replaceEventActorIds(idReplacements, regenerateEventIds(event))
  );

  scenesAdapter.addOne(state.scenes, fixedScene);

  if (action.payload.defaults?.actors) {
    for (let actor of action.payload.defaults.actors) {
      addActorToScene(
        state,
        fixedScene,
        {
          ...actor,
          id: idReplacements[actor.id] || uuid(),
        },
        idReplacements
      );
    }
  }

  if (action.payload.defaults?.triggers) {
    for (let trigger of action.payload.defaults.triggers) {
      addTriggerToScene(
        state,
        fixedScene,
        {
          ...trigger,
          id: idReplacements[trigger.id] || uuid(),
        },
        idReplacements
      );
    }
  }
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
  let patch = { ...action.payload.changes };

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
        patch.tileColors = otherScene.tileColors;
      } else if (
        oldBackground &&
        background &&
        oldBackground.width == background.width
      ) {
        const collisionsSize = Math.ceil(background.width * background.height);
        patch.collisions = scene.collisions.slice(0, collisionsSize);
        patch.tileColors = [];
      } else if (background) {
        const collisionsSize = Math.ceil(background.width * background.height);
        patch.collisions = [];
        patch.tileColors = [];
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

const editSceneEventDestinationPosition: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    eventId: string;
    destSceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const scene = localSceneSelectors.selectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  const updatedScene = mapSceneEvents(scene, (event) => {
    if (event.id !== action.payload.eventId) {
      return event;
    }
    return {
      ...event,
      args: {
        ...event.args,
        sceneId: action.payload.destSceneId,
        x: action.payload.x,
        y: action.payload.y,
      },
    };
  });

  const patch = (({
    script,
    playerHit1Script,
    playerHit2Script,
    playerHit3Script,
  }) => ({ script, playerHit1Script, playerHit2Script, playerHit3Script }))(
    updatedScene
  );

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

  const newActor = Object.assign(
    {
      name: "",
      frame: 0,
      animate: false,
      spriteSheetId,
      spriteType: SPRITE_TYPE_STATIC,
      direction: "down",
      moveSpeed: 1,
      animSpeed: 3,
      paletteId: "",
      isPinned: false,
      collisionGroup: "",
      script: [],
      startScript: [],
      updateScript: [],
      hit1Script: [],
      hit2Script: [],
      hit3Script: [],
    } as Partial<Actor>,
    action.payload.defaults || {},
    {
      id: action.payload.actorId,
      x: clamp(action.payload.x, 0, scene.width - 2),
      y: clamp(action.payload.y, 0, scene.height - 1),
    }
  ) as Actor;

  addActorToScene(state, scene, newActor, {});
};

const addActorToScene = (
  state: EntitiesState,
  scene: Scene,
  actor: Actor,
  idReplacements: Dictionary<string>
) => {
  const fixedActor = mapActorEvents(actor, (event) =>
    replaceEventActorIds(idReplacements, regenerateEventIds(event))
  );

  // Add to scene
  scene.actors = ([] as string[]).concat(scene.actors, fixedActor.id);
  actorsAdapter.addOne(state.actors, fixedActor);
};

const editActor: CaseReducer<
  EntitiesState,
  PayloadAction<{ actorId: string; changes: Partial<Actor> }>
> = (state, action) => {
  const actor = localActorSelectors.selectById(state, action.payload.actorId);
  let patch = { ...action.payload.changes };

  if (!actor) {
    return;
  }

  // If changed spriteSheetId
  if (patch.spriteSheetId) {
    const newSprite = localSpriteSheetSelectors.selectById(
      state,
      patch.spriteSheetId
    );

    if (newSprite) {
      // If new sprite not an actor then reset sprite type back to static
      if (newSprite.numFrames !== 3 && newSprite.numFrames !== 6) {
        patch.spriteType = SPRITE_TYPE_STATIC;
      }
      const oldSprite = localSpriteSheetSelectors.selectById(
        state,
        actor.spriteSheetId
      );
      // If new sprite is an actor and old one wasn't reset sprite type to actor
      if (
        oldSprite &&
        newSprite &&
        oldSprite.id !== newSprite.id &&
        oldSprite.numFrames !== 3 &&
        oldSprite.numFrames !== 6 &&
        (newSprite.numFrames === 3 || newSprite.numFrames === 6)
      ) {
        patch.spriteType = SPRITE_TYPE_ACTOR;
      }

      if (newSprite && newSprite.numFrames <= actor.frame) {
        patch.frame = 0;
      }
    }
  }
  // If static and cycling frames start from frame 1 (facing downwards)
  if (
    (patch.animate && actor.spriteType === SPRITE_TYPE_STATIC) ||
    patch.spriteType === SPRITE_TYPE_STATIC
  ) {
    patch.direction = "down";
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

const editActorEventDestinationPosition: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    eventId: string;
    destSceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const actor = localActorSelectors.selectById(state, action.payload.actorId);
  if (!actor) {
    return;
  }

  const updatedActor = mapActorEvents(actor, (event) => {
    if (event.id !== action.payload.eventId) {
      return event;
    }
    return {
      ...event,
      args: {
        ...event.args,
        sceneId: action.payload.destSceneId,
        x: action.payload.x,
        y: action.payload.y,
      },
    };
  });

  const patch = (({
    script,
    startScript,
    updateScript,
    hit1Script,
    hit2Script,
    hit3Script,
  }) => ({
    script,
    startScript,
    updateScript,
    hit1Script,
    hit2Script,
    hit3Script,
  }))(updatedActor);

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: patch,
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
    variables?: Variable[];
  }>
> = (state, action) => {
  const scene = localSceneSelectors.selectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  const width = Math.min(action.payload.width, scene.width);
  const height = Math.min(action.payload.height, scene.height);

  // Add any variables from clipboard
  if (action.payload.defaults?.id && action.payload.variables) {
    const newVariables = action.payload.variables.map((variable) => {
      return {
        ...variable,
        id: variable.id.replace(
          action.payload.defaults?.id || "",
          action.payload.triggerId
        ),
      };
    });
    variablesAdapter.upsertMany(state.variables, newVariables);
  }

  const newTrigger: Trigger = Object.assign(
    {
      name: "",
      trigger: "walk",
      script: [],
    },
    action.payload.defaults || {},
    {
      id: action.payload.triggerId,
      x: clamp(action.payload.x, 0, scene.width - width),
      y: clamp(action.payload.y, 0, scene.height - height),
      width,
      height,
    }
  );

  // Add to scene
  addTriggerToScene(state, scene, newTrigger, {});
};

const addTriggerToScene = (
  state: EntitiesState,
  scene: Scene,
  trigger: Trigger,
  idReplacements: Dictionary<string>
) => {
  const fixedTrigger = mapTriggerEvents(trigger, (event) =>
    replaceEventActorIds(idReplacements, regenerateEventIds(event))
  );

  // Add to scene
  scene.triggers = ([] as string[]).concat(scene.triggers, fixedTrigger.id);
  triggersAdapter.addOne(state.triggers, fixedTrigger);
};

const editTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{ triggerId: string; changes: Partial<Trigger> }>
> = (state, action) => {
  let patch = { ...action.payload.changes };

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

const editTriggerEventDestinationPosition: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    eventId: string;
    destSceneId: string;
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
  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      script: patchEvents(trigger.script, action.payload.eventId, {
        sceneId: action.payload.destSceneId,
        x: action.payload.x,
        y: action.payload.y,
      }),
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
  let patch = { ...action.payload.changes };

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
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];

  if (!spriteAnimation || spriteAnimation.frames.length <= 1) {
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
    flipX: false,
    flipY: false,
    objPalette: "OBP0",
    paletteIndex: 0,
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
  PayloadAction<
    {
      metaspriteTileId: string;
      x: number;
      y: number;
    }[]
  >
> = (state, action) => {
  action.payload.forEach(({ metaspriteTileId, x, y }) => {
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
  PayloadAction<{ metaspriteTileIds: string[] }>
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
  PayloadAction<{ metaspriteTileIds: string[] }>
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
  PayloadAction<{ metaspriteTileId: string; changes: Partial<MetaspriteTile> }>
> = (state, action) => {
  const metaspriteTile =
    state.metaspriteTiles.entities[action.payload.metaspriteTileId];
  let patch = { ...action.payload.changes };

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

  const removeMetaspriteTiles = (metasprite.tiles
    .map((id) => state.metaspriteTiles.entities[id])
    .filter((i) => !!i) as MetaspriteTile[])
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
    spriteAnimationId: string;
    changes: Partial<SpriteAnimation>;
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];
  let patch = { ...action.payload.changes };

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
      sceneId: string;
      x: number;
      y: number;
      paletteIndex: number;
      brush: Brush;
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

  const brush = action.payload.brush;
  const drawSize = brush === "16px" ? 2 : 1;
  const tileColorsSize = Math.ceil(background.width * background.height);
  const tileColors = (scene.tileColors || []).slice(0, tileColorsSize);

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

  scenesAdapter.updateOne(state.scenes, {
    id: action.payload.sceneId,
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
  let patch = { ...action.payload.changes };

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
  PayloadAction<{ customEventId: string }>
> = (state, action) => {
  const newCustomEvent: CustomEvent = {
    id: action.payload.customEventId,
    name: "",
    description: "",
    variables: {},
    actors: {},
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
  const oldEvent = state.customEvents.entities[action.payload.customEventId];

  let patch = { ...action.payload.changes };

  if (!oldEvent) {
    const newCustomEvent: CustomEvent = {
      id: action.payload.customEventId,
      name: "",
      description: "",
      variables: {},
      actors: {},
      script: [],
    };
    customEventsAdapter.addOne(state.customEvents, newCustomEvent);
  }

  if (patch.script) {
    // Fix invalid variables in script
    const fix = replaceInvalidCustomEventVariables;
    const fixActor = replaceInvalidCustomEventActors;
    const fixProperty = replaceInvalidCustomEventProperties;
    patch.script = mapEvents(patch.script, (event: ScriptEvent) => {
      if (event.args) {
        const fixedEventArgs = Object.keys(event.args).reduce((memo, arg) => {
          const fixedArgs = memo;
          if (isVariableField(event.command, arg, event.args)) {
            fixedArgs[arg] = fix(event.args[arg]);
          } else if (isPropertyField(event.command, arg, event.args[arg])) {
            fixedArgs[arg] = fixProperty(event.args[arg]);
          } else {
            fixedArgs[arg] = event.args[arg];
          }

          return fixedArgs;
        }, {} as Dictionary<any>);

        return {
          ...event,
          args: {
            ...event.args,
            ...fixedEventArgs,
            actorId: event.args.actorId && fixActor(event.args.actorId),
            otherActorId:
              event.args.otherActorId && fixActor(event.args.otherActorId),
          },
        };
      }
      return event;
    });

    const variables = {} as Dictionary<CustomEventVariable>;
    const actors = {} as Dictionary<CustomEventActor>;

    const oldVariables = oldEvent ? oldEvent.variables : {};
    const oldActors = oldEvent ? oldEvent.actors : {};

    walkEvents(patch.script, (e: ScriptEvent) => {
      const args = e.args;

      if (!args) return;
      if (e.args.__comment) return;

      if (args.actorId && args.actorId !== "player") {
        const letter = String.fromCharCode(
          "A".charCodeAt(0) + parseInt(args.actorId)
        );
        actors[args.actorId] = {
          id: args.actorId,
          name: oldActors[args.actorId]?.name || `Actor ${letter}`,
        };
      }

      if (args.otherActorId && args.otherActorId !== "player") {
        const letter = String.fromCharCode(
          "A".charCodeAt(0) + parseInt(args.otherActorId)
        );
        actors[args.otherActorId] = {
          id: args.otherActorId,
          name: oldActors[args.otherActorId]?.name || `Actor ${letter}`,
        };
      }

      Object.keys(args).forEach((arg) => {
        if (isVariableField(e.command, arg, args)) {
          const addVariable = (variable: string, type?: "8bit" | "16bit") => {
            const letter = String.fromCharCode(
              "A".charCodeAt(0) + parseInt(variable)
            );
            const newType =
              variables[variable]?.type === "16bit" ? "16bit" : type;
            variables[variable] = {
              id: variable,
              name: oldVariables[variable]?.name || `Variable ${letter}`,
              type: newType,
            };
          };
          const variable = args[arg];
          const field = getField(e.command, arg, args);
          if (variable != null && variable.type === "variable") {
            addVariable(variable.value, field.variableType);
          } else {
            addVariable(variable, field.variableType);
          }
        }

        if (isPropertyField(e.command, arg, args[arg])) {
          const addPropertyActor = (property: string) => {
            const actor = property && property.replace(/:.*/, "");
            if (actor !== "player") {
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
          if (property != null && property.type === "property") {
            addPropertyActor(property.value);
          } else {
            addPropertyActor(property);
          }
        }
      });

      if (args.text) {
        const text = Array.isArray(args.text) ? args.text.join() : args.text;
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
    });

    patch.variables = { ...variables };
    patch.actors = { ...actors };

    const patchEventCallFn = patchCustomEventCallArgs(
      action.payload.customEventId,
      patch.script,
      patch.variables,
      patch.actors
    );
    const patchedActors = mapActorsEvents(
      localActorSelectors.selectAll(state),
      patchEventCallFn
    );
    const patchedTriggers = mapTriggersEvents(
      localTriggerSelectors.selectAll(state),
      patchEventCallFn
    );
    const patchedScenes = mapScenesEvents(
      localSceneSelectors.selectAll(state),
      patchEventCallFn
    );
    actorsAdapter.setAll(state.actors, patchedActors);
    triggersAdapter.setAll(state.triggers, patchedTriggers);
    scenesAdapter.setAll(state.scenes, patchedScenes);
  }

  if (patch.name) {
    const patchEventCallFn = patchCustomEventCallName(
      action.payload.customEventId,
      patch.name
    );
    const patchedActors = mapActorsEvents(
      localActorSelectors.selectAll(state),
      patchEventCallFn
    );
    const patchedTriggers = mapTriggersEvents(
      localTriggerSelectors.selectAll(state),
      patchEventCallFn
    );
    const patchedScenes = mapScenesEvents(
      localSceneSelectors.selectAll(state),
      patchEventCallFn
    );
    actorsAdapter.setAll(state.actors, patchedActors);
    triggersAdapter.setAll(state.triggers, patchedTriggers);
    scenesAdapter.setAll(state.scenes, patchedScenes);
  }

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

/**************************************************************************
 * Engine Field Values
 */

const editEngineFieldValue: CaseReducer<
  EntitiesState,
  PayloadAction<{ engineFieldId: string; value: any }>
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
        defaults?: Partial<SceneData>;
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
    editSceneEventDestinationPosition,
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
    editActorEventDestinationPosition,

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
    editTriggerEventDestinationPosition,

    /**************************************************************************
     * Sprites
     */

    editSpriteSheet,

    /**************************************************************************
     * Metasprites
     */

    addMetasprite: {
      reducer: addMetasprite,
      prepare: (payload: { spriteAnimationId: string }) => {
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
        metaspriteId: string;
        x: number;
        y: number;
        sliceX: number;
        sliceY: number;
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
      prepare: () => {
        return {
          payload: {
            customEventId: uuid(),
          },
        };
      },
    },

    editCustomEvent,
    removeCustomEvent,

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
      .addCase(projectActions.loadMusic.fulfilled, loadMusic)
      .addCase(projectActions.removeMusic.fulfilled, removeMusic)
      .addCase(projectActions.reloadAssets, reloadAssets),
});

export const { reducer } = entitiesSlice;

export const actions = {
  ...entitiesSlice.actions,
  moveSelectedEntity,
  editDestinationPosition,
  removeSelectedEntity,
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
const localCustomEventSelectors = customEventsAdapter.getSelectors(
  (state: EntitiesState) => state.customEvents
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
