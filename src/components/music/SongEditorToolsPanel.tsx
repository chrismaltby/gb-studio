import React, { useCallback, useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import styled, { ThemeContext } from "styled-components";
import {
  PlayIcon,
  PauseIcon,
  SaveIcon,
  PencilIcon,
  EraserIcon,
  TrackerIcon,
  SelectionIcon,
  PianoIcon,
  PianoInverseIcon,
  StopIcon,
  PlayStartIcon,
} from "ui/icons/Icons";
import FloatingPanel, { FloatingPanelDivider } from "ui/panels/FloatingPanel";
import trackerActions from "store/features/tracker/trackerActions";
import { Button } from "ui/buttons/Button";
import { Music } from "shared/lib/entities/entitiesTypes";
import { saveSongFile } from "store/features/trackerDocument/trackerDocumentState";
import { InstrumentSelect } from "./InstrumentSelect";
import { Select } from "ui/form/Select";
import { PianoRollToolType } from "store/features/tracker/trackerState";
import l10n from "shared/lib/lang/l10n";
import { InstrumentType } from "store/features/editor/editorState";
import API from "renderer/lib/api";
import { useAppSelector } from "store/hooks";

const octaveOffsetOptions: OctaveOffsetOptions[] = [0, 1, 2, 3].map((i) => ({
  value: i,
  label: `Octave ${i + 3}`,
}));

interface OctaveOffsetOptions {
  value: number;
  label: string;
}

interface SongEditorToolsPanelProps {
  selectedSong?: Music;
}

const FloatingPanelSwitchView = styled(FloatingPanel)`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
`;

const FloatingPanelTools = styled(FloatingPanel)`
  position: absolute;
  top: 10px;
  left: 64px;
  z-index: 10;
`;

const getPlayButtonLabel = (play: boolean, playbackFromStart: boolean) => {
  if (play) {
    return l10n("FIELD_PAUSE");
  } else {
    if (playbackFromStart) {
      return l10n("FIELD_RESTART");
    } else {
      return l10n("FIELD_PLAY");
    }
  }
};

const SongEditorToolsPanel = ({ selectedSong }: SongEditorToolsPanelProps) => {
  const dispatch = useDispatch();

  const play = useAppSelector((state) => state.tracker.playing);
  const playerReady = useAppSelector((state) => state.tracker.playerReady);
  const subpatternEditorFocus = useAppSelector(
    (state) => state.tracker.subpatternEditorFocus
  );

  const modified = useAppSelector(
    (state) => state.trackerDocument.present.modified
  );

  const view = useAppSelector((state) => state.tracker.view);

  const tool = useAppSelector((state) => state.tracker.tool);
  const [previousTool, setPreviousTool] = useState<PianoRollToolType>();
  const [tmpSelectionMode, setTmpSelectionMode] = useState(false);

  const defaultStartPlaybackPosition = useAppSelector(
    (state) => state.tracker.defaultStartPlaybackPosition
  );

  const [playbackFromStart, setPlaybackFromStart] = useState(false);

  const togglePlay = useCallback(() => {
    if (!playerReady) return;
    if (!play) {
      if (playbackFromStart) {
        API.music.sendToMusicWindow({
          action: "position",
          position: defaultStartPlaybackPosition,
        });
      }
      dispatch(trackerActions.playTracker());
    } else {
      dispatch(trackerActions.pauseTracker());
    }
  }, [
    defaultStartPlaybackPosition,
    dispatch,
    play,
    playbackFromStart,
    playerReady,
  ]);

  const stopPlayback = useCallback(() => {
    dispatch(trackerActions.stopTracker());
    API.music.sendToMusicWindow({
      action: "stop",
      position: defaultStartPlaybackPosition,
    });
  }, [defaultStartPlaybackPosition, dispatch]);

  const toggleView = useCallback(() => {
    if (view === "tracker") {
      dispatch(trackerActions.toggleView("roll"));
    } else {
      dispatch(trackerActions.toggleView("tracker"));
    }
  }, [dispatch, view]);

  const setTool = useCallback(
    (newTool: PianoRollToolType) => {
      setPreviousTool(tool);
      dispatch(trackerActions.setTool(newTool));
    },
    [dispatch, tool]
  );

  const saveSong = useCallback(() => {
    if (selectedSong && modified) {
      dispatch(saveSongFile());
    }
  }, [dispatch, modified, selectedSong]);

  const defaultInstruments = useAppSelector(
    (state) => state.tracker.defaultInstruments
  );

  const setDefaultInstruments = useCallback(
    (instrument: number) => {
      dispatch(
        trackerActions.setDefaultInstruments([
          instrument,
          instrument,
          instrument,
          instrument,
        ])
      );
    },
    [dispatch]
  );

  const octaveOffset = useAppSelector((state) => state.tracker.octaveOffset);

  const setOctaveOffset = useCallback(
    (offset: number) => {
      dispatch(trackerActions.setOctaveOffset(offset));
    },
    [dispatch]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target && (e.target as Node).nodeName === "INPUT") {
        return;
      }
      if (!tmpSelectionMode && e.shiftKey) {
        setTmpSelectionMode(true);
        setTool("selection");
      }
      if (e.ctrlKey || e.shiftKey) {
        return;
      }
      if (e.altKey) {
        setPlaybackFromStart(true);
      }
      if (e.key === "`") {
        toggleView();
      }
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
      if (view !== "roll") {
        return;
      }
      if (!subpatternEditorFocus) {
        if (e.code === "Digit1") {
          setDefaultInstruments(0);
        } else if (e.code === "Digit2") {
          setDefaultInstruments(1);
        } else if (e.code === "Digit3") {
          setDefaultInstruments(2);
        } else if (e.code === "Digit4") {
          setDefaultInstruments(3);
        } else if (e.code === "Digit5") {
          setDefaultInstruments(4);
        } else if (e.code === "Digit6") {
          setDefaultInstruments(5);
        } else if (e.code === "Digit7") {
          setDefaultInstruments(6);
        } else if (e.code === "Digit8") {
          setDefaultInstruments(7);
        } else if (e.code === "Digit9") {
          setDefaultInstruments(8);
        }
      }
    },
    [
      tmpSelectionMode,
      view,
      subpatternEditorFocus,
      setTool,
      toggleView,
      togglePlay,
      setDefaultInstruments,
    ]
  );

  const onKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (!e.altKey) {
        setPlaybackFromStart(false);
      }
      if (tmpSelectionMode && !e.shiftKey) {
        setTool(previousTool || "pencil");
        setTmpSelectionMode(false);
      }
    },
    [tmpSelectionMode, setTool, previousTool]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  const song = useAppSelector((state) => state.trackerDocument.present.song);
  const selectedChannel = useAppSelector(
    (state) => state.tracker.selectedChannel
  );
  const [instrumentType, setInstrumentType] =
    useState<InstrumentType | undefined>();
  useEffect(() => {
    if (view === "roll") {
      switch (selectedChannel) {
        case 0:
        case 1:
          setInstrumentType("duty");
          break;
        case 2:
          setInstrumentType("wave");
          break;
        case 3:
          setInstrumentType("noise");
          break;
      }
    } else {
      setInstrumentType(undefined);
    }
  }, [view, setInstrumentType, song, selectedChannel]);

  const themeContext = useContext(ThemeContext);

  const themePianoIcon =
    themeContext.type === "light" ? <PianoIcon /> : <PianoInverseIcon />;

  return (
    <>
      <FloatingPanelSwitchView>
        <Button
          variant="transparent"
          onClick={toggleView}
          title={
            view === "roll"
              ? l10n("TOOL_TRACKER_VIEW")
              : l10n("TOOL_PIANO_ROLL_VIEW")
          }
        >
          {view === "roll" ? <TrackerIcon /> : themePianoIcon}
        </Button>
      </FloatingPanelSwitchView>

      <FloatingPanelTools>
        <Button
          variant="transparent"
          disabled={!selectedSong || !modified}
          onClick={saveSong}
          title={l10n("FIELD_SAVE")}
        >
          <SaveIcon />
        </Button>
        <FloatingPanelDivider />
        <Button
          variant="transparent"
          disabled={!playerReady}
          onClick={togglePlay}
          title={getPlayButtonLabel(play, playbackFromStart)}
        >
          {play ? (
            <PauseIcon />
          ) : playbackFromStart ? (
            <PlayStartIcon />
          ) : (
            <PlayIcon />
          )}
        </Button>
        <Button
          variant="transparent"
          disabled={!playerReady}
          onClick={stopPlayback}
          title={l10n("FIELD_STOP")}
        >
          <StopIcon />
        </Button>
        {view === "roll" ? (
          <>
            <FloatingPanelDivider />
            <Button
              variant="transparent"
              onClick={() => setTool("pencil")}
              active={tool === "pencil"}
              title={l10n("TOOL_PENCIL")}
            >
              <PencilIcon />
            </Button>
            <Button
              variant="transparent"
              onClick={() => setTool("eraser")}
              active={tool === "eraser"}
              title={l10n("TOOL_ERASER")}
            >
              <EraserIcon />
            </Button>
            <Button
              variant="transparent"
              onClick={() => setTool("selection")}
              active={tool === "selection"}
            >
              <SelectionIcon />
            </Button>
          </>
        ) : (
          ""
        )}
        <FloatingPanelDivider />
        <InstrumentSelect
          name="instrument"
          value={`${defaultInstruments[0]}`}
          onChange={(newValue) => {
            setDefaultInstruments(parseInt(newValue));
          }}
          instrumentType={instrumentType}
        />
        {view === "tracker" ? (
          <>
            <FloatingPanelDivider />
            <Select
              value={octaveOffsetOptions.find((i) => i.value === octaveOffset)}
              options={octaveOffsetOptions}
              onChange={(newValue: OctaveOffsetOptions) => {
                setOctaveOffset(newValue.value);
              }}
            />
          </>
        ) : (
          ""
        )}
      </FloatingPanelTools>
    </>
  );
};

export default SongEditorToolsPanel;
