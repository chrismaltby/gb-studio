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
import { pasteAny } from "./clipboardHelpers";
import { ClipboardTypeActors, ClipboardTypeTriggers } from "./clipboardTypes";

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
const copyTriggers = createAction<{
  triggerIds: string[];
}>("clipboard/copyTriggers");
const copyActors = createAction<{
  actorIds: string[];
}>("clipboard/copyActors");
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
    }

    // if (typeof clipboardData !== "object" || clipboardData === null) {
    //   return;
    // }
    // const wide: {
    //   __type?: unknown;
    //   scene?: Partial<SceneData>;
    //   actor?: Partial<Actor>;
    //   trigger?: Partial<Trigger>;
    //   __variables?: Variable[];
    // } = clipboardData;

    // if (wide.__type === "scene" && wide.scene) {
    //   const clipboardScene = wide.scene;
    //   dispatch(pasteCustomEvents());
    //   dispatch(editorActions.setSceneDefaults(clipboardScene));
    // } else if (wide.__type === "actor" && wide.actor) {
    //   const clipboardActor = wide.actor;
    //   dispatch(pasteCustomEvents());
    //   dispatch(editorActions.setActorDefaults(clipboardActor));
    // } else if (wide.__type === "trigger" && wide.trigger) {
    //   const clipboardTrigger = wide.trigger;
    //   dispatch(pasteCustomEvents());
    //   dispatch(editorActions.setTriggerDefaults(clipboardTrigger));
    // }
    // if (wide.__variables) {
    //   const clipboardVariables = wide.__variables;
    //   dispatch(editorActions.setClipboardVariables(clipboardVariables));
    // }
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
      const trigger = clipboard.data.actors[0];
      dispatch(
        pasteActorAt({
          sceneId,
          x: trigger.x,
          y: trigger.y,
        })
      );
    }

    /*
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
    */
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
  copyTriggers,
  copyActors,
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
};
