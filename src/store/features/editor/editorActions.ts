import { actions } from "./editorState";
import type { Dispatch } from "redux";
import type { AppThunk } from "store/storeTypes";
import settingsActions from "store/features/settings/settingsActions";
import { TOOL_TILES } from "consts";
import navigationActions from "store/features/navigation/navigationActions";
import trackerActions from "store/features/tracker/trackerActions";

type SelectSceneTileForPaintingPayload = {
  tilesetId: string;
  tileIndex: number;
  width?: number;
  height?: number;
  tilesetWidth?: number;
  autotile?: boolean;
  persistTileset?: boolean;
  activateTool?: boolean;
};

const selectSceneTileForPainting =
  (payload: SelectSceneTileForPaintingPayload): AppThunk =>
  (dispatch) => {
    dispatch(actions.setSelectedSceneTile(payload));
    if (payload.persistTileset) {
      dispatch(
        settingsActions.editSettings({
          selectedSceneTilesetId: payload.tilesetId,
        }),
      );
    }
    if (payload.autotile !== undefined) {
      dispatch(actions.setSelectedSceneTileAutotile(payload.autotile));
    }
    if (payload.activateTool !== false) {
      dispatch(actions.setTool({ tool: TOOL_TILES }));
    }
  };

export type EditorResourceTarget =
  | { type: "scene"; sceneId: string }
  | { type: "actor"; sceneId: string; actorId: string }
  | { type: "trigger"; sceneId: string; triggerId: string }
  | { type: "customEvent"; customEventId: string }
  | { type: "sprite"; spriteId: string }
  | { type: "background"; backgroundId: string }
  | { type: "music"; musicId: string }
  | { type: "sound"; soundId: string };

const focusScene = (dispatch: Dispatch, sceneId: string) => {
  dispatch(actions.editSearchTerm(""));
  dispatch(actions.editSearchTerm(sceneId));
};

const openEditorResourceById =
  (target: EditorResourceTarget): AppThunk =>
  (dispatch) => {
    switch (target.type) {
      case "scene":
        dispatch(navigationActions.setSection("world"));
        dispatch(actions.selectScene({ sceneId: target.sceneId }));
        focusScene(dispatch, target.sceneId);
        return;
      case "actor":
        dispatch(navigationActions.setSection("world"));
        dispatch(
          actions.selectActor({
            sceneId: target.sceneId,
            actorId: target.actorId,
          }),
        );
        focusScene(dispatch, target.sceneId);
        return;
      case "trigger":
        dispatch(navigationActions.setSection("world"));
        dispatch(
          actions.selectTrigger({
            sceneId: target.sceneId,
            triggerId: target.triggerId,
          }),
        );
        focusScene(dispatch, target.sceneId);
        return;
      case "customEvent":
        dispatch(navigationActions.setSection("world"));
        dispatch(
          actions.selectCustomEvent({ customEventId: target.customEventId }),
        );
        return;
      case "sprite":
        dispatch(navigationActions.setSection("sprites"));
        dispatch(actions.setSelectedSpriteSheetId(target.spriteId));
        return;
      case "background":
        dispatch(navigationActions.setSection("images"));
        dispatch(navigationActions.setNavigationId(target.backgroundId));
        return;
      case "music":
        dispatch(navigationActions.setSection("music"));
        dispatch(trackerActions.setSelectedSongId(target.musicId));
        return;
      case "sound":
        dispatch(navigationActions.setSection("sounds"));
        dispatch(navigationActions.setNavigationId(target.soundId));
        return;
    }
  };

const allActions = {
  ...actions,
  selectSceneTileForPainting,
  openEditorResourceById,
};

export default allActions;
