import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MIDDLE_MOUSE, TILE_SIZE, TOOL_SELECT } from "consts";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import settingsActions from "store/features/settings/settingsActions";
import { useAppDispatch, useAppSelector, useAppStore } from "store/hooks";
import { sceneName } from "shared/lib/entities/entitiesHelpers";
import { SceneCursorView } from "components/world/entities/scenes/cursor/SceneCursorView";
import {
  getCapturedSceneCursorEventMode,
  getSceneCursorEventModes,
  getSceneCursorView,
} from "components/world/entities/scenes/cursor/modes/SceneCursorMode";
import type {
  SceneCursorEvent,
  SceneCursorMode,
  SceneCursorMouseDownRawEvent,
} from "components/world/entities/scenes/cursor/modes/SceneCursorMode";
import { useActorPlacementCursorMode } from "components/world/entities/scenes/cursor/modes/useActorPlacementCursorMode";
import { useCollisionPaintCursorMode } from "components/world/entities/scenes/cursor/modes/useCollisionPaintCursorMode";
import { useColorPaintCursorMode } from "components/world/entities/scenes/cursor/modes/useColorPaintCursorMode";
import { useDefaultCursorMode } from "components/world/entities/scenes/cursor/modes/useDefaultCursorMode";
import { useEraserCursorMode } from "components/world/entities/scenes/cursor/modes/useEraserCursorMode";
import { useEntityDragCursorMode } from "components/world/entities/scenes/cursor/modes/useEntityDragCursorMode";
import { useSceneGridSelectionCursorMode } from "components/world/entities/scenes/cursor/modes/useSceneGridSelectionCursorMode";
import { useSceneSelectCursorMode } from "components/world/entities/scenes/cursor/modes/useSceneSelectCursorMode";
import { useTilePaintCursorMode } from "components/world/entities/scenes/cursor/modes/useTilePaintCursorMode";
import { useTriggerPlacementCursorMode } from "components/world/entities/scenes/cursor/modes/useTriggerPlacementCursorMode";

interface WorldCursorProps {
  editable: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  zoomRatio: number;
}

interface CursorHover {
  sceneId: string;
  x: number;
  y: number;
  pX: number;
  pY: number;
  worldX: number;
  worldY: number;
}

const EMPTY_HOVER: CursorHover = {
  sceneId: "",
  x: 0,
  y: 0,
  pX: 0,
  pY: 0,
  worldX: 0,
  worldY: 0,
};

const sceneContentSelector = "[data-scene-content-id]";

const toCursorMouseDownRawEvent = (
  raw: MouseEvent,
): SceneCursorMouseDownRawEvent => ({
  altKey: raw.altKey,
  ctrlKey: raw.ctrlKey,
  metaKey: raw.metaKey,
  shiftKey: raw.shiftKey,
  nativeEvent: raw,
});

