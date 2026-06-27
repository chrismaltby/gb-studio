import { useCallback, useMemo, useRef } from "react";
import {
  DRAG_ACTOR,
  DRAG_DESTINATION,
  DRAG_PLAYER,
  DRAG_TRIGGER,
  TILE_SIZE,
} from "consts";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { actorSelectors } from "store/features/entities/entitiesSelectors";
import settingsActions from "store/features/settings/settingsActions";
import { useAppDispatch, useAppSelector, useAppStore } from "store/hooks";
import { applyDragOffset } from "components/world/entities/scenes/cursor/getDragOffset";
import type {
  SceneCursorMode,
  SceneCursorMouseMoveHandler,
  SceneCursorMouseUpHandler,
} from "./SceneCursorMode";

const EVENT_PRIORITY = 1000;

export const useEntityDragCursorMode = (): SceneCursorMode => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const enabled = useAppSelector((state) => !!state.editor.dragging);
  const lastPositionRef = useRef("");

  const onMouseMove = useCallback<SceneCursorMouseMoveHandler>(
    (event) => {
      if (!event.isOverScene) {
        return;
      }

      const state = store.getState();
      const { dragging, scene } = state.editor;

      if (dragging?.type === DRAG_ACTOR) {
        const actor = actorSelectors.selectById(state, dragging.actorId);

        if (!actor) {
          return;
        }

        const usePixelCoordinates = actor.coordinateType === "pixels";
        const unitSize = usePixelCoordinates ? 1 : TILE_SIZE;
        const pointerX = usePixelCoordinates ? event.pX : event.x;
        const pointerY = usePixelCoordinates ? event.pY : event.y;
        const { x, y } = applyDragOffset(
          pointerX,
          pointerY,
          dragging.offsetX,
          dragging.offsetY,
          unitSize,
        );
        const position = `${dragging.type}:${dragging.actorId}:${event.sceneId}:${x}:${y}`;

        if (lastPositionRef.current === position) {
          return;
        }
        lastPositionRef.current = position;

        dispatch(
          entitiesActions.moveActor({
            actorId: dragging.actorId,
            sceneId: scene,
            newSceneId: event.sceneId,
            x,
            y,
          }),
        );
      } else if (dragging?.type === DRAG_TRIGGER) {
        const { x, y } = applyDragOffset(
          event.x,
          event.y,
          dragging.offsetX,
          dragging.offsetY,
          TILE_SIZE,
        );
        const position = `${dragging.type}:${dragging.triggerId}:${event.sceneId}:${x}:${y}`;

        if (lastPositionRef.current === position) {
          return;
        }
        lastPositionRef.current = position;

        dispatch(
          entitiesActions.moveTrigger({
            sceneId: scene,
            triggerId: dragging.triggerId,
            newSceneId: event.sceneId,
            x,
            y,
          }),
        );
      } else if (dragging?.type === DRAG_PLAYER) {
        const position = `${dragging.type}:${event.sceneId}:${event.x}:${event.y}`;

        if (lastPositionRef.current === position) {
          return;
        }
        lastPositionRef.current = position;

        dispatch(
          settingsActions.editPlayerStartAt({
            sceneId: event.sceneId,
            x: event.x,
            y: event.y,
          }),
        );
      } else if (dragging?.type === DRAG_DESTINATION) {
        const position = `${dragging.type}:${dragging.eventId}:${event.sceneId}:${event.x}:${event.y}`;

        if (lastPositionRef.current === position) {
          return;
        }
        lastPositionRef.current = position;

        dispatch(
          entitiesActions.editScriptEventDestination({
            scriptEventId: dragging.eventId,
            destSceneId: event.sceneId,
            x: event.x,
            y: event.y,
          }),
        );
      }
    },
    [dispatch, store],
  );

  const stopDragging = useCallback(() => {
    const { dragging } = store.getState().editor;

    lastPositionRef.current = "";

    if (dragging?.type === DRAG_ACTOR) {
      dispatch(editorActions.dragActorStop());
    } else if (dragging?.type === DRAG_TRIGGER) {
      dispatch(editorActions.dragTriggerStop());
    } else if (dragging?.type === DRAG_PLAYER) {
      dispatch(editorActions.dragPlayerStop());
    } else if (dragging?.type === DRAG_DESTINATION) {
      dispatch(editorActions.dragDestinationStop());
    }
  }, [dispatch, store]);

  const onMouseUp = useCallback<SceneCursorMouseUpHandler>(() => {
    stopDragging();
  }, [stopDragging]);

  return useMemo(
    () => ({
      id: "entityDrag",
      enabled,
      viewPriority: 0,
      eventPriority: EVENT_PRIORITY,
      captureEventsWhenEnabled: true,
      onMouseMove,
      onMouseUp,
      onCancel: stopDragging,
    }),
    [enabled, onMouseMove, onMouseUp, stopDragging],
  );
};
