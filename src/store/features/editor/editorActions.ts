import { actions } from "./editorState";
import type { Dispatch } from "redux";
import type { AppThunk, RootState } from "store/storeTypes";
import settingsActions from "store/features/settings/settingsActions";
import { TOOL_TILES } from "consts";
import navigationActions from "store/features/navigation/navigationActions";
import trackerActions from "store/features/tracker/trackerActions";
import type { BuildAssetMatch } from "shared/lib/compiler/buildAssetUsage";
import type { CompiledScriptSource } from "lib/compiler/compileData";
import {
  actorSelectors,
  backgroundSelectors,
  musicSelectors,
  sceneSelectors,
  soundSelectors,
  spriteSheetSelectors,
} from "store/features/entities/entitiesSelectors";

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

const editorTargetForSymbol = (
  state: RootState,
  match: BuildAssetMatch,
): EditorResourceTarget | undefined => {
  switch (match.type) {
    case "scene": {
      const entity = sceneSelectors
        .selectAll(state)
        .find((item) => item.symbol === match.symbol);
      return entity ? { type: "scene", sceneId: entity.id } : undefined;
    }
    case "sprite": {
      const entity = spriteSheetSelectors
        .selectAll(state)
        .find((item) => item.symbol === match.symbol);
      return entity ? { type: "sprite", spriteId: entity.id } : undefined;
    }
    case "background": {
      const entity = backgroundSelectors
        .selectAll(state)
        .find((item) => item.symbol === match.symbol);
      return entity
        ? { type: "background", backgroundId: entity.id }
        : undefined;
    }
    case "music": {
      const entity = musicSelectors
        .selectAll(state)
        .find((item) => item.symbol === match.symbol);
      return entity ? { type: "music", musicId: entity.id } : undefined;
    }
    case "sound": {
      const entity = soundSelectors
        .selectAll(state)
        .find((item) => item.symbol === match.symbol);
      return entity ? { type: "sound", soundId: entity.id } : undefined;
    }
  }
};

const openEditorResourceBySymbol =
  (match: BuildAssetMatch): AppThunk =>
  (dispatch, getState) => {
    const target = editorTargetForSymbol(getState(), match);
    if (target) dispatch(openEditorResourceById(target));
  };

const sceneSecondaryTabForScriptKey = (scriptKey: string) =>
  (
    ({
      playerHit1Script: "hit1",
      playerHit2Script: "hit2",
      playerHit3Script: "hit3",
    }) as const
  )[scriptKey as "playerHit1Script" | "playerHit2Script" | "playerHit3Script"];
const actorScriptTab = (scriptKey: string, hasCollisionGroup: boolean) =>
  scriptKey === "updateScript"
    ? "update"
    : scriptKey === "startScript"
      ? "start"
      : scriptKey.startsWith("hit") || hasCollisionGroup
        ? "hit"
        : "interact";
const actorSecondaryTabForScriptKey = (
  scriptKey: string,
  hasCollisionGroup: boolean,
) =>
  scriptKey === "script" && hasCollisionGroup
    ? "hitPlayer"
    : ({ hit1Script: "hit1", hit2Script: "hit2", hit3Script: "hit3" } as const)[
        scriptKey as "hit1Script" | "hit2Script" | "hit3Script"
      ];

const openEditorScript =
  (source: CompiledScriptSource): AppThunk =>
  (dispatch, getState) => {
    if (source.entityType === "scene") {
      dispatch(
        actions.setScriptTabScene(
          source.scriptKey === "script" ? "start" : "hit",
        ),
      );
      const secondary = sceneSecondaryTabForScriptKey(source.scriptKey);
      if (secondary) dispatch(actions.setScriptTabSecondary(secondary));
      dispatch(
        openEditorResourceById({ type: "scene", sceneId: source.entityId }),
      );
    } else if (source.entityType === "actor") {
      const hasCollisionGroup = Boolean(
        actorSelectors.selectById(getState(), source.entityId)?.collisionGroup,
      );
      dispatch(
        actions.setScriptTab(
          actorScriptTab(source.scriptKey, hasCollisionGroup),
        ),
      );
      const secondary = actorSecondaryTabForScriptKey(
        source.scriptKey,
        hasCollisionGroup,
      );
      if (secondary) dispatch(actions.setScriptTabSecondary(secondary));
      dispatch(
        openEditorResourceById({
          type: "actor",
          actorId: source.entityId,
          sceneId: source.sceneId,
        }),
      );
    } else if (source.entityType === "trigger") {
      dispatch(
        actions.setScriptTabTrigger(
          source.scriptKey === "leaveScript" ? "leave" : "trigger",
        ),
      );
      dispatch(
        openEditorResourceById({
          type: "trigger",
          triggerId: source.entityId,
          sceneId: source.sceneId,
        }),
      );
    } else {
      dispatch(
        openEditorResourceById({
          type: "customEvent",
          customEventId: source.entityId,
        }),
      );
    }
  };

const allActions = {
  ...actions,
  selectSceneTileForPainting,
  openEditorResourceById,
  openEditorResourceBySymbol,
  openEditorScript,
};

export default allActions;
