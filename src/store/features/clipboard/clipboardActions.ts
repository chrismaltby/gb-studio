import { createAction, AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import { actions } from "./clipboardState";
import {
  sceneSelectors,
  actorSelectors,
  triggerSelectors,
} from "../entities/entitiesState";
import { ScriptEventParentType } from "../entities/entitiesTypes";
import { RootState } from "store/configureStore";
import editorActions from "../editor/editorActions";
import { pasteAny } from "./clipboardHelpers";
import {
  ClipboardTypeActors,
  ClipboardTypeScenes,
  ClipboardTypeTriggers,
} from "./clipboardTypes";

const fetchClipboard = createAction("clipboard/fetch");
const copyText = createAction<string>("clipboard/copyText");
const copyScriptEvents = createAction<{
  scriptEventIds: string[];
}>("clipboard/copyScriptEvents");
const copyTriggers = createAction<{
  triggerIds: string[];
}>("clipboard/copyTriggers");
const copyActors = createAction<{
  actorIds: string[];
}>("clipboard/copyActors");
const copyScenes = createAction<{
  sceneIds: string[];
}>("clipboard/copyScenes");
const copyMetasprites = createAction<{
  metaspriteIds: string[];
}>("clipboard/copyMetasprites");
const copyMetaspriteTiles = createAction<{
  metaspriteTileIds: string[];
}>("clipboard/copyMetaspriteTiles");
const copySpriteState = createAction<{
  spriteStateId: string;
}>("clipboard/copySpriteState");
const copyPaletteIds = createAction<{
  paletteIds: string[];
}>("clipboard/copyPaletteIds");
const pasteSprite = createAction<{
  spriteSheetId: string;
  metaspriteId: string;
  spriteAnimationId: string;
  spriteStateId: string;
}>("clipboard/pasteSprite");
const pasteScriptEvents = createAction<{
  entityId: string;
  type: ScriptEventParentType;
  key: string;
  insertId?: string;
  before?: boolean;
}>("clipboard/pasteScriptEvents");
const pasteScriptEventValues = createAction<{
  scriptEventId: string;
}>("clipboard/pasteScriptEventValues");
const pasteCustomEvents = createAction<void>("clipboard/pasteCustomEvents");
const pastePaletteIds = createAction<{
  sceneId: string;
  type: "background" | "sprite";
}>("clipboard/pastePaletteIds");
const pasteTriggerAt = createAction<{
  sceneId: string;
  x: number;
  y: number;
}>("clipboard/pasteTriggerAt");
const pasteActorAt = createAction<{
  sceneId: string;
  x: number;
  y: number;
}>("clipboard/pasteActorAt");
const pasteSceneAt = createAction<{
  x: number;
  y: number;
}>("clipboard/pasteSceneAt");

const copySelectedEntity =
  () =>
  (
    dispatch: ThunkDispatch<RootState, unknown, AnyAction>,
    getState: () => RootState
  ) => {
    const state = getState();
    const { scene: sceneId, entityId, type: editorType } = state.editor;
    if (editorType === "scene") {
      const scene = sceneSelectors.selectById(state, sceneId);
      if (scene) {
        dispatch(copyScenes({ sceneIds: [scene.id] }));
      }
    } else if (editorType === "actor") {
      const actor = actorSelectors.selectById(state, entityId);
      if (actor) {
        dispatch(copyActors({ actorIds: [actor.id] }));
      }
    } else if (editorType === "trigger") {
      const trigger = triggerSelectors.selectById(state, entityId);
      if (trigger) {
        dispatch(copyTriggers({ triggerIds: [trigger.id] }));
      }
    }
  };

const pasteClipboardEntity =
  () => (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    const clipboard = pasteAny();
    if (!clipboard) {
      return;
    }
    if (clipboard.format === ClipboardTypeTriggers) {
      dispatch(editorActions.setTool({ tool: "triggers" }));
      dispatch(editorActions.setPasteMode(true));
    } else if (clipboard.format === ClipboardTypeActors) {
      dispatch(editorActions.setTool({ tool: "actors" }));
      dispatch(editorActions.setPasteMode(true));
    } else if (clipboard.format === ClipboardTypeScenes) {
      dispatch(editorActions.setTool({ tool: "scene" }));
      dispatch(editorActions.setPasteMode(true));
    }
  };

const pasteClipboardEntityInPlace =
  () =>
  (
    dispatch: ThunkDispatch<RootState, unknown, AnyAction>,
    getState: () => RootState
  ) => {
    const clipboard = pasteAny();
    if (!clipboard) {
      return;
    }
    const state = getState();
    const { scene: sceneId } = state.editor;
    if (clipboard.format === ClipboardTypeTriggers) {
      const trigger = clipboard.data.triggers[0];
      dispatch(
        pasteTriggerAt({
          sceneId,
          x: trigger.x,
          y: trigger.y,
        })
      );
    } else if (clipboard.format === ClipboardTypeActors) {
      const actor = clipboard.data.actors[0];
      dispatch(
        pasteActorAt({
          sceneId,
          x: actor.x,
          y: actor.y,
        })
      );
    } else if (clipboard.format === ClipboardTypeScenes) {
      const scene = clipboard.data.scenes[0];
      dispatch(
        pasteSceneAt({
          x: scene.x,
          y: scene.y,
        })
      );
    }
  };

export default {
  ...actions,
  fetchClipboard,
  copyText,
  copyScriptEvents,
  copyTriggers,
  copyActors,
  copyScenes,
  copyMetasprites,
  copyMetaspriteTiles,
  copySpriteState,
  copySelectedEntity,
  copyPaletteIds,
  pasteClipboardEntity,
  pasteClipboardEntityInPlace,
  pasteCustomEvents,
  pasteSprite,
  pastePaletteIds,
  pasteScriptEvents,
  pasteScriptEventValues,
  pasteTriggerAt,
  pasteActorAt,
  pasteSceneAt,
};
