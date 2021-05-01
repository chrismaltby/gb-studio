import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Song } from "../../lib/helpers/uge/song/Song";
import { RootState } from "../../store/configureStore";
import { SplitPaneVerticalDivider } from "../ui/splitpane/SplitPaneDivider";
import { SequenceEditor } from "./SequenceEditor";
import { UgePlayer } from "./UgePlayer";
import scrollIntoView from 'scroll-into-view-if-needed';
import { SplitPaneHeader } from "../ui/splitpane/SplitPaneHeader";
import l10n from "../../lib/helpers/l10n";
import { RollChannel } from "./RollChannel";

const CELL_SIZE = 16;

interface SongPianoRollProps {
  id: string,
  sequenceId: number,
  song: Song | null,
  height: number
}

const SongGrid = styled.div`
  font-family: monospace;
  white-space: nowrap;
  border-width: 0 0 0 1px;
  border-color: ${(props) => props.theme.colors.sidebar.border};
  border-style: solid;
  display: flex;
  flex-direction: column;
  position: relative;
`;

export const SongPianoRoll = ({
  id,
  song,
  sequenceId,
  height
}: SongPianoRollProps) => {
  const [playbackState, setPlaybackState] = useState([-1, -1]);
  const playing = useSelector(
    (state: RootState) => state.tracker.playing
  );

  const [channelStatus, setChannelStatus] = useState([false, false, false, false]);
  console.log(channelStatus);

  const patternId = song?.sequence[sequenceId] || 0;

  const playingRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (playingRowRef && playingRowRef.current) {
      if (playing) {
        scrollIntoView(
          playingRowRef.current,
          {
            scrollMode: 'if-needed',
            block: 'nearest',
            inline: 'end',
          }
        );
      }
    }
  }, [playing, playbackState]);

  useEffect(() => {
    setPlaybackState([-1, -1]);
  }, [playing, song])

  const [patternsPanelOpen, setPatternsPanelOpen] = useState(true);
  const togglePatternsPanel = useCallback(() => {
    setPatternsPanelOpen(!patternsPanelOpen);
  }, [patternsPanelOpen, setPatternsPanelOpen]);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        height: height,
      }}
    >
      <div style={{
        position: "relative",
        flexGrow: 1,
        overflow: "hidden"
      }}
      >
        <div style={{
          position: "relative",
          overflow: "auto",
          height: "100%",
        }}>
          <SongGrid
            tabIndex={0}
          >
            <div 
              ref={playingRowRef}
              style={{
                width: CELL_SIZE - 1,
                border: "1px solid red",
                position: "absolute",
                transform: `translateX(${20 + playbackState[1] * CELL_SIZE}px)`,
                top: 0,
                bottom: 0,
                background: "red",
              }}
            ></div>

          {Array(4).fill("").map((_, i) => 
            <RollChannel 
              channelId={i}
              patternId={patternId}
              patterns={song?.patterns[patternId]}
              cellSize={CELL_SIZE}
            />
          )}
          </SongGrid>
        </div>
      </div>
      <SplitPaneVerticalDivider />
      <SplitPaneHeader
        onToggle={togglePatternsPanel}
        collapsed={!patternsPanelOpen}
      >
        {l10n("FIELD_PATTERNS")}
      </SplitPaneHeader>
      {patternsPanelOpen && (
        <div style={{ 
          position: "relative"
        }}>
          <SequenceEditor
            id={id}
            direction="horizontal"
            sequence={song?.sequence}
            patterns={song?.patterns.length}
            playingSequence={playbackState[0]}
          />
        </div>
      )}
      <UgePlayer
        song={id}
        data={song}
        onPlaybackUpdate={setPlaybackState}
        onChannelStatusUpdate={setChannelStatus}
      />
    </div>
  )
}