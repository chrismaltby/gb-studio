import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "../../store/configureStore";
import {
  PlayIcon,
  PauseIcon,
  SaveIcon,
} from "../ui/icons/Icons";
import FloatingPanel, {
  FloatingPanelDivider,
} from "../ui/panels/FloatingPanel";
import trackerActions from "../../store/features/tracker/trackerActions";
import { Button } from "../ui/buttons/Button";
import { Music } from "../../store/features/entities/entitiesTypes";
import { assetFilename } from "../../lib/helpers/gbstudio";
import { saveSongFile } from "../../store/features/tracker/trackerState";

interface SongEditorToolsPanelProps {
  selectedSong: Music;
}

const Wrapper = styled(FloatingPanel)`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
`;

const SongEditorToolsPanel = ({
  selectedSong
}: SongEditorToolsPanelProps) => {
  const dispatch = useDispatch();
  const projectRoot = useSelector((state: RootState) => state.document.root);

  const play = useSelector(
    (state: RootState) => state.tracker.playing
  );

  const modified = useSelector(
    (state: RootState) => state.tracker.modified
  );

  const togglePlay = useCallback(() => {
    if (!play) {
      dispatch(trackerActions.playTracker());
    } else {
      dispatch(trackerActions.pauseTracker());
    }
  }, [dispatch, play]);

  const saveSong = useCallback(() => {
    if (modified) {
      const path = `${assetFilename(
        projectRoot,
        "music",
        selectedSong
      )}`
      dispatch(saveSongFile(path));
    }
  }, [dispatch, modified, projectRoot, selectedSong]);

  return (
    <Wrapper>
      <Button variant="transparent" disabled={!modified} onClick={saveSong}>
        <SaveIcon />
      </Button>
      <FloatingPanelDivider />
      <Button variant="transparent" onClick={togglePlay}>
        {play ? <PauseIcon /> : <PlayIcon />}
      </Button>
    </Wrapper>
  );
};

export default SongEditorToolsPanel;