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
import {
  getInstrumentTypeByChannel,
  getInstrumentListByType,
  parseClipboardToPattern,
  parsePatternFieldsToClipboard,
} from "./helpers";
import { getKeys, KeyWhen } from "lib/keybindings/keyBindings";
import trackerActions from "store/features/tracker/trackerActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { clipboard } from "store/features/clipboard/clipboardHelpers";
import { cloneDeep } from "lodash";

interface SongTrackerProps {
  sequenceId: number;
  song: Song | null;
  height: number;
  channelStatus: boolean[];
}

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
}

const CHANNEL_FIELDS = 4;
const ROW_SIZE = CHANNEL_FIELDS * 4;
const NUM_FIELDS = ROW_SIZE * 64;

const SongGrid = styled.div`
  white-space: nowrap;
  border-width: 0 0 0 1px;
  border-color: ${(props) => props.theme.colors.sidebar.border};
  border-style: solid;
`;

const SongGridHeader = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  left: 94px;
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
  const startPlaybackPosition = useSelector(
    (state: RootState) => state.tracker.startPlaybackPosition
  );

  const patternId = song?.sequence[sequenceId] || 0;
  const pattern = song?.patterns[patternId];

  const [selectedTrackerFields, setSelectedTrackerFields] =
    useState<number[]>();
  const [selectionOrigin, setSelectionOrigin] =
    useState<Position | undefined>();
  const [selectionRect, setSelectionRect] =
    useState<SelectionRect | undefined>();
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    console.log(selectionRect);
    const newSelectedTrackerFields = [];
    if (selectionRect) {
      for (
        let i = selectionRect.x;
        i <= selectionRect.x + selectionRect.width;
        i++
      ) {
        for (
          let j = selectionRect.y;
          j <= selectionRect.y + selectionRect.height;
          j++
        ) {
          newSelectedTrackerFields.push(j * ROW_SIZE + i);
        }
      }
    }
    setSelectedTrackerFields(newSelectedTrackerFields);
    console.log(newSelectedTrackerFields);
  }, [selectionOrigin, selectionRect]);

  const [playbackState, setPlaybackState] = useState([0, 0]);

  useEffect(() => {
    setPlaybackState(startPlaybackPosition);
  }, [setPlaybackState, startPlaybackPosition]);
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

  const [activeField, setActiveField] = useState<number | undefined>();
  const channelId = useSelector(
    (state: RootState) => state.tracker.selectedChannel
  );

  useEffect(() => {
    if (activeField) {
      const newChannelId = Math.floor(
        (activeField % ROW_SIZE) / CHANNEL_FIELDS
      );
      dispatch(trackerActions.setSelectedChannel(newChannelId));
      console.log(newChannelId);
    }
  }, [activeField, dispatch]);

  const playingRowRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (playingRowRef && playingRowRef.current) {
      if (playing) {
        playingRowRef.current.scrollIntoView({
          behavior: "auto",
          block: "center",
          inline: "nearest",
        });
      }
    }
  }, [playing, playbackState]);

  const activeFieldRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (activeFieldRef && activeFieldRef.current) {
      if (!playing) {
        scrollIntoView(activeFieldRef.current.parentElement as Element, {
          scrollMode: "if-needed",
          block: "nearest",
        });
      }
    }
  }, [playing, activeField]);

  const handleMouseDown = useCallback(
    (e: any) => {
      const fieldId = e.target.dataset["fieldid"];
      const rowId = e.target.dataset["row"];

      if (!!fieldId) {
        if (e.shiftKey) {
          setIsSelecting(true);

          const newActiveField =
            ((parseInt(fieldId) % NUM_FIELDS) + NUM_FIELDS) % NUM_FIELDS;

          if (selectionOrigin) {
            const x2 = newActiveField % ROW_SIZE;
            const y2 = Math.floor(newActiveField / ROW_SIZE);

            const x = Math.min(selectionOrigin.x, x2);
            const y = Math.min(selectionOrigin.y, y2);
            const width = Math.abs(selectionOrigin.x - x2);
            const height = Math.abs(selectionOrigin.y - y2);
            setSelectionRect({ x, y, width, height });
          }
          setActiveField(parseInt(fieldId));
        } else {
          setActiveField(parseInt(fieldId));
          const x = parseInt(fieldId) % ROW_SIZE;
          const y = Math.floor(parseInt(fieldId) / ROW_SIZE);
          setSelectionOrigin({ x, y });
          setSelectionRect(undefined);
        }
      } else if (rowId) {
        dispatch(
          trackerActions.setDefaultStartPlaybackPosition([
            sequenceId,
            parseInt(rowId),
          ])
        );
        ipcRenderer.send("music-data-send", {
          action: "position",
          position: [sequenceId, parseInt(rowId)],
        });
      } else {
        setActiveField(undefined);
      }
    },
    [dispatch, selectionOrigin, sequenceId]
  );

  const handleKeys = useCallback(
    (e: KeyboardEvent) => {
      const editPatternCell =
        (type: keyof PatternCell) => (value: number | null) => {
          if (activeField === undefined) {
            return;
          }
          dispatch(
            trackerDocumentActions.editPatternCell({
              patternId: patternId,
              cell: [
                Math.floor(activeField / 16),
                Math.floor(activeField / 4) % 4,
              ],
              changes: {
                [type]: value,
              },
            })
          );
        };

      const transposeNoteCell = (value: number) => {
        if (activeField === undefined) {
          return;
        }
        dispatch(
          trackerDocumentActions.transposeNoteCell({
            patternId: patternId,
            cellId: activeField,
            transpose: value,
          })
        );
      };

      const editNoteField = (value: number | null) => {
        if (activeField === undefined) {
          return;
        }

        const channel = Math.floor(activeField / 4) % 4;
        const defaultInstrument = defaultInstruments[channel];

        if (song && value !== null) {
          const instrumentType = getInstrumentTypeByChannel(channel) || "duty";
          const instrumentList = getInstrumentListByType(song, instrumentType);
          ipcRenderer.send("music-data-send", {
            action: "preview",
            note: value + octaveOffset * 12,
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
          setActiveField(activeField + ROW_SIZE * editStep);
        }
      };

      const editInstrumentField = (value: number | null) => {
        if (activeFieldRef && activeFieldRef.current) {
          const el = activeFieldRef.current;
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

      const editEffectCodeField = (value: number | null) => {
        editPatternCell("effectcode")(value);
      };

      const editEffectParamField = (value: number | null) => {
        if (activeFieldRef && activeFieldRef.current) {
          const el = activeFieldRef.current;
          let newValue = value;
          if (value !== null && el.innerText !== "..") {
            newValue = 16 * parseInt(el.innerText[1], 16) + value;
          }
          editPatternCell("effectparam")(newValue);
        }
      };

      const deleteSelectedTrackerFields = () => {
        if (pattern && selectedTrackerFields) {
          const newPattern = cloneDeep(pattern);
          for (let i = 0; i < selectedTrackerFields.length; i++) {
            const field = selectedTrackerFields[i];
            const newPatternCell = {
              ...newPattern[Math.floor(field / 16)][Math.floor(field / 4) % 4],
            };

            if (field % 4 === 0) {
              newPatternCell.note = null;
            }
            if ((field - 1) % 4 === 0) {
              newPatternCell.instrument = null;
            }
            if ((field - 2) % 4 === 0) {
              newPatternCell.effectcode = null;
            }
            if ((field - 3) % 4 === 0) {
              newPatternCell.effectparam = null;
            }

            newPattern[Math.floor(field / 16)][Math.floor(field / 4) % 4] =
              newPatternCell;
          }
          dispatch(
            trackerDocumentActions.editPattern({
              patternId: patternId,
              pattern: newPattern,
            })
          );
        }
      };

      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedTrackerFields(undefined);
        setSelectionOrigin(undefined);
      }

      if (e.key === "Backspace") {
        if (selectedTrackerFields && selectedTrackerFields.length > 0) {
          e.preventDefault();
          deleteSelectedTrackerFields();
          return;
        }
      }

      if (activeField === undefined) {
        return;
      }

      let tmpActiveField = activeField;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        tmpActiveField -= 1;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        tmpActiveField += 1;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        tmpActiveField += ROW_SIZE;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        tmpActiveField -= ROW_SIZE;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          tmpActiveField -= 4;
        } else {
          tmpActiveField += 4;
        }
      }
      if (e.shiftKey && !isSelecting) {
        setIsSelecting(true);
        if (!selectionRect) {
          const x = activeField % ROW_SIZE;
          const y = Math.floor(activeField / ROW_SIZE);
          setSelectionOrigin({
            x,
            y,
          });
        }
      }
      if (activeField !== tmpActiveField) {
        const newActiveField =
          ((tmpActiveField % NUM_FIELDS) + NUM_FIELDS) % NUM_FIELDS;

        if (isSelecting && selectionOrigin) {
          const x2 = newActiveField % ROW_SIZE;
          const y2 = Math.floor(newActiveField / ROW_SIZE);

          const x = Math.min(selectionOrigin.x, x2);
          const y = Math.min(selectionOrigin.y, y2);
          const width = Math.abs(selectionOrigin.x - x2);
          const height = Math.abs(selectionOrigin.y - y2);

          setSelectionRect({ x, y, width, height });
        } else {
          setSelectionOrigin(undefined);
          setSelectionRect(undefined);
        }

        setActiveField(newActiveField);
      }

      let currentFocus: KeyWhen = null;

      if (activeField % 4 === 0) {
        if (e.ctrlKey) {
          if (e.shiftKey) {
            if (e.key === "Q" || e.key === "+") return transposeNoteCell(12);
            if (e.key === "A" || e.key === "_") return transposeNoteCell(-12);
          } else {
            if (e.key === "q" || e.key === "=") return transposeNoteCell(1);
            if (e.key === "a" || e.key === "-") return transposeNoteCell(-1);
          }
          return;
        } else if (e.metaKey) {
          return;
        }

        currentFocus = "noteColumnFocus";
      }
      if ((activeField - 1) % 4 === 0) {
        currentFocus = "instrumentColumnFocus";
      }
      if ((activeField - 2) % 4 === 0) {
        currentFocus = "effectCodeColumnFocus";
      }
      if ((activeField - 3) % 4 === 0) {
        currentFocus = "effectParamColumnFocus";
      }

      if (currentFocus && !e.metaKey && !e.ctrlKey && !e.altKey) {
        getKeys(e.key, currentFocus, {
          editNoteField,
          editInstrumentField,
          editEffectCodeField,
          editEffectParamField,
        });
      }
    },
    [
      activeField,
      isSelecting,
      dispatch,
      patternId,
      defaultInstruments,
      song,
      octaveOffset,
      editStep,
      pattern,
      selectedTrackerFields,
      selectionRect,
      selectionOrigin,
    ]
  );

  const handleKeysUp = useCallback(
    (e: KeyboardEvent) => {
      if (activeField) {
        // console.log(e.key);
      }
      if (!e.shiftKey) {
        setIsSelecting(false);
      }
    },
    [activeField]
  );

  const onSelectAll = useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();

      const selection = window.getSelection();
      if (!selection || selection.focusNode) {
        return;
      }
      window.getSelection()?.empty();

      const offset = CHANNEL_FIELDS * channelId;
      setSelectionOrigin({ x: offset, y: 0 });
      setSelectionRect({
        x: offset,
        y: 0,
        width: 3,
        height: 63,
      });
    },
    [channelId]
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

  useEffect(() => {
    document.addEventListener("selectionchange", onSelectAll);

    return () => {
      document.removeEventListener("selectionchange", onSelectAll);
    };
  });

  const onFocus = useCallback(
    (_e: React.FocusEvent<HTMLDivElement>) => {
      if (!activeField) {
        setActiveField(0);
      }
    },
    [activeField, setActiveField]
  );

  const onBlur = useCallback(
    (_e: React.FocusEvent<HTMLDivElement>) => {
      setActiveField(undefined);
    },
    [setActiveField]
  );

  const onCopy = useCallback(() => {
    if (pattern && selectedTrackerFields) {
      // const parsedSelectedPattern = parsePatternToClipboard(pattern);
      const parsedSelectedPattern = parsePatternFieldsToClipboard(
        pattern,
        selectedTrackerFields
      );
      // console.log(parsedSelectedPattern);
      dispatch(clipboardActions.copyText(parsedSelectedPattern));
    }
  }, [dispatch, pattern, selectedTrackerFields]);

  const onPaste = useCallback(() => {
    if (pattern) {
      const newPastedPattern = parseClipboardToPattern(clipboard.readText());
      if (
        newPastedPattern &&
        activeField !== undefined &&
        channelId !== undefined
      ) {
        const startRow = Math.floor(activeField / ROW_SIZE);
        const newPattern = cloneDeep(pattern);
        for (let i = 0; i < newPastedPattern.length; i++) {
          const pastedPatternCellRow = newPastedPattern[i];
          for (let j = 0; j < 4 - channelId; j++) {
            if (pastedPatternCellRow[j]) {
              newPattern[startRow + i][channelId + j] = pastedPatternCellRow[j];
            }
          }
        }
        console.log(newPattern);
        dispatch(
          trackerDocumentActions.editPattern({
            patternId: patternId,
            pattern: newPattern,
          })
        );
      }
    }
  }, [activeField, channelId, dispatch, pattern, patternId]);

  // Clipboard
  useEffect(() => {
    window.addEventListener("copy", onCopy);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("paste", onPaste);
    };
  }, [onCopy, onPaste]);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
      }}
    >
      <div style={{ position: "relative", minWidth: "93px" }}>
        <SequenceEditor
          direction="vertical"
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
          {pattern?.map((row: PatternCell[], i: number) => {
            const isActiveRow =
              activeField !== undefined &&
              Math.floor(activeField / ROW_SIZE) === i;
            const isPlaying =
              playbackState[0] === sequenceId && playbackState[1] === i;
            return (
              <span ref={isPlaying ? playingRowRef : null}>
                <SongRow
                  id={`__${i}`}
                  n={i}
                  row={row}
                  fieldCount={i * ROW_SIZE}
                  activeField={isActiveRow ? activeField : undefined}
                  isActive={isActiveRow}
                  isPlaying={isPlaying}
                  ref={activeFieldRef}
                  selectedTrackerFields={
                    !isPlaying ? selectedTrackerFields || [] : []
                  }
                />
              </span>
            );
          })}
        </SongGrid>
      </div>
    </div>
  );
};
