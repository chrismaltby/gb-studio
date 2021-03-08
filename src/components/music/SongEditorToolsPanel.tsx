import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "../../store/configureStore";
import {
  EyeOpenIcon,
  PlayIcon,
  PauseIcon,
} from "../ui/icons/Icons";
import FloatingPanel, {
  FloatingPanelDivider,
} from "../ui/panels/FloatingPanel";
import trackerActions from "../../store/features/tracker/trackerActions";
import { Button } from "../ui/buttons/Button";

interface SongEditorToolsPanelProps {
  selectedSongId: string;
}

const Wrapper = styled(FloatingPanel)`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
`;

const SongEditorToolsPanel = ({
  selectedSongId
}: SongEditorToolsPanelProps) => {
  const dispatch = useDispatch();

  const play = useSelector(
    (state: RootState) => state.tracker.playing
  );

  const togglePlay = useCallback(() => {
    if (!play) {
      dispatch(trackerActions.playTracker());
    } else {
      dispatch(trackerActions.pauseTracker());
    }
  }, [dispatch, play]);

  return (
    <Wrapper>
      <Button variant="transparent" onClick={togglePlay}>
        {play ? <PauseIcon /> : <PlayIcon />}
      </Button>
      <FloatingPanelDivider />
      <Button variant="transparent">
        <EyeOpenIcon />
      </Button>
    </Wrapper>
  );
};

export default SongEditorToolsPanel;