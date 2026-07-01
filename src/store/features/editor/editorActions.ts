import { actions } from "./editorState";
import { AppThunk } from "store/storeTypes";
import settingsActions from "store/features/settings/settingsActions";
import { TOOL_TILES } from "consts";

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

const allActions = { ...actions, selectSceneTileForPainting };

export default allActions;
