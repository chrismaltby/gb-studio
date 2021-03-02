import React from "react";
import styled, { css } from "styled-components";
import { PatternCell } from "../../lib/helpers/uge/song/PatternCell";

interface SongRowProps {
  id: string,
  n: number,
  row: PatternCell[],
  selected: boolean
}

interface WrapperProps {
  selected: boolean
}

const Wrapper = styled.span<WrapperProps>`
  display: inline-block;
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
  border-width: 0 1px 0 0;
  border-color: black;
  border-style: solid;
  margin: 0;
  padding: 4px 8px;
  height: 20px;
  ${(props) =>
    props.selected
      ? css`
          background-color: ${props.theme.colors.highlight};
        `
      : ""
  }
`;

const Cell = styled.span`
  margin: 2px;
`;

const renderCounter = (n: number): string => {
  return (n)?.toString().padStart(2, "0") || "__";
}

const noteName = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"]
const renderNote = (note: number | null): string => {
  if (note) {
    const octave = ~~(note / 12) + 3;
    return noteName[note % 12] + octave;
  }
  return "...";
}

const renderInstrument = (instrument: number | null): string => {
  return (instrument)?.toString().padStart(2, "0") || "..";
}

const renderEffect = (effectcode: number | null): string => {
  return (effectcode)?.toString(16).toUpperCase() || ".";
}

const renderEffectParam = (effectparam: number | null): string => {
  return (effectparam)?.toString(16).toUpperCase().padStart(2, "0") || "..";
}

export const SongRow = React.memo(({
  n,
  row,
  selected
}: SongRowProps) => {
  return (
    <div>
      <Wrapper selected={selected}><Cell>{renderCounter(n)}</Cell></Wrapper>
      {row.map((cell) =>
        <Wrapper selected={selected}>
          <Cell>{renderNote(cell.note)}</Cell>&nbsp;
          <Cell>{renderInstrument(cell.instrument)}</Cell>&nbsp;
          <Cell>{renderEffect(cell.effectcode)}{renderEffectParam(cell.effectparam)}</Cell>
        </Wrapper>
      )}
    </div>
  )
})