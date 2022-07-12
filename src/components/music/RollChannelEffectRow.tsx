import React from "react";
import styled, { css } from "styled-components";
import { PatternCell } from "lib/helpers/uge/song/PatternCell";

interface RollChannelProps {
  channelId: number;
  renderPattern: PatternCell[][];
  cellSize: number;
}

interface WrapperProps {
  rows: number;
  cols: number;
  size: number;
  active?: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  left: ${30 + 10 + 1}px;

  ${(props) => css`
    top: ${props.size / 2}px;
    width: ${props.cols * props.size}px;
    height: ${props.size}px;

    border-top: 1px solid #808080;
    border-bottom: 1px solid #808080;

    background-image: linear-gradient(
      90deg,
      ${props.theme.colors.tracker.rollCell.border} 1px,
      transparent 1px
    ),
    linear-gradient(
      ${props.theme.colors.tracker.rollCell.border} 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      ${props.theme.colors.tracker.rollCell.border} 2px,
      transparent 1px
    );
  background-size: ${props.size}px ${props.size}px,
    ${props.size}px ${props.size}px, ${props.size * 8}px ${props.size * 12}px;
  }

  `}
`;

interface NoteProps {
  size: number;
}

const Note = styled.div<NoteProps>`
  position: absolute;
  height: ${(props) => `${props.size - 1}px`};
  border: 1px solid black;
  text-align: center;
  line-height: 1.1em;
`;

export const RollChannelEffectRowFwd = ({
  channelId,
  renderPattern,
  cellSize,
}: RollChannelProps) => {
  return (
    <Wrapper rows={12 * 6} cols={64} size={cellSize}>
      {renderPattern?.map((column: PatternCell[], columnIdx: number) => {
        const cell = column[channelId];
        if (cell && (cell.effectcode !== null || cell.effectparam !== null)) {
          return (
            <Note
              data-type="note"
              data-column={columnIdx}
              key={`fx_${columnIdx}_${channelId}`}
              size={cellSize}
              style={{
                left: `${columnIdx * cellSize}px`,
                width: cellSize,
                bottom: `0px`,
                pointerEvents: "none",
              }}
            >
              {cell.effectcode?.toString(16).toUpperCase()}
            </Note>
          );
        }
        return "";
      })}
    </Wrapper>
  );
};

export const RollChannelEffectRow = React.memo(RollChannelEffectRowFwd);
