import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import styled, { css } from "styled-components";
import { Song } from "../../lib/helpers/uge/song/Song";
import { RootState } from "../../store/configureStore";
import { SplitPaneVerticalDivider } from "../ui/splitpane/SplitPaneDivider";
import { SequenceEditor } from "./SequenceEditor";
import { UgePlayer } from "./UgePlayer";
import scrollIntoView from 'scroll-into-view-if-needed';
import { SplitPaneHeader } from "../ui/splitpane/SplitPaneHeader";
import l10n from "../../lib/helpers/l10n";
import { RollChannel } from "./RollChannel";

const CELL_SIZE = 14;

interface SongPianoRollProps {
  sequenceId: number,
  song: Song | null,
  height: number
}

const Piano = styled.div`
  position: sticky; 
  left: 0;
  min-width: 30px;
  background: white;
  height: ${CELL_SIZE * 12 * 6}px;
  z-index: 2;
`;

const PianoKey = styled.div<{ color: "white" | "black" }>`
  position: ${(props) => props.color === "black" ? "relative" : ""};
  height: ${CELL_SIZE}px;
  width: ${(props) => props.color === "black" ? "85%" : "100%"};
  background: ${(props) => props.color === "black" ? "black" : "white"};
  border-radius: 0 2px 2px 0;
  box-shadow: ${(props) => props.color === "black" ? "#868686c4 0px 2px 3px 0px" : ""};
  ${(props) => (
    props.color === "black" ? css`
    &&::after {
      content: "";
      position: absolute;
      right: -4px;
      width: calc(100% + 4px);
      height: ${CELL_SIZE + CELL_SIZE/2}px;
      box-shadow: inset #d4d4d488 -2px -2px 1px 0px;
      top: 7px;
    }
    ` : ""
  )}
`;

const SongGrid = styled.div`
  font-family: monospace;
  white-space: nowrap;
  border-width: 0 0 0 1px;
  border-color: ${(props) => props.theme.colors.sidebar.border};
  border-style: solid;
  position: relative;
  z-index: 1;
`;

const RollPlaybackTracker = styled.div`              
  z-index: 0;
  width: ${CELL_SIZE - 1}px;
  height: ${CELL_SIZE * 12 * 6}px;
  border: 1px solid ${(props) => props.theme.colors.highlight};
  background: ${(props) => props.theme.colors.highlight};
  position: absolute;
  top: 0;
  bottom: 0;
`;

export const SongPianoRoll = ({
  song,
  sequenceId,
  height
}: SongPianoRollProps) => {
  const [playbackState, setPlaybackState] = useState([-1, -1]);
  const playing = useSelector(
    (state: RootState) => state.tracker.present.playing
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

  const visibleChannels = useSelector(
    (state: RootState) => state.tracker.present.visibleChannels
  );

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
          display: "flex",
          position: "relative",
          overflow: "auto",
          height: "100%",
          zIndex: 1,
        }}>
          <Piano>
            {Array(6).fill("").map((_, i) => 
              <>
                <PianoKey color="white"></PianoKey>
                <PianoKey color="black"></PianoKey>
                <PianoKey color="white"></PianoKey>
                <PianoKey color="black"></PianoKey>
                <PianoKey color="white"></PianoKey>
                <PianoKey color="black"></PianoKey>
                <PianoKey color="white"></PianoKey>
                <PianoKey color="white"></PianoKey>
                <PianoKey color="black"></PianoKey>
                <PianoKey color="white"></PianoKey>
                <PianoKey color="black"></PianoKey>
                <PianoKey color="white">C{8 - i}</PianoKey>
              </>
            )}
          </Piano>
          <SongGrid
            tabIndex={0}
          >
            <RollPlaybackTracker 
              ref={playingRowRef}
              style={{
                transform: `translateX(${20 + playbackState[1] * CELL_SIZE}px)`,
              }}
            />
            {visibleChannels.map((i) => 
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
            direction="horizontal"
            sequence={song?.sequence}
            patterns={song?.patterns.length}
            playingSequence={playbackState[0]}
          />
        </div>
      )}
      <UgePlayer
        data={song}
        onPlaybackUpdate={setPlaybackState}
        onChannelStatusUpdate={setChannelStatus}
      />
    </div>
  )
}