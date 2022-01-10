import React, { useCallback, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { ThemeContext } from "styled-components";
import { RootState } from "store/configureStore";
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
import { Music } from "store/features/entities/entitiesTypes";
import { saveSongFile } from "store/features/trackerDocument/trackerDocumentState";
import { InstrumentSelect } from "./InstrumentSelect";
import { Select } from "ui/form/Select";
import { PianoRollToolType } from "store/features/tracker/trackerState";
import { ipcRenderer } from "electron";

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

const SongEditorToolsPanel = ({ selectedSong }: SongEditorToolsPanelProps) => {
  const dispatch = useDispatch();
  const projectRoot = useSelector((state: RootState) => state.document.root);

  const play = useSelector((state: RootState) => state.tracker.playing);
  const playerReady = useSelector(
    (state: RootState) => state.tracker.playerReady
  );

  const modified = useSelector(
    (state: RootState) => state.trackerDocument.present.modified
  );

  const view = useSelector((state: RootState) => state.tracker.view);

  const tool = useSelector((state: RootState) => state.tracker.tool);

  const defaultStartPlaybackPosition = useSelector(
    (state: RootState) => state.tracker.defaultStartPlaybackPosition
  );

  const [playbackFromStart, setPlaybackFromStart] = useState(false);

  const togglePlay = useCallback(() => {
    if (!play) {
      if (playbackFromStart) {
        ipcRenderer.send("music-data-send", {
          action: "position",
          position: defaultStartPlaybackPosition,
        });
      }
      dispatch(trackerActions.playTracker());
    } else {
      dispatch(trackerActions.pauseTracker());
    }
  }, [defaultStartPlaybackPosition, dispatch, play, playbackFromStart]);

  const stopPlayback = useCallback(() => {
    dispatch(trackerActions.stopTracker());
    ipcRenderer.send("music-data-send", {
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
    (tool: PianoRollToolType) => {
      dispatch(trackerActions.setTool(tool));
    },
    [dispatch]
  );

  const saveSong = useCallback(() => {
    if (selectedSong && modified) {
      dispatch(saveSongFile());
    }
  }, [dispatch, modified, selectedSong]);

  const defaultInstruments = useSelector(
    (state: RootState) => state.tracker.defaultInstruments
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

  const octaveOffset = useSelector(
    (state: RootState) => state.tracker.octaveOffset
  );

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
      if (e.ctrlKey || e.shiftKey) {
        return;
      }
      if (e.altKey) {
        setPlaybackFromStart(true);
      }
      if (view !== "roll") {
        return;
      }
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
    },
    [setDefaultInstruments, setPlaybackFromStart, view]
  );

  const onKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (!e.altKey) {
        setPlaybackFromStart(false);
      }
    },
    [setPlaybackFromStart]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  const themeContext = useContext(ThemeContext);

  const themePianoIcon =
    themeContext.type === "light" ? <PianoIcon /> : <PianoInverseIcon />;

  return (
    <>
      <FloatingPanelSwitchView>
        <Button variant="transparent" onClick={toggleView}>
          {view === "roll" ? <TrackerIcon /> : themePianoIcon}
        </Button>
      </FloatingPanelSwitchView>

      <FloatingPanelTools>
        <Button
          variant="transparent"
          disabled={!selectedSong || !modified}
          onClick={saveSong}
        >
          <SaveIcon />
        </Button>
        <FloatingPanelDivider />
        <Button
          variant="transparent"
          disabled={!playerReady}
          onClick={togglePlay}
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
            >
              <PencilIcon />
            </Button>
            <Button
              variant="transparent"
              onClick={() => setTool("eraser")}
              active={tool === "eraser"}
            >
              <EraserIcon />
            </Button>
            {/* <Button
              variant="transparent"
              onClick={() => setTool("selection")}
              active={tool === "selection"}
            >
              <SelectionIcon />
            </Button>{" "} */}
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
