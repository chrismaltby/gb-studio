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
  MetaspriteTile,
  Metasprite,
} from "../entities/entitiesTypes";
import { RootState } from "../../configureStore";
import editorActions from "../editor/editorActions";
import entitiesActions from "../entities/entitiesActions";

const fetchClipboard = createAction("clipboard/fetch");
const copyText = createAction<string>("clipboard/copyText");
const copyActor = createAction<Actor>("clipboard/copyActor");
const copyTrigger = createAction<Trigger>("clipboard/copyTrigger");
const copyScene = createAction<Scene>("clipboard/copyScene");
const copyEvent = createAction<ScriptEvent>("clipboard/copyEvent");
const copyScript = createAction<ScriptEvent[]>("clipboard/copyScript");
const copyMetasprites = createAction<{
  metaspriteIds: string[];
}>("clipboard/copyMetasprites");
const copyMetaspriteTiles = createAction<{
  metaspriteTileIds: string[];
}>("clipboard/copyMetaspriteTiles");
const pasteSprite = createAction<{
  metaspriteId: string;
  spriteAnimationId: string;
}>("clipboard/paste");
const pasteMetasprites = createAction<void>("clipboard/pasteMetasprites");
const pasteMetaspriteTiles = createAction<void>(
  "clipboard/pasteMetaspriteTiles"
);
const pasteCustomEvents = createAction<void>("clipboard/pasteCustomEvents");

const copySelectedEntity = () => (
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

const pasteClipboardEntity = (clipboardData: any) => (
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>
) => {
  if (clipboardData.__type === "scene") {
    const clipboardScene = clipboardData.scene as Partial<SceneData>;
    dispatch(pasteCustomEvents());
    dispatch(editorActions.setSceneDefaults(clipboardScene));
  } else if (clipboardData.__type === "actor") {
    const clipboardActor = clipboardData.actor as Partial<Actor>;
    dispatch(pasteCustomEvents());
    dispatch(editorActions.setActorDefaults(clipboardActor));
  } else if (clipboardData.__type === "trigger") {
    const clipboardTrigger = clipboardData.trigger as Partial<Trigger>;
    dispatch(pasteCustomEvents());
    dispatch(editorActions.setTriggerDefaults(clipboardTrigger));
  }
  if (clipboardData.__variables) {
    const clipboardVariables = clipboardData.__variables as Variable[];
    dispatch(editorActions.setClipboardVariables(clipboardVariables));
  }
};

const pasteClipboardEntityInPlace = (clipboardData: any) => (
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>,
  getState: () => RootState
) => {
  const state = getState();
  const { scene: sceneId } = state.editor;

  if (clipboardData.__type === "scene") {
    const clipboardScene = clipboardData.scene;
    dispatch(pasteCustomEvents());
    dispatch(
      entitiesActions.addScene({
        x: clipboardScene.x,
        y: clipboardScene.y,
        defaults: clipboardScene,
        variables: clipboardData.__variables,
      })
    );
  } else if (sceneId && clipboardData.__type === "actor") {
    const clipboardActor = clipboardData.actor;
    dispatch(pasteCustomEvents());
    dispatch(
      entitiesActions.addActor({
        sceneId,
        x: clipboardActor.x,
        y: clipboardActor.y,
        defaults: clipboardActor,
        variables: clipboardData.__variables,
      })
    );
  } else if (sceneId && clipboardData.__type === "trigger") {
    const clipboardTrigger = clipboardData.trigger;
    dispatch(pasteCustomEvents());
    dispatch(
      entitiesActions.addTrigger({
        sceneId,
        x: clipboardTrigger.x,
        y: clipboardTrigger.y,
        width: clipboardTrigger.width,
        height: clipboardTrigger.height,
        defaults: clipboardTrigger,
        variables: clipboardData.__variables,
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
  copyMetasprites,
  copyMetaspriteTiles,
  copySelectedEntity,
  pasteClipboardEntity,
  pasteClipboardEntityInPlace,
  pasteCustomEvents,
  pasteMetasprites,
  pasteMetaspriteTiles,
  pasteSprite,
};
