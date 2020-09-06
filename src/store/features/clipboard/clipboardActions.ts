import { createAction, AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import {
  Actor,
  Trigger,
  Scene,
  ScriptEvent,
  sceneSelectors,
  actorSelectors,
  triggerSelectors,
  SceneData,
} from "../entities/entitiesState";
import { RootState } from "../../configureStore";
import editorActions from "../editor/editorActions";
import entitiesActions from "../entities/entitiesActions";

const copyActor = createAction<Actor>("clipboard/copyActor");
const copyTrigger = createAction<Trigger>("clipboard/copyTrigger");
const copyScene = createAction<Scene>("clipboard/copyScene");
const copyEvent = createAction<ScriptEvent>("clipboard/copyEvent");
const copyScript = createAction<ScriptEvent[]>("clipboard/copyScript");
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
      })
    );
  }
};

export default {
  copyActor,
  copyTrigger,
  copyScene,
  copyEvent,
  copyScript,
  copySelectedEntity,
  pasteClipboardEntity,
  pasteClipboardEntityInPlace,
  pasteCustomEvents
};
