import React, {
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";
import { PatternCell, SequenceItem } from "shared/lib/uge/types";
import { useAppDispatch, useAppSelector, useAppStore } from "store/hooks";
import { PianoRollPatternBlock } from "./PianoRollPatternBlock";
import {
  StyledPianoRollScrollBottomWrapper,
  StyledPianoRollScrollCanvas,
  StyledPianoRollScrollContentWrapper,
  StyledPianoRollScrollLeftWrapper,
  StyledPianoRollScrollHeaderFooterSpacer,
  StyledPianoRollScrollWrapper,
  StyledPianoRollPatternsWrapper,
  StyledPianoRollScrollLeftFXSpacer,
  StyledAddPatternButton,
  StyledAddPatternWrapper,
  StyledPianoRollScrollLeftHeaderSpacer,
  StyledPianoRollWrapper,
} from "./style";
import { PianoKeyboard } from "./PianoKeyboard";
import {
  OCTAVE_SIZE,
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
import {
  calculateDocumentWidth,
  calculatePlaybackTrackerPosition,
  interpolateGridLine,
  noteToRow,
  pageToSnappedGridPoint,
  pixelRangeToGridRange,
  pixelToGridIndex,
  rowToNote,
} from "./helpers";
import { PianoRollSequenceBar } from "./PianoRollSequenceBar";
import { Selection } from "ui/document/Selection";
import { CaretRightIcon, FXIcon, PlusIcon } from "ui/icons/Icons";
import useResizeObserver from "ui/hooks/use-resize-observer";
import l10n from "shared/lib/lang/l10n";
import {
  resolveAbsRow,
  toAbsRow,
  fromAbsRow,
} from "store/features/trackerDocument/trackerDocumentHelpers";
import renderPianoContextMenu from "components/music/contextMenus/renderPianoContextMenu";
import { useContextMenu } from "ui/hooks/use-context-menu";
import { PianoRollToolType } from "store/features/tracker/trackerState";
import { PatternCellAddress } from "shared/lib/uge/editor/types";
import { useMusicNotePreview } from "components/music/hooks/useMusicNotePreview";
import {
  BlurableDOMElement,
  InteractionState,
  PointerModifiers,
  SelectionRect,
  TwoFingerTapState,
} from "components/music/piano/types";
import { FixedSpacer } from "ui/spacing/Spacing";
import { PianoRollPlaybackController } from "./PianoRollPlaybackController";
import { PianoRollSustainOverlay } from "./PianoRollSustainOverlay";
import {
  useMusicMidiNoteSubscription,
  useMusicMidiState,
} from "components/music/midi/useMusicMidi";
import {
  createNoteDragPreviewStore,
  DragPreviewNotes,
  PastePreviewNotes,
} from "components/music/piano/PianoRollNotePreviews";
import { PATTERN_LENGTH } from "shared/lib/uge/mod2uge/constants";
import { useSelectAllShortcut } from "ui/hooks/use-select-all";

const TAP_MAX_MOVEMENT = 20;
const TWO_FINGER_TAP_MAX_DURATION = 300;
const NOTE_DRAG_MARGIN_PX = 20;
const DRAG_COMMIT_TAP_MAX_MOVEMENT = 5;

const emptySequence: SequenceItem[] = [];

const dragPreviewStore = createNoteDragPreviewStore();

export const SongPianoRoll = () => {
  const store = useAppStore();
  const dispatch = useAppDispatch();
  const playPreview = useMusicNotePreview();
  const midiState = useMusicMidiState();

  // Component Interaction State

  const interactionRef = useRef<InteractionState>({
    type: "idle",
    modifiers: { addToSelection: false, clone: false },
  });

  const twoFingerTapRef = useRef<TwoFingerTapState>({ type: "idle" });

  const [isDragging, setIsDragging] = useState(false);
  const [dragClone, setDragClone] = useState(false);

  const [selectionRect, setSelectionRect] = useState<
    SelectionRect | undefined
  >();

  const suppressNextContextMenuRef = useRef(false);
  const lastDragPreviewCellRef = useRef<string | null>(null);

  const activePointersRef = useRef<
    Map<
      number,
      {
        clientX: number;
        clientY: number;
        pointerType: string;
      }
    >
  >(new Map());

  const primaryPointerIdRef = useRef<number | null>(null);

  // DOM Refs

  const documentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
    null,
  );
  const [wrapperEl, wrapperSize] = useResizeObserver<HTMLDivElement>();

  // Redux State

  const sequence = useAppSelector(
    (state) => state.trackerDocument.present.song?.sequence ?? emptySequence,
  );

  const subpatternEditorFocus = useAppSelector(
    (state) => state.tracker.subpatternEditorFocus,
  );
  const pastedPattern = useAppSelector((state) => state.tracker.pastedPattern);

  const selectedChannel = useAppSelector(
    (state) => state.tracker.selectedChannel,
  );
  const visibleChannels = useAppSelector(
    (state) => state.tracker.visibleChannels,
  );

  const tool = useAppSelector((state) => state.tracker.tool);

  const toolRef = useRef(tool);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  const selectedInstrumentId = useAppSelector(
    (state) => state.tracker.selectedInstrumentId,
  );

  const documentWidth = useMemo(
    () => calculateDocumentWidth(sequence.length) + 100,
    [sequence.length],
  );
  const totalAbsRows = sequence.length * TRACKER_PATTERN_LENGTH;

  const playing = useAppSelector((state) => state.tracker.playing);

  const selectedSequenceId = useAppSelector((state) =>
    !playing ? state.tracker.selectedSequence : -1,
  );

  // Stable refs to access latest data within callbacks
  // without causing them to be regenerated on data changes

  const lastSelectedSequenceId = useRef(selectedSequenceId);
  const playingRef = useRef(playing);

  // Sync refs to contain latest data on changes
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // Cached State

  const displayChannels = useMemo(
    () =>
      [
        selectedChannel,
        ...visibleChannels.filter((c) => c !== selectedChannel),
      ].reverse(),
    [selectedChannel, visibleChannels],
  );

  // #region Helpers

  const updateActivePointer = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      activePointersRef.current.set(e.pointerId, {
        clientX: e.clientX,
        clientY: e.clientY,
        pointerType: e.pointerType,
      });
    },
    [],
  );

  const removeActivePointer = useCallback((pointerId: number) => {
    activePointersRef.current.delete(pointerId);

    if (primaryPointerIdRef.current === pointerId) {
      primaryPointerIdRef.current = null;
    }
  }, []);

  const getTouchPointers = useCallback(() => {
    return [...activePointersRef.current.entries()].filter(
      ([, pointer]) => pointer.pointerType === "touch",
    );
  }, []);

  const selectCellsInRange = useCallback(
    (
      selectedPatternCells: PatternCellAddress[],
      nextSelectionRect: SelectionRect,
    ) => {
      const state = store.getState();
      const song = state.trackerDocument.present.song;
      if (!song) {
        return [];
      }
      const totalAbsRows = song.sequence.length * TRACKER_PATTERN_LENGTH;
      const totalNoteRows = TOTAL_NOTES;

      const { from: rangeStartAbsRow, to: rangeEndAbsRow } =
        pixelRangeToGridRange(
          nextSelectionRect.x,
          nextSelectionRect.width,
          totalAbsRows,
        );

      const { from: fromNoteRow, to: toNoteRow } = pixelRangeToGridRange(
        nextSelectionRect.y,
        nextSelectionRect.height,
        totalNoteRows,
      );

      const selectedPatternCellMap = new Map(
        selectedPatternCells.map((cell) => [
          `${cell.sequenceId}:${cell.rowId}:${cell.channelId}`,
          cell,
        ]),
      );

      for (let absRow = rangeStartAbsRow; absRow < rangeEndAbsRow; absRow++) {
        const resolved = resolveAbsRow(song.sequence, absRow, selectedChannel);
        if (!resolved) {
          continue;
        }

        const cell = song.patterns[resolved.patternId]?.[resolved.rowId];

        if (!cell || cell.note === null) {
          continue;
        }

        const noteRow = noteToRow(cell.note);
        if (noteRow >= fromNoteRow && noteRow < toNoteRow) {
          const address: PatternCellAddress = {
            sequenceId: resolved.sequenceId,
            rowId: resolved.rowId,
            channelId: selectedChannel,
          };
          selectedPatternCellMap.set(
            `${address.sequenceId}:${address.rowId}:${address.channelId}`,
            address,
          );
        }
      }

      return [...selectedPatternCellMap.values()].sort((a, b) =>
        a.sequenceId !== b.sequenceId
          ? a.sequenceId - b.sequenceId
          : a.rowId !== b.rowId
            ? a.rowId - b.rowId
            : a.channelId - b.channelId,
      );
    },
    [store, selectedChannel],
  );

  const findNearbySelectedCell = useCallback(
    (clientX: number, clientY: number): PatternCellAddress | undefined => {
      if (!documentRef.current) {
        return undefined;
      }

      const state = store.getState();

      const rect = documentRef.current.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      const song = state.trackerDocument.present.song;
      if (!song) {
        return undefined;
      }

      const selectedCells = state.tracker.selectedPatternCells;

      for (const selectedCell of selectedCells) {
        if (selectedCell.channelId !== selectedChannel) {
          continue;
        }

        const patternId =
          song.sequence[selectedCell.sequenceId]?.channels[
            selectedCell.channelId
          ];
        const cell =
          patternId !== undefined
            ? song.patterns[patternId]?.[selectedCell.rowId]
            : undefined;

        if (!cell || cell.note === null) {
          continue;
        }

        const absRow = toAbsRow(selectedCell.sequenceId, selectedCell.rowId);
        const left = absRow * PIANO_ROLL_CELL_SIZE;
        const top = noteToRow(cell.note) * PIANO_ROLL_CELL_SIZE;

        if (
          localX >= left - NOTE_DRAG_MARGIN_PX &&
          localX < left + PIANO_ROLL_CELL_SIZE + NOTE_DRAG_MARGIN_PX &&
          localY >= top - NOTE_DRAG_MARGIN_PX &&
          localY < top + PIANO_ROLL_CELL_SIZE + NOTE_DRAG_MARGIN_PX
        ) {
          return selectedCell;
        }
      }

      return undefined;
    },
    [store, selectedChannel],
  );

  const calculatePositionFromClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const state = store.getState();
      const song = state.trackerDocument.present.song;

      if (!documentRef.current || !song) {
        return {
          noteIndex: null,
          patternRow: null,
          sequenceId: null,
        };
      }

      const rect = documentRef.current.getBoundingClientRect();
      const absRow = clamp(
        pixelToGridIndex(clientX - rect.left),
        0,
        totalAbsRows - 1,
      );
      const resolved = resolveAbsRow(song.sequence, absRow, selectedChannel);

      if (!resolved) {
        return {
          noteIndex: null,
          patternRow: null,
          sequenceId: null,
        };
      }

      const newNoteRow = pixelToGridIndex(clientY - rect.top);
      const newNote = rowToNote(newNoteRow);

      return {
        noteIndex: newNote,
        patternRow: resolved.rowId,
        sequenceId: resolved.sequenceId,
      };
    },
    [selectedChannel, store, totalAbsRows],
  );

  const resetPointerPreviewState = useCallback(() => {
    setSelectionRect(undefined);
    setIsDragging(false);
    setDragClone(false);
    dragPreviewStore.reset();
    lastDragPreviewCellRef.current = null;
  }, []);

  const selectClickedCell = useCallback(
    (clickedCellAddress: PatternCellAddress, addToSelection: boolean) => {
      const state = store.getState();
      const selectedPatternCells = state.tracker.selectedPatternCells;

      const isSelected = selectedPatternCells.some(
        (selectedCell) =>
          selectedCell.sequenceId === clickedCellAddress.sequenceId &&
          selectedCell.rowId === clickedCellAddress.rowId &&
          selectedCell.channelId === clickedCellAddress.channelId,
      );

      if (isSelected) {
        return;
      }

      if (addToSelection) {
        const selectedPatternCellMap = new Map(
          selectedPatternCells.map((selectedCell) => [
            `${selectedCell.sequenceId}:${selectedCell.rowId}:${selectedCell.channelId}`,
            selectedCell,
          ]),
        );

        selectedPatternCellMap.set(
          `${clickedCellAddress.sequenceId}:${clickedCellAddress.rowId}:${clickedCellAddress.channelId}`,
          clickedCellAddress,
        );

        dispatch(
          trackerActions.setSelectedPatternCells([
            ...selectedPatternCellMap.values(),
          ]),
        );
        return;
      }

      dispatch(trackerActions.setSelectedPatternCells([clickedCellAddress]));
    },
    [store, dispatch],
  );

  const beginDragNoteInteraction = useCallback(
    (
      absRow: number,
      note: number,
      modifiers: PointerModifiers,
      pointer: {
        clientX: number;
        clientY: number;
      },
      clickPlacement?: {
        cellAddress: PatternCellAddress;
        noteIndex: number;
      },
    ) => {
      interactionRef.current = {
        type: "dragNote",
        modifiers,
        origin: {
          absRow,
          note,
        },
        startPointer: pointer,
        delta: {
          rows: 0,
          notes: 0,
        },
        clickPlacement,
      };

      resetPointerPreviewState();
    },
    [resetPointerPreviewState],
  );

  const beginSelectionBoxInteraction = useCallback(
    (
      pageX: number,
      pageY: number,
      modifiers: PointerModifiers,
      selectedPatternCells: PatternCellAddress[],
    ) => {
      const state = store.getState();

      if (!documentRef.current) {
        return;
      }

      const song = state.trackerDocument.present.song;
      if (!song) {
        return;
      }

      const bounds = documentRef.current.getBoundingClientRect();

      const { x, y } = pageToSnappedGridPoint(
        pageX,
        pageY,
        bounds,
        song.sequence.length,
      );

      const newSelectionRect = {
        x,
        y,
        width: PIANO_ROLL_CELL_SIZE,
        height: PIANO_ROLL_CELL_SIZE,
      };

      const newSelectedPatterns = selectCellsInRange(
        modifiers.addToSelection ? selectedPatternCells : [],
        newSelectionRect,
      );

      interactionRef.current = {
        type: "selectionBox",
        modifiers,
        box: {
          origin: { x, y },
          rect: newSelectionRect,
        },
      };

      setSelectionRect(newSelectionRect);
      setIsDragging(false);
      setDragClone(false);
      dragPreviewStore.reset();
      lastDragPreviewCellRef.current = null;

      dispatch(trackerActions.setSelectedPatternCells(newSelectedPatterns));
    },
    [store, dispatch, selectCellsInRange],
  );

  const tryBeginNearbySelectedDrag = useCallback(
    (
      clickedCellAddress: PatternCellAddress,
      noteIndex: number,
      modifiers: PointerModifiers,
      clientX: number,
      clientY: number,
    ) => {
      const state = store.getState();
      const nearbySelectedCell = findNearbySelectedCell(clientX, clientY);

      if (!nearbySelectedCell) {
        return false;
      }

      const song = state.trackerDocument.present.song;
      if (!song) {
        return false;
      }

      const nearbyPatternId =
        song.sequence[nearbySelectedCell.sequenceId]?.channels[
          nearbySelectedCell.channelId
        ];
      const nearbyCell =
        nearbyPatternId !== undefined
          ? song.patterns[nearbyPatternId]?.[nearbySelectedCell.rowId]
          : undefined;

      if (nearbyCell?.note === null || nearbyCell?.note === undefined) {
        return false;
      }

      beginDragNoteInteraction(
        toAbsRow(nearbySelectedCell.sequenceId, nearbySelectedCell.rowId),
        nearbyCell.note,
        modifiers,
        { clientX, clientY },
        {
          cellAddress: clickedCellAddress,
          noteIndex,
        },
      );

      return true;
    },
    [store, beginDragNoteInteraction, findNearbySelectedCell],
  );

  const commitPastedPatternAt = useCallback(
    (sequenceId: number, patternRow: number, noteIndex: number) => {
      if (!pastedPattern) {
        return;
      }

      dispatch(
        trackerDocumentActions.commitPastedAbsoluteCells({
          pastedPattern,
          channelId: selectedChannel,
          startSequenceId: sequenceId,
          startRowId: patternRow,
          anchorNote: noteIndex,
        }),
      );

      dispatch(trackerActions.clearPastedPattern());
    },
    [dispatch, pastedPattern, selectedChannel],
  );

  const commitPlacedNote = useCallback(
    (
      args: {
        cellAddress: PatternCellAddress;
        noteIndex: number;
      },
      options?: {
        preview: boolean;
        select: boolean;
      },
    ) => {
      const state = store.getState();

      const { cellAddress, noteIndex } = args;
      const { sequenceId, rowId, channelId } = cellAddress;
      const shouldPreview = options?.preview ?? true;
      const shouldSelect = options?.select ?? true;

      const patternId =
        state.trackerDocument.present.song?.sequence[sequenceId]?.channels[
          channelId
        ];

      if (patternId === undefined) {
        return;
      }

      dispatch(
        trackerDocumentActions.editPatternCell({
          patternId,
          rowId,
          changes: {
            instrument: selectedInstrumentId,
            note: noteIndex,
          },
        }),
      );

      const currentPattern =
        state.trackerDocument.present.song?.patterns[patternId];
      const currentCell = currentPattern?.[rowId];

      if (shouldPreview) {
        playPreview({
          note: noteIndex,
          instrumentId: selectedInstrumentId,
          effectCode: currentCell?.effectCode ?? 0,
          effectParam: currentCell?.effectParam ?? 0,
        });
      }

      if (shouldSelect) {
        dispatch(trackerActions.setSelectedPatternCells([cellAddress]));
      }
    },
    [store, dispatch, playPreview, selectedInstrumentId],
  );

  const tryBeginExistingOrNearbyNoteDrag = useCallback(
    (args: {
      cell: PatternCell;
      noteIndex: number;
      sequenceId: number;
      patternRow: number;
      modifiers: PointerModifiers;
      clientX: number;
      clientY: number;
      addToSelection: boolean;
    }) => {
      const {
        cell,
        noteIndex,
        sequenceId,
        patternRow,
        modifiers,
        clientX,
        clientY,
        addToSelection,
      } = args;

      const absRow = toAbsRow(sequenceId, patternRow);

      const clickedCellAddress: PatternCellAddress = {
        sequenceId,
        rowId: patternRow,
        channelId: selectedChannel,
      };

      if (cell.note === noteIndex) {
        selectClickedCell(clickedCellAddress, addToSelection);

        beginDragNoteInteraction(absRow, cell.note, modifiers, {
          clientX,
          clientY,
        });

        return true;
      }

      const startedNearbyDrag = tryBeginNearbySelectedDrag(
        clickedCellAddress,
        noteIndex,
        modifiers,
        clientX,
        clientY,
      );

      return startedNearbyDrag;
    },
    [
      beginDragNoteInteraction,
      selectClickedCell,
      selectedChannel,
      tryBeginNearbySelectedDrag,
    ],
  );

  const stopTouch = useCallback(
    (e: PointerEvent | React.PointerEvent<HTMLDivElement>) => {
      const isTouch = e.pointerType === "touch";
      if (isTouch) {
        e.preventDefault();
      }
    },
    [],
  );

  // #endregion Helpers

  // #region Action Handlers

  const updatePianoHover = useCallback(
    (
      noteIndex: number,
      location?: {
        rowId: number | null;
        sequenceId: number | null;
      },
    ) => {
      const state = store.getState();
      const hoverColumn = state.tracker.hoverColumn;
      const hoverSequence = state.tracker.hoverSequence;

      dispatch(
        trackerActions.setHover({
          note: noteIndex,
          column: location?.rowId ?? hoverColumn,
          sequenceId: location?.sequenceId ?? hoverSequence,
        }),
      );
    },
    [store, dispatch],
  );

  const recordMidiNoteAtPlayhead = useCallback(
    (noteIndex: number) => {
      const state = store.getState();
      const currentSong = state.trackerDocument.present.song;

      if (!currentSong) {
        return false;
      }

      const quantizeSnap = state.tracker.quantizeSnap;
      const playbackSequence = state.tracker.playbackSequence;
      const playbackRow = state.tracker.playbackRow;
      let quantizedRow = playbackRow;
      let quantizedSequenceId = playbackSequence;
      if (quantizeSnap === "beat") {
        quantizedRow = 4 * Math.round(playbackRow / 4);
      } else if (quantizeSnap === "halfbeat") {
        quantizedRow = 2 * Math.round(playbackRow / 2);
      }

      if (quantizedRow >= PATTERN_LENGTH) {
        quantizedSequenceId++;
        quantizedRow = 0;
        if (quantizedSequenceId >= currentSong.sequence.length) {
          quantizedSequenceId = 0;
        }
      }

      const targetPosition = {
        sequenceId: quantizedSequenceId,
        rowId: quantizedRow,
      };

      const cellAddress: PatternCellAddress = {
        sequenceId: quantizedSequenceId,
        rowId: quantizedRow,
        channelId: selectedChannel,
      };

      commitPlacedNote(
        {
          cellAddress,
          noteIndex,
        },
        {
          preview: false,
          select: false,
        },
      );
      updatePianoHover(noteIndex, targetPosition);
      return true;
    },
    [commitPlacedNote, selectedChannel, store, updatePianoHover],
  );

  const transposeSelectedPianoNote = useCallback(
    (noteIndex: number) => {
      const state = store.getState();
      const selectedPatternCells = state.tracker.selectedPatternCells;

      if (selectedPatternCells.length !== 1) {
        return;
      }

      dispatch(
        trackerDocumentActions.editPatternCells({
          patternCells: selectedPatternCells,
          changes: {
            note: noteIndex,
          },
        }),
      );
    },
    [store, dispatch],
  );

  const onPianoNote = useCallback(
    (noteIndex: number) => {
      playPreview({
        note: noteIndex,
        instrumentId: selectedInstrumentId,
      });
      if (!playingRef.current) {
        transposeSelectedPianoNote(noteIndex);
      }
      updatePianoHover(noteIndex);
    },
    [
      playPreview,
      selectedInstrumentId,
      transposeSelectedPianoNote,
      updatePianoHover,
    ],
  );

  const onMidiPianoNote = useCallback(
    (noteIndex: number) => {
      playPreview({
        note: noteIndex,
        instrumentId: selectedInstrumentId,
      });

      if (playingRef.current) {
        if (midiState.recordingEnabled) {
          recordMidiNoteAtPlayhead(noteIndex);
        }
        updatePianoHover(noteIndex);
        return;
      }
      if (midiState.recordingEnabled) {
        transposeSelectedPianoNote(noteIndex);
      }
      updatePianoHover(noteIndex);
    },
    [
      midiState.recordingEnabled,
      playPreview,
      recordMidiNoteAtPlayhead,
      selectedInstrumentId,
      transposeSelectedPianoNote,
      updatePianoHover,
    ],
  );

  useMusicMidiNoteSubscription(onMidiPianoNote);

  const cycleSelectedTool = useCallback(() => {
    let nextTool: PianoRollToolType = "pencil";
    if (toolRef.current === "pencil") {
      nextTool = "eraser";
    } else if (toolRef.current === "eraser") {
      nextTool = "selection";
    }
    dispatch(trackerActions.setTool(nextTool));
  }, [dispatch]);

  const onAddSequence = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const state = store.getState();
      const song = state.trackerDocument.present.song;
      dispatch(
        trackerDocumentActions.insertSequence({
          sequenceIndex: song?.sequence.length ?? 0,
          position: "after",
        }),
      );
    },
    [store, dispatch],
  );

  const onJumpToSongStart = useCallback(() => {
    dispatch(
      trackerActions.setDefaultStartPlaybackPosition({
        sequence: 0,
        row: 0,
      }),
    );
    API.music.sendToMusicWindow({
      action: "position",
      position: { sequence: 0, row: 0 },
    });
  }, [dispatch]);

  // #endregion Action Handlers

  // #region SelectAll Event Handlers

  const onSelectAll = useCallback(() => {
    const state = store.getState();

    const song = state.trackerDocument.present.song;
    if (!song) {
      return;
    }

    const sequenceId = lastSelectedSequenceId.current;

    const selectedPatternCells = state.tracker.selectedPatternCells;

    if (selectedPatternCells.length <= 1) {
      const selectSequenceId =
        selectedPatternCells.length === 1
          ? selectedPatternCells[0].sequenceId
          : sequenceId;
      const patternId =
        song.sequence[selectSequenceId]?.channels[selectedChannel];
      const patternPatternCells: PatternCellAddress[] = (
        patternId !== undefined ? song.patterns[patternId] : []
      )
        .map((patternRow, rowId) =>
          patternRow.note !== null
            ? {
                sequenceId: selectSequenceId,
                rowId,
                channelId: selectedChannel,
              }
            : undefined,
        )
        .filter((addr) => addr !== undefined) as PatternCellAddress[];

      dispatch(trackerActions.setSelectedPatternCells(patternPatternCells));
    } else {
      const allPatternCells: PatternCellAddress[] = song.sequence
        .flatMap((sequenceItem, sequenceId) =>
          (song.patterns[sequenceItem.channels[selectedChannel]] ?? []).map(
            (patternRow, rowId) =>
              patternRow.note !== null
                ? {
                    sequenceId,
                    rowId,
                    channelId: selectedChannel,
                  }
                : undefined,
          ),
        )
        .filter((addr) => addr !== undefined) as PatternCellAddress[];

      dispatch(trackerActions.setSelectedPatternCells(allPatternCells));
    }

    const el = document.querySelector(":focus") as unknown as
      BlurableDOMElement | undefined;
    if (el && el.blur) {
      el.blur();
    }
  }, [store, dispatch, selectedChannel]);

  // Attach selectAll listeners
  useSelectAllShortcut({
    enabled: !subpatternEditorFocus,
    onSelectAll,
  });

  // #endregion SelectAll Event Handlers

  // #region Keyboard Event Handlers

  // Keyboard listeners
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (playingRef.current) {
        return;
      }

      interactionRef.current = {
        ...interactionRef.current,
        modifiers: {
          addToSelection: e.shiftKey,
          clone: e.altKey,
        },
      };

      if ((e.target as HTMLElement | null)?.nodeName !== "BODY") {
        return;
      }

      const state = store.getState();
      const selectedPatternCells = state.tracker.selectedPatternCells;

      if (e.ctrlKey && e.shiftKey) {
        if (e.code === "KeyQ") {
          dispatch(
            trackerDocumentActions.transposeAbsoluteCells({
              patternCells: selectedPatternCells,
              direction: "up",
              size: "octave",
            }),
          );
          return;
        }

        if (e.code === "KeyA") {
          dispatch(
            trackerDocumentActions.transposeAbsoluteCells({
              patternCells: selectedPatternCells,
              direction: "down",
              size: "octave",
            }),
          );
          return;
        }
      } else if (e.altKey && e.shiftKey) {
        if (e.code === "KeyQ") {
          dispatch(
            trackerDocumentActions.transposeAbsoluteCells({
              patternCells: selectedPatternCells,
              direction: "up",
              size: "note",
            }),
          );
          return;
        }

        if (e.code === "KeyA") {
          dispatch(
            trackerDocumentActions.transposeAbsoluteCells({
              patternCells: selectedPatternCells,
              direction: "down",
              size: "note",
            }),
          );
          return;
        }
      } else if (e.ctrlKey) {
        if (e.code === "KeyI") {
          dispatch(
            trackerDocumentActions.changeInstrumentAbsoluteCells({
              patternCells: selectedPatternCells,
              instrumentId: selectedInstrumentId,
            }),
          );
          return;
        }

        if (e.code === "KeyK") {
          dispatch(
            trackerDocumentActions.interpolateAbsoluteCells({
              patternCells: selectedPatternCells,
            }),
          );
          return;
        }

        return;
      } else if (e.metaKey) {
        return;
      }

      if (e.code === "Equal") {
        dispatch(
          trackerDocumentActions.transposeAbsoluteCells({
            patternCells: selectedPatternCells,
            direction: "up",
            size: e.shiftKey ? "octave" : "note",
          }),
        );
        return;
      }

      if (e.code === "Minus") {
        dispatch(
          trackerDocumentActions.transposeAbsoluteCells({
            patternCells: selectedPatternCells,
            direction: "down",
            size: e.shiftKey ? "octave" : "note",
          }),
        );
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        if (selectedPatternCells.length === 0) {
          return;
        }

        dispatch(
          trackerDocumentActions.clearAbsoluteCells({
            patternCells: selectedPatternCells,
          }),
        );
        dispatch(trackerActions.setSelectedPatternCells([]));
        return;
      }

      if (e.key === "Escape") {
        interactionRef.current = {
          type: "idle",
          modifiers: {
            addToSelection: e.shiftKey,
            clone: e.altKey,
          },
        };

        lastDragPreviewCellRef.current = null;
        setSelectionRect(undefined);
        setIsDragging(false);
        setDragClone(false);
        dragPreviewStore.reset();
        dispatch(trackerActions.setSelectedPatternCells([]));
        dispatch(trackerActions.clearPastedPattern());
      }
    },
    [store, dispatch, selectedInstrumentId],
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    interactionRef.current = {
      ...interactionRef.current,
      modifiers: {
        addToSelection: e.shiftKey,
        clone: e.altKey,
      },
    };
  }, []);

  // Attach keyboard listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // #endregion Keyboard Event Handlers

  // #region Clipboard Event Handlers

  const onCopy = useCallback(
    (e: ClipboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.nodeName === "INPUT") return;

      const state = store.getState();
      const selectedPatternCells = state.tracker.selectedPatternCells;

      dispatch(
        trackerDocumentActions.copyAbsoluteCells({
          patternCells: selectedPatternCells,
        }),
      );
    },
    [store, dispatch],
  );

  const onCut = useCallback(
    (e: ClipboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.nodeName === "INPUT") return;

      const state = store.getState();
      const selectedPatternCells = state.tracker.selectedPatternCells;

      dispatch(
        trackerDocumentActions.cutAbsoluteCells({
          patternCells: selectedPatternCells,
        }),
      );
    },
    [store, dispatch],
  );

  const onPaste = useCallback(() => {
    dispatch(trackerActions.pasteAbsoluteCells());
  }, [dispatch]);

  const onPasteInPlace = useCallback(() => {
    void dispatch(
      trackerDocumentActions.pasteInPlace({
        channelId: selectedChannel,
      }),
    );
  }, [dispatch, selectedChannel]);

  // Attach clipboard listeners
  useEffect(() => {
    if (subpatternEditorFocus) {
      return;
    }

    window.addEventListener("copy", onCopy);
    window.addEventListener("cut", onCut);
    window.addEventListener("paste", onPaste);

    const unsubscribePasteInPlace =
      API.events.menu.pasteInPlace.subscribe(onPasteInPlace);

    return () => {
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("cut", onCut);
      window.removeEventListener("paste", onPaste);
      unsubscribePasteInPlace();
    };
  }, [subpatternEditorFocus, onCopy, onCut, onPaste, onPasteInPlace]);

  // #endregion Clipboard Event Handlers

  // #region Tap Gestures

  const resetTwoFingerTapGesture = useCallback(() => {
    twoFingerTapRef.current = { type: "idle" };
  }, []);

  const handleTwoFingerGestureStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): boolean => {
      if (e.pointerType !== "touch") {
        return false;
      }

      const touchPointers = getTouchPointers();

      if (touchPointers.length === 2) {
        const [, touchA] = touchPointers[0];
        const [, touchB] = touchPointers[1];

        const midpointX = (touchA.clientX + touchB.clientX) * 0.5;
        const midpointY = (touchA.clientY + touchB.clientY) * 0.5;

        const previousGesture = twoFingerTapRef.current;
        const firstTouchMovedTooFar =
          previousGesture.type === "init"
            ? previousGesture.movedTooFar ||
              Math.hypot(
                touchA.clientX - previousGesture.startX,
                touchA.clientY - previousGesture.startY,
              ) > TAP_MAX_MOVEMENT
            : true;

        twoFingerTapRef.current = {
          type: "tracking",
          startedAt:
            previousGesture.type === "init"
              ? previousGesture.startedAt
              : Date.now(),
          startMidpointX: midpointX,
          startMidpointY: midpointY,
          movedTooFar: firstTouchMovedTooFar,
        };

        if (!firstTouchMovedTooFar) {
          primaryPointerIdRef.current = null;
          interactionRef.current = {
            type: "idle",
            modifiers: interactionRef.current.modifiers,
          };

          resetPointerPreviewState();
        }

        e.preventDefault();
        return true;
      }

      if (touchPointers.length === 1) {
        if (twoFingerTapRef.current.type === "idle") {
          const [, touchA] = touchPointers[0];

          twoFingerTapRef.current = {
            type: "init",
            startedAt: Date.now(),
            startX: touchA.clientX,
            startY: touchA.clientY,
            movedTooFar: false,
          };
        }

        return false;
      }

      resetTwoFingerTapGesture();
      return false;
    },
    [getTouchPointers, resetPointerPreviewState, resetTwoFingerTapGesture],
  );

  const handleTwoFingerGestureMove = useCallback(
    (e: PointerEvent): boolean => {
      if (e.pointerType !== "touch") {
        return false;
      }

      const gesture = twoFingerTapRef.current;

      if (gesture.type === "init") {
        const distance = Math.hypot(
          e.clientX - gesture.startX,
          e.clientY - gesture.startY,
        );

        if (distance > TAP_MAX_MOVEMENT) {
          twoFingerTapRef.current = {
            ...gesture,
            movedTooFar: true,
          };
        }

        return false;
      }

      if (gesture.type === "tracking") {
        const touchPointers = getTouchPointers();

        if (touchPointers.length !== 2) {
          twoFingerTapRef.current = {
            ...gesture,
            movedTooFar: true,
          };
          return true;
        }

        const [, touchA] = touchPointers[0];
        const [, touchB] = touchPointers[1];

        const midpointX = (touchA.clientX + touchB.clientX) * 0.5;
        const midpointY = (touchA.clientY + touchB.clientY) * 0.5;

        const deltaX = midpointX - gesture.startMidpointX;
        const deltaY = midpointY - gesture.startMidpointY;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance > TAP_MAX_MOVEMENT) {
          twoFingerTapRef.current = {
            ...gesture,
            movedTooFar: true,
          };
        }

        return true;
      }

      return false;
    },
    [getTouchPointers],
  );

  const handleTwoFingerGestureEnd = useCallback(
    (e: PointerEvent): boolean => {
      const gesture = twoFingerTapRef.current;

      if (gesture.type !== "tracking") {
        return false;
      }

      const remainingTouchCount = getTouchPointers().filter(
        ([pointerId]) => pointerId !== e.pointerId,
      ).length;

      const duration = Date.now() - gesture.startedAt;
      const isTwoFingerTap =
        !gesture.movedTooFar &&
        duration <= TWO_FINGER_TAP_MAX_DURATION &&
        remainingTouchCount < 2;

      resetTwoFingerTapGesture();
      removeActivePointer(e.pointerId);

      if (isTwoFingerTap) {
        cycleSelectedTool();
      }

      return true;
    },
    [
      cycleSelectedTool,
      getTouchPointers,
      removeActivePointer,
      resetTwoFingerTapGesture,
    ],
  );

  // #endregion Tap Gestures

  // #region Pointer Event Handlers

  const handlePencilStart = useCallback(
    (
      e: React.PointerEvent<HTMLDivElement>,
      ctx: {
        cell: PatternCell;
        noteIndex: number;
        patternRow: number;
        patternId: number;
        sequenceId: number;
        modifiers: PointerModifiers;
      },
    ) => {
      const { cell, noteIndex, patternId, patternRow, sequenceId, modifiers } =
        ctx;

      const isTouch = e.pointerType === "touch";
      const state = store.getState();
      const selectedPatternCells = state.tracker.selectedPatternCells;
      const absRow = toAbsRow(sequenceId, patternRow);

      const clickedCellAddress: PatternCellAddress = {
        sequenceId,
        rowId: patternRow,
        channelId: selectedChannel,
      };

      const startedDrag = tryBeginExistingOrNearbyNoteDrag({
        cell,
        noteIndex,
        sequenceId,
        patternRow,
        modifiers,
        clientX: e.clientX,
        clientY: e.clientY,
        addToSelection: false,
      });

      if (startedDrag) {
        stopTouch(e);
        return;
      }

      if (cell.note !== noteIndex && selectedPatternCells.length > 1) {
        dispatch(trackerActions.setSelectedPatternCells([]));
        interactionRef.current = {
          type: "idle",
          modifiers,
        };
        resetPointerPreviewState();
        return;
      }

      if (isTouch) {
        interactionRef.current = {
          type: "pendingNote",
          modifiers,
          startPoint: {
            x: e.clientX,
            y: e.clientY,
          },
          pending: {
            patternId,
            patternRow,
            sequenceId,
            absRow,
            noteIndex,
            clickedCellAddress,
          },
        };

        resetPointerPreviewState();
        stopTouch(e);
        return;
      }

      commitPlacedNote({
        cellAddress: clickedCellAddress,
        noteIndex,
      });

      interactionRef.current = {
        type: "paint",
        modifiers,
        lastPaintPosition: {
          absRow,
          note: noteIndex,
        },
      };

      setIsDragging(false);
      setDragClone(false);
      dragPreviewStore.reset();
      lastDragPreviewCellRef.current = `${absRow}:${noteIndex}`;
    },
    [
      store,
      dispatch,
      selectedChannel,
      tryBeginExistingOrNearbyNoteDrag,
      commitPlacedNote,
      stopTouch,
      resetPointerPreviewState,
    ],
  );

  const handleEraserStart = useCallback(
    (
      e: React.PointerEvent<HTMLDivElement>,
      ctx: {
        cell: PatternCell;
        noteIndex: number;
        patternRow: number;
        patternId: number;
        sequenceId: number;
        modifiers: PointerModifiers;
      },
    ) => {
      const { cell, noteIndex, patternId, sequenceId, patternRow, modifiers } =
        ctx;
      const isTouch = e.pointerType === "touch";

      const absRow = toAbsRow(sequenceId, patternRow);

      const clickedCellAddress: PatternCellAddress = {
        sequenceId,
        rowId: patternRow,
        channelId: selectedChannel,
      };

      if (cell.note === noteIndex) {
        if (!isTouch) {
          suppressNextContextMenuRef.current = true;
        }

        dispatch(
          trackerDocumentActions.editPatternCell({
            patternId,
            rowId: patternRow,
            changes: {
              instrument: null,
              note: null,
            },
          }),
        );

        dispatch(trackerActions.setSelectedPatternCells([clickedCellAddress]));
      }

      interactionRef.current = {
        type: "erase",
        modifiers,
        lastPaintPosition: {
          absRow,
          note: noteIndex,
        },
      };

      setIsDragging(false);
      setDragClone(false);
      dragPreviewStore.reset();
      lastDragPreviewCellRef.current = null;
      stopTouch(e);
      return;
    },
    [dispatch, selectedChannel, stopTouch],
  );

  const handleSelectionStart = useCallback(
    (
      e: React.PointerEvent<HTMLDivElement>,
      ctx: {
        cell: PatternCell;
        noteIndex: number;
        patternRow: number;
        sequenceId: number;
        modifiers: PointerModifiers;
      },
    ) => {
      const { cell, noteIndex, patternRow, sequenceId, modifiers } = ctx;

      const state = store.getState();
      const selectedPatternCells = state.tracker.selectedPatternCells;

      const startedDrag = tryBeginExistingOrNearbyNoteDrag({
        cell,
        noteIndex,
        sequenceId,
        patternRow,
        modifiers,
        clientX: e.clientX,
        clientY: e.clientY,
        addToSelection: modifiers.addToSelection,
      });

      if (startedDrag) {
        stopTouch(e);
        return;
      }

      beginSelectionBoxInteraction(
        e.pageX,
        e.pageY,
        modifiers,
        selectedPatternCells,
      );

      stopTouch(e);
    },
    [
      store,
      beginSelectionBoxInteraction,
      stopTouch,
      tryBeginExistingOrNearbyNoteDrag,
    ],
  );

  const handlePendingNoteMove = useCallback(
    (
      e: PointerEvent,
      interaction: Extract<InteractionState, { type: "pendingNote" }>,
    ) => {
      const movedDistance = Math.hypot(
        e.clientX - interaction.startPoint.x,
        e.clientY - interaction.startPoint.y,
      );

      if (movedDistance > TAP_MAX_MOVEMENT) {
        interactionRef.current = {
          type: "idle",
          modifiers: interaction.modifiers,
        };
      }

      e.preventDefault();
    },
    [],
  );

  const handleDragNoteMove = useCallback(
    (
      e: PointerEvent,
      interaction: Extract<InteractionState, { type: "dragNote" }>,
      ctx: {
        noteIndex: number;
        patternRow: number;
        sequenceId: number;
        modifiers: PointerModifiers;
      },
    ) => {
      const state = store.getState();

      const selectedPatternCells = state.tracker.selectedPatternCells;

      if (selectedPatternCells.length === 0) {
        stopTouch(e);
        return;
      }

      const { noteIndex, sequenceId, patternRow, modifiers } = ctx;

      const song = state.trackerDocument.present.song;
      if (!song) {
        return;
      }

      const absRow = toAbsRow(sequenceId, patternRow);
      const nextDragDelta = {
        rows: absRow - interaction.origin.absRow,
        notes: noteIndex - interaction.origin.note,
      };

      if (
        nextDragDelta.rows !== interaction.delta.rows ||
        nextDragDelta.notes !== interaction.delta.notes
      ) {
        interactionRef.current = {
          ...interaction,
          delta: nextDragDelta,
        };

        setIsDragging(true);
        setDragClone(modifiers.clone);
        dragPreviewStore.setSnapshot({
          rowDelta: nextDragDelta.rows,
          noteDelta: nextDragDelta.notes,
        });

        const previewCellId = `${absRow}:${noteIndex}`;

        const { sequenceId: originSequenceId, rowId: originRowId } = fromAbsRow(
          interaction.origin.absRow,
        );

        dispatch(
          trackerActions.setHover({
            note: noteIndex,
            column: patternRow,
            sequenceId,
          }),
        );

        const originPatternIndex =
          song.sequence[originSequenceId]?.channels[selectedChannel];
        const originPattern =
          originPatternIndex !== undefined
            ? song.patterns[originPatternIndex]
            : undefined;
        const selectedCell = originPattern?.[originRowId];
        const instrumentId = selectedCell?.instrument ?? 0;
        const effectCode = selectedCell?.effectCode ?? 0;
        const effectParam = selectedCell?.effectParam ?? 0;

        if (lastDragPreviewCellRef.current !== previewCellId) {
          playPreview({
            note: noteIndex,
            instrumentId,
            effectCode,
            effectParam,
          });
          lastDragPreviewCellRef.current = previewCellId;
        }
      }

      stopTouch(e);
    },
    [store, dispatch, playPreview, selectedChannel, stopTouch],
  );

  const handlePaintNoteMove = useCallback(
    (
      e: PointerEvent,
      interaction: Extract<InteractionState, { type: "paint" }>,
      ctx: {
        noteIndex: number;
        patternRow: number;
        sequenceId: number;
      },
    ) => {
      const state = store.getState();

      const { noteIndex, sequenceId, patternRow } = ctx;

      const song = state.trackerDocument.present.song;
      if (!song) {
        return;
      }

      const absRow = toAbsRow(sequenceId, patternRow);
      const currentCellId = `${absRow}:${noteIndex}`;

      if (lastDragPreviewCellRef.current !== currentCellId) {
        const prev = interaction.lastPaintPosition;
        lastDragPreviewCellRef.current = currentCellId;

        interactionRef.current = {
          ...interaction,
          lastPaintPosition: { absRow, note: noteIndex },
        };

        const cellsToPaint = interpolateGridLine(
          prev ? { absRow: prev.absRow, note: prev.note } : null,
          { absRow, note: noteIndex },
        );

        dispatch(
          trackerDocumentActions.paintAbsoluteCells({
            cells: cellsToPaint,
            channelId: selectedChannel,
            instrumentId: selectedInstrumentId,
          }),
        );

        const lastPainted = cellsToPaint[cellsToPaint.length - 1];
        if (lastPainted) {
          const resolved = resolveAbsRow(
            song.sequence,
            lastPainted.absRow,
            selectedChannel,
          );

          if (resolved) {
            dispatch(
              trackerActions.setSelectedPatternCells([
                {
                  sequenceId: resolved.sequenceId,
                  rowId: resolved.rowId,
                  channelId: selectedChannel,
                },
              ]),
            );

            const patternId =
              song.sequence[resolved.sequenceId]?.channels[selectedChannel];
            const pattern =
              patternId !== undefined ? song.patterns[patternId] : undefined;
            const cell = pattern?.[resolved.rowId];

            playPreview({
              note: lastPainted.note,
              instrumentId: selectedInstrumentId,
              effectCode: cell?.effectCode ?? 0,
              effectParam: cell?.effectParam ?? 0,
            });
          }
        }
      }

      stopTouch(e);
    },
    [
      store,
      dispatch,
      playPreview,
      selectedChannel,
      selectedInstrumentId,
      stopTouch,
    ],
  );

  const handleEraserMove = useCallback(
    (
      e: PointerEvent,
      interaction: Extract<InteractionState, { type: "erase" }>,
      ctx: {
        noteIndex: number;
        patternRow: number;
        sequenceId: number;
      },
    ) => {
      const { noteIndex, sequenceId, patternRow } = ctx;

      const absRow = toAbsRow(sequenceId, patternRow);
      const currentCellId = `${absRow}:${noteIndex}`;

      if (lastDragPreviewCellRef.current !== currentCellId) {
        const prev = interaction.lastPaintPosition;
        lastDragPreviewCellRef.current = currentCellId;

        interactionRef.current = {
          ...interaction,
          lastPaintPosition: { absRow, note: noteIndex },
        };

        const cellsToErase = interpolateGridLine(
          prev ? { absRow: prev.absRow, note: prev.note } : null,
          { absRow, note: noteIndex },
        );

        dispatch(
          trackerDocumentActions.eraseAbsoluteCells({
            cells: cellsToErase,
            channelId: selectedChannel,
          }),
        );
      }

      stopTouch(e);
    },
    [dispatch, selectedChannel, stopTouch],
  );

  const handleSelectionMove = useCallback(
    (
      e: PointerEvent,
      interaction: Extract<InteractionState, { type: "selectionBox" }>,
    ) => {
      const state = store.getState();

      if (!documentRef.current) {
        stopTouch(e);
        return;
      }

      const song = state.trackerDocument.present.song;
      if (!song) {
        return;
      }

      const bounds = documentRef.current.getBoundingClientRect();
      const { x: x2, y: y2 } = pageToSnappedGridPoint(
        e.pageX,
        e.pageY,
        bounds,
        song.sequence.length,
      );

      const x = Math.min(interaction.box.origin.x, x2);
      const y = Math.min(interaction.box.origin.y, y2);
      const width = Math.max(
        PIANO_ROLL_CELL_SIZE,
        Math.abs(interaction.box.origin.x - x2) + PIANO_ROLL_CELL_SIZE,
      );
      const height = Math.max(
        PIANO_ROLL_CELL_SIZE,
        Math.abs(interaction.box.origin.y - y2) + PIANO_ROLL_CELL_SIZE,
      );

      const nextSelectionRect = { x, y, width, height };

      // Selection box has changed from previous call
      // so update selected cells
      if (
        nextSelectionRect.x !== interaction.box.rect.x ||
        nextSelectionRect.y !== interaction.box.rect.y ||
        nextSelectionRect.width !== interaction.box.rect.width ||
        nextSelectionRect.height !== interaction.box.rect.height
      ) {
        interactionRef.current = {
          ...interaction,
          box: {
            ...interaction.box,
            rect: nextSelectionRect,
          },
        };

        setSelectionRect(nextSelectionRect);

        const selectedPatternCells = state.tracker.selectedPatternCells;

        const selectedCells = selectCellsInRange(
          interaction.modifiers.addToSelection ? selectedPatternCells : [],
          nextSelectionRect,
        );

        dispatch(trackerActions.setSelectedPatternCells(selectedCells));
      }

      stopTouch(e);
    },
    [store, dispatch, selectCellsInRange, stopTouch],
  );

  const handleDragNoteEnd = useCallback(
    (
      e: PointerEvent,
      interaction: Extract<InteractionState, { type: "dragNote" }>,
    ) => {
      const state = store.getState();
      const selectedPatternCells = state.tracker.selectedPatternCells;

      const hasGridMoved =
        interaction.delta.rows !== 0 || interaction.delta.notes !== 0;

      const hasPointerMoved =
        Math.hypot(
          e.clientX - interaction.startPointer.clientX,
          e.clientY - interaction.startPointer.clientY,
        ) > DRAG_COMMIT_TAP_MAX_MOVEMENT;

      const startedFromNearbyHit = interaction.clickPlacement !== undefined;

      const shouldMove = startedFromNearbyHit
        ? hasGridMoved && hasPointerMoved
        : hasGridMoved;

      const shouldPlaceFallbackNote =
        interaction.clickPlacement !== undefined &&
        toolRef.current !== "selection" &&
        !hasPointerMoved;

      if (shouldMove && selectedPatternCells.length > 0) {
        dispatch(
          trackerDocumentActions.moveAbsoluteCells({
            patternCells: selectedPatternCells,
            rowDelta: interaction.delta.rows,
            noteDelta: interaction.delta.notes,
            clone: interaction.modifiers.clone,
          }),
        );
      } else if (shouldPlaceFallbackNote && interaction.clickPlacement) {
        commitPlacedNote(interaction.clickPlacement);
      }
    },
    [store, commitPlacedNote, dispatch],
  );

  const handlePendingNoteEnd = useCallback(
    (
      e: PointerEvent,
      interaction: Extract<InteractionState, { type: "pendingNote" }>,
    ) => {
      const pending = interaction.pending;

      commitPlacedNote({
        cellAddress: pending.clickedCellAddress,
        noteIndex: pending.noteIndex,
      });

      lastDragPreviewCellRef.current = `${pending.absRow}:${pending.noteIndex}`;

      interactionRef.current = {
        type: "idle",
        modifiers: interaction.modifiers,
      };

      removeActivePointer(e.pointerId);
    },
    [commitPlacedNote, removeActivePointer],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = store.getState();

      suppressNextContextMenuRef.current = false;
      updateActivePointer(e);

      const isMouse = e.pointerType === "mouse";
      const tool = toolRef.current;

      if (handleTwoFingerGestureStart(e)) {
        return;
      }

      if (primaryPointerIdRef.current !== null) {
        return;
      }

      primaryPointerIdRef.current = e.pointerId;

      if (e.currentTarget.hasPointerCapture?.(e.pointerId) === false) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }

      const modifiers: PointerModifiers = {
        addToSelection: e.shiftKey,
        clone: e.altKey,
      };

      const isPrimaryAction = e.button === 0 || !isMouse;

      interactionRef.current = {
        ...interactionRef.current,
        modifiers,
      };

      const song = state.trackerDocument.present.song;
      if (!song) {
        stopTouch(e);
        return;
      }

      const { noteIndex, patternRow, sequenceId } =
        calculatePositionFromClientPoint(e.clientX, e.clientY);

      if (noteIndex === null || patternRow === null || sequenceId === null) {
        stopTouch(e);
        return;
      }

      dispatch(
        trackerActions.setHover({
          note: noteIndex,
          column: patternRow,
          sequenceId,
        }),
      );

      const patternId = song.sequence[sequenceId]?.channels[selectedChannel];
      const cell =
        patternId !== undefined
          ? song.patterns[patternId]?.[patternRow]
          : undefined;

      if (!cell) {
        return;
      }

      if (pastedPattern) {
        commitPastedPatternAt(sequenceId, patternRow, noteIndex);
        stopTouch(e);
        return;
      }

      if (tool === "pencil" && isPrimaryAction) {
        handlePencilStart(e, {
          cell,
          noteIndex,
          patternRow,
          patternId,
          sequenceId,
          modifiers,
        });
        return;
      }

      if ((toolRef.current === "eraser" && isPrimaryAction) || e.button === 2) {
        handleEraserStart(e, {
          cell,
          noteIndex,
          patternRow,
          patternId,
          sequenceId,
          modifiers,
        });
        return;
      }

      if (tool === "selection" && isPrimaryAction) {
        handleSelectionStart(e, {
          cell,
          noteIndex,
          patternRow,
          sequenceId,
          modifiers,
        });
        return;
      }
    },
    [
      store,
      calculatePositionFromClientPoint,
      commitPastedPatternAt,
      dispatch,
      handleEraserStart,
      handlePencilStart,
      handleSelectionStart,
      handleTwoFingerGestureStart,
      pastedPattern,
      selectedChannel,
      stopTouch,
      updateActivePointer,
    ],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const state = store.getState();

      if (playingRef.current) {
        return;
      }

      updateActivePointer(e);

      if (handleTwoFingerGestureMove(e)) {
        return;
      }

      const isTouch = e.pointerType === "touch";
      const interaction = interactionRef.current;

      if (
        primaryPointerIdRef.current !== e.pointerId &&
        !(e.pointerType === "mouse" && interaction.type === "idle")
      ) {
        return;
      }

      if (interaction.type === "pendingNote") {
        handlePendingNoteMove(e, interaction);
        return;
      }

      const modifiers: PointerModifiers = {
        addToSelection: e.shiftKey,
        clone: e.altKey,
      };

      interactionRef.current = {
        ...interactionRef.current,
        modifiers,
      };

      const { noteIndex, patternRow, sequenceId } =
        calculatePositionFromClientPoint(e.clientX, e.clientY);

      if (noteIndex === null || patternRow === null || sequenceId === null) {
        return;
      }

      const hoverColumn = state.tracker.hoverColumn;
      const hoverNote = state.tracker.hoverNote;
      const hoverSequence = state.tracker.hoverSequence;

      if (
        !isTouch &&
        (noteIndex !== hoverNote ||
          patternRow !== hoverColumn ||
          sequenceId !== hoverSequence)
      ) {
        if (scrollRef.current) {
          const rect = scrollRef.current.getBoundingClientRect();
          if (
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom
          ) {
            dispatch(
              trackerActions.setHover({
                note: noteIndex,
                column: patternRow,
                sequenceId,
              }),
            );
          }
        }
      }

      if (pastedPattern) {
        stopTouch(e);
        return;
      }

      const song = state.trackerDocument.present.song;
      if (!song) {
        return;
      }

      if (interaction.type === "dragNote") {
        handleDragNoteMove(e, interaction, {
          noteIndex,
          sequenceId,
          patternRow,
          modifiers,
        });
      } else if (interaction.type === "paint") {
        handlePaintNoteMove(e, interaction, {
          noteIndex,
          sequenceId,
          patternRow,
        });
      } else if (interaction.type === "erase") {
        handleEraserMove(e, interaction, {
          noteIndex,
          sequenceId,
          patternRow,
        });
      } else if (interaction.type === "selectionBox") {
        handleSelectionMove(e, interaction);
      }
    },
    [
      store,
      updateActivePointer,
      handleTwoFingerGestureMove,
      calculatePositionFromClientPoint,
      pastedPattern,
      handlePendingNoteMove,
      dispatch,
      stopTouch,
      handleDragNoteMove,
      handlePaintNoteMove,
      handleEraserMove,
      handleSelectionMove,
    ],
  );

  const onPointerEnd = useCallback(
    (e: PointerEvent) => {
      const state = store.getState();
      const interaction = interactionRef.current;
      const song = state.trackerDocument.present.song;

      try {
        if (!song) {
          return;
        }

        if (interaction.type === "dragNote") {
          handleDragNoteEnd(e, interaction);
          return;
        }

        if (
          interaction.type === "selectionBox" ||
          interaction.type === "paint" ||
          interaction.type === "erase"
        ) {
          return;
        }
      } finally {
        // Reset pointer interaction state
        interactionRef.current = {
          type: "idle",
          modifiers: {
            addToSelection: false,
            clone: false,
          },
        };

        setSelectionRect(undefined);
        setIsDragging(false);
        setDragClone(false);
        dragPreviewStore.reset();
        lastDragPreviewCellRef.current = null;
      }
    },
    [store, handleDragNoteEnd],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (handleTwoFingerGestureEnd(e)) {
        return;
      }

      if (primaryPointerIdRef.current !== e.pointerId) {
        removeActivePointer(e.pointerId);
        return;
      }

      const interaction = interactionRef.current;

      if (interaction.type === "pendingNote") {
        handlePendingNoteEnd(e, interaction);
        return;
      }

      onPointerEnd(e);
      removeActivePointer(e.pointerId);
    },
    [
      handlePendingNoteEnd,
      handleTwoFingerGestureEnd,
      onPointerEnd,
      removeActivePointer,
    ],
  );

  const onPointerCancel = useCallback(
    (e: PointerEvent) => {
      resetTwoFingerTapGesture();

      if (primaryPointerIdRef.current === e.pointerId) {
        onPointerEnd(e);
      }

      removeActivePointer(e.pointerId);
    },
    [onPointerEnd, removeActivePointer, resetTwoFingerTapGesture],
  );

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", onPointerUp, {
      passive: false,
    });
    window.addEventListener("pointercancel", onPointerCancel, {
      passive: false,
    });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [onPointerMove, onPointerUp, onPointerCancel]);

  // #endregion Pointer Events

  // #region Context Menu

  const getSelectionContextMenu = useCallback(() => {
    const state = store.getState();
    const selectedPatternCells = state.tracker.selectedPatternCells;
    return renderPianoContextMenu({
      dispatch,
      selectedPatternCells,
      channelId: selectedChannel,
      selectedInstrumentId,
    });
  }, [store, dispatch, selectedChannel, selectedInstrumentId]);

  const getSelectionContextMenuEnabled = useCallback(() => {
    return !suppressNextContextMenuRef.current;
  }, []);

  const {
    onContextMenu: onSelectionContextMenu,
    contextMenuElement: selectionContextMenuElement,
  } = useContextMenu({
    getIsEnabled: getSelectionContextMenuEnabled,
    getMenu: getSelectionContextMenu,
  });

  // #endregion Context Menu

  // #region Scroll Handling Effects

  // Scroll to center view on C5 on document load
  useEffect(() => {
    if (scrollRef.current) {
      const scrollRect = scrollRef.current.getBoundingClientRect();
      const halfViewHeight = scrollRect.height * 0.5;
      const c5Y = PIANO_ROLL_CELL_SIZE * OCTAVE_SIZE * 4;
      scrollRef.current.scrollTo({
        top: c5Y - halfViewHeight + 40,
      });
    }
  }, []);

  // Scroll to playhead while song is playing
  // On sequenceId change, smoothly scroll
  // to newly selected pattern
  useEffect(() => {
    if (
      !playing &&
      lastSelectedSequenceId.current !== -1 &&
      selectedSequenceId !== lastSelectedSequenceId.current &&
      scrollRef.current
    ) {
      const rect = scrollRef.current.getBoundingClientRect();
      const halfWidth = rect.width * 0.5;
      const patternWidth = TRACKER_PATTERN_LENGTH * PIANO_ROLL_CELL_SIZE;
      const patternX = calculatePlaybackTrackerPosition(selectedSequenceId, 0);
      const scrollLeft =
        rect.width < patternWidth
          ? patternX
          : patternX - halfWidth + patternWidth * 0.5;

      scrollRef.current.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
    lastSelectedSequenceId.current = selectedSequenceId;
  }, [selectedSequenceId, playing]);

  // #endregion Scroll Handling Effects

  const onScrollWrapperRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node;
      setScrollElement(node);
      wrapperEl.current = node;
    },
    [wrapperEl],
  );

  return (
    <StyledPianoRollWrapper>
      <StyledPianoRollScrollWrapper ref={onScrollWrapperRef}>
        <StyledPianoRollScrollCanvas>
          <div style={{ minWidth: PIANO_ROLL_PIANO_WIDTH + documentWidth }}>
            <PianoRollSequenceBar>
              <PianoRollPlaybackController
                scrollElement={scrollElement}
                sequenceLength={sequence.length}
              />
            </PianoRollSequenceBar>
            <StyledPianoRollScrollLeftWrapper>
              <StyledPianoRollScrollLeftHeaderSpacer
                onClick={onJumpToSongStart}
              />
              <PianoKeyboard onPlayNote={onPianoNote} />
              <StyledPianoRollScrollLeftFXSpacer>
                <FXIcon />
                <FixedSpacer width={5} />
                <CaretRightIcon />
              </StyledPianoRollScrollLeftFXSpacer>
            </StyledPianoRollScrollLeftWrapper>
            <StyledPianoRollScrollContentWrapper
              ref={documentRef}
              style={{
                width: documentWidth,
                cursor: isDragging ? (dragClone ? "copy" : "move") : "auto",
                touchAction: tool === "selection" ? "none" : "auto",
              }}
              onContextMenu={onSelectionContextMenu}
              onPointerDown={!playing ? onPointerDown : undefined}
            >
              <PianoRollSustainOverlay
                displayChannels={displayChannels}
                selectedChannel={selectedChannel}
                sequence={sequence}
              />
              <StyledPianoRollPatternsWrapper>
                {sequence.map((p, i) => (
                  <PianoRollPatternBlock
                    key={`roll_pattern_${i}:${p}`}
                    sequenceId={i}
                    displayChannels={displayChannels}
                    isDragging={isDragging}
                    playing={playing}
                    selectedChannel={selectedChannel}
                  />
                ))}
              </StyledPianoRollPatternsWrapper>
              <StyledAddPatternWrapper
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  height: (wrapperSize.height ?? 0) - 61,
                }}
              >
                <StyledAddPatternButton
                  onClick={onAddSequence}
                  title={l10n("FIELD_ADD_PATTERN")}
                >
                  <PlusIcon />
                </StyledAddPatternButton>
              </StyledAddPatternWrapper>
              {isDragging && (
                <DragPreviewNotes dragPreviewStore={dragPreviewStore} />
              )}
              <PastePreviewNotes />
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
              {sequence.map((p, i) => (
                <PianoRollEffectRow
                  key={`roll_pattern_effects_${i}:${p}`}
                  patternId={p.channels[selectedChannel]}
                  sequenceId={i}
                  channelId={selectedChannel}
                />
              ))}
            </StyledPianoRollScrollBottomWrapper>
          </div>
        </StyledPianoRollScrollCanvas>
        {selectionContextMenuElement}
      </StyledPianoRollScrollWrapper>
    </StyledPianoRollWrapper>
  );
};
