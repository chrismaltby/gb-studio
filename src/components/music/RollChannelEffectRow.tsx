import React, { useCallback } from "react";
import styled, { css } from "styled-components";
import { PatternCell } from "shared/lib/uge/song/PatternCell";
import trackerActions from "store/features/tracker/trackerActions";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface RollChannelProps {
  patternId: number;
  channelId: number;
  renderPattern: PatternCell[][];
  cellSize: number;
}

interface WrapperProps {
  $rows: number;
  $cols: number;
  $size: number;
  $active?: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  font-family: monospace;
  position: absolute;
  left: ${30 + 10 + 1}px;

  ${(props) => css`
    top: ${props.$size / 2}px;
    width: ${props.$cols * props.$size}px;
    height: ${props.$size - 1}px;

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
  background-size: ${props.$size}px ${props.$size}px,
    ${props.$size}px ${props.$size}px, ${props.$size * 8}px ${
    props.$size * 12
  }px;
  }

  `}
`;

interface NoteProps {
  $size: number;
  $isSelected?: boolean;
}

const Note = styled.div<NoteProps>`
  position: absolute;
  height: ${(props) => `${props.$size - 1}px`};
  border: 1px solid black;
  text-align: center;
  line-height: 1.1em;
  pointer-events: none;
  box-shadow: ${(props) =>
    props.$isSelected ? `0 0 0px 2px ${props.theme.colors.highlight}` : ""};
  z-index: ${(props) => (props.$isSelected ? 1 : 0)};
  background-color: ${(props) => props.theme.colors.button.activeBackground};
`;

export const RollChannelEffectRowFwd = ({
  patternId,
  channelId,
  renderPattern,
  cellSize,
}: RollChannelProps) => {
  const dispatch = useAppDispatch();
  const tool = useAppSelector((state) => state.tracker.tool);

  const selectedEffectCell = useAppSelector(
    (state) => state.tracker.selectedEffectCell
  );

  // Mouse
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!renderPattern) return;
      const col = Math.floor(e.offsetX / cellSize);
      const cell = renderPattern[col][channelId];
      const lastCell = renderPattern[selectedEffectCell || 0][channelId];

      if (e.button === 0 && tool !== "eraser") {
        // If there's a note in position
        if (cell) {
          const changes = {
            effectcode:
              cell.effectcode !== null
                ? cell.effectcode
                : lastCell.effectcode || 0,
            effectparam:
              cell.effectparam !== null
                ? cell.effectparam
                : lastCell.effectparam || 0,
          };
          dispatch(
            trackerDocumentActions.editPatternCell({
              patternId: patternId,
              cell: [col, channelId],
              changes: changes,
            })
          );
          dispatch(trackerActions.setSelectedEffectCell(col));
          // Dispatch twice preserve effect param data when not arpeggio
          dispatch(
            trackerDocumentActions.editPatternCell({
              patternId: patternId,
              cell: [col, channelId],
              changes: changes,
            })
          );
        }
      } else if (e.button === 2 || (tool === "eraser" && e.button === 0)) {
        // If there's a note in position
        if (cell && (cell.effectcode !== null || cell.effectparam !== null)) {
          dispatch(
            trackerDocumentActions.editPatternCell({
              patternId: patternId,
              cell: [col, channelId],
              changes: {
                effectcode: null,
                effectparam: null,
              },
            })
          );
        }
      }
    },
    [
      renderPattern,
      cellSize,
      channelId,
      tool,
      dispatch,
      patternId,
      selectedEffectCell,
    ]
  );

  return (
    <Wrapper
      $rows={12 * 6}
      $cols={64}
      $size={cellSize}
      onMouseDown={(e) => {
        handleMouseDown(e.nativeEvent);
      }}
    >
      {renderPattern?.map((column: PatternCell[], columnIdx: number) => {
        const cell = column[channelId];
        const isSelected = selectedEffectCell === columnIdx;
        if (cell && (cell.effectcode !== null || cell.effectparam !== null)) {
          return (
            <Note
              data-type="note"
              data-column={columnIdx}
              key={`fx_${columnIdx}_${channelId}`}
              $size={cellSize}
              $isSelected={isSelected}
              style={{
                left: `${columnIdx * cellSize}px`,
                width: cellSize,
                bottom: `-1px`,
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
