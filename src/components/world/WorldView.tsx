import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import throttle from "lodash/throttle";
import SceneView from "./SceneView";
import WorldHelp from "./WorldHelp";
import Connections from "./Connections";
import {
  MIDDLE_MOUSE,
  TOOL_COLORS,
  TOOL_COLLISIONS,
  TOOL_ERASER,
} from "consts";
import {
  sceneSelectors,
  getMaxSceneRight,
  getMaxSceneBottom,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { sceneName } from "store/features/entities/entitiesHelpers";
import { RootState } from "store/configureStore";
import { useDispatch, useSelector, useStore } from "react-redux";
import styled from "styled-components";

const Wrapper = styled.div`
  position: absolute;
  left: 0px;
  right: 0;
  top: 0;
  bottom: 0px;
  overflow: auto;
`;

const WorldGrid = styled.div`
  position: absolute;
`;

const WorldContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
`;

const NewSceneCursor = styled.div`
  position: absolute;
  cursor: pointer;
  background-color: rgba(3, 54, 99, 0.5);
  width: 256px;
  height: 256px;
  border-radius: 4px;
  z-index: 2000;
`;

const WorldView = () => {
  //#region Component State

  const dispatch = useDispatch();
  const store = useStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContentsRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const blockWheelZoom = useRef<number>();

  const [dragMode, setDragMode] = useState(false);
  const [hoverState, setHoverState] = useState<{ x: number; y: number }>();
  const dragState = useRef({
    dragDistanceX: 0,
    dragDistanceY: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const scrollState = useRef({
    scrollX: 0,
    scrollY: 0,
  });
  const isMouseOver = useRef(false);

  const loaded = useSelector((state: RootState) => state.document.loaded);
  const scenes = useSelector(
    (state: RootState) => sceneSelectors.selectIds(state) as string[]
  );
  const scenesLookup = useSelector((state: RootState) =>
    sceneSelectors.selectEntities(state)
  );

  const showConnections = useSelector(
    (state: RootState) =>
      state.project.present.settings.showConnections &&
      (state.editor.showLayers ||
        (state.editor.tool !== TOOL_COLORS &&
          state.editor.tool !== TOOL_COLLISIONS &&
          state.editor.tool !== TOOL_ERASER))
  );

  const clipboardVariables = useSelector(
    (state: RootState) => state.editor.clipboardVariables
  );
  const focusSceneId = useSelector(
    (state: RootState) => state.editor.focusSceneId
  );
  const sidebarWidth = useSelector(
    (state: RootState) => state.editor.worldSidebarWidth
  );

  const viewportWidth = window.innerWidth - sidebarWidth - 17;
  const viewportHeight = window.innerHeight - 40 - 17;

  const scrollWidth = useSelector((state: RootState) =>
    Math.max(viewportWidth, getMaxSceneRight(state) + 20)
  );
  const scrollHeight = useSelector((state: RootState) =>
    Math.max(viewportHeight, getMaxSceneBottom(state) + 60)
  );

  const focus = useSelector((state: RootState) => state.editor.worldFocus);

  const zoomRatio = useSelector(
    (state: RootState) => (state.editor.zoom || 100) / 100
  );

  const searchTerm = useSelector((state: RootState) => state.editor.searchTerm);

  const matchingScenes = searchTerm
    ? scenes.filter((scene, sceneIndex) => {
        const s = scenesLookup[scene];
        const name = s ? sceneName(s, sceneIndex) : "";
        return (
          searchTerm === scene ||
          name.toUpperCase().indexOf(searchTerm.toUpperCase()) !== -1
        );
      })
    : [];

  const onlyMatchingScene =
    (matchingScenes.length === 1 && scenesLookup[matchingScenes[0]]) ||
    scenesLookup[focusSceneId] ||
    null;

  const tool = useSelector((state: RootState) => state.editor.tool);
  const pasteMode = useSelector((state: RootState) => state.editor.pasteMode);

  const prevLoaded = useRef(false);
  const prevOnlyMatchingScene = useRef(onlyMatchingScene);
  const prevZoomRatio = useRef(0);

  //#endregion Component State

  //#region Clipboard handling

  const onCopy = useCallback(
    (e) => {
      if (e.target.nodeName !== "BODY") {
        return;
      }
      e.preventDefault();
      dispatch(clipboardActions.copySelectedEntity());
    },
    [dispatch]
  );

  const onPaste = useCallback(
    (e) => {
      if (e.target.nodeName !== "BODY") {
        return;
      }
      e.preventDefault();
      try {
        dispatch(clipboardActions.pasteClipboardEntity());
      } catch (err) {
        // Clipboard isn't pastable, just ignore it
      }
    },
    [dispatch]
  );

  //#endregion Clipboard handling

  //#region Keyboard handling

  const onKeyDown = useCallback(
    (e) => {
      if (e.target.nodeName !== "BODY") {
        return;
      }
      if (e.ctrlKey || e.shiftKey || e.metaKey) {
        return;
      }
      if (e.code === "Space") {
        setDragMode(true);
        e.preventDefault();
      }
      if (focus && (e.key === "Backspace" || e.key === "Delete")) {
        dispatch(entitiesActions.removeSelectedEntity());
      }
    },
    [dispatch, focus]
  );

  const onKeyUp = useCallback(
    (e) => {
      if (dragMode && (e.code === "Space" || e.key === "Alt")) {
        setDragMode(false);
      }
    },
    [dragMode]
  );

  //#endregion Keyboard handling

  //#region Zoom handling

  const onMouseWheel = useCallback(
    (e) => {
      if (e.ctrlKey && !blockWheelZoom.current) {
        e.preventDefault();
        if (e.wheelDelta > 0) {
          dispatch(
            editorActions.zoomIn({ section: "world", delta: e.deltaY * 0.5 })
          );
        } else {
          dispatch(
            editorActions.zoomOut({ section: "world", delta: e.deltaY * 0.5 })
          );
        }
      } else {
        // Don't allow mousewheel zoom while scrolling
        clearTimeout(blockWheelZoom.current);
        blockWheelZoom.current = setTimeout(() => {
          blockWheelZoom.current = undefined;
        }, 60);
      }
    },
    [dispatch]
  );

  //#endregion Zoom handling

  //#region Scroll handling

  const onScrollThrottled = useMemo(
    () =>
      throttle((left: number, top: number) => {
        dispatch(editorActions.scrollWorld({ x: left, y: top }));
      }, 10),
    [dispatch]
  );

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
      scrollState.current.scrollX = (
        e.currentTarget as HTMLDivElement
      ).scrollLeft;
      scrollState.current.scrollY = (
        e.currentTarget as HTMLDivElement
      ).scrollTop;
      onScrollThrottled(
        scrollState.current.scrollX,
        scrollState.current.scrollY
      );
    },
    [onScrollThrottled]
  );

  //#endregion Scroll handling

  //#region World Dragging

  const onWorldDragMove = useCallback((e: MouseEvent) => {
    if (!scrollRef.current) {
      return;
    }
    if (!e.buttons) {
      // If buttons isn't set that means the mouse button was likely
      // released while the mouse cursor was outside the window
      // so we should stop dragging
      window.removeEventListener("mousemove", onWorldDragMove);
      return;
    }
    scrollRef.current.scrollLeft -= e.movementX;
    scrollRef.current.scrollTop -= e.movementY;
    dragState.current.dragDistanceX -= e.movementX;
    dragState.current.dragDistanceY -= e.movementY;
  }, []);

  const onEndWorldDrag = useCallback(
    (e: MouseEvent) => {
      if (
        Math.abs(dragState.current.dragDistanceX) < 20 &&
        Math.abs(dragState.current.dragDistanceY) < 20
      ) {
        if (e.target === worldRef.current) {
          dispatch(editorActions.selectWorld());
        }
      }
      window.removeEventListener("mousemove", onWorldDragMove);
      window.removeEventListener("mouseup", onEndWorldDrag);
    },
    [dispatch, onWorldDragMove]
  );

  const startWorldDrag = useCallback(
    (_e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      dragState.current.dragDistanceX = 0;
      dragState.current.dragDistanceY = 0;

      window.addEventListener("mousemove", onWorldDragMove);
      window.addEventListener("mouseup", onEndWorldDrag);
    },
    [onEndWorldDrag, onWorldDragMove]
  );

  const startWorldDragIfAltOrMiddleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (dragMode || e.nativeEvent.which === MIDDLE_MOUSE) {
        e.preventDefault();
        e.stopPropagation();
        window.addEventListener("mousemove", onWorldDragMove);
        window.addEventListener("mouseup", onEndWorldDrag);
      }
    },
    [dragMode, onEndWorldDrag, onWorldDragMove]
  );

  //#endregion World Dragging

  //#region Add Scene

  const onAddScene = useCallback(() => {
    if (!hoverState) {
      return;
    }
    if (pasteMode) {
      dispatch(clipboardActions.pasteSceneAt(hoverState));
    } else {
      dispatch(
        entitiesActions.addScene({
          ...hoverState,
          variables: clipboardVariables,
        })
      );
    }
    dispatch(editorActions.setTool({ tool: "select" }));
    setHoverState(undefined);
  }, [clipboardVariables, dispatch, hoverState, pasteMode]);

  //#endregion Add Scene

  //#region World Resize

  const onWindowResizeThrottled = useMemo(
    () =>
      throttle(() => {
        dispatch(
          editorActions.resizeWorldView({
            width: window.innerWidth,
            height: window.innerHeight,
          })
        );
      }, 300),
    [dispatch]
  );

  const onWindowResize = useCallback(() => {
    onWindowResizeThrottled();
  }, [onWindowResizeThrottled]);

  // Set window size on load
  useEffect(() => {
    onWindowResize();
  }, [onWindowResize]);

  //#endregion World Resize

  //#region Scroll position

  const onMouseEnter = useCallback(() => {
    isMouseOver.current = true;
  }, []);

  const onMouseLeave = useCallback(() => {
    isMouseOver.current = false;
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const boundingRect = e.currentTarget.getBoundingClientRect();
      const x = e.pageX + e.currentTarget.scrollLeft - boundingRect.x;
      const y = e.pageY + e.currentTarget.scrollTop - boundingRect.y - 0;

      dragState.current.offsetX = e.pageX - boundingRect.x;
      dragState.current.offsetY = e.pageY - boundingRect.y;

      if (tool === "scene") {
        setHoverState({
          x: x / zoomRatio - 128,
          y: y / zoomRatio - 128,
        });
      }
    },
    [tool, zoomRatio]
  );

  useEffect(() => {
    if (zoomRatio !== prevZoomRatio.current) {
      const view = scrollRef.current;
      const viewContents = scrollContentsRef.current;
      if (!view || !viewContents) {
        return;
      }
      const oldScrollX = view.scrollLeft;
      const oldScrollY = view.scrollTop;
      const halfViewWidth = 0.5 * view.clientWidth;
      const halfViewHeight = 0.5 * view.clientHeight;
      const offsetX = isMouseOver.current
        ? dragState.current.offsetX
        : halfViewWidth;
      const offsetY = isMouseOver.current
        ? dragState.current.offsetY
        : halfViewHeight;
      const oldCenterX = oldScrollX + offsetX;
      const oldCenterY = oldScrollY + offsetY;
      const zoomChange = zoomRatio / prevZoomRatio.current;
      const newCenterX = oldCenterX * zoomChange;
      const newCenterY = oldCenterY * zoomChange;
      const newScrollX = newCenterX - offsetX;
      const newScrollY = newCenterY - offsetY;
      viewContents.style.transform = `scale(${zoomRatio})`;
      view.scroll({
        top: newScrollY,
        left: newScrollX,
      });
      scrollState.current.scrollX = newScrollX;
      scrollState.current.scrollY = newScrollY;
    }

    const scroll = scrollRef.current;
    if (scroll && loaded && !prevLoaded.current) {
      const state: RootState = store.getState();
      scrollState.current.scrollX = state.editor.worldScrollX;
      scrollState.current.scrollY = state.editor.worldScrollY;
      scroll.scrollTo(scrollState.current.scrollX, scrollState.current.scrollY);
    }

    if (
      onlyMatchingScene &&
      (!prevOnlyMatchingScene.current ||
        onlyMatchingScene.id !== prevOnlyMatchingScene.current.id)
    ) {
      const view = scrollRef.current;
      const viewContents = scrollContentsRef.current;
      if (!view || !viewContents) {
        return;
      }
      const halfViewWidth = 0.5 * view.clientWidth;
      const halfViewHeight = 0.5 * view.clientHeight;
      const newScrollX =
        (onlyMatchingScene.x + onlyMatchingScene.width * 8 * 0.5) * zoomRatio -
        halfViewWidth;
      const newScrollY =
        (onlyMatchingScene.y + onlyMatchingScene.height * 8 * 0.5) * zoomRatio -
        halfViewHeight;
      viewContents.style.transform = `scale(${zoomRatio})`;
      view.scroll({
        top: newScrollY,
        left: newScrollX,
      });
      scrollState.current.scrollX = newScrollX;
      scrollState.current.scrollY = newScrollY;
    }

    prevZoomRatio.current = zoomRatio;
    prevOnlyMatchingScene.current = onlyMatchingScene;
    prevLoaded.current = loaded;
  }, [loaded, onlyMatchingScene, store, zoomRatio]);

  //#endregion

  //#region Window Blur

  const onWindowBlur = useCallback(() => {
    setDragMode(false);
  }, []);

  //#endregion Window Blur

  //#region Event Listeners

  useEffect(() => {
    window.addEventListener("mousewheel", onMouseWheel, {
      passive: false,
    });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("copy", onCopy);
    window.addEventListener("paste", onPaste);
    window.addEventListener("resize", onWindowResize);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      window.removeEventListener("mousewheel", onMouseWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("mousemove", onWorldDragMove);
      window.removeEventListener("mouseup", onEndWorldDrag);
    };
  }, [
    onCopy,
    onEndWorldDrag,
    onKeyDown,
    onKeyUp,
    onMouseWheel,
    onPaste,
    onWindowBlur,
    onWindowResize,
    onWorldDragMove,
  ]);

  //#endregion Event Listeners

  return (
    <Wrapper
      ref={scrollRef}
      onMouseOver={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      onMouseDown={startWorldDragIfAltOrMiddleClick}
      onScroll={onScroll}
      style={
        dragMode
          ? {
              cursor: "grab",
            }
          : undefined
      }
    >
      <WorldContent ref={scrollContentsRef}>
        <WorldGrid
          ref={worldRef}
          style={{ width: scrollWidth, height: scrollHeight }}
          onMouseDown={startWorldDrag}
        />

        {loaded && scenes.length === 0 && <WorldHelp />}

        {scenes.map((sceneId, index) => (
          <SceneView
            key={sceneId}
            id={sceneId}
            index={index}
            editable={!dragMode}
          />
        ))}

        {showConnections && (
          <Connections
            width={scrollWidth}
            height={scrollHeight}
            zoomRatio={zoomRatio}
            editable={!dragMode}
          />
        )}

        {tool === "scene" && hoverState && (
          <NewSceneCursor
            onClick={onAddScene}
            style={{
              left: hoverState.x,
              top: hoverState.y,
            }}
          />
        )}
      </WorldContent>
    </Wrapper>
  );
};

export default WorldView;
