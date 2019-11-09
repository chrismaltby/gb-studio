import uuid from "uuid/v4";
import * as types from "./actionTypes";
import loadProjectData from "../lib/project/loadProjectData";
import saveProjectData from "../lib/project/saveProjectData";
import { loadSpriteData } from "../lib/project/loadSpriteData";
import { loadBackgroundData } from "../lib/project/loadBackgroundData";
import { loadMusicData } from "../lib/project/loadMusicData";
import {
  DRAG_PLAYER,
  DRAG_DESTINATION,
  DRAG_TRIGGER,
  DRAG_ACTOR
} from "../reducers/editorReducer";
import { denormalizeProject } from "../reducers/entitiesReducer";
import migrateWarning from "../lib/project/migrateWarning";
import parseAssetPath from "../lib/helpers/path/parseAssetPath";

const asyncAction = async (
  dispatch,
  requestType,
  successType,
  failureType,
  fn
) => {
  dispatch({ type: requestType });
  try {
    const res = await fn();
    dispatch({ ...res, type: successType });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    dispatch({ type: failureType });
  }
};

export const setGlobalError = (message, filename, line, col, stackTrace) => {
  return {
    type: types.SET_GLOBAL_ERROR,
    message,
    filename,
    line,
    col,
    stackTrace
  };
};

export const resizeWorldSidebar = width => {
  return {
    type: types.SIDEBAR_WORLD_RESIZE,
    width
  };
};

export const resizeFilesSidebar = width => {
  return {
    type: types.SIDEBAR_FILES_RESIZE,
    width
  };
};

export const scrollWorld = (x, y) => {
  return {
    type: types.SCROLL_WORLD,
    x,
    y
  };
};

export const loadProject = path => async dispatch => {
  return asyncAction(
    dispatch,
    types.PROJECT_LOAD_REQUEST,
    types.PROJECT_LOAD_SUCCESS,
    types.PROJECT_LOAD_FAILURE,
    async () => {
      let shouldOpenProject = false;
      try {
        shouldOpenProject = await migrateWarning(path);
      } catch (error) {
        dispatch(
          setGlobalError(
            error.message,
            error.filename,
            error.lineno,
            error.colno,
            error.stack
          )
        );
      }
      if (!shouldOpenProject) {
        throw new Error("Cancelled opening project");
      }
      const data = await loadProjectData(path);
      return {
        data,
        path
      };
    }
  );
};

export const loadSprite = filename => async (dispatch, getState) => {
  return asyncAction(
    dispatch,
    types.SPRITE_LOAD_REQUEST,
    types.SPRITE_LOAD_SUCCESS,
    types.SPRITE_LOAD_FAILURE,
    async () => {
      const state = getState();
      const projectRoot = state.document && state.document.root;
      const data = await loadSpriteData(projectRoot)(filename);
      return {
        data
      };
    }
  );
};

export const removeSprite = filename => async (dispatch, getState) => {
  const state = getState();
  const projectRoot = state.document && state.document.root;
  const { file, plugin } = parseAssetPath(filename, projectRoot, "sprites");

  return dispatch({
    type: types.SPRITE_REMOVE,
    data: {
      filename: file,
      plugin
    }
  });
};

export const loadBackground = filename => async (dispatch, getState) => {
  return asyncAction(
    dispatch,
    types.BACKGROUND_LOAD_REQUEST,
    types.BACKGROUND_LOAD_SUCCESS,
    types.BACKGROUND_LOAD_FAILURE,
    async () => {
      const state = getState();
      const projectRoot = state.document && state.document.root;
      const data = await loadBackgroundData(projectRoot)(filename);
      return {
        data
      };
    }
  );
};

export const removeBackground = filename => async (dispatch, getState) => {
  const state = getState();
  const projectRoot = state.document && state.document.root;
  const { file, plugin } = parseAssetPath(filename, projectRoot, "backgrounds");

  return dispatch({
    type: types.BACKGROUND_REMOVE,
    data: {
      filename: file,
      plugin
    }
  });
};

