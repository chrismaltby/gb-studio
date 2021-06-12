import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { css } from "styled-components";
import { PatternCell } from "lib/helpers/uge/song/PatternCell";
import { RootState } from "store/configureStore";
import trackerActions from "store/features/tracker/trackerActions";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";

import { instrumentColors } from "./InstrumentSelect";

interface RollChannelProps {
  channelId: number;
  active?: boolean;
  patternId: number;
  patterns?: PatternCell[][];
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
  top: 0;
  margin: 0 20px;
  ${(props) => css`
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
  patternId,
  patterns,
  cellSize,
}: RollChannelProps) => {
  const dispatch = useDispatch();

  const tool = useSelector((state: RootState) => state.tracker.tool);
  const defaultInstruments = useSelector(
    (state: RootState) => state.tracker.defaultInstruments
  );
  const hoverNote = useSelector((state: RootState) => state.tracker.hoverNote);

  const removeNote = useCallback(
    (channel: number, column: number) => (e: any) => {
      if (e.button === 2 || (tool === "eraser" && e.button === 0)) {
        dispatch(
          trackerDocumentActions.editPatternCell({
            patternId: patternId,
            cell: [column, channel],
            changes: {
              instrument: null,
              note: null,
            },
          })
        );
      } else if (tool === "pencil" && e.button === 0) {
        dispatch(
          trackerDocumentActions.editPatternCell({
            patternId: patternId,
            cell: [column, channel],
            changes: { instrument: defaultInstruments[channel] },
          })
        );
      }
    },
    [defaultInstruments, dispatch, patternId, tool]
  );

  const handleMouseDown = useCallback(
    (e: any) => {
      const cell = e.target.dataset["channel"];
      if (cell !== undefined && tool === "pencil" && e.button === 0) {
        const col = Math.floor(e.offsetX / cellSize);
        const note = 12 * 6 - 1 - Math.floor(e.offsetY / cellSize);
        const changes = {
          instrument: defaultInstruments[cell],
          note: note,
        };
        dispatch(
          trackerDocumentActions.editPatternCell({
            patternId: patternId,
            cell: [col, cell],
            changes: changes,
          })
        );
      }
    },
    [tool, cellSize, defaultInstruments, dispatch, patternId]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const note = 12 * 6 - 1 - Math.floor(e.offsetY / cellSize);
      if (note !== hoverNote) {
        dispatch(trackerActions.setHoverNote(note));
      }
    },
    [hoverNote, cellSize, dispatch]
  );

  const handleMouseLeave = useCallback(
    (_e: MouseEvent) => {
      if (hoverNote) {
        dispatch(trackerActions.setHoverNote(null));
      }
    },
    [hoverNote, dispatch]
  );

  return (
    <Wrapper
      data-channel={channelId}
      active={active}
      rows={12 * 6}
      cols={64}
      size={cellSize}
      onMouseDown={(e) => {
        handleMouseDown(e.nativeEvent);
      }}
      onMouseMove={(e) => {
        handleMouseMove(e.nativeEvent);
      }}
      onMouseLeave={(e) => {
        handleMouseLeave(e.nativeEvent);
      }}
    >
      {patterns?.map((column: PatternCell[], columnIdx: number) => {
        const cell = column[channelId];

        if (cell.note !== null) {
          return (
            <>
              <Note
                key={`note_${columnIdx}_${channelId}`}
                onMouseDown={removeNote(channelId, columnIdx)}
                size={cellSize}
                className={
                  cell.instrument !== null
                    ? `label--${instrumentColors[cell.instrument]}`
                    : ""
                }
                style={{
                  left: `${columnIdx * cellSize}px`,
                  width: cellSize,
                  bottom: `${(cell.note % (12 * 6)) * cellSize - 1}px`,
                }}
              >
                {cell.effectcode?.toString(16).toUpperCase()}
              </Note>
              {cell.effectcode === 0 ? (
                <>
                  <Note
                    data-param={(cell.effectparam || 0) >> 4}
                    key={`note_arpeggio_${columnIdx}_${channelId}_1`}
                    size={cellSize}
                    className={
                      cell.instrument !== null
                        ? `label--${instrumentColors[cell.instrument]}`
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
                        ? `label--${instrumentColors[cell.instrument]}`
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
