import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import throttle from "lodash/throttle";
import SceneView from "./entities/scenes/SceneView";
import WorldHelp from "./WorldHelp";
import Connections from "./connections/Connections";
import {
  MIDDLE_MOUSE,
  TOOL_COLORS,
  TOOL_COLLISIONS,
  TOOL_TILES,
  TOOL_ERASER,
  TILE_SIZE,
  TOOL_SELECT,
  TOOL_SCENE,
  TOOL_NOTE,
} from "consts";
import {
  sceneSelectors,
  getMaxWorldRight,
  getMaxWorldBottom,
  noteSelectors,
} from "store/features/entities/entitiesSelectors";
import editorActions from "store/features/editor/editorActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { sceneName } from "shared/lib/entities/entitiesHelpers";
import styled from "styled-components";
import {
  useAppDispatch,
  useAppSelector,
  useAppSelectorMapArray,
  useAppStore,
} from "store/hooks";
import { Selection } from "ui/document/Selection";
import useResizeObserver from "ui/hooks/use-resize-observer";
import NoteView from "components/world/entities/notes/NoteView";
import renderWorldContextMenu from "components/world/contextMenus/renderWorldContextMenu";
import { useContextMenu } from "ui/hooks/use-context-menu";
import WorldCursor from "components/world/WorldCursor";
import { BackgroundIcon, JigsawIcon } from "ui/icons/Icons";
import l10n from "shared/lib/lang/l10n";
import PlayerStartMarker from "components/world/connections/PlayerStartMarker";
import { useSelectAllShortcut } from "ui/hooks/use-select-all";

const MOUSE_ZOOM_SPEED = 0.5;

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
  background: ${(props) => props.theme.colors.document.background};
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
  color: ${(props) => props.theme.colors.text};
  width: 160px;
  height: 144px;
  border-radius: 4px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  cursor: copy;

  svg {
    width: 64px;
    height: 64px;
    fill: ${(props) => props.theme.colors.text};
  }