export const loadMusic = filename => async (dispatch, getState) => {
  return asyncAction(
    dispatch,
    types.MUSIC_LOAD_REQUEST,
    types.MUSIC_LOAD_SUCCESS,
    types.MUSIC_LOAD_FAILURE,
    async () => {
      const state = getState();
      const projectRoot = state.document && state.document.root;
      const data = await loadMusicData(projectRoot)(filename);
      return {
        data
      };
    }
  );
};

export const removeMusic = filename => async (dispatch, getState) => {
  const state = getState();
  const projectRoot = state.document && state.document.root;
  const { file, plugin } = parseAssetPath(filename, projectRoot, "music");

  return dispatch({
    type: types.MUSIC_REMOVE,
    data: {
      filename: file,
      plugin
    }
  });
};

export const playMusic = filename => {
  return {
    type: types.PLAY_MUSIC,
    filename
  };
};

export const pauseMusic = () => {
  return {
    type: types.PAUSE_MUSIC
  };
};

export const playSoundFxBeep = pitch => {
  return {
    type: types.PLAY_SOUNDFX_BEEP,
    pitch
  };
};

export const playSoundFxTone = (frequency, duration) => {
  return {
    type: types.PLAY_SOUNDFX_TONE,
    frequency,
    duration
  };
};

export const playSoundFxCrash = () => {
  return {
    type: types.PLAY_SOUNDFX_CRASH
  };
};

export const pauseSoundFx = () => {
  return {
    type: types.PAUSE_SOUNDFX
  };
};

export const saveProject = () => async (dispatch, getState) => {
  const state = getState();
  if (
    !state.document.loaded ||
    state.document.saving ||
    !state.document.modified
  ) {
    return;
  }
  await asyncAction(
    dispatch,
    types.PROJECT_SAVE_REQUEST,
    types.PROJECT_SAVE_SUCCESS,
    types.PROJECT_SAVE_FAILURE,
    async () => {
      const data = denormalizeProject(state.entities.present);
      data.settings.zoom = state.editor.zoom;
      await saveProjectData(state.document.path, data);
    }
  );
};

export const setTool = tool => {
  return { type: types.SET_TOOL, tool };
};

export const setActorPrefab = actor => {
  return { type: types.SET_ACTOR_PREFAB, actor };
};

export const setTriggerPrefab = trigger => {
  return { type: types.SET_TRIGGER_PREFAB, trigger };
};

export const setScenePrefab = scene => {
  return { type: types.SET_SCENE_PREFAB, scene };
};

export const setSection = section => {
  return { type: types.SET_SECTION, section };
};

export const setNavigationId = id => {
  return { type: types.SET_NAVIGATION_ID, id };
};

export const selectSidebar = () => {
  return { type: types.SELECT_SIDEBAR };
};

export const addScene = (x, y, defaults) => {
  return { type: types.ADD_SCENE, x, y, id: uuid(), defaults };
};

export const selectScene = sceneId => {
  return { type: types.SELECT_SCENE, sceneId };
};

export const moveScene = (sceneId, x, y) => {
  return { type: types.MOVE_SCENE, sceneId, x, y };
};

export const dragScene = (moveX, moveY) => {
  return { type: types.DRAG_SCENE, moveX, moveY };
};

export const dragSceneStart = () => {
  return { type: types.DRAG_SCENE_START };
};

export const dragSceneStop = () => {
  return { type: types.DRAG_SCENE_STOP };
};

export const editScene = (sceneId, values) => {
  return { type: types.EDIT_SCENE, sceneId, values };
};

export const removeScene = sceneId => {
  return { type: types.REMOVE_SCENE, sceneId };
};

export const addActor = (sceneId, x, y, defaults) => {
  return { type: types.ADD_ACTOR, sceneId, x, y, id: uuid(), defaults };
};

export const sceneHover = (sceneId, x, y) => {
  return { type: types.SCENE_HOVER, sceneId, x, y };
};

export const actorHover = (sceneId, id, x, y) => {
  return { type: types.ACTOR_HOVER, sceneId, id, x, y };
};

