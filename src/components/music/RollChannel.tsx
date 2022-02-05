import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { css } from "styled-components";
import { PatternCell } from "lib/helpers/uge/song/PatternCell";
import { Song } from "lib/helpers/uge/song/Song";
import { RootState } from "store/configureStore";
import trackerActions from "store/features/tracker/trackerActions";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";

import { instrumentColors } from "./InstrumentSelect";
import { ipcRenderer } from "electron";
import { getInstrumentTypeByChannel, getInstrumentListByType } from "./helpers";
import { cloneDeep } from "lodash";

interface RollChannelProps {
  channelId: number;
  active?: boolean;
  patternId: number;
  pattern?: PatternCell[][];
  cellSize: number;
}

interface WrapperProps {
  rows: number;
  cols: number;
  size: number;
  active?: boolean;
}

interface NoteRenderCoordinates {
  note: number;
  column: number;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  top: 0;
  margin: 0 10px;
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

const playNotePreview = (
  song: Song,
  channel: number,
  note: number,
  instrument: number
) => {
  const instrumentType = getInstrumentTypeByChannel(channel) || "duty";
  const instrumentList = getInstrumentListByType(song, instrumentType);
  ipcRenderer.send("music-data-send", {
    action: "preview",
    note: note,
    type: instrumentType,
    instrument: instrumentList[instrument],
    square2: channel === 1,
  });
};

export const RollChannelFwd = ({
  channelId,
  active,
  patternId,
  pattern,
  cellSize,
}: RollChannelProps) => {
  const dispatch = useDispatch();

  const tool = useSelector((state: RootState) => state.tracker.tool);
  const defaultInstruments = useSelector(
    (state: RootState) => state.tracker.defaultInstruments
  );
  const hoverNote = useSelector((state: RootState) => state.tracker.hoverNote);
  const song = useSelector(
    (state: RootState) => state.trackerDocument.present.song
  );

  const currentInstrument = defaultInstruments[channelId];

  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const selectedPatternCells = useSelector(
    (state: RootState) => state.tracker.selectedPatternCells
  );
  const [moveNoteFrom, setMoveNoteFrom] = useState<NoteRenderCoordinates>();
  const [moveNoteTo, setMoveNoteTo] = useState<NoteRenderCoordinates>();
  const [renderPattern, setRenderPattern] = useState<PatternCell[][]>();
  const [renderSelectedPatternCells, setRenderSelectedPatternCells] = useState<
    number[]
  >([]);

  useEffect(() => {
    setRenderPattern(pattern);
  }, [pattern]);

  useEffect(() => {
    setRenderSelectedPatternCells(selectedPatternCells);
  }, [selectedPatternCells]);

  const handleNoteClick = useCallback(
    (column: number, cell: PatternCell) => (e: any) => {
      if (!song) {
        return;
      }
      if (e.button === 2 || (tool === "eraser" && e.button === 0)) {
        dispatch(
          trackerDocumentActions.editPatternCell({
            patternId: patternId,
            cell: [column, channelId],
            changes: {
              instrument: null,
              note: null,
            },
          })
        );
        const newSelectedCells = [...selectedPatternCells];
        newSelectedCells.splice(column, 1);
        dispatch(trackerActions.setSelectedPatternCells(newSelectedCells));
      } else if (tool === "pencil" && e.button === 0) {
        dispatch(
          trackerDocumentActions.editPatternCell({
            patternId: patternId,
            cell: [column, channelId],
            changes: { instrument: currentInstrument },
          })
        );
        if (cell.note) {
          playNotePreview(song, channelId, cell.note, currentInstrument);
        }
        if (cell.note) {
          if (selectedPatternCells.indexOf(column) === -1) {
            const newSelectedPatterns = [column];
            dispatch(
              trackerActions.setSelectedPatternCells(newSelectedPatterns)
            );
          }

          setIsMouseDown(true);
          setIsDragging(false);
          console.log("COLUMN", column);
          setMoveNoteFrom({ column: column, note: cell.note });
          setMoveNoteTo({ column: column, note: cell.note });
        }
      }
    },
    [
      channelId,
      currentInstrument,
      dispatch,
      patternId,
      selectedPatternCells,
      song,
      tool,
    ]
  );

  const handleMouseDown = useCallback(
    (e: any) => {
      const channel = parseInt(e.target.dataset["channel"]);
      if (!isNaN(channel) && tool === "pencil" && e.button === 0) {
        if (selectedPatternCells.length > 1) {
          dispatch(trackerActions.setSelectedPatternCells([]));
        } else {
          const col = Math.floor(e.offsetX / cellSize);
          const note = 12 * 6 - 1 - Math.floor(e.offsetY / cellSize);
          const changes = {
            instrument: defaultInstruments[channelId],
            note: note,
          };
          dispatch(
            trackerDocumentActions.editPatternCell({
              patternId: patternId,
              cell: [col, channelId],
              changes: changes,
            })
          );

          if (song) {
            playNotePreview(song, channelId, note, currentInstrument);
          }

          dispatch(trackerActions.setSelectedPatternCells([]));
          setMoveNoteFrom(undefined);
        }
      }
    },
    [
      tool,
      selectedPatternCells.length,
      dispatch,
      cellSize,
      defaultInstruments,
      channelId,
      patternId,
      song,
      currentInstrument,
    ]
  );

  const handleMouseMove = useCallback(
    (e: any) => {
      const isNote = e.target.dataset["type"] === "note";
      const newNote = isNote
        ? parseInt(e.target.dataset["note"])
        : 12 * 6 - 1 - Math.floor(e.offsetY / cellSize);
      const newColumn = isNote
        ? parseInt(e.target.dataset["column"])
        : Math.floor(e.offsetX / cellSize);

      if (newNote !== hoverNote) {
        dispatch(trackerActions.setHoverNote(newNote));
      }

      if (isMouseDown && song && selectedPatternCells.length > 0) {
        setIsDragging(true);
        if (moveNoteTo?.note !== newNote || moveNoteTo?.column !== newColumn) {
          playNotePreview(song, channelId, newNote, currentInstrument);

          console.log(moveNoteTo);
          const newMoveNoteTo = {
            note: newNote,
            column: newColumn,
          };
          setMoveNoteTo(newMoveNoteTo);

          if (pattern) {
            const columnFrom = moveNoteFrom?.column || 0;
            const columnTo = newMoveNoteTo?.column || 0;
            const columnDir = columnFrom > columnTo ? -1 : 1;
            const deltaX = Math.abs(columnFrom - columnTo) * columnDir;

            const noteFrom = moveNoteFrom?.note || 0;
            const noteTo = newMoveNoteTo?.note || 0;
            const noteDir = noteFrom > noteTo ? -1 : 1;
            const deltaY = Math.abs(noteFrom - noteTo) * noteDir;

            const newPattern = cloneDeep(pattern);
            for (const i of selectedPatternCells) {
              const newPatternColumn = cloneDeep(pattern[i]);
              const newPatternCell = newPatternColumn.splice(
                channelId,
                1,
                new PatternCell()
              )[0];
              if (newPattern[i + deltaX]) {
                newPatternCell.note =
                  newPatternCell.note !== null
                    ? (newPatternCell.note + deltaY + 12 * 6) % (12 * 6)
                    : null;
                if (selectedPatternCells.indexOf(i - deltaX) === -1) {
                  newPattern[i] = newPatternColumn;
                }
                newPattern[i + deltaX][channelId] = newPatternCell;
              } else if (i + deltaX < 0 || i + deltaX >= 64) {
                if (selectedPatternCells.indexOf(i - deltaX) === -1) {
                  newPattern[i][channelId] = new PatternCell();
                }
              }
            }
            setRenderPattern(newPattern);
            setRenderSelectedPatternCells(
              selectedPatternCells.map((i) => i + deltaX)
            );
          }
        }
      }
    },
    [
      cellSize,
      hoverNote,
      isMouseDown,
      song,
      selectedPatternCells,
      dispatch,
      moveNoteTo,
      channelId,
      currentInstrument,
      pattern,
      moveNoteFrom?.column,
      moveNoteFrom?.note,
    ]
  );

  const handleMouseLeave = useCallback(
    (_e: MouseEvent) => {
      if (hoverNote) {
        dispatch(trackerActions.setHoverNote(null));
      }
    },
    [hoverNote, dispatch]
  );

  const handleMouseUp = useCallback(
    (_e: MouseEvent) => {
      if (isDragging && isMouseDown && selectedPatternCells.length > 0) {
        if (pattern && renderPattern) {
          dispatch(
            trackerDocumentActions.editPattern({
              patternId: patternId,
              pattern: renderPattern,
            })
          );
          dispatch(
            trackerActions.setSelectedPatternCells(
              renderSelectedPatternCells.filter((c) => c >= 0 && c < 64)
            )
          );
        }
        setMoveNoteFrom({ note: 0, column: 0 });
        setMoveNoteTo({ note: 0, column: 0 });
      }
      setIsDragging(false);
      setIsMouseDown(false);
    },
    [
      isDragging,
      isMouseDown,
      selectedPatternCells,
      pattern,
      renderPattern,
      dispatch,
      patternId,
      renderSelectedPatternCells,
    ]
  );

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.nodeName !== "BODY") {
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        return;
      }

