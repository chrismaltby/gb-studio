import React, { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { css } from "styled-components";
import { Song } from "renderer/lib/uge/song/Song";
import { RootState } from "store/configureStore";
import { SplitPaneVerticalDivider } from "ui/splitpane/SplitPaneDivider";
import { SequenceEditor } from "./SequenceEditor";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import l10n from "renderer/lib/l10n";
import { RollChannel } from "./RollChannel";
import { RollChannelGrid } from "./RollChannelGrid";
import { RollChannelSelectionArea } from "./RollChannelSelectionArea";
import trackerActions from "store/features/tracker/trackerActions";
import { PatternCell } from "renderer/lib/uge/song/PatternCell";
import { cloneDeep } from "lodash";
import clipboardActions from "store/features/clipboard/clipboardActions";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { getInstrumentListByType, getInstrumentTypeByChannel } from "./helpers";
import {
  parsePatternToClipboard,
  parseClipboardToPattern,
} from "./musicClipboardHelpers";
import { RollChannelEffectRow } from "./RollChannelEffectRow";
import { WandIcon } from "ui/icons/Icons";
import { RollChannelHover } from "./RollChannelHover";
import API from "renderer/lib/api";
import { MusicDataPacket } from "shared/lib/music/types";

const CELL_SIZE = 16;
const MAX_NOTE = 71;
const GRID_MARGIN = 10;

interface SongPianoRollProps {
  sequenceId: number;
  song: Song | null;
  height: number;
}

interface PianoKeyProps {
  color: "white" | "black";
  tall?: boolean;
  highlight?: boolean;
}

interface SongGridHeaderProps {
  cols: number;
}

interface SongGridFooterProps {
  cols: number;
}

const Piano = styled.div`
  position: sticky;
  left: 0;
  min-width: 30px;
  background: white;
  height: ${CELL_SIZE * 12 * 6}px;
  z-index: 2;
`;

const blackKeyStyle = css`
  height: ${CELL_SIZE}px;
  width: 85%;
  background: linear-gradient(45deg, #636363, black);
  background: linear-gradient(
    90deg,
    rgba(2, 0, 36, 1) 0%,
    rgba(99, 99, 99, 1) 90%,
    rgba(0, 0, 0, 1) 98%
  );
  border-bottom: none;
  border-radius: 0 2px 2px 0;
  box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 3px 0px;
  top: ${-0.5 * CELL_SIZE}px;
  margin-bottom: ${-CELL_SIZE}px;
  z-index: 2;
`;

const highlightStyle = css`
  :after {
    content: "";
    position: absolute;
    top: 0px;
    left: 0px;
    bottom: 0px;
    right: 0px;
    background: linear-gradient(90deg, #607d8b 0%, #b0bec5);
    opacity: 0.5;
  }
`;

const PianoKey = styled.div<PianoKeyProps>`
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  color: #90a4ae;
  font-weight: bold;
  font-size: 10px;
  padding-right: 5px;
  position: relative;
  height: ${(props) => (props.tall ? 2 : 1.5) * CELL_SIZE}px;
  width: 100%;
  background: white;
  border-bottom: 1px solid #cfd8dc;
  box-shadow: rgba(0, 0, 0, 0.1) -2px 0px 2px 0px inset;
  ${(props) => (props.color === "black" ? blackKeyStyle : "")}
  ${(props) => (props.highlight ? highlightStyle : "")}
  :hover {
    ${highlightStyle};
  }
`;

const SongGrid = styled.div`
  font-family: monospace;
  white-space: nowrap;
  border-width: 0 0 0 1px;
  border-color: ${(props) => props.theme.colors.sidebar.border};
  border-style: solid;
  position: relative;
  :focus {
    z-index: 1;
  }
`;

const RollPlaybackTracker = styled.div`
  pointer-events: none;
  z-index: 0;
  width: ${CELL_SIZE - 1}px;
  height: ${CELL_SIZE * 12 * 6 + CELL_SIZE}px;
  background-image: linear-gradient(
    90deg,
    ${(props) => props.theme.colors.highlight} 2px,
    transparent 1px
  );
  background-position-y: ${CELL_SIZE}px;
  background-repeat-y: no-repeat;
  background-size: ${CELL_SIZE * 8}px ${CELL_SIZE * 12 * 6 + CELL_SIZE}px;
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${30 + 10 + 1 - 10}px;
  &::before {
    content: "";
    position: absolute;
    top: 2px;
    left: -${CELL_SIZE / 2 - 1}px;
    border-top: ${CELL_SIZE - 4}px solid transparent;
    border-top-color: ${(props) => props.theme.colors.highlight};
    border-left: ${CELL_SIZE / 2}px solid transparent;
    border-right: ${CELL_SIZE / 2}px solid transparent;
  }
`;

const SongGridHeader = styled.div<SongGridHeaderProps>`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  padding-left: ${30 + 10 + 1}px;
  z-index: 10;
  ${(props) => css`
    width: ${props.cols * CELL_SIZE}px;
    height: ${CELL_SIZE}px;
    background-color: ${props.theme.colors.document.background};
    background-image: linear-gradient(
      90deg,
      ${props.theme.colors.tracker.rollCell.border} 2px,
      transparent 1px
    );
    background-size: ${CELL_SIZE * 8}px ${CELL_SIZE / 3}px;
    background-repeat: repeat-x;
    background-position-y: center;
    background-position-x: ${30 + 10 + 1}px;
    border-bottom: 1px solid #808080;
    margin-bottom: -1px;
    border-right: 2px solid ${props.theme.colors.document.background};
  `}
`;

const SongGridFooter = styled.div<SongGridFooterProps>`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 5;
  ${(props) => css`
    margin-top: ${CELL_SIZE / 2}px;
    width: calc(${props.cols * CELL_SIZE}px + ${30 + 10 + 1}px);
    height: ${2 * CELL_SIZE}px;
    border-right: 2px solid #808080;
    background-color: ${props.theme.colors.sidebar.background};
    box-shadow: ${(props) => props.theme.colors.card.boxShadow};
  `}
`;

const FooterIcon = styled.div`
  position: sticky;
  left: 0;
  height: ${CELL_SIZE * 2}px;
  width: ${30 + 1}px;
  background-color:  ${(props) => props.theme.colors.sidebar.background};
  justify-content: center;
  z-index: 6;
  display: flex;

  svg {
    height: 20px;
    width: 20px;
    max-width: 100%;
    max-height: 100%;
    fill: ${(props) => props.theme.colors.button.text};
    margin: auto;
  }
}}
`;

type BlurableDOMElement = {
  blur: () => void;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
}

interface NoteRenderCoordinates {
  note: number;
  column: number;
}

const playNotePreview = (
  song: Song,
  channel: number,
  note: number,
  instrument: number
) => {
  const instrumentType = getInstrumentTypeByChannel(channel) || "duty";
  const instrumentList = getInstrumentListByType(song, instrumentType);
  API.music.sendMusicData({
    action: "preview",
    note: note,
    type: instrumentType,
    instrument: instrumentList[instrument],
    square2: channel === 1,
  });
};

export const SongPianoRoll = ({
  song,
  sequenceId,
  height,
}: SongPianoRollProps) => {
  const dispatch = useDispatch();

  const playing = useSelector((state: RootState) => state.tracker.playing);
  const hoverNote = useSelector((state: RootState) => state.tracker.hoverNote);
  const startPlaybackPosition = useSelector(
    (state: RootState) => state.tracker.startPlaybackPosition
  );
  const subpatternEditorFocus = useSelector(
    (state: RootState) => state.tracker.subpatternEditorFocus
  );

  const patternId = song?.sequence[sequenceId] || 0;
  const pattern = song?.patterns[patternId];

  const [playbackState, setPlaybackState] = useState([0, 0]);

  useEffect(() => {
    setPlaybackState(startPlaybackPosition);
  }, [setPlaybackState, startPlaybackPosition]);

  useEffect(() => {
    const listener = (_event: unknown, d: MusicDataPacket) => {
      if (d.action === "update") {
        setPlaybackState(d.update);
      }
    };
    API.music.musicDataSubscribe(listener);

    return () => {
      API.music.musicDataUnsubscribe(listener);
    };
  }, [setPlaybackState]);

  const setPlaybackPosition = useCallback(
    (e: MouseEvent) => {
      const col = clamp(Math.floor(e.offsetX / CELL_SIZE), 0, 63);

      dispatch(
        trackerActions.setDefaultStartPlaybackPosition([sequenceId, col])
      );
      API.music.sendMusicData({
        action: "position",
        position: [sequenceId, col],
      });
    },
    [dispatch, sequenceId]
  );

  const playingRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (playingRowRef && playingRowRef.current) {
      if (playing) {
        playingRowRef.current.scrollIntoView({
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [playing, playbackState]);

  const [patternsPanelOpen, setPatternsPanelOpen] = useState(true);
  const togglePatternsPanel = useCallback(() => {
    setPatternsPanelOpen(!patternsPanelOpen);
  }, [patternsPanelOpen, setPatternsPanelOpen]);

  const selectedChannel = useSelector(
    (state: RootState) => state.tracker.selectedChannel
  );
  const visibleChannels = useSelector(
    (state: RootState) => state.tracker.visibleChannels
  );

  const tool = useSelector((state: RootState) => state.tracker.tool);
  const gridRef = useRef<HTMLDivElement>(null);

  const [draggingSelection, setDraggingSelection] = useState(false);
  const [selectionOrigin, setSelectionOrigin] =
    useState<Position | undefined>();
  const [selectionRect, setSelectionRect] =
    useState<SelectionRect | undefined>();
  const [addToSelection, setAddToSelection] = useState(false);

  const selectedPatternCells = useSelector(
    (state: RootState) => state.tracker.selectedPatternCells
  );

  useEffect(() => {
    setRenderPattern(pattern);
  }, [pattern]);

  useEffect(() => {
    setRenderSelectedPatternCells(selectedPatternCells);
  }, [selectedPatternCells]);

  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [clonePatternCells, setClonePatternCells] = useState<boolean>(false);

  const [moveNoteFrom, setMoveNoteFrom] = useState<NoteRenderCoordinates>();
  const [moveNoteTo, setMoveNoteTo] = useState<NoteRenderCoordinates>();
  const [renderPattern, setRenderPattern] = useState<PatternCell[][]>();
  const [renderSelectedPatternCells, setRenderSelectedPatternCells] = useState<
    number[]
  >([]);

  const [pastedPattern, setPastedPattern] = useState<PatternCell[][]>();

  const hoverColumn = useSelector(
    (state: RootState) => state.tracker.hoverColumn
  );

  const defaultInstruments = useSelector(
    (state: RootState) => state.tracker.defaultInstruments
  );
  const currentInstrument = defaultInstruments[selectedChannel];

  useEffect(() => {
    if (tool !== "selection") {
      setDraggingSelection(false);
      setSelectionRect(undefined);
    }
  }, [tool]);

  const selectCellsInRange = useCallback(
    (selectedPatternCells: number[], selectionRect: SelectionRect) => {
      if (pattern) {
        const fromI = selectionRect.x / CELL_SIZE;
        const toI = (selectionRect.x + selectionRect.width) / CELL_SIZE;
        const fromJ = selectionRect.y / CELL_SIZE;
        const toJ = (selectionRect.y + selectionRect.height) / CELL_SIZE;

        const newSelectedPatterns = [...selectedPatternCells];
        for (let i = fromI; i < toI; i++) {
          for (let j = fromJ; j < toJ; j++) {
            const note = 12 * 6 - 1 - j;
            if (
              pattern[i][selectedChannel] &&
              pattern[i][selectedChannel].note === note
            ) {
              newSelectedPatterns.push(i);
            }
          }
        }
        return newSelectedPatterns;
      }
      return [];
    },
    [selectedChannel, pattern]
  );

  const onSelectAll = useCallback(
    (_e) => {
      const selection = window.getSelection();
      if (!selection || selection.focusNode) {
        return;
      }
      window.getSelection()?.empty();
      const allPatternCells = pattern
        ?.map((c, i) => {
          return c[selectedChannel].note !== null ? i : undefined;
        })
        .filter((c) => c !== undefined) as number[];
      dispatch(trackerActions.setSelectedPatternCells(allPatternCells));

      // Blur any focused element to be able to use keyboard actions on the
      // selection
      const el = document.querySelector(":focus") as unknown as
        | BlurableDOMElement
        | undefined;
      if (el && el.blur) el.blur();
    },
    [selectedChannel, dispatch, pattern]
  );

  useEffect(() => {
    if (!subpatternEditorFocus) {
      document.addEventListener("selectionchange", onSelectAll);
      return () => {
        document.removeEventListener("selectionchange", onSelectAll);
      };
    }
  }, [onSelectAll, subpatternEditorFocus]);

  const refreshRenderPattern = useCallback(
    (newMoveNoteTo) => {
      if (pattern) {
        const columnFrom = moveNoteFrom?.column || 0;
        const columnTo = newMoveNoteTo?.column || 0;
        const columnDir = columnFrom > columnTo ? -1 : 1;
        const deltaX = Math.abs(columnFrom - columnTo) * columnDir;

        const noteFrom = moveNoteFrom?.note || 0;
        const noteTo = newMoveNoteTo?.note || 0;
        const noteDir = noteFrom > noteTo ? -1 : 1;
        const deltaY = Math.abs(noteFrom - noteTo) * noteDir;

        const newPattern = cloneDeep(pattern);
        for (const i of selectedPatternCells) {
          const newPatternColumn = cloneDeep(pattern[i]);
          const newPatternCell = !clonePatternCells
            ? newPatternColumn.splice(selectedChannel, 1, new PatternCell())[0]
            : { ...newPatternColumn[selectedChannel] };
          if (newPattern[i + deltaX]) {
            newPatternCell.note =
              newPatternCell.note !== null
                ? (newPatternCell.note + deltaY + 12 * 6) % (12 * 6)
                : null;
            if (selectedPatternCells.indexOf(i - deltaX) === -1) {
              newPattern[i] = newPatternColumn;
            }
            newPattern[i + deltaX][selectedChannel] = newPatternCell;
          } else if (i + deltaX < 0 || i + deltaX >= 64) {
            if (selectedPatternCells.indexOf(i - deltaX) === -1) {
              newPattern[i][selectedChannel] = new PatternCell();
            }
          }
        }
        setRenderPattern(newPattern);
        setRenderSelectedPatternCells(
          selectedPatternCells.map((i) => i + deltaX)
        );
      }
    },
    [
      selectedChannel,
      clonePatternCells,
      moveNoteFrom?.column,
      moveNoteFrom?.note,
      pattern,
      selectedPatternCells,
    ]
  );

  useEffect(() => {
    if (isDragging) {
      refreshRenderPattern(moveNoteTo);
    }
  }, [isDragging, moveNoteTo, refreshRenderPattern]);

  const refreshPastedPattern = useCallback(
    (currentPastedPattern: PatternCell[][]) => {
      if (pattern && hoverColumn !== null && hoverNote !== null) {
        const newPattern = cloneDeep(pattern);

        let columnOffset = 0;
        let noteOffset = undefined;
        for (const p of currentPastedPattern) {
          const pastedPatternCell = { ...p[0] };
          if (pastedPatternCell.note !== null) {
            if (noteOffset === undefined) {
              noteOffset = hoverNote - pastedPatternCell.note;
            }
            if (
              hoverColumn + columnOffset >= 0 &&
              hoverColumn + columnOffset < 64
            ) {
              pastedPatternCell.note =
                ((pastedPatternCell.note + noteOffset || 0) + 12 * 6) %
                (12 * 6);
              newPattern[(hoverColumn + columnOffset) % 64][selectedChannel] =
                pastedPatternCell;
            }
          }
          columnOffset++;
        }
        setRenderPattern(newPattern);
      }
    },
    [selectedChannel, hoverColumn, hoverNote, pattern]
  );

  // Mouse
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!pattern) return;
      const col = clamp(Math.floor(e.offsetX / CELL_SIZE), 0, 63);
      const note = 12 * 6 - 1 - Math.floor(e.offsetY / CELL_SIZE);
      const cell = pattern[col][selectedChannel];

      if (pastedPattern && renderPattern) {
        dispatch(
          trackerDocumentActions.editPattern({
            patternId: patternId,
            pattern: renderPattern,
          })
        );
        setPastedPattern(undefined);
      } else if (tool === "pencil" && e.button === 0) {
        // If there's a note in position
        if (cell && cell.note === note) {
          setIsMouseDown(true);
          setIsDragging(false);
          setMoveNoteFrom({ column: col, note: cell.note });
          setMoveNoteTo({ column: col, note: cell.note });
        }
        if (cell && cell.note !== note && selectedPatternCells.length > 1) {
          dispatch(trackerActions.setSelectedPatternCells([]));
        } else {
          const changes = {
            instrument: defaultInstruments[selectedChannel],
            note: note,
          };
          dispatch(
            trackerDocumentActions.editPatternCell({
              patternId: patternId,
              cell: [col, selectedChannel],
              changes: changes,
            })
          );

          if (song) {
            playNotePreview(song, selectedChannel, note, currentInstrument);
          }

          if (!selectedPatternCells.includes(col)) {
            dispatch(trackerActions.setSelectedPatternCells([col]));
          }
        }
        // setMoveNoteFrom(undefined);
      } else if (e.button === 2 || (tool === "eraser" && e.button === 0)) {
        // If there's a note in position
        if (cell && cell.note === note) {
          dispatch(
            trackerDocumentActions.editPatternCell({
              patternId: patternId,
              cell: [col, selectedChannel],
              changes: {
                instrument: null,
                note: null,
              },
            })
          );
          const newSelectedCells = [...selectedPatternCells];
          newSelectedCells.splice(col, 1);
          dispatch(trackerActions.setSelectedPatternCells(newSelectedCells));
        }
      } else if (tool === "selection" && e.button === 0) {
        // If there's a note in position
        if (cell && cell.note === note) {
          if (!selectedPatternCells.includes(col)) {
            if (addToSelection) {
              const newSelectedPatterns = [...selectedPatternCells];
              newSelectedPatterns.push(col);
              dispatch(
                trackerActions.setSelectedPatternCells(newSelectedPatterns)
              );
            } else {
              dispatch(trackerActions.setSelectedPatternCells([col]));
            }
          }
          setIsMouseDown(true);
          setIsDragging(false);
          setMoveNoteFrom({ column: col, note: cell.note });
          setMoveNoteTo({ column: col, note: cell.note });
        } else if (gridRef.current) {
          const bounds = gridRef.current.getBoundingClientRect();
          const x = clamp(
            Math.floor((e.pageX - bounds.left - GRID_MARGIN) / CELL_SIZE) *
              CELL_SIZE,
            0,
            63 * CELL_SIZE
          );
          const y = clamp(
            Math.floor((e.pageY - bounds.top) / CELL_SIZE) * CELL_SIZE,
            0,
            12 * 6 * CELL_SIZE - CELL_SIZE
          );

          const newSelectionRect = {
            x,
            y,
            width: CELL_SIZE,
            height: CELL_SIZE,
          };

          const newSelectedPatterns = selectCellsInRange(
            addToSelection ? selectedPatternCells : [],
            newSelectionRect
          );

          setSelectionOrigin({ x, y });
          setSelectionRect(newSelectionRect);
          setDraggingSelection(true);
          dispatch(trackerActions.setSelectedPatternCells(newSelectedPatterns));
        }
      }
    },
    [
      tool,
      pastedPattern,
      renderPattern,
      selectedPatternCells,
      pattern,
      dispatch,
      selectedChannel,
      defaultInstruments,
      patternId,
      song,
      currentInstrument,
      selectCellsInRange,
      addToSelection,
    ]
  );

  const handleMouseUp = useCallback(
    (_e: MouseEvent) => {
      if (isDragging && isMouseDown && selectedPatternCells.length > 0) {
        if (pattern && renderPattern) {
          dispatch(
            trackerDocumentActions.editPattern({
              patternId: patternId,
              pattern: renderPattern,
            })
          );
          dispatch(
            trackerActions.setSelectedPatternCells(
              renderSelectedPatternCells.filter((c) => c >= 0 && c < 64)
            )
          );
        }
        setMoveNoteFrom({ note: 0, column: 0 });
        setMoveNoteTo({ note: 0, column: 0 });
      }
      setSelectionRect(undefined);
      setIsDragging(false);
      setIsMouseDown(false);
    },
    [
      dispatch,
      isDragging,
      isMouseDown,
      pattern,
      patternId,
      renderPattern,
      renderSelectedPatternCells,
      selectedPatternCells.length,
    ]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!gridRef.current) return;

      const bounds = gridRef.current.getBoundingClientRect();

      const newColumn = Math.floor(
        (e.pageX - bounds.left - GRID_MARGIN) / CELL_SIZE
      );
      const newRow = Math.floor((e.pageY - bounds.top) / CELL_SIZE);
      const newNote = 12 * 6 - 1 - newRow;
      if (newNote !== hoverNote) {
        dispatch(trackerActions.setHoverNote(newNote));
      }
      if (newColumn !== hoverColumn) {
        dispatch(trackerActions.setHoverColumn(newColumn));
      }

      if (pattern && pastedPattern) {
        refreshPastedPattern(pastedPattern);
      } else if (isMouseDown && song && selectedPatternCells.length > 0) {
        setIsDragging(true);
        if (moveNoteTo?.note !== newNote || moveNoteTo?.column !== newColumn) {
          playNotePreview(song, selectedChannel, newNote, currentInstrument);

          console.log(moveNoteTo);
          const newMoveNoteTo = {
            note: newNote,
            column: newColumn,
          };
          setMoveNoteTo(newMoveNoteTo);

          refreshRenderPattern(newMoveNoteTo);
        }
      } else if (
        tool === "selection" &&
        draggingSelection &&
        selectionRect &&
        selectionOrigin
      ) {
        const x2 = clamp(newColumn * CELL_SIZE, 0, 64 * CELL_SIZE);
        const y2 = clamp(newRow * CELL_SIZE, 0, 12 * 6 * CELL_SIZE);

        const x = Math.min(selectionOrigin.x, x2);
        const y = Math.min(selectionOrigin.y, y2);
        const width = Math.abs(selectionOrigin.x - x2);
        const height = Math.abs(selectionOrigin.y - y2);

        setSelectionRect({ x, y, width, height });

        const selectedCells = selectCellsInRange(
          addToSelection ? selectedPatternCells : [],
          selectionRect
        );
        dispatch(trackerActions.setSelectedPatternCells(selectedCells));
      }
    },
    [
      addToSelection,
      currentInstrument,
      dispatch,
      draggingSelection,
      hoverColumn,
      hoverNote,
      isMouseDown,
      moveNoteTo,
      pastedPattern,
      pattern,
      refreshPastedPattern,
      refreshRenderPattern,
      selectCellsInRange,
      selectedChannel,
      selectedPatternCells,
      selectionOrigin,
      selectionRect,
      song,
      tool,
    ]
  );

  const handleMouseLeave = useCallback(
    (_e: MouseEvent) => {
      if (hoverNote) {
        dispatch(trackerActions.setHoverNote(null));
      }
    },
    [hoverNote, dispatch]
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Keyboard
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.nodeName !== "BODY") {
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        return;
      }
      if (e.altKey) {
        setClonePatternCells(true);
      }
      if (e.shiftKey) {
        setAddToSelection(true);
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        if (pattern) {
          const newPattern = cloneDeep(pattern);
          console.log(newPattern, selectedPatternCells, selectedChannel);
          selectedPatternCells.forEach((i) => {
            console.log(newPattern[i]);
            newPattern[i].splice(selectedChannel, 1, new PatternCell());
          });
          dispatch(trackerActions.setSelectedPatternCells([]));
          console.log(patternId, newPattern);
          dispatch(
            trackerDocumentActions.editPattern({
              patternId: patternId,
              pattern: newPattern,
            })
          );
        }
      }
      if (e.key === "Escape") {
        dispatch(trackerActions.setSelectedPatternCells([]));
        setIsDragging(false);
        if (pastedPattern !== undefined) {
          setPastedPattern(undefined);
          setRenderPattern(pattern);
        }
      }
    },
    [
      selectedChannel,
      dispatch,
      pastedPattern,
      pattern,
      patternId,
      selectedPatternCells,
    ]
  );

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    if (!e.altKey) {
      setClonePatternCells(false);
    }
    if (!e.shiftKey) {
      setAddToSelection(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  // Clipoard
  const onCopy = useCallback(() => {
    if (pattern) {
      const parsedSelectedPattern = parsePatternToClipboard(
        pattern,
        selectedChannel,
        selectedPatternCells
      );
      dispatch(clipboardActions.copyText(parsedSelectedPattern));
    }
  }, [selectedChannel, dispatch, pattern, selectedPatternCells]);

  const onCut = useCallback(() => {
    if (pattern) {
      const parsedSelectedPattern = parsePatternToClipboard(
        pattern,
        selectedChannel,
        selectedPatternCells
      );
      dispatch(clipboardActions.copyText(parsedSelectedPattern));
      //delete selection
      const newPattern = cloneDeep(pattern);
      console.log(newPattern, selectedPatternCells, selectedChannel);
      selectedPatternCells.forEach((i) => {
        console.log(newPattern[i]);
        newPattern[i].splice(selectedChannel, 1, new PatternCell());
      });
      dispatch(trackerActions.setSelectedPatternCells([]));
      console.log(patternId, newPattern);
      dispatch(
        trackerDocumentActions.editPattern({
          patternId: patternId,
          pattern: newPattern,
        })
      );
    }
  }, [pattern, selectedChannel, selectedPatternCells, dispatch, patternId]);

  const onPaste = useCallback(async () => {
    if (pattern) {
      const newPastedPattern = parseClipboardToPattern(
        await API.clipboard.readText()
      );
      if (newPastedPattern) {
        refreshPastedPattern(newPastedPattern);
      }
      setPastedPattern(newPastedPattern);
      dispatch(trackerActions.setSelectedPatternCells([]));

      // Blur any focused element to be able to use keyboard actions on the
      // selection
      const el = document.querySelector(":focus") as unknown as
        | BlurableDOMElement
        | undefined;
      if (el && el.blur) el.blur();
    }
  }, [dispatch, pattern, refreshPastedPattern]);

  const onPasteInPlace = useCallback(async () => {
    if (pattern) {
      const newPastedPattern = parseClipboardToPattern(
        await API.clipboard.readText()
      );

      if (newPastedPattern) {
        const newPattern = Array(64)
          .fill("")
          .map((_, i) => {
            console.log(i, selectedChannel);
            const row = [...pattern[i]];
            const pastedRow = newPastedPattern[i];
            if (pastedRow) {
              if (pastedRow.length === 4) {
                return pastedRow;
              } else {
                pastedRow.forEach((c, i) => {
                  row[(selectedChannel + i) % 4] = c;
                });
              }
              return row;
            }
            return [
              new PatternCell(),
              new PatternCell(),
              new PatternCell(),
              new PatternCell(),
            ];
          });

        console.log(newPattern);
        dispatch(
          trackerDocumentActions.editPattern({
            patternId: patternId,
            pattern: newPattern,
          })
        );
        setPastedPattern(undefined);
        dispatch(trackerActions.setSelectedPatternCells([]));
      }

      // Blur any focused element to be able to use keyboard actions on the
      // selection
      const el = document.querySelector(":focus") as unknown as
        | BlurableDOMElement
        | undefined;
      if (el && el.blur) el.blur();
    }
  }, [selectedChannel, dispatch, pattern, patternId]);

  useEffect(() => {
    if (!subpatternEditorFocus) {
      window.addEventListener("copy", onCopy);
      window.addEventListener("cut", onCut);
      window.addEventListener("paste", onPaste);
      API.clipboard.addPasteInPlaceListener(onPasteInPlace);
      return () => {
        window.removeEventListener("copy", onCopy);
        window.removeEventListener("cut", onCut);
        window.removeEventListener("paste", onPaste);
        API.clipboard.removePasteInPlaceListener(onPasteInPlace);
      };
    }
  }, [onCopy, onCut, onPaste, onPasteInPlace, subpatternEditorFocus]);

  const v = [
    selectedChannel,
    ...visibleChannels.filter((c) => c !== selectedChannel),
  ].reverse();

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        height: height,
      }}
    >
      <div
        style={{
          position: "relative",
          flexGrow: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            overflow: "auto",
            height: "100%",
            zIndex: 1,
          }}
        >
          <SongGridHeader cols={64}>
            <div
              style={{ height: "100%" }}
              onMouseDown={(e) => {
                setPlaybackPosition(e.nativeEvent);
              }}
            ></div>
            <div
              ref={playingRowRef}
              style={{
                width: "1px",
                transform: `translateX(${playbackState[1] * CELL_SIZE}px)`,
              }}
            ></div>
            <RollPlaybackTracker
              style={{
                display: playbackState[0] === sequenceId ? "" : "none",
                transform: `translateX(${10 + playbackState[1] * CELL_SIZE}px)`,
              }}
            />
          </SongGridHeader>
          <div
            style={{
              display: "flex",
              position: "relative",
              width: "100%",
              zIndex: 1,
            }}
          >
            <Piano>
              {Array(6)
                .fill("")
                .map((_, i) => (
                  <React.Fragment key={`pianokey_${i}`}>
                    <PianoKey
                      color="white"
                      highlight={hoverNote === MAX_NOTE - i * 12}
                    ></PianoKey>
                    <PianoKey
                      color="black"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 1)}
                    ></PianoKey>
                    <PianoKey
                      color="white"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 2)}
                      tall
                    ></PianoKey>
                    <PianoKey
                      color="black"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 3)}
                    ></PianoKey>
                    <PianoKey
                      color="white"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 4)}
                      tall
                    ></PianoKey>
                    <PianoKey
                      color="black"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 5)}
                    ></PianoKey>
                    <PianoKey
                      color="white"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 6)}
                    ></PianoKey>
                    <PianoKey
                      color="white"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 7)}
                    ></PianoKey>
                    <PianoKey
                      color="black"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 8)}
                    ></PianoKey>
                    <PianoKey
                      color="white"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 9)}
                      tall
                    ></PianoKey>
                    <PianoKey
                      color="black"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 10)}
                    ></PianoKey>
                    <PianoKey
                      color="white"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 11)}
                    >
                      C{8 - i}
                    </PianoKey>
                  </React.Fragment>
                ))}
            </Piano>
            <SongGrid
              ref={gridRef}
              onMouseDown={(e) => {
                handleMouseDown(e.nativeEvent);
              }}
              onMouseLeave={(e) => {
                handleMouseLeave(e.nativeEvent);
              }}
              style={{
                cursor: isDragging
                  ? clonePatternCells
                    ? "copy"
                    : "move"
                  : "auto",
              }}
            >
              <RollChannelGrid cellSize={CELL_SIZE} />
              <RollChannelHover
                cellSize={CELL_SIZE}
                hoverColumn={hoverColumn}
                hoverRow={hoverNote}
              />
              {v.map((i) => (
                <RollChannel
                  key={`roll_channel_${i}`}
                  channelId={i}
                  active={selectedChannel === i}
                  renderPattern={renderPattern || []}
                  renderSelectedPatternCells={renderSelectedPatternCells}
                  isDragging={isDragging}
                  cellSize={CELL_SIZE}
                />
              ))}
              <RollChannelSelectionArea
                cellSize={CELL_SIZE}
                selectionRect={selectionRect}
              />
            </SongGrid>
          </div>
          <SongGridFooter cols={64}>
            <FooterIcon>
              <WandIcon />
            </FooterIcon>
            <RollChannelEffectRow
              patternId={patternId}
              channelId={selectedChannel}
              renderPattern={renderPattern || []}
              cellSize={CELL_SIZE}
            />
          </SongGridFooter>
        </div>
      </div>
      <SplitPaneVerticalDivider />
      <SplitPaneHeader
        onToggle={togglePatternsPanel}
        collapsed={!patternsPanelOpen}
      >
        {l10n("FIELD_PATTERNS")}
      </SplitPaneHeader>
      {patternsPanelOpen && (
        <div
          style={{
            position: "relative",
          }}
        >
          <SequenceEditor
            direction="horizontal"
            sequence={song?.sequence}
            patterns={song?.patterns.length}
            playingSequence={playbackState[0]}
          />
        </div>
      )}
    </div>
  );
};
