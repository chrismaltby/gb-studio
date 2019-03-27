import * as types from "./actionTypes";
import loadProjectData from "../lib/project/loadProjectData";
import saveProjectData from "../lib/project/saveProjectData";
import { loadSpriteData } from "../lib/project/loadSpriteData";
import { loadBackgroundData } from "../lib/project/loadBackgroundData";
import { loadMusicData } from "../lib/project/loadMusicData";
import uuid from "uuid/v4";

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
    console.log(e);
    dispatch({ type: failureType });
  }
};

export const loadProject = path => async dispatch => {
  return asyncAction(
    dispatch,
    types.PROJECT_LOAD_REQUEST,
    types.PROJECT_LOAD_SUCCESS,
    types.PROJECT_LOAD_FAILURE,
    async () => {
      const data = await loadProjectData(path, { loadSprite, loadBackground });
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
      const data = await loadSpriteData(
        `${projectRoot}/assets/sprites/${filename}`
      );
      return {
        data
      };
    }
  );
};

export const removeSprite = filename => {
  return {
    type: types.SPRITE_REMOVE,
    filename
  };
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
      const data = await loadBackgroundData(
        `${projectRoot}/assets/backgrounds/${filename}`
      );
      return {
        data
      };
    }
  );
};

export const removeBackground = filename => {
  return {
    type: types.BACKGROUND_REMOVE,
    filename
  };
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
      const data = await loadMusicData(
        `${projectRoot}/assets/music/${filename}`
      );
      return {
        data
      };
    }
  );
};

export const removeMusic = filename => {
  return {
    type: types.MUSIC_REMOVE,
    filename
  };
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

export const saveProject = () => async (dispatch, getState) => {
  const state = getState();
  if (!state.document.loaded || state.document.saving) {
    return;
  }
  return asyncAction(
    dispatch,
    types.PROJECT_SAVE_REQUEST,
    types.PROJECT_SAVE_SUCCESS,
    types.PROJECT_SAVE_FAILURE,
    async () => {
      await saveProjectData(state.document.path, {
        ...state.project.present,
        settings: {
          ...state.project.present.settings,
          zoom: state.editor.zoom
        }
      });
    }
  );
};

export const setTool = tool => {
  return { type: types.SET_TOOL, tool };
};

export const setSection = section => {
  return { type: types.SET_SECTION, section };
};

export const setNavigationId = id => {
  return { type: types.SET_NAVIGATION_ID, id };
};

export const addScene = (x, y) => {
  return { type: types.ADD_SCENE, x, y, id: uuid() };
};

export const selectScene = sceneId => {
  return { type: types.SELECT_SCENE, sceneId };
};

export const moveScene = (sceneId, moveX, moveY) => {
  return { type: types.MOVE_SCENE, sceneId, moveX, moveY };
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

export const addActor = (sceneId, x, y) => {
  return { type: types.ADD_ACTOR, sceneId, x, y };
};

export const moveActor = (sceneId, index, moveX, moveY) => {
  return { type: types.MOVE_ACTOR, sceneId, index, moveX, moveY };
};

export const selectActor = (sceneId, index) => {
  return { type: types.SELECT_ACTOR, sceneId, index };
};

export const removeActor = (sceneId, index) => {
  return { type: types.REMOVE_ACTOR, sceneId, index };
};

export const removeActorAt = (sceneId, x, y) => {
  return { type: types.REMOVE_ACTOR_AT, sceneId, x, y };
};

export const editActor = (sceneId, index, values) => {
  return { type: types.EDIT_ACTOR, sceneId, index, values };
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

export const addTrigger = (sceneId, x, y) => {
  return { type: types.ADD_TRIGGER, sceneId, x, y };
};

export const removeTrigger = (sceneId, index) => {
  return { type: types.REMOVE_TRIGGER, sceneId, index };
};

export const removeTriggerAt = (sceneId, x, y) => {
  return { type: types.REMOVE_TRIGGER_AT, sceneId, x, y };
};

export const resizeTrigger = (sceneId, index, startX, startY, x, y) => {
  return { type: types.RESIZE_TRIGGER, sceneId, index, startX, startY, x, y };
};

export const moveTrigger = (sceneId, index, moveX, moveY) => {
  return { type: types.MOVE_TRIGGER, sceneId, index, moveX, moveY };
};

export const editTrigger = (sceneId, index, values) => {
  return { type: types.EDIT_TRIGGER, sceneId, index, values };
};

export const selectTrigger = (sceneId, index) => {
  return { type: types.SELECT_TRIGGER, sceneId, index };
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

export const editWorld = values => {
  return { type: types.EDIT_WORLD, values };
};

export const editProject = values => {
  return { type: types.EDIT_PROJECT, values };
};

export const editProjectSettings = values => {
  return { type: types.EDIT_PROJECT_SETTINGS, values };
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

export const dragDestinationStart = (
  eventId,
  sceneId,
  selectionType,
  index
) => {
  return {
    type: types.DRAG_DESTINATION_START,
    eventId,
    sceneId,
    selectionType,
    index
  };
};

export const editDestinationPosition = (
  eventId,
  sceneId,
  selectionType,
  index,
  destSceneId,
  x,
  y
) => {
  if (selectionType === "actors") {
    return {
      type: types.EDIT_ACTOR_EVENT_DESTINATION_POSITION,
      eventId,
      sceneId,
      index,
      destSceneId,
      x,
      y
    };
  } else if (selectionType === "triggers") {
    return {
      type: types.EDIT_TRIGGER_EVENT_DESTINATION_POSITION,
      eventId,
      sceneId,
      index,
      destSceneId,
      x,
      y
    };
  } else {
    return {
      type: types.EDIT_SCENE_EVENT_DESTINATION_POSITION,
      eventId,
      sceneId,
      destSceneId,
      x,
      y
    };
  }
};

export const dragDestinationStop = () => {
  return { type: types.DRAG_DESTINATION_STOP };
};

export const copyEvent = event => {
  return { type: types.COPY_EVENT, event };
};

export const zoomIn = section => {
  return { type: types.ZOOM_IN, section };
};

export const zoomOut = section => {
  return { type: types.ZOOM_OUT, section };
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

export const consoleClear = () => {
  return { type: types.CMD_CLEAR };
};

export const buildGame = ({
  buildType = "web",
  exportBuild = false,
  ejectBuild = false
} = {}) => async (dispatch, getState) => {
  const state = getState();
  if (state.console.status === "running") {
    // Can't build while previous build still in progress
    return;
  }
  dispatch({
    type: types.BUILD_GAME,
    buildType,
    exportBuild,
    ejectBuild
  });
};
