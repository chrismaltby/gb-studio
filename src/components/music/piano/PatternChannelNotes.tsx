import React from "react";
import { PatternCell } from "shared/lib/uge/types";
import {
  PIANO_ROLL_CELL_SIZE,
  TOTAL_NOTES,
  TRACKER_PATTERN_LENGTH,
} from "consts";
import { StyledPianoRollNote, StyledPatternChannelNotes } from "./style";

interface PatternChannelNotesProps {
  channelId: number;
  isActive: boolean;
  sequenceId: number;
  pattern: PatternCell[][];
  selectedPatternCells: number[];
  isDragging: boolean;
}

const ARPEGGIO_CODE = 0;

const noteBottom = (note: number) =>
  (note % TOTAL_NOTES) * PIANO_ROLL_CELL_SIZE;

export const PatternChannelNotes = React.memo(
  ({
    channelId,
    isActive,
    sequenceId,
    pattern,
    selectedPatternCells,
    isDragging,
  }: PatternChannelNotesProps) => {
    let instrument: number | null = null;

    return (
      <StyledPatternChannelNotes $active={isActive}>
        {pattern?.map((column, columnIdx) => {
          const cell = column[channelId];
          if (!cell || cell.note === null) return null;

          const absoluteColumn =
            sequenceId * TRACKER_PATTERN_LENGTH + columnIdx;

          const isSelected =
            isActive && selectedPatternCells.indexOf(absoluteColumn) !== -1;

          if (cell.instrument !== null) {
            instrument = cell.instrument;
          }

          const noteInstrument =
            instrument !== null && isActive ? instrument : undefined;

          const usingPreviousInstrument =
            cell.instrument === null && instrument !== null;

          const left = columnIdx * PIANO_ROLL_CELL_SIZE;
          const effect = cell.effectparam ?? 0;

          return (
            <React.Fragment key={`note_${columnIdx}_${channelId}`}>
              <StyledPianoRollNote
                data-type="note"
                data-note={cell.note}
                data-column={columnIdx}
                $instrument={noteInstrument}
                $usingPreviousInstrument={usingPreviousInstrument}
                $isSelected={isSelected}
                $isDragging={isDragging}
                style={{
                  left,
                  bottom: noteBottom(cell.note),
                }}
              />
              {cell.effectcode === ARPEGGIO_CODE && (
                <>
                  <StyledPianoRollNote
                    data-param={effect >> 4}
                    $instrument={noteInstrument}
                    $usingPreviousInstrument={usingPreviousInstrument}
                    $isVirtual
                    style={{
                      left,
                      bottom: noteBottom(cell.note + (effect >> 4)),
                    }}
                  />
                  <StyledPianoRollNote
                    data-param={effect & 0xf}
                    $instrument={noteInstrument}
                    $usingPreviousInstrument={usingPreviousInstrument}
                    $isVirtual
                    style={{
                      left,
                      bottom: noteBottom(cell.note + (effect & 0xf)),
                    }}
                  />
                </>
              )}
            </React.Fragment>
          );
        })}
      </StyledPatternChannelNotes>
    );
  },
);