const WorldCursor = ({ editable, scrollRef, zoomRatio }: WorldCursorProps) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const scenes = useAppSelector(sceneSelectors.selectAll);
  const searchTerm = useAppSelector((state) => state.editor.searchTerm);
  const sceneSelectionIds = useAppSelector(
    (state) => state.editor.sceneSelectionIds,
  );
  const {
    x,
    y,
    sceneId: hoverSceneId,
  } = useAppSelector((state) => state.editor.hover);

  const [cursorHover, setCursorHover] = useState<CursorHover | undefined>();

  const cursorRef = useRef<HTMLDivElement>(null);
  const activeEventModeRef = useRef<SceneCursorMode | undefined>(undefined);
  const activeEventSceneIdRef = useRef("");
  const capturedEventModeRef = useRef<SceneCursorMode | undefined>(undefined);
  const hoverRef = useRef<CursorHover>(EMPTY_HOVER);

  const scene = useMemo(
    () => scenes.find((scene) => scene.id === hoverSceneId),
    [hoverSceneId, scenes],
  );
  const enabled = editable && !!scene;

  useEffect(() => {
    hoverRef.current = {
      ...(cursorHover ?? EMPTY_HOVER),
      sceneId: hoverSceneId,
      x,
      y,
    };
  }, [cursorHover, hoverSceneId, x, y]);

  const getCursorRect = useCallback(
    () => cursorRef.current?.getBoundingClientRect(),
    [],
  );

  const sceneSelectCursorMode = useSceneSelectCursorMode();
  const actorPlacementCursorMode = useActorPlacementCursorMode();
  const triggerPlacementCursorMode = useTriggerPlacementCursorMode();
  const collisionPaintCursorMode = useCollisionPaintCursorMode(getCursorRect);
  const colorPaintCursorMode = useColorPaintCursorMode();
  const tilePaintCursorMode = useTilePaintCursorMode();
  const eraserCursorMode = useEraserCursorMode();
  const sceneGridSelectionCursorMode = useSceneGridSelectionCursorMode();
  const entityDragCursorMode = useEntityDragCursorMode();
  const defaultCursorMode = useDefaultCursorMode();

  const cursorModes = useMemo(
    () => [
      sceneSelectCursorMode,
      actorPlacementCursorMode,
      triggerPlacementCursorMode,
      collisionPaintCursorMode,
      colorPaintCursorMode,
      tilePaintCursorMode,
      eraserCursorMode,
      sceneGridSelectionCursorMode,
      entityDragCursorMode,
      defaultCursorMode,
    ],
    [
      sceneSelectCursorMode,
      actorPlacementCursorMode,
      triggerPlacementCursorMode,
      collisionPaintCursorMode,
      colorPaintCursorMode,
      tilePaintCursorMode,
      eraserCursorMode,
      sceneGridSelectionCursorMode,
      entityDragCursorMode,
      defaultCursorMode,
    ],
  );

  const cursorView = useMemo(
    () => getSceneCursorView(cursorModes),
    [cursorModes],
  );

  const eventModes = useMemo(
    () => getSceneCursorEventModes(cursorModes),
    [cursorModes],
  );

  const capturedEventMode = useMemo(
    () => getCapturedSceneCursorEventMode(cursorModes),
    [cursorModes],
  );

  capturedEventModeRef.current = capturedEventMode;

  const getSceneFiltered = useCallback(
    (sceneId: string) => {
      const sceneIndex = scenes.findIndex((scene) => scene.id === sceneId);
      const scene = scenes[sceneIndex];
      const name = scene ? sceneName(scene, sceneIndex) : "";
      const multiSelected = sceneSelectionIds.includes(sceneId);

      return (
        (searchTerm &&
          name.toUpperCase().indexOf(searchTerm.toUpperCase()) === -1 &&
          sceneId !== searchTerm) ||
        (sceneSelectionIds.length > 1 && !multiSelected) ||
        false
      );
    },
    [sceneSelectionIds, scenes, searchTerm],
  );

  const setHover = useCallback(
    (nextHover: CursorHover | undefined) => {
      const next = nextHover ?? EMPTY_HOVER;
      const prev = hoverRef.current;

      hoverRef.current = next;

      if (
        prev.sceneId !== next.sceneId ||
        prev.x !== next.x ||
        prev.y !== next.y ||
        prev.worldX !== next.worldX ||
        prev.worldY !== next.worldY
      ) {
        if (nextHover) {
          setCursorHover(nextHover);
        } else {
          setCursorHover(undefined);
        }
      }

      if (
        prev.sceneId !== next.sceneId ||
        prev.x !== next.x ||
        prev.y !== next.y
      ) {
        dispatch(
          editorActions.sceneHover({
            sceneId: next.sceneId,
            x: next.x,
            y: next.y,
          }),
        );
      }
    },
    [dispatch],
  );

  const updateHoverFromMouseEvent = useCallback(
    (raw: MouseEvent) => {
      const scroll = scrollRef.current;

      if (!scroll || zoomRatio <= 0) {
        setHover(undefined);
        return undefined;
      }

      const target = document.elementFromPoint(raw.clientX, raw.clientY);
      const sceneContent =
        target instanceof Element
          ? target.closest<HTMLElement>(sceneContentSelector)
          : undefined;

      if (!sceneContent || !scroll.contains(sceneContent)) {
        setHover(undefined);
        return undefined;
      }

      const sceneId = sceneContent.dataset.sceneContentId ?? "";
      const scene = scenes.find((scene) => scene.id === sceneId);

      if (!scene) {
        setHover(undefined);
        return undefined;
      }

      const contentRect = sceneContent.getBoundingClientRect();
      const scrollRect = scroll.getBoundingClientRect();
      const pX = Math.floor((raw.clientX - contentRect.left) / zoomRatio);
      const pY = Math.floor((raw.clientY - contentRect.top) / zoomRatio);
      const tX = Math.floor(pX / TILE_SIZE);
      const tY = Math.floor(pY / TILE_SIZE);

      if (tX < 0 || tY < 0 || tX >= scene.width || tY >= scene.height) {
        setHover(undefined);
        return undefined;
      }

      const contentWorldX =
        (contentRect.left + scroll.scrollLeft - scrollRect.left) / zoomRatio;
      const contentWorldY =
        (contentRect.top + scroll.scrollTop - scrollRect.top) / zoomRatio;
      const nextHover: CursorHover = {
        sceneId,
        x: tX,
        y: tY,
        pX,
        pY,
        worldX: contentWorldX + tX * TILE_SIZE,
        worldY: contentWorldY + tY * TILE_SIZE,
      };

      setHover(nextHover);

      return nextHover;
    },
    [scenes, scrollRef, setHover, zoomRatio],
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
      if (e.code === "KeyP" && enabled) {
        dispatch(
          settingsActions.editPlayerStartAt({ sceneId: hoverSceneId, x, y }),
        );
        dispatch(editorActions.setTool({ tool: TOOL_SELECT }));
      }
    },
    [dispatch, enabled, hoverSceneId, x, y],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  useEffect(() => {
    return () => {
      capturedEventModeRef.current?.onCancel?.();
      activeEventModeRef.current?.onCancel?.();
      capturedEventModeRef.current = undefined;
      activeEventModeRef.current = undefined;
      activeEventSceneIdRef.current = "";
    };
  }, []);

  const createCursorEvent = useCallback(
    <T,>(raw: T, useActiveScene = true): SceneCursorEvent<T> => {
      const hover = hoverRef.current;
      const sceneId =
        useActiveScene && activeEventModeRef.current
          ? activeEventSceneIdRef.current
          : hover.sceneId;

      return {
        x: hover.x,
        y: hover.y,
        pX: hover.pX,
        pY: hover.pY,
        sceneId,
        isOverScene: !!sceneId && hover.sceneId === sceneId,
        raw,
      };
    },
    [],
  );

  const prepareCursorMouseDown = useCallback(
    (raw: MouseEvent) => {
      const hover = updateHoverFromMouseEvent(raw);

      if (!hover) {
        return false;
      }

      if (raw.which === MIDDLE_MOUSE) {
        return false;
      }

      if (getSceneFiltered(hover.sceneId)) {
        dispatch(editorActions.editSearchTerm(""));
      }

      return true;
    },
    [dispatch, getSceneFiltered, updateHoverFromMouseEvent],
  );

  const onWindowMouseDown = useCallback(
    (raw: MouseEvent) => {
      if (!editable || store.getState().editor.dragging) {
        return;
      }

      if (!prepareCursorMouseDown(raw)) {
        return;
      }

      const e = createCursorEvent(toCursorMouseDownRawEvent(raw));

      activeEventModeRef.current?.onCancel?.();
      activeEventModeRef.current = undefined;
      activeEventSceneIdRef.current = "";

      for (const mode of eventModes) {
        if (mode.onMouseDown?.(e)) {
          activeEventModeRef.current = mode;
          activeEventSceneIdRef.current = e.sceneId;
          return;
        }
      }
    },
    [createCursorEvent, editable, eventModes, prepareCursorMouseDown, store],
  );

  const onWindowMouseMove = useCallback(
    (raw: MouseEvent) => {
      updateHoverFromMouseEvent(raw);

      if (capturedEventMode) {
        capturedEventMode.onMouseMove?.(createCursorEvent(raw, false));
        return;
      }

      const activeMode = activeEventModeRef.current;

      if (!activeMode) {
        return;
      }

      activeMode.onMouseMove?.(createCursorEvent(raw));
    },
    [capturedEventMode, createCursorEvent, updateHoverFromMouseEvent],
  );

  const onWindowMouseUp = useCallback(
    (raw: MouseEvent) => {
      if (capturedEventMode) {
        updateHoverFromMouseEvent(raw);
        capturedEventMode.onMouseUp?.(createCursorEvent(raw, false));
        return;
      }

      const activeMode = activeEventModeRef.current;

      if (!activeMode) {
        return;
      }

      updateHoverFromMouseEvent(raw);

      const e = createCursorEvent(raw);

      activeEventModeRef.current = undefined;
      activeEventSceneIdRef.current = "";

      activeMode.onMouseUp?.(e);
    },
    [capturedEventMode, createCursorEvent, updateHoverFromMouseEvent],
  );

  useEffect(() => {
    window.addEventListener("mousedown", onWindowMouseDown);
    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => {
      window.removeEventListener("mousedown", onWindowMouseDown);
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
    };
  }, [onWindowMouseDown, onWindowMouseMove, onWindowMouseUp]);

  if (!editable || !cursorHover || !scene) {
    return null;
  }

  return (
    <SceneCursorView
      ref={cursorRef}
      x={cursorHover.worldX}
      y={cursorHover.worldY}
      view={cursorView}
    />
  );
};

export default WorldCursor;