export const moveSelectedEntity = (sceneId, x, y) => (dispatch, getState) => {
  const state = getState();
  const { dragging, scene, eventId, entityId, type: editorType } = state.editor;
  if (dragging === DRAG_PLAYER) {
    dispatch(editPlayerStartAt(sceneId, x, y));
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
    dispatch(moveActor(scene, entityId, sceneId, x, y));
  } else if (dragging === DRAG_TRIGGER) {
    dispatch(moveTrigger(scene, entityId, sceneId, x, y));
  }
};

export const removeSelectedEntity = () => (dispatch, getState) => {
  const state = getState();
  const { scene, entityId, type: editorType } = state.editor;
  if (editorType === "scenes") {
    dispatch(removeScene(scene));
  } else if (editorType === "triggers") {
    dispatch(removeTrigger(scene, entityId));
  } else if (editorType === "actors") {
    dispatch(removeActor(scene, entityId));
  }
};

export const moveActor = (sceneId, id, newSceneId, x, y) => {
  return { type: types.MOVE_ACTOR, sceneId, id, newSceneId, x, y };
};

export const selectActor = (sceneId, id) => {
  return { type: types.SELECT_ACTOR, sceneId, id };
};

export const removeActor = (sceneId, id) => {
  return { type: types.REMOVE_ACTOR, sceneId, id };
};

export const removeActorAt = (sceneId, x, y) => {
  return { type: types.REMOVE_ACTOR_AT, sceneId, x, y };
};

export const editActor = (sceneId, id, values) => {
  return { type: types.EDIT_ACTOR, sceneId, id, values };
};

export const selectScriptEvent = eventId => {
  return { type: types.SELECT_SCRIPT_EVENT, eventId };
};

export const addCollisionTile = (sceneId, x, y) => {
  return { type: types.ADD_COLLISION_TILE, sceneId, x, y };
};

export const removeCollisionTile = (sceneId, x, y) => {
  return { type: types.REMOVE_COLLISION_TILE, sceneId, x, y };
};

export const addTrigger = (sceneId, x, y, defaults) => {
  return { type: types.ADD_TRIGGER, sceneId, x, y, id: uuid(), defaults };
};

export const removeTrigger = (sceneId, id) => {
  return { type: types.REMOVE_TRIGGER, sceneId, id };
};

export const removeTriggerAt = (sceneId, x, y) => {
  return { type: types.REMOVE_TRIGGER_AT, sceneId, x, y };
};

export const resizeTrigger = (sceneId, id, startX, startY, x, y) => {
  return { type: types.RESIZE_TRIGGER, sceneId, id, startX, startY, x, y };
};

export const moveTrigger = (sceneId, id, newSceneId, x, y) => {
  return { type: types.MOVE_TRIGGER, sceneId, id, newSceneId, x, y };
};

export const editTrigger = (sceneId, id, values) => {
  return { type: types.EDIT_TRIGGER, sceneId, id, values };
};

export const selectTrigger = (sceneId, id) => {
  return { type: types.SELECT_TRIGGER, sceneId, id };
};

export const renameVariable = (variableId, name) => {
  return { type: types.RENAME_VARIABLE, variableId, name };
};

export const setStatus = status => {
  return { type: types.SET_STATUS, status };
};

export const selectWorld = () => {
  return { type: types.SELECT_WORLD };
};

export const selectCustomEvent = id => {
  return { type: types.SELECT_CUSTOM_EVENT, id };
};

export const addCustomEvent = () => {
  return { type: types.ADD_CUSTOM_EVENT, id: uuid() };
};

export const editWorld = values => {
  return { type: types.EDIT_WORLD, values };
};

export const editProject = values => {
  return { type: types.EDIT_PROJECT, values };
};

export const editProjectSettings = values => {
  return { type: types.EDIT_PROJECT_SETTINGS, values };
};

export const editCustomEvent = (id, values) => {
  return { type: types.EDIT_CUSTOM_EVENT, id, values };
};

export const removeCustomEvent = customEventId => {
  return { type: types.REMOVE_CUSTOM_EVENT, customEventId };
};

export const editPlayerStartAt = (sceneId, x, y) => {
  return { type: types.EDIT_PLAYER_START_AT, sceneId, x, y };
};

export const dragPlayerStart = () => {
  return { type: types.DRAG_PLAYER_START };
};

