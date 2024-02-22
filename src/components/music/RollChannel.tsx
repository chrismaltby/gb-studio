import React from "react";
import styled, { css } from "styled-components";
import { PatternCell } from "renderer/lib/uge/song/PatternCell";

interface RollChannelProps {
  channelId: number;
  active: boolean;
  renderPattern: PatternCell[][];
  renderSelectedPatternCells: number[];
  cellSize: number;
  isDragging: boolean;
}

interface WrapperProps {
  rows: number;
  cols: number;
  size: number;
  active?: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  top: 0;

  ${(props) => css`
    margin: 0 ${3 * props.size}px ${2 * props.size}px 10px;
    width: ${props.cols * props.size}px;
    height: ${props.rows * props.size}px;
    opacity: ${props.active ? 1 : 0.3};
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

export const RollChannelFwd = ({
  channelId,
  active,
  renderPattern,
  renderSelectedPatternCells,
  cellSize,
  isDragging,
}: RollChannelProps) => {
  return (
    <Wrapper active={active} rows={12 * 6} cols={64} size={cellSize}>
      {renderPattern?.map((column: PatternCell[], columnIdx: number) => {
        const isSelected =
          active && renderSelectedPatternCells.indexOf(columnIdx) > -1;
        const cell = column[channelId];

        if (cell && cell.note !== null) {
          return (
            <>
              <Note
                data-type="note"
                data-note={cell.note}
                data-column={columnIdx}
                key={`note_${columnIdx}_${channelId}`}
                size={cellSize}
                className={
                  cell.instrument !== null
                    ? `label--instrument-${cell.instrument}`
                    : ""
                }
                style={{
                  left: `${columnIdx * cellSize}px`,
                  width: cellSize,
                  bottom: `${(cell.note % (12 * 6)) * cellSize - 1}px`,
                  pointerEvents: "none",
                  boxShadow:
                    isSelected && !isDragging ? "0 0 0px 2px #c92c61" : "",
                  zIndex: isSelected ? 1 : 0,
                  opacity: isSelected && isDragging ? 0.6 : 1,
                }}
              >
                {/* {cell.effectcode?.toString(16).toUpperCase()} */}
              </Note>
              {cell.effectcode === 0 ? (
                <>
                  <Note
                    data-param={(cell.effectparam || 0) >> 4}
                    key={`note_arpeggio_${columnIdx}_${channelId}_1`}
                    size={cellSize}
                    className={
                      cell.instrument !== null
                        ? `label--instrument-${cell.instrument}`
                        : ""
                    }
                    style={{
                      opacity: 0.4,
                      left: `${columnIdx * cellSize}px`,
                      width: cellSize,
                      bottom: `${
                        ((cell.note + ((cell.effectparam || 0) >> 4)) %
                          (12 * 6)) *
                          cellSize -
                        1
                      }px`,
                    }}
                  ></Note>
                  <Note
                    data-param={(cell.effectparam || 0) & 0xf}
                    key={`note_arpeggio_${columnIdx}_${channelId}_2`}
                    size={cellSize}
                    className={
                      cell.instrument !== null
                        ? `label--instrument-${cell.instrument}`
                        : ""
                    }
                    style={{
                      opacity: 0.4,
                      left: `${columnIdx * cellSize}px`,
                      width: cellSize,
                      bottom: `${
                        ((cell.note + ((cell.effectparam || 0) & 0xf)) %
                          (12 * 6)) *
                          cellSize -
                        1
                      }px`,
                    }}
                  ></Note>
                </>
              ) : (
                ""
              )}
            </>
          );
        }
        return "";
      })}
    </Wrapper>
  );
};

export const RollChannel = React.memo(RollChannelFwd);
