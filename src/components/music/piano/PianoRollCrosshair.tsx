import React from "react";
import {
  StyledPianoRollCrosshair,
  StyledPianoRollCrosshairHorizontal,
  StyledPianoRollCrosshairVertical,
} from "./style";
import { PIANO_ROLL_CELL_SIZE, TOTAL_NOTES } from "consts";

interface PianoRollCrosshairProps {
  hoverColumn: number | null;
  hoverRow: number | null;
  isSequenceHovered: boolean;
}

export const PianoRollCrosshair = ({
  hoverColumn,
  hoverRow,
  isSequenceHovered,
}: PianoRollCrosshairProps) => {
  if (hoverColumn === null || hoverRow == null) {
    return null;
  }
  return (
    <StyledPianoRollCrosshair>
      <StyledPianoRollCrosshairHorizontal
        style={{
          top: (TOTAL_NOTES - hoverRow - 1) * PIANO_ROLL_CELL_SIZE,
        }}
      />
      {isSequenceHovered && (
        <StyledPianoRollCrosshairVertical
          style={{
            left: hoverColumn * PIANO_ROLL_CELL_SIZE,
          }}
        />
      )}
    </StyledPianoRollCrosshair>
  );
};
