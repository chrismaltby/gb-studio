import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MIDDLE_MOUSE, TILE_SIZE } from "consts";
import { noteSelectors } from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { noteName } from "shared/lib/entities/entitiesHelpers";
import styled, { css } from "styled-components";
import { LabelSpan } from "ui/buttons/LabelButton";
import { useAppDispatch, useAppSelector } from "store/hooks";
import renderNoteContextMenu from "components/world/renderNoteContextMenu";
import { ContextMenu } from "ui/menu/ContextMenu";
import { noteColorStyles } from "ui/form/NoteField";
import { LabelColor } from "shared/lib/resources/types";
import l10n from "shared/lib/lang/l10n";

const ALIGNMENT_OFFSET_X = -1;
const ALIGNMENT_OFFSET_Y = 3;

interface NoteViewProps {
  id: string;
  index: number;
  editable?: boolean;
}

const NoteName = styled.div`
  text-align: center;
  padding-left: 5px;

  white-space: nowrap;
  font-size: 11px;
  color: #000;
  border-width: 0 0 1px 0;
  border-style: solid;

  background-color: var(--note-bg-color);
  border-color: var(--note-border-color);

  border-top-left-radius: 3px;
  border-top-right-radius: 3px;

  transition: background 0.3s ease-in-out;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    cursor: move;
  }
`;

const NoteMetadata = styled.div`
  white-space: nowrap;
  overflow: hidden;
  line-height: 20px;
  font-size: 11px;
  transition:
    padding-left 0.1s ease-in-out,
    padding-right 0.1s ease-in-out;
  transition-delay: 0.3s;
`;

const ContentWrapper = styled.div``;

const NoteContent = styled.textarea`
  background-color: transparent;
  color: #000;
  border: 0;
  padding: 5px;
  overflow: hidden;
  box-sizing: border-box;
  resize: none;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 11px;

  &:focus {
    box-shadow: none;
    outline: none;
  }
`;

const ResizeHandle = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;

  &::before {
    content: "";
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 12px;
    height: 12px;

    background: linear-gradient(
      135deg,
      transparent 0 9px,
      var(--note-border-color) 9px 11px,
      transparent 11px 13px,
      var(--note-border-color) 13px 15px,
      transparent 15px
    );
  }
`;

interface WrapperProps {
  $selected?: boolean;
  $multiSelected?: boolean;
  $filtered?: boolean;
  $color?: LabelColor;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  user-select: none;
  border-radius: 4px;
  transition: background 0.3s ease-in-out;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  min-width: 160px;
  border-width: 1px;
  border-style: solid;

  background-color: var(--note-bg-color);
  border-color: var(--note-border-color);
  ${noteColorStyles};

  ${(props) =>
    props.$multiSelected
      ? css`
          z-index: 10;
          box-shadow: 0 0 0px 4px var(--note-border-color);

          ${LabelSpan} {
            opacity: 1;
          }

          .Note__Info,
          .Note:hover .Note__Info {
            opacity: 1;
          }
        `
      : ""}

  ${(props) =>
    props.$selected
      ? css`
          z-index: 10;
          box-shadow: 0 0 0px 4px var(--note-border-color);

          ${LabelSpan} {
            opacity: 1;
          }

          .Note__Info,
          .Note:hover .Note__Info {
            opacity: 1;
          }
        `
      : ""}

  ${(props) =>
    props.$filtered
      ? css`
          &:after {
            content: "";
            background-color: ${(props) => props.theme.colors.background};
            border-radius: 4px;
            opacity: 0.8;
            position: absolute;
            top: -5px;
            left: -5px;
            right: -5px;
            bottom: -5px;
            pointer-events: none;
          }
        `
      : ""}
`;

