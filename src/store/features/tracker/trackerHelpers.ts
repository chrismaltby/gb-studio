import {
  TRACKER_CHANNEL_FIELDS,
  TRACKER_PATTERN_LENGTH,
  TRACKER_ROW_SIZE,
} from "consts";
import { PatternCellAddress } from "shared/lib/uge/editor/types";
import { resolveUniqueTrackerPositions } from "store/features/trackerDocument/trackerDocumentHelpers";

export interface TrackerSelectionOrigin {
  x: number;
  y: number;
  sequenceId: number;
}

export interface TrackerSelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PATTERN_FIELD_COUNT = TRACKER_PATTERN_LENGTH * TRACKER_ROW_SIZE;

export const getSequenceIdFromGlobalField = (field: number) =>
  Math.floor(field / PATTERN_FIELD_COUNT);

export const getLocalFieldFromGlobalField = (field: number) =>
  field % PATTERN_FIELD_COUNT;

export const getGlobalField = (sequenceId: number, localField: number) =>
  sequenceId * PATTERN_FIELD_COUNT + localField;

const deriveSelectedTrackerFields = (
  selectionOrigin: TrackerSelectionOrigin | undefined,
  selectionRect: TrackerSelectionRect | undefined,
): number[] => {
  if (selectionRect) {
    const selectedTrackerFields: number[] = [];

    for (
      let x = selectionRect.x;
      x <= selectionRect.x + selectionRect.width;
      x++
    ) {
      for (
        let y = selectionRect.y;
        y <= selectionRect.y + selectionRect.height;
        y++
      ) {
        selectedTrackerFields.push(y * TRACKER_ROW_SIZE + x);
      }
    }

    return selectedTrackerFields;
  }

  if (!selectionOrigin) {
    return [];
  }

  return [selectionOrigin.y * TRACKER_ROW_SIZE + selectionOrigin.x];
};

const deriveSelectedPatternCells = (
  selectedSequence: number,
  activeField: number | undefined,
  selectedTrackerFields: number[],
  selectionOrigin: TrackerSelectionOrigin | undefined,
): PatternCellAddress[] => {
  if (selectedTrackerFields.length === 0) {
    return [];
  }

  const sequenceId =
    selectionOrigin?.sequenceId ??
    (activeField !== undefined
      ? getSequenceIdFromGlobalField(activeField)
      : selectedSequence);

  return resolveUniqueTrackerPositions(selectedTrackerFields).map(
    ({ rowIndex, channelIndex }) => ({
      sequenceId,
      rowId: rowIndex,
      channelId: channelIndex,
    }),
  );
};

interface TrackerGridState {
  selectedSequence: number;
  selectedChannel: 0 | 1 | 2 | 3;
  trackerActiveField?: number;
  trackerSelectionOrigin?: TrackerSelectionOrigin;
  trackerSelectionRect?: TrackerSelectionRect;
  selectedTrackerFields: number[];
  selectedPatternCells: PatternCellAddress[];
  selectedEffectCell: unknown | null;
  sidebarView: string;
}

const applySelectedChannelFromActiveField = (
  state: TrackerGridState,
  activeField: number | undefined,
) => {
  if (activeField === undefined) {
    return;
  }

  const localField = activeField % PATTERN_FIELD_COUNT;
  const nextSelectedChannel = Math.floor(
    (localField % TRACKER_ROW_SIZE) / TRACKER_CHANNEL_FIELDS,
  ) as 0 | 1 | 2 | 3;

  if (state.selectedChannel !== nextSelectedChannel) {
    state.selectedEffectCell = null;
    state.selectedChannel = nextSelectedChannel;
  }
};

export const applyTrackerGridState = (
  state: TrackerGridState,
  activeField: number | undefined,
  selectionOrigin: TrackerSelectionOrigin | undefined,
  selectionRect: TrackerSelectionRect | undefined,
) => {
  state.trackerActiveField = activeField;
  state.trackerSelectionOrigin = selectionOrigin;
  state.trackerSelectionRect = selectionRect;
  state.selectedTrackerFields = deriveSelectedTrackerFields(
    selectionOrigin,
    selectionRect,
  );
  state.selectedPatternCells = deriveSelectedPatternCells(
    state.selectedSequence,
    activeField,
    state.selectedTrackerFields,
    selectionOrigin,
  );

  if (state.selectedPatternCells.length > 0) {
    state.sidebarView = "cell";
  }

  applySelectedChannelFromActiveField(state, activeField);
};

export const applyTrackerGridToSequenceStart = (
  state: TrackerGridState,
  sequenceId: number,
) => {
  const channelFieldOffset = state.selectedChannel * TRACKER_CHANNEL_FIELDS;

  applyTrackerGridState(
    state,
    sequenceId * PATTERN_FIELD_COUNT + channelFieldOffset,
    {
      x: channelFieldOffset,
      y: 0,
      sequenceId,
    },
    undefined,
  );
};
