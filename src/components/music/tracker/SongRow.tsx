import React from "react";
import { PatternCell } from "shared/lib/uge/types";
import {
  renderNote,
  renderInstrument,
  renderEffect,
  renderEffectParam,
} from "components/music/helpers";
import {
  StyledTrackerEffectCodeField,
  StyledTrackerEffectParamField,
  StyledTrackerInstrumentField,
  StyledTrackerNoteField,
  StyledTrackerCell,
  StyledTrackerRowIndexField,
  StyledTrackerRow,
} from "./style";

interface TrackerRowProps {
  id: string;
  n: number;
  row: PatternCell[];
  fieldCount: number;
  activeField: number | undefined;
  isActive: boolean;
  isPlaying: boolean;
  selectedTrackerFields: number[];
  channelStatus: boolean[];
}

const renderCounter = (n: number): string => {
  return n?.toString().padStart(2, "0") || "__";
};

const TrackerRowFwd = React.forwardRef<HTMLSpanElement, TrackerRowProps>(
  (
    {
      n,
      row,
      fieldCount,
      activeField,
      isPlaying,
      isActive,
      selectedTrackerFields,
      channelStatus,
    }: TrackerRowProps,
    ref,
  ) => {
    return (
      <StyledTrackerRow>
        <StyledTrackerCell
          $isPlaying={isPlaying}
          $isActive={isActive}
          $isMuted={false}
          $n={n}
          $size="small"
          data-row={n}
        >
          <StyledTrackerRowIndexField id={`cell_${n}`}>
            {renderCounter(n)}
          </StyledTrackerRowIndexField>
        </StyledTrackerCell>
        {row.map((cell, channelId) => {
          const ret = (
            <StyledTrackerCell
              $isPlaying={isPlaying}
              $isActive={isActive}
              $isMuted={channelStatus[channelId]}
              $n={n}
              key={`_${channelId}`}
            >
              <StyledTrackerNoteField
                id={`cell_${n}_${channelId}_note`}
                $active={activeField === fieldCount}
                ref={activeField === fieldCount ? ref : null}
                data-fieldid={fieldCount}
                $selected={selectedTrackerFields.indexOf(fieldCount) > -1}
              >
                {renderNote(cell.note)}
              </StyledTrackerNoteField>
              <StyledTrackerInstrumentField
                id={`cell_${n}_${channelId}_instrument`}
                $active={activeField === fieldCount + 1}
                ref={activeField === fieldCount + 1 ? ref : null}
                data-fieldid={fieldCount + 1}
                $selected={selectedTrackerFields.indexOf(fieldCount + 1) > -1}
              >
                {renderInstrument(cell.instrument)}
              </StyledTrackerInstrumentField>
              <StyledTrackerEffectCodeField
                id={`cell_${n}_${channelId}_effectcode`}
                $active={activeField === fieldCount + 2}
                ref={activeField === fieldCount + 2 ? ref : null}
                data-fieldid={fieldCount + 2}
                style={{
                  paddingRight: 1,
                }}
                $selected={selectedTrackerFields.indexOf(fieldCount + 2) > -1}
              >
                {renderEffect(cell.effectcode)}
              </StyledTrackerEffectCodeField>
              <StyledTrackerEffectParamField
                id={`cell_${n}_${channelId}_effectparam`}
                $active={activeField === fieldCount + 3}
                ref={activeField === fieldCount + 3 ? ref : null}
                data-fieldid={fieldCount + 3}
                style={{
                  paddingLeft: 1,
                }}
                $selected={selectedTrackerFields.indexOf(fieldCount + 3) > -1}
              >
                {renderEffectParam(cell.effectparam)}
              </StyledTrackerEffectParamField>
            </StyledTrackerCell>
          );
          fieldCount += 4;
          return ret;
        })}
      </StyledTrackerRow>
    );
  },
);

const comparePatternCell = (a: PatternCell, b: PatternCell) => {
  return (
    a.note === b.note &&
    a.instrument === b.instrument &&
    a.effectcode === b.effectcode &&
    a.effectparam === b.effectparam
  );
};
const arePropsEqual = (
  prevProps: TrackerRowProps,
  nextProps: TrackerRowProps,
) => {
  for (let i = 0; i < prevProps.row.length; i++) {
    if (!comparePatternCell(prevProps.row[i], nextProps.row[i])) {
      return false;
    }
  }
  return (
    prevProps.id === nextProps.id &&
    prevProps.n === nextProps.n &&
    prevProps.fieldCount === nextProps.fieldCount &&
    prevProps.activeField === nextProps.activeField &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.selectedTrackerFields.length ===
      nextProps.selectedTrackerFields.length &&
    prevProps.channelStatus === nextProps.channelStatus &&
    prevProps.selectedTrackerFields[0] === nextProps.selectedTrackerFields[0]
  );
};

export const TrackerRow = React.memo(TrackerRowFwd, arePropsEqual);