      if (e.key === "Backspace") {
        if (pattern) {
          const newPattern = cloneDeep(pattern);
          console.log(newPattern, selectedPatternCells, channelId);
          selectedPatternCells.forEach((i) => {
            console.log(newPattern[i]);
            newPattern[i].splice(channelId, 1, new PatternCell());
          });
          dispatch(trackerActions.setSelectedPatternCells([]));
          console.log(patternId, newPattern);
          dispatch(
            trackerDocumentActions.editPattern({
              patternId: patternId,
              pattern: newPattern,
            })
          );
        }
      }
      if (e.key === "Escape") {
        dispatch(trackerActions.setSelectedPatternCells([]));
        setIsDragging(false);
      }
    },
    [channelId, dispatch, pattern, patternId, selectedPatternCells]
  );

  // Keyboard handlers
  useEffect(() => {
    if (active) {
      window.addEventListener("keydown", onKeyDown);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
      };
    }
  }, [active, onKeyDown]);

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
      style={{
        cursor: isDragging ? "move" : "auto",
      }}
    >
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
                onMouseDown={handleNoteClick(columnIdx, cell)}
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
                  pointerEvents: isDragging ? "none" : "auto",
                  boxShadow:
                    isSelected && !isDragging ? "0 0 0px 2px #c92c61" : "",
                  zIndex: isSelected ? 1 : 0,
                  opacity: isSelected && isDragging ? 0.6 : 1,
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