const NoteView = memo(({ id, index, editable }: NoteViewProps) => {
  const dispatch = useAppDispatch();
  const note = useAppSelector((state) => noteSelectors.selectById(state, id));
  const selected = useAppSelector(
    (state) => state.editor.entityId === id && state.editor.type === "note",
  );
  const sceneSelectionIds = useAppSelector(
    (state) => state.editor.sceneSelectionIds,
  );
  const multiSelected = sceneSelectionIds.includes(id);
  const searchTerm = useAppSelector((state) => state.editor.searchTerm);
  const name = useMemo(
    () => (note ? noteName(note, index) : ""),
    [index, note],
  );
  const lastNamePart = useMemo(
    () => name.replace(/.*[/\\]/, "").trim(),
    [name],
  );

  const noteFiltered =
    (searchTerm &&
      name.toUpperCase().indexOf(searchTerm.toUpperCase()) === -1 &&
      id !== searchTerm) ||
    (sceneSelectionIds.length > 1 && !multiSelected) ||
    false;

  const zoom = useAppSelector((state) => state.editor.zoom);
  const zoomRatio = zoom / 100;

  const visible = useAppSelector((state) => {
    const worldScrollX = state.editor.worldScrollX;
    const worldScrollY = state.editor.worldScrollY;
    const worldViewWidth = state.editor.worldViewWidth;
    const worldViewHeight = state.editor.worldViewHeight;
    const sidebarWidth = state.editor.worldSidebarWidth;
    const navigatorWidth = state.project.present.settings.showNavigator
      ? state.editor.navigatorSidebarWidth
      : 0;

    const viewMargin = 400;

    const viewBoundsX = (worldScrollX - viewMargin) / zoomRatio;
    const viewBoundsY = (worldScrollY - viewMargin) / zoomRatio;

    const viewBoundsWidth =
      (worldViewWidth - sidebarWidth - navigatorWidth + viewMargin * 2) /
      zoomRatio;
    const viewBoundsHeight = (worldViewHeight + viewMargin * 2) / zoomRatio;

    return note
      ? note.x + note.width * 8 > viewBoundsX &&
          note.x < viewBoundsX + viewBoundsWidth &&
          note.y + note.height * 8 + 50 > viewBoundsY &&
          note.y < viewBoundsY + viewBoundsHeight
      : false;
  });

  const dragState = useRef({
    lastTX: -1,
    lastTY: -1,
    lastPageX: -1,
    lastPageY: -1,
    noteX: 0,
    noteY: 0,
    zoomRatio: 0,
  });

  // Store selection as ref to prevent onMoveDrag from being recreated
  // every time multi selection changes (causes first drag to fail)
  const currentSceneSelectionIds = useRef<string[]>([]);
  useEffect(() => {
    currentSceneSelectionIds.current = sceneSelectionIds;
  }, [sceneSelectionIds]);

  const onMoveDrag = useCallback(
    (e: MouseEvent) => {
      const dragDeltaX =
        (e.pageX - dragState.current.lastPageX) / dragState.current.zoomRatio;
      const dragDeltaY =
        (e.pageY - dragState.current.lastPageY) / dragState.current.zoomRatio;

      dragState.current.lastPageX = e.pageX;
      dragState.current.lastPageY = e.pageY;
      dragState.current.noteX += dragDeltaX;
      dragState.current.noteY += dragDeltaY;

      dispatch(
        entitiesActions.moveWorldEntities({
          entityId: id,
          x: Math.round(dragState.current.noteX / TILE_SIZE) * TILE_SIZE,
          y: Math.round(dragState.current.noteY / TILE_SIZE) * TILE_SIZE,
          additionalEntityIds: currentSceneSelectionIds.current,
        }),
      );
    },
    [dispatch, id],
  );

  const onEndDrag = useCallback(() => {
    window.removeEventListener("mousemove", onMoveDrag);
    window.removeEventListener("mouseup", onEndDrag);
  }, [onMoveDrag]);

  const onStartDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!note) {
        return;
      }

      if (!editable || e.nativeEvent.which === MIDDLE_MOUSE) {
        return;
      }

      dragState.current.lastPageX = e.pageX;
      dragState.current.lastPageY = e.pageY;
      dragState.current.noteX = note.x;
      dragState.current.noteY = note.y;
      dragState.current.zoomRatio = zoomRatio;

      dispatch(editorActions.selectNote({ noteId: id }));

      window.addEventListener("mousemove", onMoveDrag);
      window.addEventListener("mouseup", onEndDrag);
    },
    [dispatch, editable, id, onEndDrag, onMoveDrag, note, zoomRatio],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onMoveDrag);
      window.removeEventListener("mouseup", onEndDrag);
    };
  }, [onEndDrag, onMoveDrag]);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    menu: JSX.Element[];
  }>();

  useEffect(() => {
    const el = textAreaRef.current;
    if (!selected && el && document.activeElement === el) {
      el.blur();
    }
  }, [selected]);

  const onContextMenuClose = useCallback(() => {
    setContextMenu(undefined);
  }, []);

  const renderContextMenu = useCallback(() => {
    return renderNoteContextMenu({
      dispatch,
      noteId: id,
      additionalSceneIds: sceneSelectionIds,
      onClose: onContextMenuClose,
    });
  }, [dispatch, id, onContextMenuClose, sceneSelectionIds]);

  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!renderContextMenu) {
        return;
      }
      const menu = renderContextMenu();
      if (!menu) {
        return;
      }
      setContextMenu({ x: e.pageX, y: e.pageY, menu });
    },
    [renderContextMenu],
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visible) return;

    const container = containerRef.current;
    const handle = handleRef.current;
    if (!container || !handle) return;

    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();

      startX = e.clientX;
      startY = e.clientY;
      startWidth = rect.width;
      startHeight = rect.height;

      dispatch(editorActions.selectNote({ noteId: id }));

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newWidthPx = (startWidth + dx) / zoomRatio;
      const newHeightPx = (startHeight + dy) / zoomRatio;

      const newWidthTiles = Math.max(1, Math.ceil(newWidthPx / TILE_SIZE));
      const newHeightTiles = Math.max(1, Math.ceil(newHeightPx / TILE_SIZE));

      dispatch(
        entitiesActions.editNote({
          noteId: id,
          changes: {
            width: newWidthTiles,
            height: newHeightTiles,
          },
        }),
      );
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    handle.addEventListener("mousedown", onMouseDown);

    return () => {
      handle.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [visible, id, dispatch, zoomRatio]);

  const onToggleSelection = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        dispatch(editorActions.toggleNoteSelectedId(id));
      }
    },
    [dispatch, id],
  );

  if (!note || !visible) {
    return <></>;
  }

  return (
    <Wrapper
      $selected={selected}
      $multiSelected={multiSelected}
      $filtered={noteFiltered}
      $color={note.labelColor}
      style={{
        left: note.x + ALIGNMENT_OFFSET_X,
        top: note.y + ALIGNMENT_OFFSET_Y,
      }}
      onContextMenu={onContextMenu}
      onMouseDownCapture={onToggleSelection}
    >
      <NoteMetadata onMouseDown={onStartDrag}>
        <NoteName
          style={{
            maxWidth: note.width * TILE_SIZE,
          }}
        >
          {lastNamePart || l10n("NOTE")}
        </NoteName>
      </NoteMetadata>
      <ContentWrapper ref={containerRef}>
        <NoteContent
          ref={textAreaRef}
          style={{
            width: note.width * TILE_SIZE,
            height: note.height * TILE_SIZE,
          }}
          onFocus={() => {
            dispatch(editorActions.selectNote({ noteId: id }));
          }}
          onChange={(e) => {
            dispatch(editorActions.selectNote({ noteId: id }));
            dispatch(
              entitiesActions.editNote({
                noteId: id,
                changes: {
                  content: e.currentTarget.value,
                },
              }),
            );
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          placeholder={`${l10n("FIELD_NOTES")}...`}
          value={note.content}
        />
        <ResizeHandle ref={handleRef} />
      </ContentWrapper>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={onContextMenuClose}
        >
          {contextMenu.menu}
        </ContextMenu>
      )}
    </Wrapper>
  );
});

export default NoteView;
