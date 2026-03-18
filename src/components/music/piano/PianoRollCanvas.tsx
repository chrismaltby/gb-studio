import React, {
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useState,
  useLayoutEffect,
} from "react";
import { Song, PatternCell } from "shared/lib/uge/types";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { PianoRollPatternBlock } from "./PianoRollPatternBlock";
import {
  StyledPianoRollScrollBottomWrapper,
  StyledPianoRollScrollCanvas,
  StyledPianoRollScrollContentWrapper,
  StyledPianoRollScrollLeftWrapper,
  StyledPianoRollScrollHeaderFooterSpacer,
  StyledPianoRollScrollWrapper,
  StyledPianoRollPatternsWrapper,
  StyledPianoRollNote,
} from "./style";
import { PianoKeyboard } from "./PianoKeyboard";
import {
  PIANO_ROLL_CELL_SIZE,
  PIANO_ROLL_PIANO_WIDTH,
  TOTAL_NOTES,
  TRACKER_PATTERN_LENGTH,
} from "consts";
import { PianoRollEffectRow } from "./PianoRollEffectRow";
import clamp from "shared/lib/helpers/clamp";
import trackerActions from "store/features/tracker/trackerActions";
import API from "renderer/lib/api";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { createPatternCell } from "shared/lib/uge/song";
import {
  parsePatternToClipboard,
  parseClipboardToPattern,
  parseClipboardOrigin,
  NO_CHANGE_ON_PASTE,
} from "components/music/musicClipboardHelpers";
import {
  getInstrumentListByType,
  getInstrumentTypeByChannel,
} from "components/music/helpers";
import {
  calculateDocumentWidth,
  calculatePlaybackTrackerPosition,
  clonePattern,
  commitChangedPatterns,
  interpolateGridLine,
  mutatePatternsAndCollectChanges,
  noteToRow,
  resolveAbsCol,
  rowToNote,
  toAbsCol,
  wrapNote,
} from "./helpers";
import { PianoRollSequenceBar } from "./PianoRollSequenceBar";
import { Selection } from "ui/document/Selection";

const GRID_MARGIN = 0;

interface PianoRollCanvasProps {
  song: Song;
  sequenceId: number;
  playbackOrder: number;
  playbackRow: number;
}

interface Position {
  x: number;
  y: number;
}

interface NoteDragOrigin {
  absCol: number;
  note: number;
}

interface DragDelta {
  columns: number;
  notes: number;
}

type BlurableDOMElement = {
  blur: () => void;
};

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const playNotePreview = (
  song: Song,
  channel: number,
  note: number,
  instrument: number,
) => {
  const instrumentType = getInstrumentTypeByChannel(channel) || "duty";
  const instrumentList = getInstrumentListByType(song, instrumentType);
  API.music.sendToMusicWindow({
    action: "preview",
    note: note,
    type: instrumentType,
    instrument: instrumentList[instrument],
    square2: channel === 1,
  });
};

