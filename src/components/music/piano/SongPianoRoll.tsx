import React, { useState, useRef, useEffect, useCallback } from "react";
import { Song } from "shared/lib/uge/types";
import { SplitPaneVerticalDivider } from "ui/splitpane/SplitPaneDivider";
import { SequenceEditor } from "components/music/SequenceEditor";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { MusicDataReceivePacket } from "shared/lib/music/types";
import { useAppSelector } from "store/hooks";
import { StyledPianoRollWrapper } from "./style";
import { PianoRollCanvas } from "./PianoRollCanvas";
import l10n from "shared/lib/lang/l10n";
import API from "renderer/lib/api";

interface SongPianoRollProps {
  sequenceId: number;
  song: Song | null;
  height: number;
}

export const SongPianoRoll = ({
  song,
  height,
  sequenceId,
}: SongPianoRollProps) => {
  const playing = useAppSelector((state) => state.tracker.playing);
  const startPlaybackPosition = useAppSelector(
    (state) => state.tracker.startPlaybackPosition,
  );

  const [playbackState, setPlaybackState] = useState([0, 0]);

  useEffect(() => {
    setPlaybackState(startPlaybackPosition);
  }, [setPlaybackState, startPlaybackPosition]);

  useEffect(() => {
    const listener = (_event: unknown, d: MusicDataReceivePacket) => {
      if (d.action === "update") {
        setPlaybackState(d.update);
      }
    };
    const unsubscribeMusicData = API.events.music.response.subscribe(listener);
    return () => {
      unsubscribeMusicData();
    };
  }, [setPlaybackState]);

  const playingRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (playingRowRef && playingRowRef.current) {
      if (playing) {
        playingRowRef.current.scrollIntoView({
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [playing, playbackState]);

  const [patternsPanelOpen, setPatternsPanelOpen] = useState(true);
  const togglePatternsPanel = useCallback(() => {
    setPatternsPanelOpen(!patternsPanelOpen);
  }, [patternsPanelOpen, setPatternsPanelOpen]);

  return (
    <StyledPianoRollWrapper style={{ height }}>
      {song && (
        <PianoRollCanvas
          song={song}
          sequenceId={sequenceId}
          playbackOrder={playbackState[0]}
          playbackRow={playbackState[1]}
        />
      )}
      <SplitPaneVerticalDivider />
      <SplitPaneHeader
        onToggle={togglePatternsPanel}
        collapsed={!patternsPanelOpen}
      >
        {l10n("FIELD_ORDER")}
      </SplitPaneHeader>
      {patternsPanelOpen && (
        <SequenceEditor
          direction="horizontal"
          sequence={song?.sequence}
          patterns={song?.patterns.length}
          playingSequence={playbackState[0]}
        />
      )}
    </StyledPianoRollWrapper>
  );
};
