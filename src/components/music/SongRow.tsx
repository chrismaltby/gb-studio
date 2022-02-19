import React from "react";
import styled, { css } from "styled-components";
import { PatternCell } from "lib/helpers/uge/song/PatternCell";
import {
  renderNote,
  renderInstrument,
  renderEffect,
  renderEffectParam,
} from "./helpers";

interface SongRowProps {
  id: string;
  n: number;
  row: PatternCell[];
  fieldCount: number;
  activeField: number | undefined;
  isActive: boolean;
  isPlaying: boolean;
}

interface WrapperProps {
  n: number;
  isActive: boolean;
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
    props.isActive
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

const Field = styled.span<{ selected?: boolean }>`
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

const HeaderField = styled.span`
  margin: 0;
  padding: 0 4px;
  pointer-events: none;
`;

const NoteField = styled(Field)`
  color: ${(props) => props.theme.colors.tracker.note};
`;

const InstrumentField = styled(Field)`
  color: ${(props) => props.theme.colors.tracker.instrument};
`;

const EffectCodeField = styled(Field)`
  color: ${(props) => props.theme.colors.tracker.effectCode};
`;

const EffectParamField = styled(Field)`
  color: ${(props) => props.theme.colors.tracker.effectParam};
`;

const renderCounter = (n: number): string => {
  return n?.toString().padStart(2, "0") || "__";
};

const SongRowFwd = React.forwardRef<HTMLSpanElement, SongRowProps>(
  (
    { n, row, fieldCount, activeField, isPlaying, isActive }: SongRowProps,
    ref
  ) => {
    return (
      <div>
        <Wrapper
          isPlaying={isPlaying}
          isActive={isActive}
          n={n}
          size="small"
          data-row={n}
        >
          <HeaderField id={`cell_${n}`}>{renderCounter(n)}</HeaderField>
        </Wrapper>
        {row.map((cell, channelId) => {
          const ret = (
            <Wrapper isPlaying={isPlaying} isActive={isActive} n={n}>
              <NoteField
                id={`cell_${n}_${channelId}_note`}
                selected={activeField === fieldCount}
                ref={activeField === fieldCount ? ref : null}
                data-fieldid={fieldCount}
              >
                {renderNote(cell.note)}
              </NoteField>
              <InstrumentField
                id={`cell_${n}_${channelId}_instrument`}
                selected={activeField === fieldCount + 1}
                ref={activeField === fieldCount + 1 ? ref : null}
                data-fieldid={fieldCount + 1}
              >
                {renderInstrument(cell.instrument)}
              </InstrumentField>
              <EffectCodeField
                id={`cell_${n}_${channelId}_effectcode`}
                selected={activeField === fieldCount + 2}
                ref={activeField === fieldCount + 2 ? ref : null}
                data-fieldid={fieldCount + 2}
                style={{
                  paddingRight: 1,
                }}
              >
                {renderEffect(cell.effectcode)}
              </EffectCodeField>
              <EffectParamField
                id={`cell_${n}_${channelId}_effectparam`}
                selected={activeField === fieldCount + 3}
                ref={activeField === fieldCount + 3 ? ref : null}
                data-fieldid={fieldCount + 3}
                style={{
                  paddingLeft: 1,
                }}
              >
                {renderEffectParam(cell.effectparam)}
              </EffectParamField>
            </Wrapper>
          );
          fieldCount += 4;
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
    prevProps.fieldCount === nextProps.fieldCount &&
    prevProps.activeField === nextProps.activeField &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isPlaying === nextProps.isPlaying
  );
};

export const SongRow = React.memo(SongRowFwd, arePropsEqual);