export const PianoRollCanvas = ({
  song,
  sequenceId,
  playbackOrder,
  playbackRow,
}: PianoRollCanvasProps) => {
  const dispatch = useAppDispatch();

  const hoverNote = useAppSelector((state) => state.tracker.hoverNote);
  const hoverColumn = useAppSelector((state) => state.tracker.hoverColumn);
  const hoverSequenceId = useAppSelector(
    (state) => state.tracker.hoverSequence,
  );
  const selectedPatternCells = useAppSelector(
    (state) => state.tracker.selectedPatternCells,
  );
  const subpatternEditorFocus = useAppSelector(
    (state) => state.tracker.subpatternEditorFocus,
  );

  const addToSelection = useRef(false);
  const clonePatternCells = useRef(false);
  const [isCloneMode, setIsCloneMode] = useState(false);
  const [pastedPattern, setPastedPattern] = useState<PatternCell[][] | null>(
    null,
  );

  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [isDraggingNotes, setIsDraggingNotes] = useState(false);
  const [noteDragOrigin, setNoteDragOrigin] = useState<NoteDragOrigin | null>(
    null,
  );
  const lastDragPreviewCellRef = useRef<string | null>(null);
  const lastPaintPositionRef = useRef<{
    absCol: number;
    noteIndex: number;
  } | null>(null);
  const [dragDelta, setDragDelta] = useState<DragDelta>({
    columns: 0,
    notes: 0,
  });

  const selectedChannel = useAppSelector(
    (state) => state.tracker.selectedChannel,
  );
  const visibleChannels = useAppSelector(
    (state) => state.tracker.visibleChannels,
  );

  const tool = useAppSelector((state) => state.tracker.tool);

  const [draggingSelection, setDraggingSelection] = useState(false);
  const [selectionOrigin, setSelectionOrigin] = useState<
    Position | undefined
  >();
  const [selectionRect, setSelectionRect] = useState<
    SelectionRect | undefined
  >();

  const defaultInstruments = useAppSelector(
    (state) => state.tracker.defaultInstruments,
  );
  const currentInstrument = defaultInstruments[selectedChannel];

  const selectCellsInRange = useCallback(
    (_selectedPatternCells: number[], nextSelectionRect: SelectionRect) => {
      const totalCols = song.sequence.length * TRACKER_PATTERN_LENGTH;
      const totalRows = TOTAL_NOTES;

      const rangeStartCol = clamp(
        Math.floor(nextSelectionRect.x / PIANO_ROLL_CELL_SIZE),
        0,
        totalCols - 1,
      );
      const rangeEndCol = clamp(
        Math.ceil(
          (nextSelectionRect.x + nextSelectionRect.width) /
            PIANO_ROLL_CELL_SIZE,
        ),
        rangeStartCol + 1,
        totalCols,
      );

      const fromRow = clamp(
        Math.floor(nextSelectionRect.y / PIANO_ROLL_CELL_SIZE),
        0,
        totalRows - 1,
      );
      const toRow = clamp(
        Math.ceil(
          (nextSelectionRect.y + nextSelectionRect.height) /
            PIANO_ROLL_CELL_SIZE,
        ),
        fromRow + 1,
        totalRows,
      );

      const selectedColumns = new Set(_selectedPatternCells);

      for (let absCol = rangeStartCol; absCol < rangeEndCol; absCol++) {
        const resolved = resolveAbsCol(song.sequence, absCol);
        if (!resolved) {
          continue;
        }
        const cell =
          song.patterns[resolved.patternId]?.[resolved.column]?.[
            selectedChannel
          ];

        if (!cell || cell.note === null) {
          continue;
        }

        const row = noteToRow(cell.note);
        if (row >= fromRow && row < toRow) {
          selectedColumns.add(absCol);
        }
      }

      return [...selectedColumns].sort((a, b) => a - b);
    },
    [selectedChannel, song.patterns, song.sequence],
  );

  const onSelectAll = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.focusNode) {
      return;
    }

    window.getSelection()?.empty();

    const allPatternCells = song.sequence
      .flatMap((patternId, sequenceId) =>
        song.patterns[patternId].map((column, columnIdx) =>
          column[selectedChannel].note !== null
            ? toAbsCol(sequenceId, columnIdx)
            : undefined,
        ),
      )
      .filter((column) => column !== undefined) as number[];

    dispatch(trackerActions.setSelectedPatternCells(allPatternCells));

    // Blur any focused element so keyboard actions target the note selection.
    const el = document.querySelector(":focus") as unknown as
      | BlurableDOMElement
      | undefined;
    if (el && el.blur) {
      el.blur();
    }
  }, [dispatch, selectedChannel, song.patterns, song.sequence]);

  useEffect(() => {
    if (!subpatternEditorFocus) {
      document.addEventListener("selectionchange", onSelectAll);
      return () => {
        document.removeEventListener("selectionchange", onSelectAll);
      };
    }
  }, [onSelectAll, subpatternEditorFocus]);

  const handleKeyDownActions = useCallback(
    (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.nodeName !== "BODY") {
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        if (selectedPatternCells.length === 0) return;

        const { clonedPatterns, changedPatternIds } =
          mutatePatternsAndCollectChanges(
            song.patterns,
            (patterns, changed) => {
              for (const absCol of selectedPatternCells) {
                const resolved = resolveAbsCol(song.sequence, absCol);
                if (!resolved) continue;
                patterns[resolved.patternId][resolved.column][selectedChannel] =
                  createPatternCell();
                changed.add(resolved.patternId);
              }
            },
          );

        commitChangedPatterns(
          changedPatternIds,
          clonedPatterns,
          (patternId, pattern) => {
            dispatch(
              trackerDocumentActions.editPattern({
                patternId,
                pattern,
              }),
            );
          },
        );

        dispatch(trackerActions.setSelectedPatternCells([]));
      }

      if (e.key === "Escape") {
        dispatch(trackerActions.setSelectedPatternCells([]));
        setIsDraggingNotes(false);
        setDragDelta({ columns: 0, notes: 0 });
        setNoteDragOrigin(null);
        setPastedPattern(null);
      }
    },
    [
      dispatch,
      selectedChannel,
      selectedPatternCells,
      song.patterns,
      song.sequence,
    ],
  );

  const handleKeyDownActionsRef = useRef(handleKeyDownActions);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        addToSelection.current = true;
      }
      if (e.altKey) {
        clonePatternCells.current = true;
        setIsCloneMode(true);
      }
      handleKeyDownActionsRef.current(e);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey) {
        addToSelection.current = false;
      }
      if (!e.altKey) {
        clonePatternCells.current = false;
        setIsCloneMode(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const displayChannels = useMemo(
    () =>
      [
        selectedChannel,
        ...visibleChannels.filter((c) => c !== selectedChannel),
      ].reverse(),
    [selectedChannel, visibleChannels],
  );

  const c5Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    c5Ref.current?.scrollIntoView({ block: "center" });
  }, []);

  const documentWidth = song.sequence
    ? calculateDocumentWidth(song.sequence.length)
    : 0;
  const totalColumns = song.sequence.length * TRACKER_PATTERN_LENGTH;
  const totalRows = TOTAL_NOTES;

  const scrollRef = useRef<HTMLDivElement>(null);
  const playing = useAppSelector((state) => state.tracker.playing);

  const hoverNoteRef = useRef(hoverNote);
  const hoverColumnRef = useRef(hoverColumn);
  const hoverSequenceIdRef = useRef(hoverSequenceId);

  useEffect(() => {
    hoverNoteRef.current = hoverNote;
    hoverColumnRef.current = hoverColumn;
    hoverSequenceIdRef.current = hoverSequenceId;
  }, [hoverNote, hoverColumn, hoverSequenceId]);

  useLayoutEffect(() => {
    if (scrollRef.current && playing) {
      const rect = scrollRef.current.getBoundingClientRect();
      const halfWidth = rect.width * 0.5;
      scrollRef.current.scrollLeft =
        calculatePlaybackTrackerPosition(playbackOrder, playbackRow) -
        halfWidth;
    }
  }, [playing, playbackOrder, playbackRow]);

  const documentRef = useRef<HTMLDivElement>(null);

  const calculatePositionFromMouse = useCallback(
    (e: MouseEvent) => {
      if (!documentRef.current) {
        return {
          noteIndex: null,
          patternCol: null,
          sequenceId: null,
        };
      }

      const rect = documentRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const absCol = clamp(
        Math.floor(x / PIANO_ROLL_CELL_SIZE),
        0,
        totalColumns - 1,
      );
      const resolved = resolveAbsCol(song.sequence, absCol);
      if (!resolved) {
        return {
          noteIndex: null,
          patternCol: null,
          sequenceId: null,
        };
      }
      const newRow = Math.floor((e.pageY - rect.top) / PIANO_ROLL_CELL_SIZE);
      const newNote = rowToNote(newRow);

      return {
        noteIndex: newNote,
        patternCol: resolved.column,
        sequenceId: resolved.sequenceId,
      };
    },
    [song.sequence, totalColumns],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      addToSelection.current = e.shiftKey;
      clonePatternCells.current = e.altKey;
      setIsCloneMode(e.altKey);

      const { noteIndex, patternCol, sequenceId } =
        calculatePositionFromMouse(e);

      if (noteIndex === null || patternCol === null || sequenceId === null) {
        return;
      }

      if (
        noteIndex !== hoverNoteRef.current ||
        patternCol !== hoverColumnRef.current ||
        sequenceId !== hoverSequenceIdRef.current
      ) {
        dispatch(
          trackerActions.setHover({
            note: noteIndex,
            column: patternCol,
            sequenceId,
          }),
        );
      }

      if (pastedPattern) {
        return;
      }

      if (
        (tool === "selection" || tool === "pencil") &&
        isMouseDown &&
        song &&
        selectedPatternCells.length > 0 &&
        noteDragOrigin
      ) {
        const absCol = toAbsCol(sequenceId, patternCol);
        const nextDragDelta = {
          columns: absCol - noteDragOrigin.absCol,
          notes: noteIndex - noteDragOrigin.note,
        };

        if (
          nextDragDelta.columns !== dragDelta.columns ||
          nextDragDelta.notes !== dragDelta.notes
        ) {
          setDragDelta(nextDragDelta);
          setIsDraggingNotes(true);

          const previewCellId = `${absCol}:${noteIndex}`;
          if (lastDragPreviewCellRef.current !== previewCellId) {
            playNotePreview(
              song,
              selectedChannel,
              noteIndex,
              currentInstrument,
            );
            lastDragPreviewCellRef.current = previewCellId;
          }
        }
      } else if (
        tool === "pencil" &&
        isMouseDown &&
        !noteDragOrigin &&
        e.button === 0
      ) {
        const absCol = toAbsCol(sequenceId, patternCol);
        const currentCellId = `${absCol}:${noteIndex}`;
        if (lastDragPreviewCellRef.current !== currentCellId) {
          const prev = lastPaintPositionRef.current;
          lastDragPreviewCellRef.current = currentCellId;
          lastPaintPositionRef.current = { absCol, noteIndex };

          const cellsToPaint = interpolateGridLine(
            prev ? { absCol: prev.absCol, note: prev.noteIndex } : null,
            { absCol, note: noteIndex },
          );

          // Batch all paint edits: group by pattern, clone only what changed,
          // then dispatch once per affected pattern
          type PaintEdit = { column: number; note: number };
          const paintsByPattern = new Map<number, PaintEdit[]>();
          for (const paintCell of cellsToPaint) {
            const resolved = resolveAbsCol(song.sequence, paintCell.absCol);
            if (!resolved) continue;
            const existing =
              song.patterns[resolved.patternId][resolved.column][
                selectedChannel
              ];
            if (existing?.note === paintCell.note) continue;
            const edits = paintsByPattern.get(resolved.patternId) ?? [];
            edits.push({ column: resolved.column, note: paintCell.note });
            paintsByPattern.set(resolved.patternId, edits);
          }
          for (const [patternId, edits] of paintsByPattern) {
            const pattern = clonePattern(song.patterns[patternId]);
            for (const { column, note } of edits) {
              pattern[column][selectedChannel] = {
                ...pattern[column][selectedChannel],
                instrument: defaultInstruments[selectedChannel],
                note,
              };
            }
            dispatch(
              trackerDocumentActions.editPattern({
                patternId: Number(patternId),
                pattern,
              }),
            );
          }

          // Only the most recently painted cell is selected
          const lastPainted = cellsToPaint[cellsToPaint.length - 1];
          if (lastPainted) {
            dispatch(
              trackerActions.setSelectedPatternCells([lastPainted.absCol]),
            );
            playNotePreview(
              song,
              selectedChannel,
              lastPainted.note,
              currentInstrument,
            );
          }
        }
      } else if (
        (tool === "eraser" || e.button === 2) &&
        isMouseDown &&
        !noteDragOrigin
      ) {
        const absCol = toAbsCol(sequenceId, patternCol);
        const currentCellId = `${absCol}:${noteIndex}`;
        if (lastDragPreviewCellRef.current !== currentCellId) {
          const prev = lastPaintPositionRef.current;
          lastDragPreviewCellRef.current = currentCellId;
          lastPaintPositionRef.current = { absCol, noteIndex };

          const cellsToErase = interpolateGridLine(
            prev ? { absCol: prev.absCol, note: prev.noteIndex } : null,
            { absCol, note: noteIndex },
          );

          // Batch all erase edits: group by pattern, clone only what changed,
          // then dispatch once per affected pattern
          type EraseEdit = { column: number };
          const erasesByPattern = new Map<number, EraseEdit[]>();
          for (const eraseCell of cellsToErase) {
            const resolved = resolveAbsCol(song.sequence, eraseCell.absCol);
            if (!resolved) continue;
            const existing =
              song.patterns[resolved.patternId][resolved.column][
                selectedChannel
              ];
            // Only erase if there's actually a note at this position
            if (
              existing?.note !== null &&
              existing?.note !== undefined &&
              existing.note === eraseCell.note
            ) {
              const edits = erasesByPattern.get(resolved.patternId) ?? [];
              edits.push({ column: resolved.column });
              erasesByPattern.set(resolved.patternId, edits);
            }
          }
          for (const [patternId, edits] of erasesByPattern) {
            const pattern = clonePattern(song.patterns[patternId]);
            for (const { column } of edits) {
              pattern[column][selectedChannel] = {
                ...pattern[column][selectedChannel],
                instrument: null,
                note: null,
              };
            }
            dispatch(
              trackerDocumentActions.editPattern({
                patternId: Number(patternId),
                pattern,
              }),
            );
          }
        }
      } else if (
        tool === "selection" &&
        draggingSelection &&
        selectionRect &&
        selectionOrigin
      ) {
        if (!documentRef.current) {
          return;
        }
        const bounds = documentRef.current.getBoundingClientRect();
        const newAbsCol = Math.floor(
          (e.pageX - bounds.left - GRID_MARGIN) / PIANO_ROLL_CELL_SIZE,
        );
        const newRow = Math.floor(
          (e.pageY - bounds.top) / PIANO_ROLL_CELL_SIZE,
        );

        const x2 = clamp(
          newAbsCol * PIANO_ROLL_CELL_SIZE,
          0,
          totalColumns * PIANO_ROLL_CELL_SIZE,
        );
        const y2 = clamp(
          newRow * PIANO_ROLL_CELL_SIZE,
          0,
          totalRows * PIANO_ROLL_CELL_SIZE,
        );

        const x = Math.min(selectionOrigin.x, x2);
        const y = Math.min(selectionOrigin.y, y2);
        const width = Math.max(
          PIANO_ROLL_CELL_SIZE,
          Math.abs(selectionOrigin.x - x2),
        );
        const height = Math.max(
          PIANO_ROLL_CELL_SIZE,
          Math.abs(selectionOrigin.y - y2),
        );

        const nextSelectionRect = { x, y, width, height };
        setSelectionRect(nextSelectionRect);

        const selectedCells = selectCellsInRange(
          addToSelection.current ? selectedPatternCells : [],
          nextSelectionRect,
        );
        dispatch(trackerActions.setSelectedPatternCells(selectedCells));
      }
    },
    [
      calculatePositionFromMouse,
      dispatch,
      currentInstrument,
      dragDelta.columns,
      dragDelta.notes,
      draggingSelection,
      isMouseDown,
      selectedChannel,
      noteDragOrigin,
      selectCellsInRange,
      selectedPatternCells,
      pastedPattern,
      selectionOrigin,
      selectionRect,
      song,
      totalColumns,
      totalRows,
      tool,
      defaultInstruments,
    ],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      addToSelection.current = e.shiftKey;
      clonePatternCells.current = e.altKey;
      setIsCloneMode(e.altKey);

      const { noteIndex, patternCol, sequenceId } = calculatePositionFromMouse(
        e.nativeEvent,
      );
      if (noteIndex === null || patternCol === null || sequenceId === null) {
        return;
      }

      // Commit any pending paste on click
      if (pastedPattern) {
        const absCol = toAbsCol(sequenceId, patternCol);
        const { clonedPatterns, changedPatternIds } =
          mutatePatternsAndCollectChanges(
            song.patterns,
            (patterns, changed) => {
              let noteOffset: number | undefined = undefined;
              for (let offset = 0; offset < pastedPattern.length; offset++) {
                const cell = pastedPattern[offset][0];
                if (cell.note === null || cell.note === NO_CHANGE_ON_PASTE)
                  continue;
                if (noteOffset === undefined)
                  noteOffset = noteIndex - cell.note;
                const targetAbsCol = absCol + offset;
                if (targetAbsCol < 0 || targetAbsCol >= totalColumns) continue;
                const resolved = resolveAbsCol(song.sequence, targetAbsCol);
                if (!resolved) continue;
                patterns[resolved.patternId][resolved.column][selectedChannel] =
                  {
                    ...patterns[resolved.patternId][resolved.column][
                      selectedChannel
                    ],
                    ...cell,
                    note: wrapNote(cell.note + noteOffset),
                  };
                changed.add(resolved.patternId);
              }
            },
          );

        commitChangedPatterns(
          changedPatternIds,
          clonedPatterns,
          (patternId, pattern) => {
            dispatch(
              trackerDocumentActions.editPattern({
                patternId,
                pattern,
              }),
            );
          },
        );
        setPastedPattern(null);
        return;
      }

      const patternId = song.sequence[sequenceId];
      const absCol = toAbsCol(sequenceId, patternCol);
      const pattern = song.patterns[patternId];
      const cell = pattern[patternCol][selectedChannel];

      if (tool === "pencil" && e.button === 0) {
        // If there's a note in position
        if (cell && cell.note === noteIndex) {
          if (!selectedPatternCells.includes(absCol)) {
            dispatch(trackerActions.setSelectedPatternCells([absCol]));
          }
          setIsMouseDown(true);
          setIsDraggingNotes(false);
          setNoteDragOrigin({ absCol, note: cell.note });
          setDragDelta({ columns: 0, notes: 0 });
          lastDragPreviewCellRef.current = null;
          return;
        }
        if (
          cell &&
          cell.note !== noteIndex &&
          selectedPatternCells.length > 1
        ) {
          dispatch(trackerActions.setSelectedPatternCells([]));
        } else {
          const changes = {
            instrument: defaultInstruments[selectedChannel],
            note: noteIndex,
          };
          dispatch(
            trackerDocumentActions.editPatternCell({
              patternId: patternId,
              cell: [patternCol, selectedChannel],
              changes: changes,
            }),
          );

          if (song) {
            playNotePreview(
              song,
              selectedChannel,
              noteIndex,
              currentInstrument,
            );
          }

          if (!selectedPatternCells.includes(absCol)) {
            dispatch(trackerActions.setSelectedPatternCells([absCol]));
          }
          setIsMouseDown(true);
          lastDragPreviewCellRef.current = `${absCol}:${noteIndex}`;
          lastPaintPositionRef.current = { absCol, noteIndex };
        }
      } else if (e.button === 2 || (tool === "eraser" && e.button === 0)) {
        // Erase the note at click position if there is one
        if (cell && cell.note === noteIndex) {
          dispatch(
            trackerDocumentActions.editPatternCell({
              patternId: patternId,
              cell: [patternCol, selectedChannel],
              changes: {
                instrument: null,
                note: null,
              },
            }),
          );
          dispatch(trackerActions.setSelectedPatternCells([absCol]));
        }
        setIsMouseDown(true);
        lastPaintPositionRef.current = { absCol, noteIndex };
      } else if (tool === "selection" && e.button === 0) {
        // If there's a note in position
        if (cell && cell.note === noteIndex) {
          if (!selectedPatternCells.includes(absCol)) {
            if (addToSelection.current) {
              const newSelectedPatterns = [...selectedPatternCells];
              newSelectedPatterns.push(absCol);
              dispatch(
                trackerActions.setSelectedPatternCells(newSelectedPatterns),
              );
            } else {
              dispatch(trackerActions.setSelectedPatternCells([absCol]));
            }
          }
          setIsMouseDown(true);
          setIsDraggingNotes(false);
          setNoteDragOrigin({ absCol, note: cell.note });
          setDragDelta({ columns: 0, notes: 0 });
          lastDragPreviewCellRef.current = null;
        } else if (documentRef.current) {
          const bounds = documentRef.current.getBoundingClientRect();
          const x = clamp(
            Math.floor(
              (e.pageX - bounds.left - GRID_MARGIN) / PIANO_ROLL_CELL_SIZE,
            ) * PIANO_ROLL_CELL_SIZE,
            0,
            totalColumns * PIANO_ROLL_CELL_SIZE - 1,
          );
          const y = clamp(
            Math.floor((e.pageY - bounds.top) / PIANO_ROLL_CELL_SIZE) *
              PIANO_ROLL_CELL_SIZE,
            0,
            totalRows * PIANO_ROLL_CELL_SIZE - PIANO_ROLL_CELL_SIZE,
          );

          const newSelectionRect = {
            x,
            y,
            width: PIANO_ROLL_CELL_SIZE,
            height: PIANO_ROLL_CELL_SIZE,
          };

          const newSelectedPatterns = selectCellsInRange(
            addToSelection.current ? selectedPatternCells : [],
            newSelectionRect,
          );

          setSelectionOrigin({ x, y });
          setSelectionRect(newSelectionRect);
          setDraggingSelection(true);
          dispatch(trackerActions.setSelectedPatternCells(newSelectedPatterns));
        }
      }
    },
    [
      calculatePositionFromMouse,
      currentInstrument,
      defaultInstruments,
      dispatch,
      pastedPattern,
      selectCellsInRange,
      selectedChannel,
      selectedPatternCells,
      song,
      totalRows,
      tool,
      totalColumns,
    ],
  );

  const handleMouseUp = useCallback(
    (_e: MouseEvent) => {
      if (isDraggingNotes && selectedPatternCells.length > 0) {
        const { clonedPatterns, changedPatternIds } =
          mutatePatternsAndCollectChanges(
            song.patterns,
            (patterns, changed) => {
              for (const sourceAbsCol of selectedPatternCells) {
                const sourceResolved = resolveAbsCol(
                  song.sequence,
                  sourceAbsCol,
                );
                if (!sourceResolved) continue;

                const sourceCell =
                  song.patterns[sourceResolved.patternId]?.[
                    sourceResolved.column
                  ]?.[selectedChannel];

                if (!sourceCell || sourceCell.note === null) {
                  continue;
                }

                const targetAbsCol = sourceAbsCol + dragDelta.columns;

                if (
                  !clonePatternCells.current &&
                  selectedPatternCells.indexOf(
                    sourceAbsCol - dragDelta.columns,
                  ) === -1
                ) {
                  patterns[sourceResolved.patternId][sourceResolved.column][
                    selectedChannel
                  ] = {
                    ...patterns[sourceResolved.patternId][
                      sourceResolved.column
                    ][selectedChannel],
                    instrument: null,
                    note: null,
                    effectcode: null,
                    effectparam: null,
                  };
                  changed.add(sourceResolved.patternId);
                }

                if (targetAbsCol < 0 || targetAbsCol >= totalColumns) {
                  continue;
                }

                const targetResolved = resolveAbsCol(
                  song.sequence,
                  targetAbsCol,
                );
                if (!targetResolved) continue;

                patterns[targetResolved.patternId][targetResolved.column][
                  selectedChannel
                ] = {
                  ...patterns[targetResolved.patternId][targetResolved.column][
                    selectedChannel
                  ],
                  ...sourceCell,
                  note: wrapNote(sourceCell.note + dragDelta.notes),
                };
                changed.add(targetResolved.patternId);
              }
            },
          );

        commitChangedPatterns(
          changedPatternIds,
          clonedPatterns,
          (patternId, pattern) => {
            dispatch(
              trackerDocumentActions.editPattern({
                patternId,
                pattern,
              }),
            );
          },
        );

        dispatch(
          trackerActions.setSelectedPatternCells(
            selectedPatternCells
              .map((absCol) => absCol + dragDelta.columns)
              .filter((absCol) => absCol >= 0 && absCol < totalColumns),
          ),
        );
      }

      setSelectionRect(undefined);
      setDraggingSelection(false);
      setIsDraggingNotes(false);
      setDragDelta({ columns: 0, notes: 0 });
      setNoteDragOrigin(null);
      lastDragPreviewCellRef.current = null;
      lastPaintPositionRef.current = null;
      setIsCloneMode(false);
      setIsMouseDown(false);
    },
    [
      dispatch,
      dragDelta.columns,
      dragDelta.notes,
      isDraggingNotes,
      selectedChannel,
      selectedPatternCells,
      song.patterns,
      song.sequence,
      totalColumns,
    ],
  );

  const previewNotes = useMemo(() => {
    if (!isDraggingNotes) {
      return [];
    }

    return selectedPatternCells
      .map((sourceAbsCol) => {
        const sourceResolved = resolveAbsCol(song.sequence, sourceAbsCol);
        if (!sourceResolved) {
          return null;
        }
        const sourceCell =
          song.patterns[sourceResolved.patternId]?.[sourceResolved.column]?.[
            selectedChannel
          ];

        if (!sourceCell || sourceCell.note === null) {
          return null;
        }

        const targetAbsCol = sourceAbsCol + dragDelta.columns;
        if (targetAbsCol < 0 || targetAbsCol >= totalColumns) {
          return null;
        }

        const targetNote = wrapNote(sourceCell.note + dragDelta.notes);
        const targetRow = noteToRow(targetNote);

        return {
          key: `${sourceAbsCol}`,
          left: targetAbsCol * PIANO_ROLL_CELL_SIZE,
          top: targetRow * PIANO_ROLL_CELL_SIZE,
          instrument: sourceCell.instrument ?? 0,
        };
      })
      .filter((note) => note !== null);
  }, [
    dragDelta.columns,
    dragDelta.notes,
    isDraggingNotes,
    selectedChannel,
    selectedPatternCells,
    song.patterns,
    song.sequence,
    totalColumns,
  ]);

  const pastePreviewNotes = useMemo(() => {
    if (
      !pastedPattern ||
      hoverColumn === null ||
      hoverNote === null ||
      hoverSequenceId === null
    ) {
      return [];
    }
    const hoverAbsCol = hoverSequenceId * TRACKER_PATTERN_LENGTH + hoverColumn;
    let noteOffset: number | undefined = undefined;
    const notes: {
      key: string;
      left: number;
      top: number;
      instrument: number;
    }[] = [];
    for (let offset = 0; offset < pastedPattern.length; offset++) {
      const cell = pastedPattern[offset][0];
      if (cell.note === null || cell.note === NO_CHANGE_ON_PASTE) continue;
      if (noteOffset === undefined) noteOffset = hoverNote - cell.note;
      const targetAbsCol = hoverAbsCol + offset;
      if (targetAbsCol < 0 || targetAbsCol >= totalColumns) continue;
      const targetNote = wrapNote(cell.note + noteOffset);
      const targetRow = noteToRow(targetNote);
      notes.push({
        key: `${offset}`,
        left: targetAbsCol * PIANO_ROLL_CELL_SIZE,
        top: targetRow * PIANO_ROLL_CELL_SIZE,
        instrument: cell.instrument ?? 0,
      });
    }
    return notes;
  }, [pastedPattern, hoverColumn, hoverNote, hoverSequenceId, totalColumns]);

  const handleMouseMoveRef = useRef(handleMouseMove);
  const handleMouseUpRef = useRef(handleMouseUp);

  // Clipboard callbacks

  const onCopy = useCallback(
    (e: ClipboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.nodeName === "INPUT") return;
      if (selectedPatternCells.length === 0) return;
      const flatPattern = song.sequence.flatMap((pid) => song.patterns[pid]);
      const originAbsCol = Math.min(...selectedPatternCells);
      const parsedSelectedPattern = parsePatternToClipboard(
        flatPattern,
        selectedChannel,
        selectedPatternCells,
        originAbsCol,
      );
      e.preventDefault();
      e.clipboardData?.setData("text/plain", parsedSelectedPattern);
      void API.clipboard.writeText(parsedSelectedPattern);
    },
    [selectedChannel, selectedPatternCells, song.patterns, song.sequence],
  );

  const onCut = useCallback(
    (e?: ClipboardEvent) => {
      if (selectedPatternCells.length === 0) return;
      const flatPattern = song.sequence.flatMap((pid) => song.patterns[pid]);
      const originAbsCol = Math.min(...selectedPatternCells);
      const parsedSelectedPattern = parsePatternToClipboard(
        flatPattern,
        selectedChannel,
        selectedPatternCells,
        originAbsCol,
      );
      e?.preventDefault();
      e?.clipboardData?.setData("text/plain", parsedSelectedPattern);
      void API.clipboard.writeText(parsedSelectedPattern);
      const { clonedPatterns, changedPatternIds } =
        mutatePatternsAndCollectChanges(song.patterns, (patterns, changed) => {
          for (const absCol of selectedPatternCells) {
            const resolved = resolveAbsCol(song.sequence, absCol);
            if (!resolved) continue;
            patterns[resolved.patternId][resolved.column][selectedChannel] =
              createPatternCell();
            changed.add(resolved.patternId);
          }
        });

      commitChangedPatterns(
        changedPatternIds,
        clonedPatterns,
        (patternId, pattern) => {
          dispatch(
            trackerDocumentActions.editPattern({
              patternId,
              pattern,
            }),
          );
        },
      );
      dispatch(trackerActions.setSelectedPatternCells([]));
    },
    [
      dispatch,
      selectedChannel,
      selectedPatternCells,
      song.patterns,
      song.sequence,
    ],
  );

  const onPaste = useCallback(async () => {
    const newPastedPattern = parseClipboardToPattern(
      await API.clipboard.readText(),
    );
    if (newPastedPattern && newPastedPattern.length > 0) {
      setPastedPattern(newPastedPattern);
      dispatch(trackerActions.setSelectedPatternCells([]));
      const el = document.querySelector(":focus") as unknown as
        | BlurableDOMElement
        | undefined;
      if (el && el.blur) el.blur();
    }
  }, [dispatch]);

  const onPasteInPlace = useCallback(async () => {
    const clipboardText = await API.clipboard.readText();
    const newPastedPattern = parseClipboardToPattern(clipboardText);
    const originAbsCol = parseClipboardOrigin(clipboardText) ?? 0;

    if (!newPastedPattern || newPastedPattern.length === 0) return;

    const { clonedPatterns, changedPatternIds } =
      mutatePatternsAndCollectChanges(song.patterns, (patterns, changed) => {
        for (let offset = 0; offset < newPastedPattern.length; offset++) {
          const cell = newPastedPattern[offset][0];
          if (cell.note === null || cell.note === NO_CHANGE_ON_PASTE) continue;
          const absCol = originAbsCol + offset;
          if (absCol >= totalColumns) break;
          const resolved = resolveAbsCol(song.sequence, absCol);
          if (!resolved) continue;
          const existing =
            patterns[resolved.patternId][resolved.column][selectedChannel];
          patterns[resolved.patternId][resolved.column][selectedChannel] = {
            ...existing,
            note: cell.note,
            instrument:
              cell.instrument !== NO_CHANGE_ON_PASTE
                ? cell.instrument
                : existing.instrument,
            effectcode:
              cell.effectcode !== NO_CHANGE_ON_PASTE
                ? cell.effectcode
                : existing.effectcode,
            effectparam:
              cell.effectparam !== NO_CHANGE_ON_PASTE
                ? cell.effectparam
                : existing.effectparam,
          };
          changed.add(resolved.patternId);
        }
      });

    commitChangedPatterns(
      changedPatternIds,
      clonedPatterns,
      (patternId, pattern) => {
        dispatch(
          trackerDocumentActions.editPattern({
            patternId,
            pattern,
          }),
        );
      },
    );
    dispatch(trackerActions.setSelectedPatternCells([]));
    const el = document.querySelector(":focus") as unknown as
      | BlurableDOMElement
      | undefined;
    if (el && el.blur) el.blur();
  }, [dispatch, selectedChannel, song.patterns, song.sequence, totalColumns]);

  const lastSequenceId = useRef(sequenceId);
  useEffect(() => {
    if (
      !playing &&
      sequenceId !== lastSequenceId.current &&
      scrollRef.current
    ) {
      const rect = scrollRef.current.getBoundingClientRect();
      const halfWidth = rect.width * 0.5;
      const patternWidth = TRACKER_PATTERN_LENGTH * PIANO_ROLL_CELL_SIZE;
      const patternX = calculatePlaybackTrackerPosition(sequenceId, 0);
      const scrollLeft =
        rect.width < patternWidth
          ? patternX
          : patternX - halfWidth + patternWidth * 0.5;

      scrollRef.current.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
    lastSequenceId.current = sequenceId;
  }, [sequenceId, playing]);

  const onCopyRef = useRef(onCopy);
  const onCutRef = useRef(onCut);
  const onPasteRef = useRef(onPaste);
  const onPasteInPlaceRef = useRef(onPasteInPlace);

  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove;
    handleMouseUpRef.current = handleMouseUp;
    handleKeyDownActionsRef.current = handleKeyDownActions;
    onCopyRef.current = onCopy;
    onCutRef.current = onCut;
    onPasteRef.current = onPaste;
    onPasteInPlaceRef.current = onPasteInPlace;
  });

  useEffect(() => {
    if (subpatternEditorFocus) return;
    const handleCopy = (e: ClipboardEvent) => onCopyRef.current(e);
    const handleCut = (e: ClipboardEvent) => onCutRef.current(e);
    const handlePaste = () => onPasteRef.current();
    const handlePasteInPlace = () => {
      onPasteInPlaceRef.current();
    };
    window.addEventListener("copy", handleCopy);
    window.addEventListener("cut", handleCut);
    window.addEventListener("paste", handlePaste);
    const unsubscribePasteInPlace =
      API.events.menu.pasteInPlace.subscribe(handlePasteInPlace);
    return () => {
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("cut", handleCut);
      window.removeEventListener("paste", handlePaste);
      unsubscribePasteInPlace();
    };
  }, [subpatternEditorFocus]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      handleMouseMoveRef.current(e);
    };

    const onMouseUp = (e: MouseEvent) => {
      handleMouseUpRef.current(e);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <StyledPianoRollScrollWrapper ref={scrollRef}>
      <StyledPianoRollScrollCanvas
        style={{ minWidth: PIANO_ROLL_PIANO_WIDTH + documentWidth }}
      >
        <PianoRollSequenceBar
          song={song}
          playbackOrder={playbackOrder}
          playbackRow={playbackRow}
        />
        <StyledPianoRollScrollLeftWrapper>
          <PianoKeyboard c5Ref={c5Ref} hoverNote={hoverNote} />
        </StyledPianoRollScrollLeftWrapper>
        <StyledPianoRollScrollContentWrapper
          ref={documentRef}
          style={{
            width: documentWidth,
            cursor: isDraggingNotes ? (isCloneMode ? "copy" : "move") : "auto",
          }}
          onMouseDown={!playing ? handleMouseDown : undefined}
        >
          <StyledPianoRollPatternsWrapper>
            {song.sequence.map((p, i) => (
              <PianoRollPatternBlock
                key={`roll_pattern_${i}:${p}`}
                patternId={p}
                sequenceId={i}
                displayChannels={displayChannels}
                isDragging={isDraggingNotes}
              />
            ))}
          </StyledPianoRollPatternsWrapper>
          {isDraggingNotes &&
            previewNotes.map((previewNote) => (
              <StyledPianoRollNote
                key={`preview_${previewNote.key}`}
                $isSelected
                $instrument={previewNote.instrument}
                style={{
                  left: previewNote.left,
                  top: previewNote.top,
                  zIndex: 2,
                }}
              />
            ))}
          {pastedPattern &&
            pastePreviewNotes.map((previewNote) => (
              <StyledPianoRollNote
                key={`paste_preview_${previewNote.key}`}
                $isSelected
                $instrument={previewNote.instrument}
                style={{
                  left: previewNote.left,
                  top: previewNote.top,
                  zIndex: 2,
                }}
              />
            ))}
          {selectionRect && (
            <Selection
              style={{
                left: selectionRect.x,
                top: selectionRect.y,
                width: selectionRect.width,
                height: selectionRect.height,
              }}
            />
          )}
        </StyledPianoRollScrollContentWrapper>
        <StyledPianoRollScrollBottomWrapper
          style={{ minWidth: PIANO_ROLL_PIANO_WIDTH + documentWidth }}
        >
          <StyledPianoRollScrollHeaderFooterSpacer />
          {song.sequence.map((p, i) => (
            <PianoRollEffectRow
              key={`roll_pattern_effects_${i}:${p}`}
              patternId={p}
              sequenceId={i}
              channelId={selectedChannel}
            />
          ))}
        </StyledPianoRollScrollBottomWrapper>
      </StyledPianoRollScrollCanvas>
    </StyledPianoRollScrollWrapper>
  );
};
