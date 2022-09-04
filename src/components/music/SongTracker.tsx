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
import { clamp, cloneDeep, mergeWith } from "lodash";

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
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
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
    } else if (selectionOrigin) {
      newSelectedTrackerFields.push(
        selectionOrigin.y * ROW_SIZE + selectionOrigin.x
      );
    }
    setSelectedTrackerFields(newSelectedTrackerFields);
  }, [selectionOrigin, selectionRect]);

  const [selectedTrackerRows, setSelectedTrackerRows] = useState<number[]>();
  useEffect(() => {
    const newSelectedTrackerRows = selectedTrackerFields?.map((f) =>
      Math.floor(f / ROW_SIZE)
    );

    setSelectedTrackerRows(newSelectedTrackerRows);
  }, [selectedTrackerFields]);

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
    if (activeField !== undefined) {
      const newChannelId = Math.floor(
        (activeField % ROW_SIZE) / CHANNEL_FIELDS
      );
      dispatch(trackerActions.setSelectedChannel(newChannelId));
      if (activeField % CHANNEL_FIELDS >= 2) {
        dispatch(
          trackerActions.setSelectedEffectCell(
            Math.floor(activeField / ROW_SIZE)
          )
        );
      }
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

  const transposeSelectedTrackerFields = useCallback(
    (change: number, large: boolean) => {
      if (pattern && selectedTrackerFields) {
        const newPattern = cloneDeep(pattern);
        for (let i = 0; i < selectedTrackerFields.length; i++) {
          const field = selectedTrackerFields[i];
          const newPatternCell = {
            ...newPattern[Math.floor(field / 16)][Math.floor(field / 4) % 4],
          };

          if (field % 4 === 0 && newPatternCell.note !== null) {
            newPatternCell.note = clamp(
              newPatternCell.note + (large ? change * 12 : change),
              0,
              71
            );
          }
          if (field % 4 === 1 && newPatternCell.instrument !== null) {
            newPatternCell.instrument = clamp(
              newPatternCell.instrument + (large ? change * 10 : change),
              0,
              14
            );
          }
          if (field % 4 === 2 && newPatternCell.effectcode !== null) {
            newPatternCell.effectcode = clamp(
              newPatternCell.effectcode + change,
              0,
              15
            );
          }
          if (field % 4 === 3 && newPatternCell.effectparam !== null) {
            newPatternCell.effectparam = clamp(
              newPatternCell.effectparam + (large ? change * 16 : change),
              0,
              255
            );
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
    },
    [dispatch, pattern, patternId, selectedTrackerFields]
  );

  const deleteSelectedTrackerFields = useCallback(() => {
    if (pattern && selectedTrackerFields) {
      const newPattern = cloneDeep(pattern);
      for (let i = 0; i < selectedTrackerFields.length; i++) {
        const field = selectedTrackerFields[i];
        const newPatternCell = {
          ...newPattern[Math.floor(field / 16)][Math.floor(field / 4) % 4],
        };

        switch (field % 4) {
          case 0:
            newPatternCell.note = null;
            break;
          case 1:
            newPatternCell.instrument = null;
            break;
          case 2:
            newPatternCell.effectcode = null;
            break;
          case 3:
            newPatternCell.effectparam = null;
            break;
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
  }, [dispatch, pattern, patternId, selectedTrackerFields]);

  const insertTrackerFields = useCallback(
    (uninsert: boolean) => {
      if (pattern && activeField) {
        const newChannelId = Math.floor(
          (activeField % ROW_SIZE) / CHANNEL_FIELDS
        );
        const startRow = Math.floor(activeField / ROW_SIZE);
        const newPattern = cloneDeep(pattern);
        if (uninsert) {
          for (let i = startRow; i < 63; i++) {
            newPattern[i][newChannelId] = newPattern[i + 1][newChannelId];
          }
        } else {
          for (let i = 63; i > startRow; i--) {
            newPattern[i][newChannelId] = newPattern[i - 1][newChannelId];
          }
        }
        newPattern[uninsert ? 63 : startRow][newChannelId] = {
          note: null,
          instrument: null,
          effectcode: null,
          effectparam: null,
        };
        dispatch(
          trackerDocumentActions.editPattern({
            patternId: patternId,
            pattern: newPattern,
          })
        );
      }
    },
    [dispatch, pattern, patternId, activeField]
  );

  const handleMouseDown = useCallback(
    (e: any) => {
      const fieldId = e.target.dataset["fieldid"];
      const rowId = e.target.dataset["row"];

      if (!!fieldId) {
        setIsMouseDown(true);

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

  const handleMouseUp = useCallback(
    (_e: any) => {
      if (isMouseDown) {
        setIsMouseDown(false);
      }
    },
    [isMouseDown]
  );

  const handleMouseMove = useCallback(
    (e: any) => {
      if (isMouseDown) {
        const fieldId = e.target.dataset["fieldid"];

        if (!!fieldId) {
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
        }
      }
    },
    [isMouseDown, selectionOrigin]
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
        if (value !== null) {
          editPatternCell("instrument")(defaultInstrument);
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

      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedTrackerFields(undefined);
        setSelectionOrigin(undefined);
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        if ((e.shiftKey || e.ctrlKey) && activeField) {
          e.preventDefault();
          insertTrackerFields(true);
          return;
        }
        if (selectedTrackerFields && selectedTrackerFields.length > 0) {
          e.preventDefault();
          deleteSelectedTrackerFields();
          return;
        }
      }

      if (e.key === "Insert" || e.key === "Enter") {
        if (activeField) {
          insertTrackerFields(false);
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

      switch (activeField % 4) {
        case 0:
          currentFocus = "noteColumnFocus";
          break;
        case 1:
          currentFocus = "instrumentColumnFocus";
          break;
        case 2:
          currentFocus = "effectCodeColumnFocus";
          break;
        case 3:
          currentFocus = "effectParamColumnFocus";
          break;
      }

      if (e.ctrlKey) {
        if (e.shiftKey) {
          if (e.key === "Q" || e.key === "+" || e.key === "=")
            return transposeSelectedTrackerFields(1, true);
          if (e.key === "A" || e.key === "_")
            return transposeSelectedTrackerFields(-1, true);
        } else {
          if (e.key === "=") return transposeSelectedTrackerFields(1, false);
          if (e.key === "-") return transposeSelectedTrackerFields(-1, false);
        }
        return;
      } else if (e.metaKey) {
        return;
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
      selectedTrackerFields,
      selectionRect,
      selectionOrigin,
      transposeSelectedTrackerFields,
      deleteSelectedTrackerFields,
      insertTrackerFields,
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

  const handleWheel = useCallback(
    (e: any) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY === 0 ? e.deltaX : e.deltaY;
        if (e.shiftKey) {
          if (delta < 0) return transposeSelectedTrackerFields(1, true);
          if (delta > 0) return transposeSelectedTrackerFields(-1, true);
        } else {
          if (delta < 0) return transposeSelectedTrackerFields(1, false);
          if (delta > 0) return transposeSelectedTrackerFields(-1, false);
        }
        return;
      }
    },
    [transposeSelectedTrackerFields]
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

      if (!selectionRect) {
        // Select single channel
        const offset = CHANNEL_FIELDS * channelId;
        setSelectionOrigin({ x: offset, y: 0 });
        setSelectionRect({
          x: offset,
          y: 0,
          width: 3,
          height: 63,
        });
      } else {
        // Select all channels
        setSelectionOrigin({ x: 0, y: 0 });
        setSelectionRect({ x: 0, y: 0, width: 15, height: 63 });
      }
    },
    [channelId, selectionRect]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeys);
    window.addEventListener("keyup", handleKeysUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeys);
      window.removeEventListener("keyup", handleKeysUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("wheel", handleWheel);
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
      dispatch(clipboardActions.copyText(parsedSelectedPattern));
    }
  }, [dispatch, pattern, selectedTrackerFields]);

  const onCut = useCallback(() => {
    if (pattern && selectedTrackerFields) {
      const parsedSelectedPattern = parsePatternFieldsToClipboard(
        pattern,
        selectedTrackerFields
      );
      dispatch(clipboardActions.copyText(parsedSelectedPattern));
      deleteSelectedTrackerFields();
    }
  }, [deleteSelectedTrackerFields, dispatch, pattern, selectedTrackerFields]);

  const onPaste = useCallback(() => {
    if (pattern) {
      const tempActiveField =
        activeField !== undefined
          ? activeField
          : selectionOrigin
          ? selectionOrigin.y * ROW_SIZE + selectionOrigin.x
          : 0;
      if (activeField === undefined) {
        setActiveField(tempActiveField);
      }
      const newPastedPattern = parseClipboardToPattern(clipboard.readText());
      if (newPastedPattern && channelId !== undefined) {
        const startRow = Math.floor(tempActiveField / ROW_SIZE);
        const newPattern = cloneDeep(pattern);
        for (let i = 0; i < newPastedPattern.length; i++) {
          const pastedPatternCellRow = newPastedPattern[i];
          for (let j = 0; j < 4 - channelId; j++) {
            if (pastedPatternCellRow[j] && newPattern[startRow + i]) {
              newPattern[startRow + i][channelId + j] = mergeWith(
                newPattern[startRow + i][channelId + j],
                pastedPatternCellRow[j],
                (o, s) => (s === -9 ? o : s)
              );
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
  }, [activeField, channelId, dispatch, pattern, patternId, selectionOrigin]);

  // Clipboard
  useEffect(() => {
    window.addEventListener("copy", onCopy);
    window.addEventListener("cut", onCut);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("cut", onCut);
      window.removeEventListener("paste", onPaste);
    };
  }, [onCopy, onCut, onPaste]);

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
            const isSelected = selectedTrackerRows?.indexOf(i) !== -1;
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
                    !isPlaying && isSelected ? selectedTrackerFields || [] : []
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
