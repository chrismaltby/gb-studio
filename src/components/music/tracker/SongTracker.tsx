import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { PatternCell } from "shared/lib/uge/types";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { getKeys } from "renderer/lib/keybindings/keyBindings";
import trackerActions from "store/features/tracker/trackerActions";
import API from "renderer/lib/api";
import { useAppDispatch, useAppSelector, useAppStore } from "store/hooks";
import {
  StyledTrackerWrapper,
  StyledTrackerScrollWrapper,
  StyledTrackerScrollCanvas,
  StyledAddPatternWrapper,
  StyledAddPatternButton,
} from "./style";
import {
  buildSelectionRect,
  fieldToPosition,
  getFieldColumnFocus,
  normalizeFieldIndex,
} from "./helpers";
import renderTrackerContextMenu from "components/music/contextMenus/renderTrackerContextMenu";
import {
  OCTAVE_SIZE,
  TRACKER_CHANNEL_FIELDS,
  TRACKER_PATTERN_LENGTH,
  TRACKER_ROW_SIZE,
  TRACKER_UNDO,
  TRACKER_REDO,
} from "consts";
import { useContextMenu } from "ui/hooks/use-context-menu";
import { useMusicNotePreview } from "components/music/hooks/useMusicNotePreview";
import { VirtualTrackerKey } from "components/music/tracker/TrackerKeyboard";
import { SongTrackerPattern } from "components/music/tracker/SongTrackerPattern";
import { SongTrackerPlaybackController } from "components/music/tracker/SongTrackerPlaybackController";
import { SongTrackerNavigationController } from "components/music/tracker/SongTrackerNavigationController";
import { SongTrackerKeyboardContainer } from "components/music/tracker/SongTrackerKeyboardContainer";
import l10n from "shared/lib/lang/l10n";
import {
  useMusicMidiNoteSubscription,
  useMusicMidiState,
} from "components/music/midi/useMusicMidi";
import { PlusIcon } from "ui/icons/Icons";
import { useSelectAllShortcut } from "ui/hooks/use-select-all";
import {
  getPatternBlockCount,
  getSequenceChannelCell,
} from "store/features/trackerDocument/trackerDocumentHelpers";
import {
  getGlobalField,
  getLocalFieldFromGlobalField,
  getSequenceIdFromGlobalField,
  TrackerSelectionOrigin,
  TrackerSelectionRect,
} from "store/features/tracker/trackerHelpers";

type TrackerInput =
  { type: "keyboard"; code: string } | { type: "hex"; value: number | null };

const getTrackerSequenceId = ({
  trackerSelectionOrigin,
  trackerActiveField,
  selectedSequence,
}: {
  trackerSelectionOrigin?: TrackerSelectionOrigin;
  trackerActiveField?: number;
  selectedSequence: number;
}) =>
  trackerSelectionOrigin?.sequenceId ??
  (trackerActiveField !== undefined
    ? getSequenceIdFromGlobalField(trackerActiveField)
    : selectedSequence);