export const dragPlayerStop = () => {
  return { type: types.DRAG_PLAYER_STOP };
};

export const dragActorStart = (sceneId, id) => {
  return { type: types.DRAG_ACTOR_START, sceneId, id };
};

export const dragActorStop = () => {
  return { type: types.DRAG_ACTOR_STOP };
};

export const dragTriggerStart = (sceneId, id) => {
  return { type: types.DRAG_TRIGGER_START, sceneId, id };
};

export const dragTriggerStop = () => {
  return { type: types.DRAG_TRIGGER_STOP };
};

export const dragDestinationStart = (eventId, sceneId, selectionType, id) => {
  return {
    type: types.DRAG_DESTINATION_START,
    eventId,
    sceneId,
    selectionType,
    id
  };
};

export const editDestinationPosition = (
  eventId,
  sceneId,
  selectionType,
  id,
  destSceneId,
  x,
  y
) => {
  if (selectionType === "actors") {
    return {
      type: types.EDIT_ACTOR_EVENT_DESTINATION_POSITION,
      eventId,
      sceneId,
      id,
      destSceneId,
      x,
      y
    };
  }
  if (selectionType === "triggers") {
    return {
      type: types.EDIT_TRIGGER_EVENT_DESTINATION_POSITION,
      eventId,
      sceneId,
      id,
      destSceneId,
      x,
      y
    };
  }
  return {
    type: types.EDIT_SCENE_EVENT_DESTINATION_POSITION,
    eventId,
    sceneId,
    destSceneId,
    x,
    y
  };
};

export const dragDestinationStop = () => {
  return { type: types.DRAG_DESTINATION_STOP };
};

export const copyEvent = event => {
  return { type: types.COPY_EVENT, event };
};

export const copyScript = script => {
  return { type: types.COPY_SCRIPT, script };
};

export const copyActor = actor => {
  return { type: types.COPY_ACTOR, actor };
};

export const copyTrigger = trigger => {
  return { type: types.COPY_TRIGGER, trigger };
};

export const copyScene = scene => {
  return { type: types.COPY_SCENE, scene };
};

export const copySelectedEntity = () => (dispatch, getState) => {
  const state = getState();
  const { scene: sceneId, entityId, type: editorType } = state.editor;
  if (editorType === "scenes") {
    dispatch(copyScene(state.entities.present.entities.scenes[sceneId]));
  } else if (editorType === "actors") {
    dispatch(copyActor(state.entities.present.entities.actors[entityId]));
  } else if (editorType === "triggers") {
    dispatch(copyTrigger(state.entities.present.entities.triggers[entityId]));
  }
};

export const pasteClipboardEntity = clipboardData => dispatch => {
  if (clipboardData.__type === "scene") {
    dispatch(setScenePrefab(clipboardData));
  } else if (clipboardData.__type === "actor") {
    dispatch(setActorPrefab(clipboardData));
  } else if (clipboardData.__type === "trigger") {
    dispatch(setTriggerPrefab(clipboardData));
  }
};

export const zoomIn = (section, delta) => {
  return { type: types.ZOOM_IN, section, delta };
};

export const zoomOut = (section, delta) => {
  return { type: types.ZOOM_OUT, section, delta };
};

export const zoomReset = section => {
  return { type: types.ZOOM_RESET, section };
};

export const editUI = () => {
  return { type: types.EDIT_UI };
};

export const openHelp = page => {
  return { type: types.OPEN_HELP, page };
};

export const openFolder = path => {
  return { type: types.OPEN_FOLDER, path };
};

export const reloadAssets = () => {
  return { type: types.RELOAD_ASSETS };
};

export const consoleClear = () => {
  return { type: types.CMD_CLEAR };
};

export const buildGame = ({
  buildType = "web",
  exportBuild = false,
  ejectBuild = false
} = {}) => async (dispatch, getState) => {
  const state = getState();
  if (!state.document.loaded || state.console.status === "running") {
    // Can't build while previous build still in progress
    // or loading project
    return;
  }
  dispatch({
    type: types.BUILD_GAME,
    buildType,
    exportBuild,
    ejectBuild
  });
};