`;

type Point = {
  x: number;
  y: number;
};

type SelectionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const SCENE_VERTICAL_PADDING = 20;

type WorldEntitiesProps = {
  sceneIds: string[];
  noteIds: string[];
  scrollWidth: number;
  scrollHeight: number;
  zoomRatio: number;
  showConnections: boolean;
  editable: boolean;
};

const WorldEntities = React.memo(
  ({
    sceneIds: scenes,
    noteIds: notes,
    scrollWidth,
    scrollHeight,
    zoomRatio,
    showConnections,
    editable,
  }: WorldEntitiesProps) => {
    return (
      <>
        {scenes.map((sceneId, index) => (
          <SceneView
            key={sceneId}
            id={sceneId}
            index={index}
            editable={editable}
          />
        ))}

        {notes.map((noteId, index) => (
          <NoteView
            key={noteId}
            id={noteId}
            index={index}
            editable={editable}
          />
        ))}

        {showConnections && (
          <Connections
            width={scrollWidth}
            height={scrollHeight}
            zoomRatio={zoomRatio}
            editable={editable}
          />
        )}

        <PlayerStartMarker editable={editable} />
      </>
    );
  },
);

WorldEntities.displayName = "WorldEntities";

type WorldInteractionOverlayProps = {
  tool: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  zoomRatio: number;
};

const WorldInteractionOverlay = React.memo(
  ({ tool, scrollRef, zoomRatio }: WorldInteractionOverlayProps) => {
    const dispatch = useAppDispatch();
    const store = useAppStore();

    const sceneAddType = useAppSelector((state) => state.editor.sceneAddType);
    const pasteMode = useAppSelector((state) => state.editor.pasteMode);

    const [hoverState, setHoverState] = useState<Point>();
    const [selectionStart, setSelectionStart] = useState<Point>();
    const [selectionEnd, setSelectionEnd] = useState<Point>();
    const selection = useRef<SelectionRect | undefined>(undefined);

    useEffect(() => {
      if (!selectionStart || !selectionEnd) {
        selection.current = undefined;
      } else {
        selection.current = {
          x: Math.min(selectionStart.x, selectionEnd.x),
          y: Math.min(selectionStart.y, selectionEnd.y),
          width: Math.abs(selectionEnd.x - selectionStart.x),
          height: Math.abs(selectionEnd.y - selectionStart.y),
        };
      }
    }, [selectionStart, selectionEnd]);

    const onAddScene = useCallback(
      (point: Point) => {
        const state = store.getState();
        const pasteMode = state.editor.pasteMode;
        const clipboardVariables = state.editor.clipboardVariables;
        const defaultSceneTypeId =
          state.project.present.settings.defaultSceneTypeId;
        const sceneAddType = state.editor.sceneAddType;

        if (pasteMode) {
          dispatch(clipboardActions.pasteSceneAt(point));
        } else {
          dispatch(
            entitiesActions.addScene({
              ...point,
              variables: clipboardVariables,
              tilemap: sceneAddType === "tilemap",
              defaults: {
                type: defaultSceneTypeId,
              },
            }),
          );
        }

        dispatch(editorActions.setTool({ tool: TOOL_SELECT }));
      },
      [dispatch, store],
    );

    const onAddNote = useCallback(
      (point: Point) => {
        dispatch(
          entitiesActions.addNote({
            ...point,
          }),
        );

        dispatch(editorActions.setTool({ tool: TOOL_SELECT }));
      },
      [dispatch],
    );

    const onMoveMultiSelection = useCallback(
      (e: MouseEvent) => {
        const scroll = scrollRef.current;
        if (!scroll) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        const boundingRect = scroll.getBoundingClientRect();
        const x = (e.pageX + scroll.scrollLeft - boundingRect.x) / zoomRatio;
        const y = (e.pageY + scroll.scrollTop - boundingRect.y) / zoomRatio;
        const point: Point = { x, y };

        if (selection.current) {
          const rect = selection.current;

          const state = store.getState();
          const scenes = sceneSelectors.selectAll(state);
          const notes = noteSelectors.selectAll(state);

          const selectedSceneIds = scenes
            .filter((scene) => {
              return (
                scene.x + scene.width * TILE_SIZE >= rect.x &&
                scene.x <= rect.x + rect.width &&
                scene.y + scene.height * TILE_SIZE + SCENE_VERTICAL_PADDING >=
                  rect.y &&
                scene.y <= rect.y + rect.height
              );
            })
            .map((s) => s.id);

          const selectedNoteIds = notes
            .filter((note) => {
              return (
                note.x + note.width * TILE_SIZE >= rect.x &&
                note.x <= rect.x + rect.width &&
                note.y + note.height * TILE_SIZE + SCENE_VERTICAL_PADDING >=
                  rect.y &&
                note.y <= rect.y + rect.height
              );
            })
            .map((s) => s.id);

          dispatch(
            editorActions.addSceneSelectionIds([
              ...selectedSceneIds,
              ...selectedNoteIds,
            ]),
          );
        }

        setSelectionEnd(point);
      },
      [dispatch, scrollRef, store, zoomRatio],
    );

    const onEndMultiSelection = useCallback(
      (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setSelectionStart(undefined);
        setSelectionEnd(undefined);

        window.removeEventListener("mousemove", onMoveMultiSelection);
        window.removeEventListener("mouseup", onEndMultiSelection);
      },
      [onMoveMultiSelection],
    );

    const onKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.shiftKey && tool === TOOL_SELECT) {
          setSelectionStart(undefined);
          setSelectionEnd(undefined);
        }
      },
      [tool],
    );

    useEffect(() => {
      window.addEventListener("keydown", onKeyDown);

      return () => {
        window.removeEventListener("keydown", onKeyDown);
      };
    }, [onKeyDown]);

    const updateHover = useCallback(
      (e: MouseEvent) => {
        const scroll = scrollRef.current;
        if (!scroll) {
          return;
        }

        if (!(e.target instanceof Node) || !scroll.contains(e.target)) {
          setHoverState(undefined);
          return;
        }

        if (tool !== TOOL_SCENE && tool !== TOOL_NOTE) {
          setHoverState(undefined);
          return;
        }

        const boundingRect = scroll.getBoundingClientRect();
        const x = e.pageX + scroll.scrollLeft - boundingRect.x;
        const y = e.pageY + scroll.scrollTop - boundingRect.y;

        setHoverState({
          x: x / zoomRatio - 80,
          y: y / zoomRatio - 72,
        });
      },
      [scrollRef, tool, zoomRatio],
    );

    useEffect(() => {
      window.addEventListener("mousemove", updateHover);

      return () => {
        window.removeEventListener("mousemove", updateHover);
      };
    }, [updateHover]);

    const onMouseDown = useCallback(
      (e: MouseEvent) => {
        const scroll = scrollRef.current;
        if (!scroll || !e.shiftKey || tool !== TOOL_SELECT) {
          return;
        }

        if (!(e.target instanceof Node) || !scroll.contains(e.target)) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        const boundingRect = scroll.getBoundingClientRect();
        const x = (e.pageX + scroll.scrollLeft - boundingRect.x) / zoomRatio;
        const y = (e.pageY + scroll.scrollTop - boundingRect.y) / zoomRatio;

        const point: Point = { x, y };
        setSelectionStart(point);
        setSelectionEnd(point);

        window.addEventListener("mousemove", onMoveMultiSelection);
        window.addEventListener("mouseup", onEndMultiSelection);
      },
      [onEndMultiSelection, onMoveMultiSelection, scrollRef, tool, zoomRatio],
    );

    useEffect(() => {
      window.addEventListener("mousedown", onMouseDown, true);

      return () => {
        window.removeEventListener("mousedown", onMouseDown, true);
      };
    }, [onMouseDown]);

    useEffect(() => {
      return () => {
        window.removeEventListener("mousemove", onMoveMultiSelection);
        window.removeEventListener("mouseup", onEndMultiSelection);
      };
    }, [onEndMultiSelection, onMoveMultiSelection]);

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        {tool === TOOL_SCENE && hoverState && (
          <NewSceneCursor
            onClick={() => onAddScene(hoverState)}
            style={{
              left: hoverState.x,
              top: hoverState.y,
              pointerEvents: "auto",
            }}
          >
            {!pasteMode &&
              (sceneAddType === "image" ? (
                <>
                  <BackgroundIcon />
                  {l10n("FIELD_IMAGE_SCENE")}
                </>
              ) : (
                <>
                  <JigsawIcon />
                  {l10n("FIELD_TILEMAP_SCENE")}
                </>
              ))}
          </NewSceneCursor>
        )}

        {tool === TOOL_NOTE && hoverState && (
          <NewSceneCursor
            onClick={() => onAddNote(hoverState)}
            style={{
              left: hoverState.x,
              top: hoverState.y,
              pointerEvents: "auto",
            }}
          />
        )}

        {selectionStart && selectionEnd && (
          <Selection
            style={{
              left: Math.min(selectionStart.x, selectionEnd.x),
              top: Math.min(selectionStart.y, selectionEnd.y),
              width: Math.abs(selectionEnd.x - selectionStart.x),
              height: Math.abs(selectionEnd.y - selectionStart.y),
            }}
          />
        )}
      </div>
    );
  },
);

WorldInteractionOverlay.displayName = "WorldInteractionOverlay";

const WorldView = () => {
  //#region Component State

  const dispatch = useAppDispatch();
  const store = useAppStore();

  // Redux Store
  const loaded = useAppSelector((state) => state.document.loaded);
  const sceneIds = useAppSelector(sceneSelectors.selectIds);
  const sceneNames = useAppSelectorMapArray(sceneSelectors.selectAll, "name");
  const noteIds = useAppSelector(noteSelectors.selectIds);

  const showConnections = useAppSelector(
    (state) =>
      state.editor.showLayers ||
      (state.editor.tool !== TOOL_COLORS &&
        state.editor.tool !== TOOL_COLLISIONS &&
        state.editor.tool !== TOOL_TILES &&
        state.editor.tool !== TOOL_ERASER),
  );
  const focusSceneId = useAppSelector((state) => state.editor.focusSceneId);

  const zoomRatio = useAppSelector((state) => (state.editor.zoom || 100) / 100);

  const worldMaxWidth = useAppSelector(getMaxWorldRight);
  const worldMaxHeight = useAppSelector(getMaxWorldBottom);

  const focus = useAppSelector((state) => state.editor.worldFocus);

  const searchTerm = useAppSelector((state) => state.editor.searchTerm);

  const selectedIds = useAppSelector((state) => state.editor.sceneSelectionIds);
  const tool = useAppSelector((state) => state.editor.tool);
  const scenePaintSelection = useAppSelector(
    (state) => state.editor.scenePaintSelection,
  );

  const [scrollRef, scrollContainerSize] = useResizeObserver<HTMLDivElement>();

  const scrollContentsRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const blockWheelZoom = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const [dragMode, setDragMode] = useState(false);
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

  const viewportWidth = scrollContainerSize?.width ?? 0;
  const viewportHeight = scrollContainerSize?.height ?? 0;

  const scrollWidth = Math.max(
    viewportWidth / (zoomRatio ?? 1),
    worldMaxWidth + 20,
  );

  const scrollHeight = Math.max(
    viewportHeight / (zoomRatio ?? 1),
    worldMaxHeight + 60,
  );

  const worldGridStyle = useMemo(
    () => ({ width: scrollWidth, height: scrollHeight }),
    [scrollWidth, scrollHeight],
  );

  const matchingSceneIds = useMemo(() => {
    if (!searchTerm) {
      return [];
    }

    const searchTermUpper = searchTerm.toUpperCase();

    return sceneIds.filter((sceneId, sceneIndex) => {
      const name = sceneName(
        { name: sceneNames[sceneIndex] ?? "" },
        sceneIndex,
      );

      return (
        searchTerm === sceneId || name.toUpperCase().includes(searchTermUpper)
      );
    });
  }, [sceneIds, sceneNames, searchTerm]);

  const onlyMatchingSceneId =
    matchingSceneIds.length === 1 ? matchingSceneIds[0] : focusSceneId || null;

  const prevLoaded = useRef(false);
  const prevOnlyMatchingSceneId = useRef(onlyMatchingSceneId);
  const prevZoomRatio = useRef(0);

  //#endregion Component State

  //#region Clipboard handling

  const onCopy = useCallback(
    (e: ClipboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.nodeName !== "BODY") {
        return;
      }
      e.preventDefault();
      if (scenePaintSelection) {
        dispatch(clipboardActions.copySceneGridSelection());
        return;
      }
      dispatch(clipboardActions.copySelectedEntity());
    },
    [dispatch, scenePaintSelection],
  );

  const onCut = useCallback(
    (e: ClipboardEvent) => {
      if (!(e.target instanceof HTMLElement) || e.target.nodeName !== "BODY")
        return;
      if (!scenePaintSelection) return;
      e.preventDefault();
      dispatch(clipboardActions.copySceneGridSelection());
      if (scenePaintSelection.mode === "tiles" && scenePaintSelection.layerId) {
        dispatch(
          entitiesActions.deleteSceneTileSelection({
            sceneId: scenePaintSelection.sceneId,
            layerId: scenePaintSelection.layerId,
            selection: scenePaintSelection.selection,
          }),
        );
      } else if (scenePaintSelection.mode === "colors") {
        dispatch(
          entitiesActions.deleteSceneColorSelection({
            sceneId: scenePaintSelection.sceneId,
            selection: scenePaintSelection.selection,
          }),
        );
      } else if (scenePaintSelection.mode === "collisions") {
        dispatch(
          entitiesActions.deleteSceneCollisionSelection({
            sceneId: scenePaintSelection.sceneId,
            selection: scenePaintSelection.selection,
          }),
        );
      }
    },
    [dispatch, scenePaintSelection],
  );

  const onPaste = useCallback(
    (e: ClipboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target?.nodeName !== "BODY") {
        return;
      }
      e.preventDefault();
      try {
        const state = store.getState();
        const hover = state.editor.hover;
        if (hover.sceneId) {
          dispatch(
            clipboardActions.pasteSceneGridSelectionAt({
              sceneId: hover.sceneId,
              layerId: state.editor.selectedTilemapLayerId,
              x: hover.x,
              y: hover.y,
            }),
          );
        }
        dispatch(clipboardActions.pasteClipboardEntity());
      } catch {
        // Clipboard isn't pastable, just ignore it
      }
    },
    [dispatch, store],
  );

  //#endregion Clipboard handling

  //#region Keyboard handling

  const onSelectAll = useCallback(() => {
    dispatch(editorActions.setSceneSelectionIds([...sceneIds, ...noteIds]));
  }, [dispatch, sceneIds, noteIds]);

  useSelectAllShortcut({
    onSelectAll,
  });

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.nodeName !== "BODY") {
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        return;
      }
      if (e.code === "Space") {
        setDragMode(true);
        e.preventDefault();
      }
      if (focus && (e.key === "Backspace" || e.key === "Delete")) {
        if (scenePaintSelection) {
          e.preventDefault();

          if (scenePaintSelection.mode === "tiles") {
            if (!scenePaintSelection.layerId) {
              return;
            }
            dispatch(
              entitiesActions.deleteSceneTileSelection({
                sceneId: scenePaintSelection.sceneId,
                layerId: scenePaintSelection.layerId,
                selection: scenePaintSelection.selection,
              }),
            );
          } else if (scenePaintSelection.mode === "colors") {
            dispatch(
              entitiesActions.deleteSceneColorSelection({
                sceneId: scenePaintSelection.sceneId,
                selection: scenePaintSelection.selection,
              }),
            );
          } else {
            dispatch(
              entitiesActions.deleteSceneCollisionSelection({
                sceneId: scenePaintSelection.sceneId,
                selection: scenePaintSelection.selection,
              }),
            );
          }
          return;
        }

        dispatch(entitiesActions.removeSelectedEntity());
      }
    },
    [dispatch, focus, scenePaintSelection],
  );

  const onKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (dragMode && (e.code === "Space" || e.key === "Alt")) {
        setDragMode(false);
      }
    },
    [dragMode],
  );

  //#endregion Keyboard handling

  //#region Zoom handling

  const onMouseWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey && !blockWheelZoom.current) {
        e.preventDefault();
        const absDeltaY = Math.abs(e.deltaY);
        if (e.deltaY < 0) {
          dispatch(
            editorActions.zoomIn({
              section: "world",
              delta: absDeltaY * MOUSE_ZOOM_SPEED,
            }),
          );
        } else {
          dispatch(
            editorActions.zoomOut({
              section: "world",
              delta: absDeltaY * MOUSE_ZOOM_SPEED,
            }),
          );
        }
      } else {
        // Don't allow mousewheel zoom while scrolling
        if (blockWheelZoom.current) {
          clearTimeout(blockWheelZoom.current);
        }
        blockWheelZoom.current = setTimeout(() => {
          blockWheelZoom.current = undefined;
        }, 60);
      }
    },
    [dispatch],
  );

  //#endregion Zoom handling

  //#region Scroll handling

  const onScrollThrottled = useMemo(
    () =>
      throttle((left: number, top: number) => {
        dispatch(editorActions.scrollWorld({ x: left, y: top }));
      }, 10),
    [dispatch],
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
        scrollState.current.scrollY,
      );
    },
    [onScrollThrottled],
  );

  //#endregion Scroll handling

  //#region World Dragging

  const onWorldDragMove = useCallback(
    (e: MouseEvent) => {
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
    },
    [scrollRef],
  );

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
    [dispatch, onWorldDragMove],
  );

  const startWorldDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (e.shiftKey && tool === TOOL_SELECT) {
        return;
      }
      dragState.current.dragDistanceX = 0;
      dragState.current.dragDistanceY = 0;
      window.addEventListener("mousemove", onWorldDragMove);
      window.addEventListener("mouseup", onEndWorldDrag);
    },
    [onEndWorldDrag, onWorldDragMove, tool],
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
    [dragMode, onEndWorldDrag, onWorldDragMove],
  );

  //#endregion World Dragging

  //#region World Resize

  const onWindowResizeThrottled = useMemo(
    () =>
      throttle(() => {
        dispatch(
          editorActions.resizeWorldView({
            width: window.innerWidth,
            height: window.innerHeight,
          }),
        );
      }, 300),
    [dispatch],
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

      dragState.current.offsetX = e.pageX - boundingRect.x;
      dragState.current.offsetY = e.pageY - boundingRect.y;
    },
    [],
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
      const state = store.getState();
      scrollState.current.scrollX = state.editor.worldScrollX;
      scrollState.current.scrollY = state.editor.worldScrollY;
      scroll.scrollTo(scrollState.current.scrollX, scrollState.current.scrollY);
    }

    if (
      onlyMatchingSceneId &&
      (!prevOnlyMatchingSceneId.current ||
        onlyMatchingSceneId !== prevOnlyMatchingSceneId.current)
    ) {
      const view = scrollRef.current;
      const viewContents = scrollContentsRef.current;
      if (!view || !viewContents) {
        return;
      }
      const halfViewWidth = 0.5 * view.clientWidth;
      const halfViewHeight = 0.5 * view.clientHeight;
      const state = store.getState();
      const onlyMatchingScene = sceneSelectors.selectById(
        state,
        onlyMatchingSceneId,
      );
      if (!onlyMatchingScene) {
        return;
      }
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
    prevOnlyMatchingSceneId.current = onlyMatchingSceneId;
    prevLoaded.current = loaded;
  }, [loaded, onlyMatchingSceneId, scrollRef, store, zoomRatio]);

  //#endregion

  //#region Window Blur

  const onWindowBlur = useCallback(() => {
    setDragMode(false);
  }, []);

  //#endregion Window Blur

  //#region Event Listeners

  useEffect(() => {
    window.addEventListener("wheel", onMouseWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("copy", onCopy);
    window.addEventListener("cut", onCut);
    window.addEventListener("paste", onPaste);
    window.addEventListener("resize", onWindowResize);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      window.removeEventListener("wheel", onMouseWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("cut", onCut);
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("mousemove", onWorldDragMove);
      window.removeEventListener("mouseup", onEndWorldDrag);
    };
  }, [
    onCopy,
    onCut,
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

  //#region Context Menu

  const getContextMenu = useCallback(() => {
    return renderWorldContextMenu({
      dispatch,
      selectedIds,
    });
  }, [dispatch, selectedIds]);

  const getContextMenuEnabled = useCallback(() => {
    return tool === TOOL_SELECT;
  }, [tool]);

  const { onContextMenu, contextMenuElement } = useContextMenu({
    getMenu: getContextMenu,
    getIsEnabled: getContextMenuEnabled,
  });

  //#endregion Context Menu

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
          style={worldGridStyle}
          onMouseDown={startWorldDrag}
          onContextMenu={onContextMenu}
        />
        <WorldEntities
          sceneIds={sceneIds}
          noteIds={noteIds}
          scrollWidth={scrollWidth}
          scrollHeight={scrollHeight}
          zoomRatio={zoomRatio}
          showConnections={showConnections}
          editable={!dragMode}
        />
        <WorldCursor
          editable={!dragMode}
          scrollRef={scrollRef}
          zoomRatio={zoomRatio}
        />
        <WorldInteractionOverlay
          tool={tool}
          scrollRef={scrollRef}
          zoomRatio={zoomRatio}
        />
      </WorldContent>
      {loaded && sceneIds.length === 0 && noteIds.length === 0 && <WorldHelp />}
      {contextMenuElement}
    </Wrapper>
  );
};

export default WorldView;
