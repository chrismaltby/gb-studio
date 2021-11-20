import React, { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { PatternCell } from "lib/helpers/uge/song/PatternCell";
import { Song } from "lib/helpers/uge/song/Song";
import { RootState } from "store/configureStore";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
import { SplitPaneHorizontalDivider } from "ui/splitpane/SplitPaneDivider";
import { SequenceEditor } from "./SequenceEditor";
import { SongRow } from "./SongRow";
import scrollIntoView from "scroll-into-view-if-needed";
import { SongGridHeaderCell } from "./SongGridHeaderCell";
import { ipcRenderer } from "electron";
import { getInstrumentTypeByChannel, getInstrumentListByType } from "./helpers";

interface SongTrackerProps {
  sequenceId: number;
  song: Song | null;
  height: number;
  channelStatus: boolean[];
}

const COLUMN_CELLS = 4;
const ROW_SIZE = COLUMN_CELLS * 4;
const NUM_CELLS = ROW_SIZE * 64;

const SongGrid = styled.div`
  white-space: nowrap;
  border-width: 0 0 0 1px;
  border-color: ${(props) => props.theme.colors.sidebar.border};
  border-style: solid;
`;

const SongGridHeader = styled.div`
  display: flex;
  position: -webkit-sticky;
  position: absolute;
  top: 0;
  left: 90px;
  z-index: 1;
  white-space: nowrap;
  background: ${(props) => props.theme.colors.tracker.background};
  border-width: 0 0 1px 1px;
  border-color: ${(props) => props.theme.colors.tracker.border};
  border-style: solid;
`;

export const SongTracker = ({
  song,
  sequenceId,
  height,
  channelStatus,
}: SongTrackerProps) => {
  const dispatch = useDispatch();

  const playing = useSelector((state: RootState) => state.tracker.playing);
  const editStep = useSelector((state: RootState) => state.tracker.editStep);
  const defaultInstruments = useSelector(
    (state: RootState) => state.tracker.defaultInstruments
  );
  const octaveOffset = useSelector(
    (state: RootState) => state.tracker.octaveOffset
  );

  const patternId = song?.sequence[sequenceId] || 0;

  const [playbackState, setPlaybackState] = useState([0, 0]);
  useEffect(() => {
    const listener = (_event: any, d: any) => {
      if (d.action === "update") {
        setPlaybackState(d.update);
      }
    };
    ipcRenderer.on("music-data", listener);

    return () => {
      ipcRenderer.removeListener("music-data", listener);
    };
  }, [setPlaybackState]);

  const [selectedCell, setSelectedCell] = useState<number | undefined>();

  const playingRowRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (playingRowRef && playingRowRef.current) {
      if (playing) {
        playingRowRef.current.scrollIntoView();
      }
    }
  }, [playing, playbackState]);

  const selectedCellRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (selectedCellRef && selectedCellRef.current) {
      if (!playing) {
        scrollIntoView(selectedCellRef.current.parentElement as Element, {
          scrollMode: "if-needed",
          block: "nearest",
        });
      }
    }
  }, [playing, selectedCell]);

  const handleMouseDown = useCallback((e: any) => {
    const cellId = e.target.dataset["cellid"];
    if (!!cellId) {
      setSelectedCell(parseInt(cellId));
    } else {
      setSelectedCell(undefined);
    }
  }, []);

  const handleKeys = useCallback(
    (e: KeyboardEvent) => {
      const editPatternCell =
        (type: keyof PatternCell) => (value: number | null) => {
          if (selectedCell === undefined) {
            return;
          }
          dispatch(
            trackerDocumentActions.editPatternCell({
              patternId: patternId,
              cell: [
                Math.floor(selectedCell / 16),
                Math.floor(selectedCell / 4) % 4,
              ],
              changes: {
                [type]: value,
              },
            })
          );
        };

      const transposeNoteCell = (value: number) => {
        if (selectedCell === undefined) {
          return;
        }
        dispatch(
          trackerDocumentActions.transposeNoteCell({
            patternId: patternId,
            cellId: selectedCell,
            transpose: value,
          })
        );
      };

      const editNoteCell = (value: number | null) => {
        if (selectedCell === undefined) {
          return;
        }

        const channel = Math.floor(selectedCell / 4) % 4;
        const defaultInstrument = defaultInstruments[channel];

        if (song && value !== null) {
          const instrumentType = getInstrumentTypeByChannel(channel) || "duty";
          const instrumentList = getInstrumentListByType(song, instrumentType);
          ipcRenderer.send("music-data-send", {
            action: "preview",
            note: value,
            type: instrumentType,
            instrument: instrumentList[defaultInstrument],
            square2: channel === 1,
          });
        }

        editPatternCell("note")(
          value === null ? null : value + octaveOffset * 12
        );
        editPatternCell("instrument")(defaultInstrument);

        if (value !== null) {
          setSelectedCell(selectedCell + ROW_SIZE * editStep);
        }
      };

      const editInstrumentCell = (value: number | null) => {
        if (selectedCellRef && selectedCellRef.current) {
          const el = selectedCellRef.current;
          let newValue = value;
          if (
            value !== null &&
            el.innerText !== ".." &&
            el.innerText !== "15"
          ) {
            newValue = 10 * parseInt(el.innerText[1]) + value;
            if (newValue > 15) newValue = 15;
          }
          editPatternCell("instrument")(
            newValue === null ? null : newValue - 1
          );
        }
      };

      const editEffectCodeCell = (value: number | null) => {
        editPatternCell("effectcode")(value);
      };

      const editEffectParamCell = (value: number | null) => {
        if (selectedCellRef && selectedCellRef.current) {
          const el = selectedCellRef.current;
          let newValue = value;
          if (value !== null && el.innerText !== "..") {
            newValue = 16 * parseInt(el.innerText[1], 16) + value;
          }
          editPatternCell("effectparam")(newValue);
        }
      };

      if (selectedCell === undefined) {
        return;
      }

      let tmpSelectedCell = selectedCell;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        tmpSelectedCell -= 1;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        tmpSelectedCell += 1;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        tmpSelectedCell += ROW_SIZE;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        tmpSelectedCell -= ROW_SIZE;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          tmpSelectedCell -= 4;
        } else {
          tmpSelectedCell += 4;
        }
      }
      setSelectedCell(((tmpSelectedCell % NUM_CELLS) + NUM_CELLS) % NUM_CELLS);

      if (selectedCell % 4 === 0) {
        if (e.ctrlKey) {
          if (e.shiftKey) {
            if (e.key === "Q") return transposeNoteCell(12);
            if (e.key === "A") return transposeNoteCell(-12);
          } else {
            if (e.key === "q") return transposeNoteCell(1);
            if (e.key === "a") return transposeNoteCell(-1);
          }
          return;
        } else if (e.metaKey) {
          return;
        }

        if (e.key === "q") editNoteCell(0);
        if (e.key === "w") editNoteCell(1);
        if (e.key === "e") editNoteCell(2);
        if (e.key === "r") editNoteCell(3);
        if (e.key === "t") editNoteCell(4);
        if (e.key === "y") editNoteCell(5);
        if (e.key === "u") editNoteCell(6);
        if (e.key === "i") editNoteCell(7);
        if (e.key === "o") editNoteCell(8);
        if (e.key === "p") editNoteCell(9);
        if (e.key === "[") editNoteCell(10);
        if (e.key === "]") editNoteCell(11);
        if (e.key === "a") editNoteCell(12);
        if (e.key === "s") editNoteCell(13);
        if (e.key === "d") editNoteCell(14);
        if (e.key === "f") editNoteCell(15);
        if (e.key === "g") editNoteCell(16);
        if (e.key === "h") editNoteCell(17);
        if (e.key === "j") editNoteCell(18);
        if (e.key === "k") editNoteCell(19);
        if (e.key === "l") editNoteCell(20);
        if (e.key === ";") editNoteCell(21);
        if (e.key === "'") editNoteCell(22);
        //if (e.key === "??") editNoteCell(23);
        if (e.key === "z") editNoteCell(24);
        if (e.key === "x") editNoteCell(25);
        if (e.key === "c") editNoteCell(26);
        if (e.key === "v") editNoteCell(27);
        if (e.key === "b") editNoteCell(28);
        if (e.key === "n") editNoteCell(29);
        if (e.key === "m") editNoteCell(30);
        if (e.key === ",") editNoteCell(31);
        if (e.key === ".") editNoteCell(32);
        if (e.key === "/") editNoteCell(33);
        //if (e.code == "??") editNoteCell(34);
        //if (e.code == "??") editNoteCell(35);
        if (e.code === "Delete" || e.code === "Backspace") editNoteCell(null);
      }
      if ((selectedCell - 1) % 4 === 0) {
        if (e.key === "0") editInstrumentCell(0);
        if (e.key === "1") editInstrumentCell(1);
        if (e.key === "2") editInstrumentCell(2);
        if (e.key === "3") editInstrumentCell(3);
        if (e.key === "4") editInstrumentCell(4);
        if (e.key === "5") editInstrumentCell(5);
        if (e.key === "6") editInstrumentCell(6);
        if (e.key === "7") editInstrumentCell(7);
        if (e.key === "8") editInstrumentCell(8);
        if (e.key === "9") editInstrumentCell(9);
        if (e.code === "Delete" || e.code === "Backspace")
          editInstrumentCell(null);
      }
      if ((selectedCell - 2) % 4 === 0) {
        if (e.key === "0") editEffectCodeCell(0);
        if (e.key === "1") editEffectCodeCell(1);
        if (e.key === "2") editEffectCodeCell(2);
        if (e.key === "3") editEffectCodeCell(3);
        if (e.key === "4") editEffectCodeCell(4);
        if (e.key === "5") editEffectCodeCell(5);
        if (e.key === "6") editEffectCodeCell(6);
        if (e.key === "7") editEffectCodeCell(7);
        if (e.key === "8") editEffectCodeCell(8);
        if (e.key === "9") editEffectCodeCell(9);
        if (e.key === "a") editEffectCodeCell(10);
        if (e.key === "b") editEffectCodeCell(11);
        if (e.key === "c") editEffectCodeCell(12);
        if (e.key === "d") editEffectCodeCell(13);
        if (e.key === "e") editEffectCodeCell(14);
        if (e.key === "f") editEffectCodeCell(15);
        if (e.code === "Delete" || e.code === "Backspace")
          editEffectCodeCell(null);
      }
      if ((selectedCell - 3) % 4 === 0) {
        if (e.key === "0") editEffectParamCell(0);
        if (e.key === "1") editEffectParamCell(1);
        if (e.key === "2") editEffectParamCell(2);
        if (e.key === "3") editEffectParamCell(3);
        if (e.key === "4") editEffectParamCell(4);
        if (e.key === "5") editEffectParamCell(5);
        if (e.key === "6") editEffectParamCell(6);
        if (e.key === "7") editEffectParamCell(7);
        if (e.key === "8") editEffectParamCell(8);
        if (e.key === "9") editEffectParamCell(9);
        if (e.key === "a") editEffectParamCell(10);
        if (e.key === "b") editEffectParamCell(11);
        if (e.key === "c") editEffectParamCell(12);
        if (e.key === "d") editEffectParamCell(13);
        if (e.key === "e") editEffectParamCell(14);
        if (e.key === "f") editEffectParamCell(15);
        if (e.code === "Delete" || e.code === "Backspace")
          editEffectParamCell(null);
      }
    },
    [dispatch, editStep, octaveOffset, patternId, selectedCell]
  );

  const handleKeysUp = useCallback(
    (_e: KeyboardEvent) => {
      if (selectedCell) {
        // console.log(e.key);
      }
    },
    [selectedCell]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeys);
    window.addEventListener("keyup", handleKeysUp);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeys);
      window.removeEventListener("keyup", handleKeysUp);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  });

  const onFocus = useCallback(
    (_e: React.FocusEvent<HTMLDivElement>) => {
      if (!selectedCell) {
        setSelectedCell(0);
      }
    },
    [selectedCell, setSelectedCell]
  );

  const onBlur = useCallback(
    (_e: React.FocusEvent<HTMLDivElement>) => {
      setSelectedCell(undefined);
    },
    [setSelectedCell]
  );

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
      }}
    >
      <div style={{ position: "relative", minWidth: "85px" }}>
        <SequenceEditor
          sequence={song?.sequence}
          patterns={song?.patterns.length}
          playingSequence={playbackState[0]}
          height={height}
        />
      </div>
      <SplitPaneHorizontalDivider />
      <SongGridHeader>
        <SongGridHeaderCell size="small"></SongGridHeaderCell>
        <SongGridHeaderCell channel={0} muted={channelStatus[0]}>
          Duty 1
        </SongGridHeaderCell>
        <SongGridHeaderCell channel={1} muted={channelStatus[1]}>
          Duty 2
        </SongGridHeaderCell>
        <SongGridHeaderCell channel={2} muted={channelStatus[2]}>
          Wave
        </SongGridHeaderCell>
        <SongGridHeaderCell channel={3} muted={channelStatus[3]}>
          Noise
        </SongGridHeaderCell>
      </SongGridHeader>
      <div
        style={{
          position: "relative",
          overflow: "hidden auto",
          flexGrow: 1,
          height: height - 29,
          marginTop: "29px",
        }}
      >
        <SongGrid tabIndex={0} onFocus={onFocus} onBlur={onBlur}>
          {song?.patterns[patternId]?.map((row: PatternCell[], i: number) => {
            const isSelected =
              selectedCell !== undefined &&
              Math.floor(selectedCell / ROW_SIZE) === i;
            return (
              <span ref={playbackState[1] === i ? playingRowRef : null}>
                <SongRow
                  id={`__${i}`}
                  n={i}
                  row={row}
                  startCellId={i * ROW_SIZE}
                  selectedCell={isSelected ? selectedCell : undefined}
                  isSelected={isSelected}
                  isPlaying={playbackState[1] === i}
                  ref={selectedCellRef}
                />
              </span>
            );
          })}
        </SongGrid>
      </div>
    </div>
  );
};
