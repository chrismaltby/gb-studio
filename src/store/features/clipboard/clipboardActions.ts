import { createAction, AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import { actions } from "./clipboardState";
import {
  sceneSelectors,
  actorSelectors,
  triggerSelectors,
} from "../entities/entitiesState";
import {
  Actor,
  Trigger,
  Scene,
  ScriptEvent,
  SceneData,
  Variable,
  ScriptEventParentType,
} from "../entities/entitiesTypes";
import { RootState } from "store/configureStore";
import editorActions from "../editor/editorActions";
import entitiesActions from "../entities/entitiesActions";

const fetchClipboard = createAction("clipboard/fetch");
const copyText = createAction<string>("clipboard/copyText");
const copyActor = createAction<Actor>("clipboard/copyActor");
const copyTrigger = createAction<Trigger>("clipboard/copyTrigger");
const copyScene = createAction<Scene>("clipboard/copyScene");
const copyEvent = createAction<ScriptEvent>("clipboard/copyEvent");
const copyScript = createAction<ScriptEvent[]>("clipboard/copyScript");
const copyScriptEvents = createAction<{
  scriptEventIds: string[];
}>("clipboard/copyScriptEvents");
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
  insertId: string;
  before: boolean;
}>("clipboard/pasteScriptEvents");
const pasteScriptEventValues = createAction<{
  scriptEventId: string;
}>("clipboard/pasteScriptEventValues");
const pasteCustomEvents = createAction<void>("clipboard/pasteCustomEvents");
const pastePaletteIds = createAction<{
  sceneId: string;
  type: "background" | "sprite";
}>("clipboard/pastePaletteIds");

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
        dispatch(copyScene(scene));
      }
    } else if (editorType === "actor") {
      const actor = actorSelectors.selectById(state, entityId);
      if (actor) {
        dispatch(copyActor(actor));
      }
    } else if (editorType === "trigger") {
      const trigger = triggerSelectors.selectById(state, entityId);
      if (trigger) {
        dispatch(copyTrigger(trigger));
      }
    }
  };

const pasteClipboardEntity =
  (clipboardData: unknown) =>
  (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
    if (typeof clipboardData !== "object" || clipboardData === null) {
      return;
    }
    const wide: {
      __type?: unknown;
      scene?: Partial<SceneData>;
      actor?: Partial<Actor>;
      trigger?: Partial<Trigger>;
      __variables?: Variable[];
    } = clipboardData;

    if (wide.__type === "scene" && wide.scene) {
      const clipboardScene = wide.scene;
      dispatch(pasteCustomEvents());
      dispatch(editorActions.setSceneDefaults(clipboardScene));
    } else if (wide.__type === "actor" && wide.actor) {
      const clipboardActor = wide.actor;
      dispatch(pasteCustomEvents());
      dispatch(editorActions.setActorDefaults(clipboardActor));
    } else if (wide.__type === "trigger" && wide.trigger) {
      const clipboardTrigger = wide.trigger;
      dispatch(pasteCustomEvents());
      dispatch(editorActions.setTriggerDefaults(clipboardTrigger));
    }
    if (wide.__variables) {
      const clipboardVariables = wide.__variables;
      dispatch(editorActions.setClipboardVariables(clipboardVariables));
    }
  };

const pasteClipboardEntityInPlace =
  (clipboardData: unknown) =>
  (
    dispatch: ThunkDispatch<RootState, unknown, AnyAction>,
    getState: () => RootState
  ) => {
    const state = getState();
    const { scene: sceneId } = state.editor;

    if (typeof clipboardData !== "object" || clipboardData === null) {
      return;
    }
    const wide: {
      __type?: unknown;
      scene?: Partial<SceneData>;
      actor?: Partial<Actor>;
      trigger?: Partial<Trigger>;
      __variables?: Variable[];
    } = clipboardData;

    if (wide.__type === "scene" && wide.scene) {
      const clipboardScene = wide.scene;
      dispatch(pasteCustomEvents());
      dispatch(
        entitiesActions.addScene({
          x: clipboardScene.x || 0,
          y: clipboardScene.y || 0,
          defaults: clipboardScene,
          variables: wide.__variables,
        })
      );
    } else if (sceneId && wide.__type === "actor" && wide.actor) {
      const clipboardActor = wide.actor;
      dispatch(pasteCustomEvents());
      dispatch(
        entitiesActions.addActor({
          sceneId,
          x: clipboardActor.x || 0,
          y: clipboardActor.y || 0,
          defaults: clipboardActor,
          variables: wide.__variables,
        })
      );
    } else if (sceneId && wide.__type === "trigger" && wide.trigger) {
      const clipboardTrigger = wide.trigger;
      dispatch(pasteCustomEvents());
      dispatch(
        entitiesActions.addTrigger({
          sceneId,
          x: clipboardTrigger.x || 0,
          y: clipboardTrigger.y || 0,
          width: clipboardTrigger.width || 1,
          height: clipboardTrigger.height || 1,
          defaults: clipboardTrigger,
          variables: wide.__variables,
        })
      );
    }
  };

export default {
  ...actions,
  fetchClipboard,
  copyText,
  copyActor,
  copyTrigger,
  copyScene,
  copyEvent,
  copyScript,
  copyScriptEvents,
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
};
