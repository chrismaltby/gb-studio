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
import { saveUGESong } from "../../lib/helpers/uge/ugeHelper";
import { assetFilename } from "../../lib/helpers/gbstudio";
import { writeFileWithBackup } from "../../lib/helpers/fs/writeFileWithBackup";

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

  const song = useSelector(
    (state: RootState) => state.tracker.song
  );

  const togglePlay = useCallback(() => {
    if (!play) {
      dispatch(trackerActions.playTracker());
    } else {
      dispatch(trackerActions.pauseTracker());
    }
  }, [dispatch, play]);

  const saveSong = useCallback(() => {
    const buffer = saveUGESong(song);
    const path: string = `${assetFilename(
      projectRoot,
      "music",
      selectedSong
    )}`

    writeFileWithBackup(path, new Uint8Array(buffer), "utf8", () => {});
  }, [song]);

  return (
    <Wrapper>
      <Button variant="transparent" onClick={saveSong}>
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