import React from "react";
import styled, { css } from "styled-components";
import { PatternCell } from "lib/helpers/uge/song/PatternCell";

interface SongRowProps {
  id: string;
  n: number;
  row: PatternCell[];
  startCellId: number;
  selectedCell: number | undefined;
  isSelected: boolean;
  isPlaying: boolean;
}

interface WrapperProps {
  n: number;
  isSelected: boolean;
  isPlaying: boolean;
  size?: "normal" | "small";
}

const Wrapper = styled.span<WrapperProps>`
  display: inline-block;
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
  color: ${(props) => props.theme.colors.tracker.text};
  border-width: 0 1px 0 0;
  border-color: ${(props) => props.theme.colors.tracker.border};
  border-style: solid;
  margin: 0;
  padding: 4px 8px;
  height: 20px;
  ${(props) =>
    props.size === "small"
      ? css`
          width: 30px;
        `
      : css`
          width: 116px;
        `}
  background-color: ${(props) => props.theme.colors.tracker.background};
  ${(props) =>
    props.n % 8 === 0
      ? css`
          background-color: ${props.theme.colors.tracker.activeBackground};
        `
      : ""}
  ${(props) =>
    props.isSelected
      ? css`
          background-color: ${props.theme.colors.tracker.activeBackground};
        `
      : ""}
  ${(props) =>
    props.isPlaying
      ? css`
          background-color: ${props.theme.colors.highlight};
        `
      : ""}
`;

const Cell = styled.span<{ selected?: boolean }>`
  :hover {
    box-shadow: 0px 0px 0px 2px rgba(255, 0, 0, 0.2) inset;
  }
  margin: 0;
  padding: 0 4px;
  ${(props) =>
    props.selected
      ? css`
          background-color: white;
        `
      : ""}
`;

const HCell = styled.span`
  margin: 0;
  padding: 0 4px;
  pointer-events: none;
`;

const NoteCell = styled(Cell)`
  color: ${(props) => props.theme.colors.tracker.note};
`;

const InstrumentCell = styled(Cell)`
  color: ${(props) => props.theme.colors.tracker.instrument};
`;

const EffectCodeCell = styled(Cell)`
  color: ${(props) => props.theme.colors.tracker.effectCode};
`;

const EffectParamCell = styled(Cell)`
  color: ${(props) => props.theme.colors.tracker.effectParam};
`;

const renderCounter = (n: number): string => {
  return n?.toString().padStart(2, "0") || "__";
};

const noteName = [
  "C-",
  "C#",
  "D-",
  "D#",
  "E-",
  "F-",
  "F#",
  "G-",
  "G#",
  "A-",
  "A#",
  "B-",
];
const renderNote = (note: number | null): string => {
  if (note === null) {
    return "...";
  }
  const octave = ~~(note / 12) + 3;
  return `${noteName[note % 12]}${octave}`;
};

const renderInstrument = (instrument: number | null): string => {
  if (instrument === null) return "..";
  return (instrument + 1).toString().padStart(2, "0") || "..";
};

const renderEffect = (effectcode: number | null): string => {
  return effectcode?.toString(16).toUpperCase() || ".";
};

const renderEffectParam = (effectparam: number | null): string => {
  return effectparam?.toString(16).toUpperCase().padStart(2, "0") || "..";
};

const SongRowFwd = React.forwardRef<HTMLSpanElement, SongRowProps>(
  (
    { n, row, startCellId, selectedCell, isPlaying, isSelected }: SongRowProps,
    ref
  ) => {
    return (
      <div>
        <Wrapper
          isPlaying={isPlaying}
          isSelected={isSelected}
          n={n}
          size="small"
          data-row={n}
        >
          <HCell id={`cell_${n}`}>{renderCounter(n)}</HCell>
        </Wrapper>
        {row.map((cell, i) => {
          const ret = (
            <Wrapper isPlaying={isPlaying} isSelected={isSelected} n={n}>
              <NoteCell
                id={`cell_${n}_${i}_1`}
                selected={selectedCell === startCellId}
                ref={selectedCell === startCellId ? ref : null}
                data-cellid={startCellId}
              >
                {renderNote(cell.note)}
              </NoteCell>
              <InstrumentCell
                id={`cell_${n}_${i}_2`}
                selected={selectedCell === startCellId + 1}
                ref={selectedCell === startCellId + 1 ? ref : null}
                data-cellid={startCellId + 1}
              >
                {renderInstrument(cell.instrument)}
              </InstrumentCell>
              <EffectCodeCell
                id={`cell_${n}_${i}_3`}
                selected={selectedCell === startCellId + 2}
                ref={selectedCell === startCellId + 2 ? ref : null}
                data-cellid={startCellId + 2}
                style={{
                  paddingRight: 1,
                }}
              >
                {renderEffect(cell.effectcode)}
              </EffectCodeCell>
              <EffectParamCell
                id={`cell_${n}_${i}_4`}
                selected={selectedCell === startCellId + 3}
                ref={selectedCell === startCellId + 3 ? ref : null}
                data-cellid={startCellId + 3}
                style={{
                  paddingLeft: 1,
                }}
              >
                {renderEffectParam(cell.effectparam)}
              </EffectParamCell>
            </Wrapper>
          );
          startCellId += 4;
          return ret;
        })}
      </div>
    );
  }
);

const comparePatternCell = (a: PatternCell, b: PatternCell) => {
  return (
    a.note === b.note &&
    a.instrument === b.instrument &&
    a.effectcode === b.effectcode &&
    a.effectparam === b.effectparam
  );
};
const arePropsEqual = (prevProps: SongRowProps, nextProps: SongRowProps) => {
  for (let i = 0; i < prevProps.row.length; i++) {
    if (!comparePatternCell(prevProps.row[i], nextProps.row[i])) {
      return false;
    }
  }
  return (
    prevProps.id === nextProps.id &&
    prevProps.n === nextProps.n &&
    prevProps.startCellId === nextProps.startCellId &&
    prevProps.selectedCell === nextProps.selectedCell &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isPlaying === nextProps.isPlaying
  );
};

export const SongRow = React.memo(SongRowFwd, arePropsEqual);
