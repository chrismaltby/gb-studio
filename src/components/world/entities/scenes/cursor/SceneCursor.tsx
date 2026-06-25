import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import settingsActions from "store/features/settings/settingsActions";
import { TOOL_SELECT, MIDDLE_MOUSE } from "consts";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SceneCursorView } from "./SceneCursorView";
import {
  getSceneCursorEventModes,
  getSceneCursorView,
} from "./modes/SceneCursorMode";
import type {
  SceneCursorEvent,
  SceneCursorMode,
} from "./modes/SceneCursorMode";
import { useSceneSelectCursorMode } from "./modes/useSceneSelectCursorMode";
import { useActorPlacementCursorMode } from "./modes/useActorPlacementCursorMode";
import { useCollisionPaintCursorMode } from "./modes/useCollisionPaintCursorMode";
import { useColorPaintCursorMode } from "./modes/useColorPaintCursorMode";
import { useDefaultCursorMode } from "./modes/useDefaultCursorMode";
import { useEraserCursorMode } from "./modes/useEraserCursorMode";
import { useTriggerPlacementCursorMode } from "./modes/useTriggerPlacementCursorMode";
import { useSceneGridSelectionCursorMode } from "./modes/useSceneGridSelectionCursorMode";

interface SceneCursorProps {
  sceneId: string;
  sceneFiltered: boolean;
  enabled: boolean;
}

const SceneCursor = ({ sceneId, enabled, sceneFiltered }: SceneCursorProps) => {
  const dispatch = useAppDispatch();
  const {
    x,
    y,
    sceneId: hoverSceneId,
  } = useAppSelector((state) => state.editor.hover);

  const cursorRef = useRef<HTMLDivElement>(null);

  const getCursorRect = useCallback(
    () => cursorRef.current?.getBoundingClientRect(),
    [],
  );

  const cursorModeContext = useMemo(
    () => ({
      enabled,
      sceneId,
      getCursorRect,
    }),
    [enabled, getCursorRect, sceneId],
  );

  const sceneSelectCursorMode = useSceneSelectCursorMode(cursorModeContext);
  const actorPlacementCursorMode =
    useActorPlacementCursorMode(cursorModeContext);
  const triggerPlacementCursorMode =
    useTriggerPlacementCursorMode(cursorModeContext);
  const collisionPaintCursorMode =
    useCollisionPaintCursorMode(cursorModeContext);
  const colorPaintCursorMode = useColorPaintCursorMode(cursorModeContext);
  const eraserCursorMode = useEraserCursorMode(cursorModeContext);
  const sceneGridSelectionCursorMode =
    useSceneGridSelectionCursorMode(cursorModeContext);
  const defaultCursorMode = useDefaultCursorMode();

  const activeEventModeRef = useRef<SceneCursorMode | undefined>(undefined);

  const cursorModes = useMemo(
    () => [
      sceneSelectCursorMode,
      actorPlacementCursorMode,
      triggerPlacementCursorMode,
      collisionPaintCursorMode,
      colorPaintCursorMode,
      eraserCursorMode,
      sceneGridSelectionCursorMode,
      defaultCursorMode,
    ],
    [
      sceneSelectCursorMode,
      actorPlacementCursorMode,
      triggerPlacementCursorMode,
      collisionPaintCursorMode,
      colorPaintCursorMode,
      eraserCursorMode,
      sceneGridSelectionCursorMode,
      defaultCursorMode,
    ],
  );

  const cursorView = useMemo(
    () => getSceneCursorView(cursorModes),
    [cursorModes],
  );

  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, hoverSceneId),
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.nodeName !== "BODY") {
        return;
      }
      if (e.ctrlKey || e.shiftKey || e.metaKey) {
        return;
      }
      if (e.code === "KeyP") {
        if (enabled) {
          dispatch(settingsActions.editPlayerStartAt({ sceneId, x, y }));
          dispatch(editorActions.setTool({ tool: TOOL_SELECT }));
        }
      }
    },
    [dispatch, enabled, sceneId, x, y],
  );

  // Keyboard handlers
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  useEffect(() => {
    return () => {
      activeEventModeRef.current?.onCancel?.();
      activeEventModeRef.current = undefined;
    };
  }, []);

  const createCursorEvent = useCallback(
    <T,>(raw: T): SceneCursorEvent<T> => ({
      x,
      y,
      sceneId,
      isOverScene: sceneId === hoverSceneId,
      raw,
    }),
    [hoverSceneId, sceneId, x, y],
  );

  const prepareCursorMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!scene) {
        return false;
      }

      if (e.nativeEvent.which === MIDDLE_MOUSE) {
        return false;
      }

      // If clicked scene was filtered out using search
      // clear search term so scene will become fully visible again
      if (sceneFiltered) {
        dispatch(editorActions.editSearchTerm(""));
      }

      return true;
    },
    [dispatch, scene, sceneFiltered],
  );

  const eventModes = useMemo(
    () => getSceneCursorEventModes(cursorModes),
    [cursorModes],
  );

  const onMouseDown = useCallback(
    (raw: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!prepareCursorMouseDown(raw)) {
        return;
      }

      const e = createCursorEvent(raw);

      activeEventModeRef.current?.onCancel?.();
      activeEventModeRef.current = undefined;

      for (const mode of eventModes) {
        if (mode.onMouseDown?.(e)) {
          activeEventModeRef.current = mode;
          return;
        }
      }
    },
    [createCursorEvent, eventModes, prepareCursorMouseDown],
  );

  const onWindowMouseMove = useCallback(
    (raw: MouseEvent) => {
      const activeMode = activeEventModeRef.current;

      if (!activeMode) {
        return;
      }

      activeMode.onMouseMove?.(createCursorEvent(raw));
    },
    [createCursorEvent],
  );

  const onWindowMouseUp = useCallback(
    (raw: MouseEvent) => {
      const activeMode = activeEventModeRef.current;

      activeEventModeRef.current = undefined;

      if (!activeMode) {
        return;
      }

      activeMode.onMouseUp?.(createCursorEvent(raw));
    },
    [createCursorEvent],
  );

  useEffect(() => {
    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
    };
  }, [onWindowMouseMove, onWindowMouseUp]);

  if (!enabled) {
    return <div />;
  }
  return (
    <SceneCursorView
      ref={cursorRef}
      x={x}
      y={y}
      view={cursorView}
      onMouseDown={onMouseDown}
    />
  );
};

export default SceneCursor;