export const SongTracker = () => {
  const store = useAppStore();
  const dispatch = useAppDispatch();
  const playPreview = useMusicNotePreview();
  const midiState = useMusicMidiState();

  // #region Redux State

  const channelStatus = useAppSelector((state) => state.tracker.channelStatus);
  const octaveOffset = useAppSelector((state) => state.tracker.octaveOffset);
  const subpatternEditorFocus = useAppSelector(
    (state) => state.tracker.subpatternEditorFocus,
  );
  const showVirtualKeyboard = useAppSelector(
    (state) => state.tracker.showVirtualKeyboard,
  );
  const defaultStartPlaybackSequence = useAppSelector(
    (state) => state.tracker.defaultStartPlaybackSequence,
  );
  const defaultStartPlaybackRow = useAppSelector(
    (state) => state.tracker.defaultStartPlaybackRow,
  );
  const songSequence = useAppSelector(
    (state) => state.trackerDocument.present.song?.sequence,
  );
  const sequenceLength = useAppSelector(
    (state) => state.trackerDocument.present.song?.sequence.length ?? 0,
  );
  const numPatterns = useAppSelector((state) =>
    getPatternBlockCount(state.trackerDocument.present.song?.patterns),
  );

  // #endregion Redux State

  // #region DOM Refs

  const tableRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeFieldRef = useRef<HTMLSpanElement>(null);

  // #endregion DOM Refs

  // #region Stable Refs

  const isSelectingRef = useRef(false);
  const isMouseDownRef = useRef(false);
  const hasHadFocusRef = useRef(false);

  // #endregion Stable Refs

  // #region Derived State

  const soloChannel = useMemo(() => {
    const firstUnmuted = channelStatus.findIndex((x) => !x);
    const lastUnmuted = channelStatus.findLastIndex((x) => !x);

    if (firstUnmuted !== -1 && firstUnmuted === lastUnmuted) {
      return firstUnmuted;
    }

    return -1;
  }, [channelStatus]);

  // #endregion Derived State

  // #region Helpers

  const setTrackerGridState = useCallback(
    ({
      activeField,
      selectionOrigin,
      selectionRect,
    }: {
      activeField?: number;
      selectionOrigin?: TrackerSelectionOrigin;
      selectionRect?: TrackerSelectionRect;
    }) => {
      const state = store.getState();
      if (state.tracker.playing) {
        return;
      }

      dispatch(
        trackerActions.setTrackerGridState({
          activeField,
          selectionOrigin,
          selectionRect,
        }),
      );

      const currentSequenceId =
        activeField !== undefined
          ? getSequenceIdFromGlobalField(activeField)
          : state.tracker.selectedSequence;
      const loopSequenceId = state.tracker.loopSequenceId;
      const isFiltered =
        loopSequenceId !== undefined && loopSequenceId !== currentSequenceId;
      if (isFiltered) {
        dispatch(trackerActions.setLoopSequenceId(undefined));
      }
    },
    [dispatch, store],
  );

  const getMaxField = useCallback(() => {
    const state = store.getState();
    const currentSequenceLength =
      state.trackerDocument.present.song?.sequence.length ?? 0;
    return (
      currentSequenceLength * TRACKER_PATTERN_LENGTH * TRACKER_ROW_SIZE - 1
    );
  }, [store]);

  const clearSelection = useCallback(() => {
    const state = store.getState();
    const { trackerActiveField } = state.tracker;
    isSelectingRef.current = false;
    setTrackerGridState({
      activeField: trackerActiveField,
      selectionOrigin: undefined,
      selectionRect: undefined,
    });
  }, [setTrackerGridState, store]);

  const setSingleFieldSelection = useCallback(
    (field: number) => {
      const localField = getLocalFieldFromGlobalField(field);
      const fieldSequenceId = getSequenceIdFromGlobalField(field);

      setTrackerGridState({
        activeField: field,
        selectionOrigin: {
          ...fieldToPosition(localField),
          sequenceId: fieldSequenceId,
        },
        selectionRect: undefined,
      });
    },
    [setTrackerGridState],
  );

  const updateSelectionToField = useCallback(
    (field: number) => {
      const state = store.getState();
      const { trackerActiveField, trackerSelectionOrigin } = state.tracker;
      const origin = trackerSelectionOrigin;
      if (!origin) {
        return;
      }

      const fieldSequenceId = getSequenceIdFromGlobalField(field);
      if (fieldSequenceId !== origin.sequenceId) {
        return;
      }

      const localField = getLocalFieldFromGlobalField(field);
      setTrackerGridState({
        activeField: trackerActiveField,
        selectionOrigin: origin,
        selectionRect: buildSelectionRect(
          { x: origin.x, y: origin.y },
          localField,
        ),
      });
    },
    [setTrackerGridState, store],
  );

  const focusTable = useCallback(() => {
    tableRef.current?.focus({ preventScroll: true });
  }, []);

  const getCurrentPatternCellLocation = useCallback((field: number) => {
    const localField = getLocalFieldFromGlobalField(field);
    const rowId = Math.floor(localField / TRACKER_ROW_SIZE);
    const targetChannelId = Math.floor(localField / TRACKER_CHANNEL_FIELDS) % 4;

    return { rowId, channelId: targetChannelId };
  }, []);

  // #endregion Helpers

  // #region Pattern Editing Helpers

  const editPatternCell = useCallback(
    (changes: Partial<PatternCell>) => {
      const state = store.getState();
      const editingField = state.tracker.trackerActiveField;
      const maxField = getMaxField();
      const song = state.trackerDocument.present.song;

      if (editingField === undefined || editingField > maxField) {
        return;
      }

      const currentSequenceId = getSequenceIdFromGlobalField(editingField);
      const { rowId, channelId: targetChannelId } =
        getCurrentPatternCellLocation(editingField);
      const currentPatternId =
        song?.sequence?.[currentSequenceId]?.channels[targetChannelId];
      const currentCell = song
        ? getSequenceChannelCell(
            song,
            currentSequenceId,
            targetChannelId,
            rowId,
          )?.cell
        : null;

      if (currentPatternId === undefined) {
        return;
      }

      dispatch(
        trackerDocumentActions.editPatternCell({
          patternId: currentPatternId,
          rowId,
          changes,
        }),
      );

      if (!currentCell) {
        return;
      }

      const newCell: PatternCell = {
        ...currentCell,
        ...changes,
      };

      if (newCell.note === null) {
        return;
      }

      playPreview({
        note: newCell.note,
        instrumentId: newCell.instrument ?? 0,
        effectCode: newCell.effectCode ?? 0,
        effectParam: newCell.effectParam ?? 0,
      });
    },
    [dispatch, getCurrentPatternCellLocation, getMaxField, playPreview, store],
  );

  const editNoteField = useCallback(
    (value: number | null) => {
      const state = store.getState();
      const editingField = state.tracker.trackerActiveField;
      const currentOctaveOffset = state.tracker.octaveOffset;
      const currentEditStep = state.tracker.editStep;
      const maxField = getMaxField();

      if (editingField === undefined || editingField > maxField) {
        return;
      }

      const fieldOffset = editingField % TRACKER_ROW_SIZE;
      const maxChannelField = maxField - TRACKER_ROW_SIZE + 1 + fieldOffset;

      const newNote =
        value === null ? null : value + currentOctaveOffset * OCTAVE_SIZE;

      if (value === null) {
        editPatternCell({ note: null });
        return;
      }

      editPatternCell({
        note: newNote,
        instrument: state.tracker.selectedInstrumentId,
      });

      const nextField = Math.min(
        editingField + TRACKER_ROW_SIZE * currentEditStep,
        maxChannelField,
      );

      setSingleFieldSelection(nextField);
    },
    [editPatternCell, getMaxField, setSingleFieldSelection, store],
  );

  const editInstrumentField = useCallback(
    (value: number | null) => {
      const el = activeFieldRef.current;
      if (!el) {
        return;
      }

      let newValue = value;

      if (
        value !== null &&
        value <= 9 &&
        el.innerText !== ".." &&
        el.innerText !== "15"
      ) {
        newValue = 10 * parseInt(el.innerText[1], 10) + value;
        if (newValue > 15) {
          newValue = 15;
        }
      }

      editPatternCell({
        instrument: newValue === null ? null : newValue - 1,
      });
    },
    [editPatternCell],
  );

  const editEffectCodeField = useCallback(
    (value: number | null) => {
      editPatternCell({ effectCode: value });
    },
    [editPatternCell],
  );

  const editEffectParamField = useCallback(
    (value: number | null) => {
      const el = activeFieldRef.current;
      if (!el) {
        return;
      }

      let newValue = value;

      if (value !== null && el.innerText !== "..") {
        newValue = 16 * parseInt(el.innerText[1], 16) + value;
      }

      editPatternCell({ effectParam: newValue });
    },
    [editPatternCell],
  );

  const applyTrackerInput = useCallback(
    (input: TrackerInput) => {
      const state = store.getState();
      const { trackerActiveField: currentActiveField } = state.tracker;
      if (currentActiveField === undefined) {
        return false;
      }

      const focus = getFieldColumnFocus(
        getLocalFieldFromGlobalField(currentActiveField),
      );

      if (!focus) {
        return false;
      }

      if (input.type === "keyboard") {
        getKeys(input.code, focus, {
          editNoteField,
          editInstrumentField,
          editEffectCodeField,
          editEffectParamField,
        });
        return true;
      }

      if (focus === "noteColumnFocus") {
        editNoteField(input.value);
        return true;
      }

      if (focus === "instrumentColumnFocus") {
        editInstrumentField(input.value);
        return true;
      }

      if (focus === "effectCodeColumnFocus") {
        editEffectCodeField(input.value);
        return true;
      }

      if (focus === "effectParamColumnFocus") {
        editEffectParamField(input.value);
        return true;
      }

      return false;
    },
    [
      editEffectCodeField,
      editEffectParamField,
      editInstrumentField,
      editNoteField,
      store,
    ],
  );

  // #endregion Pattern Editing Helpers

  // #region Navigation Helpers

  const moveActiveField = useCallback(
    (direction: "up" | "down" | "left" | "right", extendSelection: boolean) => {
      const state = store.getState();
      const { trackerActiveField, trackerSelectionOrigin } = state.tracker;
      const currentSequenceLength =
        state.trackerDocument.present.song?.sequence.length ?? 0;

      if (trackerActiveField === undefined || currentSequenceLength <= 0) {
        return false;
      }

      const currentSequenceId =
        getSequenceIdFromGlobalField(trackerActiveField);
      const currentLocalField =
        getLocalFieldFromGlobalField(trackerActiveField);
      const currentPos = fieldToPosition(currentLocalField);

      let nextSequenceId = currentSequenceId;
      let nextX = currentPos.x;
      let nextY = currentPos.y;

      if (direction === "left") {
        if (currentPos.x > 0) {
          nextX -= 1;
        } else if (currentPos.y > 0) {
          nextX = TRACKER_ROW_SIZE - 1;
          nextY -= 1;
        } else if (currentSequenceId > 0) {
          nextSequenceId -= 1;
          nextX = TRACKER_ROW_SIZE - 1;
          nextY = TRACKER_PATTERN_LENGTH - 1;
        } else {
          nextSequenceId = currentSequenceLength - 1;
          nextX = TRACKER_ROW_SIZE - 1;
          nextY = TRACKER_PATTERN_LENGTH - 1;
        }
      } else if (direction === "right") {
        if (currentPos.x < TRACKER_ROW_SIZE - 1) {
          nextX += 1;
        } else if (currentPos.y < TRACKER_PATTERN_LENGTH - 1) {
          nextX = 0;
          nextY += 1;
        } else if (currentSequenceId < currentSequenceLength - 1) {
          nextSequenceId += 1;
          nextX = 0;
          nextY = 0;
        } else {
          nextSequenceId = 0;
          nextX = 0;
          nextY = 0;
        }
      } else if (direction === "up") {
        if (currentPos.y > 0) {
          nextY -= 1;
        } else if (currentSequenceId > 0) {
          nextSequenceId -= 1;
          nextY = TRACKER_PATTERN_LENGTH - 1;
        } else {
          nextSequenceId = currentSequenceLength - 1;
          nextY = TRACKER_PATTERN_LENGTH - 1;
        }
      } else if (direction === "down") {
        if (currentPos.y < TRACKER_PATTERN_LENGTH - 1) {
          nextY += 1;
        } else if (currentSequenceId < currentSequenceLength - 1) {
          nextSequenceId += 1;
          nextY = 0;
        } else {
          nextSequenceId = 0;
          nextY = 0;
        }
      }

      const newLocalField = normalizeFieldIndex(
        nextY * TRACKER_ROW_SIZE + nextX,
      );
      const newActiveField = getGlobalField(nextSequenceId, newLocalField);

      if (
        extendSelection &&
        trackerSelectionOrigin &&
        trackerSelectionOrigin.sequenceId === nextSequenceId
      ) {
        if (!isSelectingRef.current) {
          isSelectingRef.current = true;
        }

        const origin =
          trackerSelectionOrigin.sequenceId === currentSequenceId
            ? trackerSelectionOrigin
            : {
                ...currentPos,
                sequenceId: currentSequenceId,
              };

        setTrackerGridState({
          activeField: newActiveField,
          selectionOrigin: origin,
          selectionRect: buildSelectionRect(
            { x: origin.x, y: origin.y },
            newLocalField,
          ),
        });
      } else {
        setTrackerGridState({
          activeField: newActiveField,
          selectionOrigin: {
            x: nextX,
            y: nextY,
            sequenceId: nextSequenceId,
          },
          selectionRect: undefined,
        });
      }

      return true;
    },
    [setTrackerGridState, store],
  );

  // #endregion Navigation Helpers

  // #region Action Handlers

  const onAddSequence = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const state = store.getState();
      dispatch(
        trackerDocumentActions.insertSequence({
          sequenceIndex:
            state.trackerDocument.present.song?.sequence.length ?? 0,
          position: "after",
        }),
      );
    },
    [dispatch, store],
  );

  const onFocus = useCallback(() => {
    const state = store.getState();
    const { trackerActiveField, selectedSequence } = state.tracker;
    if (trackerActiveField === undefined) {
      const firstField = getGlobalField(selectedSequence, 0);
      setTrackerGridState({
        activeField: firstField,
        selectionOrigin: {
          x: 0,
          y: 0,
          sequenceId: selectedSequence,
        },
        selectionRect: undefined,
      });
    }

    hasHadFocusRef.current = true;
  }, [setTrackerGridState, store]);

  const onSelectAll = useCallback(() => {
    const state = store.getState();
    const {
      trackerSelectionRect,
      trackerActiveField,
      selectedSequence,
      selectedChannel,
    } = state.tracker;
    const noSelection =
      !trackerSelectionRect ||
      trackerSelectionRect.width === 0 ||
      trackerSelectionRect.height === 0;

    const currentSequenceId =
      trackerActiveField !== undefined
        ? getSequenceIdFromGlobalField(trackerActiveField)
        : selectedSequence;

    if (noSelection) {
      const offset = TRACKER_CHANNEL_FIELDS * selectedChannel;
      setTrackerGridState({
        activeField: trackerActiveField,
        selectionOrigin: { x: offset, y: 0, sequenceId: currentSequenceId },
        selectionRect: {
          x: offset,
          y: 0,
          width: 3,
          height: TRACKER_PATTERN_LENGTH - 1,
        },
      });
      return;
    }

    setTrackerGridState({
      activeField: trackerActiveField,
      selectionOrigin: { x: 0, y: 0, sequenceId: currentSequenceId },
      selectionRect: {
        x: 0,
        y: 0,
        width: TRACKER_ROW_SIZE - 1,
        height: TRACKER_PATTERN_LENGTH - 1,
      },
    });
  }, [setTrackerGridState, store]);

  // #endregion Action Handlers

  // #region Mouse Event Handlers

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) {
        return;
      }

      if (e.button > 1) {
        return;
      }

      const fieldId = e.target.dataset.fieldid;
      const fieldSequenceId = e.target.dataset.sequenceid;
      const rowId = e.target.dataset.row;
      const rowSequenceId = e.target.dataset.sequenceid;

      if (fieldId !== undefined && fieldSequenceId !== undefined) {
        const parsedField = parseInt(fieldId, 10);
        const parsedSequenceId = parseInt(fieldSequenceId, 10);
        const normalizedField = normalizeFieldIndex(parsedField);
        const globalField = getGlobalField(parsedSequenceId, normalizedField);

        isMouseDownRef.current = true;

        const state = store.getState();
        const { trackerSelectionOrigin, trackerSelectionRect } = state.tracker;

        if (
          e.shiftKey &&
          trackerSelectionOrigin?.sequenceId === parsedSequenceId
        ) {
          isSelectingRef.current = true;
          setTrackerGridState({
            activeField: globalField,
            selectionOrigin: trackerSelectionOrigin,
            selectionRect: trackerSelectionRect,
          });
          updateSelectionToField(globalField);
          focusTable();
          return;
        }

        isSelectingRef.current = false;
        setSingleFieldSelection(globalField);
        focusTable();
        return;
      }

      if (rowId !== undefined && rowSequenceId !== undefined) {
        const row = parseInt(rowId, 10);
        const parsedSequenceId = parseInt(rowSequenceId, 10);

        dispatch(
          trackerActions.setDefaultStartPlaybackPosition({
            sequence: parsedSequenceId,
            row,
          }),
        );

        API.music.sendToMusicWindow({
          action: "position",
          position: {
            sequence: parsedSequenceId,
            row,
          },
        });
      }
    },
    [
      dispatch,
      focusTable,
      setSingleFieldSelection,
      setTrackerGridState,
      store,
      updateSelectionToField,
    ],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isMouseDownRef.current) {
        return;
      }

      if (!(e.target instanceof HTMLElement)) {
        return;
      }

      const fieldId = e.target.dataset.fieldid;
      const fieldSequenceId = e.target.dataset.sequenceid;

      if (fieldId === undefined || fieldSequenceId === undefined) {
        return;
      }

      const parsedField = parseInt(fieldId, 10);
      const parsedSequenceId = parseInt(fieldSequenceId, 10);
      const normalizedField = normalizeFieldIndex(parsedField);
      const globalField = getGlobalField(parsedSequenceId, normalizedField);

      updateSelectionToField(globalField);
    },
    [updateSelectionToField],
  );

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (e.button > 1) {
      return;
    }

    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      isSelectingRef.current = false;
    }
  }, []);

  // #endregion Mouse Event Handlers

  // #region Keyboard Event Handlers

  const handleStructureKey = useCallback(
    (e: KeyboardEvent) => {
      const state = store.getState();
      const {
        trackerActiveField: currentActiveField,
        selectedTrackerFields: currentSelectedTrackerFields,
        selectedSequence,
        selectedPatternCells,
        selectedInstrumentId,
      } = state.tracker;
      const currentSequenceId =
        currentActiveField !== undefined
          ? getSequenceIdFromGlobalField(currentActiveField)
          : selectedSequence;

      if (e.key === "Escape") {
        e.preventDefault();
        clearSelection();
        return true;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        if ((e.shiftKey || e.ctrlKey) && currentActiveField !== undefined) {
          e.preventDefault();
          dispatch(
            trackerDocumentActions.shiftTrackerFields({
              sequenceId: currentSequenceId,
              selectedTrackerFields: currentSelectedTrackerFields,
              direction: "delete",
            }),
          );
          return true;
        }

        if (currentSelectedTrackerFields.length > 0) {
          e.preventDefault();
          dispatch(
            trackerDocumentActions.clearTrackerFields({
              sequenceId: currentSequenceId,
              selectedTrackerFields: currentSelectedTrackerFields,
            }),
          );
          return true;
        }
      }

      if (e.key === "Insert" || e.key === "Enter") {
        if (currentActiveField !== undefined) {
          e.preventDefault();
          dispatch(
            trackerDocumentActions.shiftTrackerFields({
              sequenceId: currentSequenceId,
              selectedTrackerFields: currentSelectedTrackerFields,
              direction: "insert",
            }),
          );
          return true;
        }
      }

      if (e.code === "Equal") {
        e.preventDefault();

        if (e.shiftKey) {
          dispatch(
            trackerDocumentActions.transposeAbsoluteCells({
              patternCells: selectedPatternCells,
              direction: "up",
              size: "octave",
            }),
          );
        } else {
          dispatch(
            trackerDocumentActions.transposeTrackerFields({
              sequenceId: currentSequenceId,
              selectedTrackerFields: currentSelectedTrackerFields,
              direction: "up",
            }),
          );
        }

        return true;
      }

      if (e.code === "Minus") {
        e.preventDefault();

        if (e.shiftKey) {
          dispatch(
            trackerDocumentActions.transposeAbsoluteCells({
              patternCells: selectedPatternCells,
              direction: "down",
              size: "octave",
            }),
          );
        } else {
          dispatch(
            trackerDocumentActions.transposeTrackerFields({
              sequenceId: currentSequenceId,
              selectedTrackerFields: currentSelectedTrackerFields,
              direction: "down",
            }),
          );
        }

        return true;
      }

      if (e.ctrlKey && e.shiftKey) {
        if (e.code === "KeyQ") {
          dispatch(
            trackerDocumentActions.transposeAbsoluteCells({
              patternCells: selectedPatternCells,
              direction: "up",
              size: "octave",
            }),
          );
          return true;
        }

        if (e.code === "KeyA") {
          dispatch(
            trackerDocumentActions.transposeAbsoluteCells({
              patternCells: selectedPatternCells,
              direction: "down",
              size: "octave",
            }),
          );
          return true;
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
          return true;
        }

        if (e.code === "KeyA") {
          dispatch(
            trackerDocumentActions.transposeAbsoluteCells({
              patternCells: selectedPatternCells,
              direction: "down",
              size: "note",
            }),
          );
          return true;
        }
      } else if (e.ctrlKey) {
        if (e.code === "KeyI") {
          dispatch(
            trackerDocumentActions.changeInstrumentAbsoluteCells({
              patternCells: selectedPatternCells,
              instrumentId: selectedInstrumentId,
            }),
          );
          return true;
        }

        if (e.code === "KeyK") {
          dispatch(
            trackerDocumentActions.interpolateAbsoluteCells({
              patternCells: selectedPatternCells,
            }),
          );
          return true;
        }
      }

      return false;
    },
    [clearSelection, dispatch, store],
  );

  const handleNavigationKey = useCallback(
    (e: KeyboardEvent) => {
      const direction =
        e.key === "ArrowLeft"
          ? "left"
          : e.key === "ArrowRight"
            ? "right"
            : e.key === "ArrowUp"
              ? "up"
              : e.key === "ArrowDown"
                ? "down"
                : null;

      if (!direction) {
        return false;
      }

      const handled = moveActiveField(direction, e.shiftKey);

      if (handled) {
        e.preventDefault();
      }

      return handled;
    },
    [moveActiveField],
  );

  const handleEditKey = useCallback(
    (e: KeyboardEvent) => {
      const state = store.getState();
      if (state.tracker.trackerActiveField === undefined) {
        return false;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) {
        return false;
      }

      return applyTrackerInput({
        type: "keyboard",
        code: e.code,
      });
    },
    [applyTrackerInput, store],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target !== tableRef.current) {
        return;
      }

      if (handleStructureKey(e)) {
        return;
      }

      if (handleNavigationKey(e)) {
        return;
      }

      handleEditKey(e);
    },
    [handleEditKey, handleNavigationKey, handleStructureKey],
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!e.shiftKey) {
      isSelectingRef.current = false;
    }
  }, []);

  // #endregion Keyboard Event Handlers

  // #region Wheel Event Handlers

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey) {
        return;
      }

      e.preventDefault();

      const state = store.getState();
      const {
        selectedPatternCells,
        selectedTrackerFields,
        trackerSelectionOrigin,
        trackerActiveField,
        selectedSequence,
      } = state.tracker;
      const delta = e.deltaY === 0 ? e.deltaX : e.deltaY;
      if (e.shiftKey) {
        if (delta < 0) {
          dispatch(
            trackerDocumentActions.transposeAbsoluteCells({
              patternCells: selectedPatternCells,
              direction: "up",
              size: "octave",
            }),
          );
          return;
        }

        if (delta > 0) {
          dispatch(
            trackerDocumentActions.transposeAbsoluteCells({
              patternCells: selectedPatternCells,
              direction: "down",
              size: "octave",
            }),
          );
          return;
        }

        return;
      }

      if (delta < 0) {
        dispatch(
          trackerDocumentActions.transposeTrackerFields({
            sequenceId: getTrackerSequenceId({
              trackerSelectionOrigin,
              trackerActiveField,
              selectedSequence,
            }),
            selectedTrackerFields,
            direction: "up",
          }),
        );
        return;
      }

      if (delta > 0) {
        dispatch(
          trackerDocumentActions.transposeTrackerFields({
            sequenceId: getTrackerSequenceId({
              trackerSelectionOrigin,
              trackerActiveField,
              selectedSequence,
            }),
            selectedTrackerFields,
            direction: "down",
          }),
        );
      }
    },
    [dispatch, store],
  );

  // #endregion Wheel Event Handlers

  // #region Clipboard Event Handlers

  const onCopy = useCallback(
    (e: ClipboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.nodeName === "INPUT") return;

      const state = store.getState();
      const {
        selectedTrackerFields,
        trackerSelectionOrigin,
        trackerActiveField,
        selectedSequence,
      } = state.tracker;
      if (selectedTrackerFields.length === 0) {
        return;
      }

      e.preventDefault();
      dispatch(
        trackerDocumentActions.copyTrackerFields({
          sequenceId: getTrackerSequenceId({
            trackerSelectionOrigin,
            trackerActiveField,
            selectedSequence,
          }),
          selectedTrackerFields,
        }),
      );
    },
    [dispatch, store],
  );

  const onCut = useCallback(
    (e: ClipboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.nodeName === "INPUT") return;

      const state = store.getState();
      const {
        selectedTrackerFields,
        trackerSelectionOrigin,
        trackerActiveField,
        selectedSequence,
      } = state.tracker;
      if (selectedTrackerFields.length === 0) {
        return;
      }

      e.preventDefault();
      dispatch(
        trackerDocumentActions.cutTrackerFields({
          sequenceId: getTrackerSequenceId({
            trackerSelectionOrigin,
            trackerActiveField,
            selectedSequence,
          }),
          selectedTrackerFields,
        }),
      );
    },
    [dispatch, store],
  );

  const onPaste = useCallback(
    async (e: ClipboardEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.nodeName === "INPUT") return;

      const state = store.getState();
      const {
        selectedTrackerFields,
        trackerSelectionOrigin,
        trackerActiveField,
        selectedSequence,
      } = state.tracker;
      const firstField = selectedTrackerFields[0];

      if (firstField === undefined) {
        return;
      }

      e.preventDefault();

      await dispatch(
        trackerDocumentActions.pasteTrackerFields({
          sequenceId: getTrackerSequenceId({
            trackerSelectionOrigin,
            trackerActiveField,
            selectedSequence,
          }),
          startField: firstField,
        }),
      );
    },
    [dispatch, store],
  );

  // #endregion Clipboard Event Handlers

  // #region Virtual Keyboard Handlers

  const handleVirtualKeyPressed = useCallback(
    (virtualKey: VirtualTrackerKey) => {
      const state = store.getState();
      const {
        trackerActiveField,
        selectedSequence,
        selectedPatternCells,
        selectedTrackerFields,
        trackerSelectionOrigin,
      } = state.tracker;

      if (trackerActiveField === undefined) {
        const firstField = getGlobalField(selectedSequence, 0);
        setSingleFieldSelection(firstField);
      }

      if (virtualKey.type === "navigation") {
        moveActiveField(virtualKey.direction, virtualKey.shiftKey);
        focusTable();
        return;
      }

      if (virtualKey.type === "number" || virtualKey.type === "note") {
        applyTrackerInput({
          type: "hex",
          value: virtualKey.value,
        });
        focusTable();
        return;
      }

      if (virtualKey.type === "transpose") {
        dispatch(
          trackerDocumentActions.transposeAbsoluteCells({
            patternCells: selectedPatternCells,
            direction: virtualKey.direction,
            size: virtualKey.size,
          }),
        );
        focusTable();
        return;
      }

      if (virtualKey.type === "transposeField") {
        dispatch(
          trackerDocumentActions.transposeTrackerFields({
            sequenceId: getTrackerSequenceId({
              trackerSelectionOrigin,
              trackerActiveField,
              selectedSequence,
            }),
            selectedTrackerFields,
            direction: virtualKey.direction,
          }),
        );
        focusTable();
        return;
      }

      if (virtualKey.type === "insertRow" || virtualKey.type === "removeRow") {
        dispatch(
          trackerDocumentActions.shiftTrackerFields({
            sequenceId: getTrackerSequenceId({
              trackerSelectionOrigin,
              trackerActiveField,
              selectedSequence,
            }),
            selectedTrackerFields,
            direction: virtualKey.type === "insertRow" ? "insert" : "delete",
          }),
        );
        focusTable();
        return;
      }

      if (virtualKey.type === "clear") {
        dispatch(
          trackerDocumentActions.clearTrackerFields({
            sequenceId: getTrackerSequenceId({
              trackerSelectionOrigin,
              trackerActiveField,
              selectedSequence,
            }),
            selectedTrackerFields,
          }),
        );
        focusTable();
        return;
      }

      if (virtualKey.type === "undo") {
        dispatch({ type: TRACKER_UNDO });
        return;
      }

      if (virtualKey.type === "redo") {
        dispatch({ type: TRACKER_REDO });
      }

      if (virtualKey.type === "settings") {
        dispatch(trackerActions.setMobileOverlayView("settings"));
      }

      if (virtualKey.type === "editEffects") {
        dispatch(trackerActions.setMobileOverlayView("notes"));
      }

      if (virtualKey.type === "toggle") {
        dispatch(trackerActions.setShowVirtualKeyboard(!showVirtualKeyboard));
      }
    },
    [
      applyTrackerInput,
      dispatch,
      focusTable,
      moveActiveField,
      setSingleFieldSelection,
      showVirtualKeyboard,
      store,
    ],
  );

  const handleMidiNotePressed = useCallback(
    (note: number) => {
      const state = store.getState();
      const {
        playing,
        trackerActiveField,
        selectedSequence,
        octaveOffset: currentOctaveOffset,
      } = state.tracker;

      if (!midiState.recordingEnabled || playing) {
        playPreview({ note });
        return;
      }

      const currentMaxField = getMaxField();

      if (trackerActiveField === undefined) {
        const firstField = getGlobalField(selectedSequence, 0);
        setSingleFieldSelection(firstField);
      }

      if (
        trackerActiveField === undefined ||
        trackerActiveField > currentMaxField ||
        getFieldColumnFocus(
          getLocalFieldFromGlobalField(trackerActiveField),
        ) !== "noteColumnFocus"
      ) {
        return;
      }

      editNoteField(note - currentOctaveOffset * OCTAVE_SIZE);
      focusTable();
    },
    [
      editNoteField,
      focusTable,
      getMaxField,
      midiState.recordingEnabled,
      playPreview,
      setSingleFieldSelection,
      store,
    ],
  );

  useMusicMidiNoteSubscription(handleMidiNotePressed);

  // #endregion Virtual Keyboard Handlers

  // #region Context Menu

  const getSelectionContextMenu = useCallback(() => {
    const state = store.getState();
    const {
      trackerActiveField,
      selectedSequence,
      trackerSelectionOrigin,
      selectedTrackerFields,
      selectedPatternCells,
      selectedInstrumentId,
    } = state.tracker;
    const activeSequenceId =
      trackerActiveField !== undefined
        ? getSequenceIdFromGlobalField(trackerActiveField)
        : selectedSequence;

    return renderTrackerContextMenu({
      dispatch,
      sequenceId: trackerSelectionOrigin?.sequenceId ?? activeSequenceId,
      selectedTrackerFields,
      selectedPatternCells,
      selectedInstrumentId,
    });
  }, [dispatch, store]);

  const {
    onContextMenu: onSelectionContextMenu,
    contextMenuElement: selectionContextMenuElement,
  } = useContextMenu({
    getMenu: getSelectionContextMenu,
  });

  // #endregion Context Menu

  // #region Global Event Effects

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [
    handleKeyDown,
    handleKeyUp,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
  ]);

  // #endregion Global Event Effects

  // #region Select All Effects

  useSelectAllShortcut({
    enabled: !subpatternEditorFocus,
    onSelectAll,
  });

  // #endregion Select All Effects

  // #region Clipboard Effects

  useEffect(() => {
    if (subpatternEditorFocus) {
      return;
    }

    window.addEventListener("copy", onCopy);
    window.addEventListener("cut", onCut);
    window.addEventListener("paste", onPaste);

    return () => {
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("cut", onCut);
      window.removeEventListener("paste", onPaste);
    };
  }, [onCopy, onCut, onPaste, subpatternEditorFocus]);

  // #endregion Clipboard Effects

  return (
    <StyledTrackerWrapper>
      <StyledTrackerScrollWrapper ref={scrollRef}>
        <StyledTrackerScrollCanvas>
          {songSequence?.map((sequencePatternId, renderSequenceId) => (
            <SongTrackerPattern
              key={renderSequenceId}
              sequenceItem={sequencePatternId}
              sequencePatternId={Math.floor(sequencePatternId.channels[0] / 4)}
              renderSequenceId={renderSequenceId}
              defaultStartPlaybackSequence={defaultStartPlaybackSequence}
              defaultStartPlaybackRow={defaultStartPlaybackRow}
              channelStatus={channelStatus}
              soloChannel={soloChannel}
              orderLength={sequenceLength}
              numPatterns={numPatterns}
              dispatch={dispatch}
              tableRef={tableRef}
              activeFieldRef={activeFieldRef}
              onFocus={onFocus}
              onSelectionContextMenu={onSelectionContextMenu}
            />
          ))}
        </StyledTrackerScrollCanvas>

        <StyledAddPatternWrapper
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <StyledAddPatternButton
            onClick={onAddSequence}
            title={l10n("FIELD_ADD_PATTERN")}
          >
            <PlusIcon />
          </StyledAddPatternButton>
        </StyledAddPatternWrapper>
      </StyledTrackerScrollWrapper>

      <SongTrackerPlaybackController
        scrollRef={scrollRef}
        sequenceLength={sequenceLength}
      />

      <SongTrackerNavigationController
        scrollRef={scrollRef}
        tableRef={tableRef}
        activeFieldRef={activeFieldRef}
        hasHadFocusRef={hasHadFocusRef}
      />

      <SongTrackerKeyboardContainer
        octaveOffset={octaveOffset}
        open={showVirtualKeyboard}
        onKeyPressed={handleVirtualKeyPressed}
      />

      {selectionContextMenuElement}
    </StyledTrackerWrapper>
  );
};
