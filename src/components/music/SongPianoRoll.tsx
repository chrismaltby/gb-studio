import React, { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { css } from "styled-components";
import { Song } from "lib/helpers/uge/song/Song";
import { RootState } from "store/configureStore";
import { SplitPaneVerticalDivider } from "ui/splitpane/SplitPaneDivider";
import { SequenceEditor } from "./SequenceEditor";
import scrollIntoView from "scroll-into-view-if-needed";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import l10n from "lib/helpers/l10n";
import { RollChannel } from "./RollChannel";
import { RollChannelGrid } from "./RollChannelGrid";
import { ipcRenderer } from "electron";
import trackerActions from "store/features/tracker/trackerActions";

const CELL_SIZE = 14;
const MAX_NOTE = 71;

interface SongPianoRollProps {
  sequenceId: number;
  song: Song | null;
  height: number;
}

interface PianoKeyProps {
  color: "white" | "black";
  tall?: boolean;
  highlight?: boolean;
}

interface SongGridHeaderProps {
  cols: number;
}

const Piano = styled.div`
  position: sticky;
  left: 0;
  min-width: 30px;
  background: white;
  height: ${CELL_SIZE * 12 * 6}px;
  z-index: 2;
`;

const blackKeyStyle = css`
  height: ${CELL_SIZE}px;
  width: 85%;
  background: linear-gradient(45deg, #636363, black);
  background: linear-gradient(
    90deg,
    rgba(2, 0, 36, 1) 0%,
    rgba(99, 99, 99, 1) 90%,
    rgba(0, 0, 0, 1) 98%
  );
  border-bottom: none;
  border-radius: 0 2px 2px 0;
  box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 3px 0px;
  top: ${-0.5 * CELL_SIZE}px;
  margin-bottom: ${-CELL_SIZE}px;
  z-index: 2;
`;

const highlightStyle = css`
  :after {
    content: "";
    position: absolute;
    top: 0px;
    left: 0px;
    bottom: 0px;
    right: 0px;
    background: linear-gradient(90deg, #607d8b 0%, #b0bec5);
    opacity: 0.5;
  }
`;

const PianoKey = styled.div<PianoKeyProps>`
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  color: #90a4ae;
  font-weight: bold;
  font-size: 10px;
  padding-right: 5px;
  position: relative;
  height: ${(props) => (props.tall ? 2 : 1.5) * CELL_SIZE}px;
  width: 100%;
  background: white;
  border-bottom: 1px solid #cfd8dc;
  box-shadow: rgba(0, 0, 0, 0.1) -2px 0px 2px 0px inset;
  ${(props) => (props.color === "black" ? blackKeyStyle : "")}
  ${(props) => (props.highlight ? highlightStyle : "")}
  :hover {
    ${highlightStyle};
  }
`;

const SongGrid = styled.div`
  font-family: monospace;
  white-space: nowrap;
  border-width: 0 0 0 1px;
  border-color: ${(props) => props.theme.colors.sidebar.border};
  border-style: solid;
  position: relative;
  :focus {
    z-index: 1;
  }
`;

const RollPlaybackTracker = styled.div`
  z-index: 0;
  width: ${CELL_SIZE - 1}px;
  height: ${CELL_SIZE * 12 * 6 + CELL_SIZE}px;
  background-image: linear-gradient(
    90deg,
    ${(props) => props.theme.colors.highlight} 2px,
    transparent 1px
  );
  background-position-y: ${CELL_SIZE}px;
  background-repeat-y: no-repeat;
  background-size: ${CELL_SIZE * 8}px ${CELL_SIZE * 12 * 6 + CELL_SIZE}px;
  position: absolute;
  top: 0;
  bottom: 0;
  left: -10px;
  &::before {
    content: "";
    position: absolute;
    top: 2px;
    left: -${CELL_SIZE / 2 - 1}px;
    border-top: ${CELL_SIZE - 4}px solid transparent;
    border-top-color: ${(props) => props.theme.colors.highlight};
    border-left: ${CELL_SIZE / 2}px solid transparent;
    border-right: ${CELL_SIZE / 2}px solid transparent;
  }
`;

const SongGridHeader = styled.div<SongGridHeaderProps>`
  position: sticky;
  top: 0;
  left: ${30 + 10 + 1}px;
  right: 0;
  z-index: 10;
  ${(props) => css`
    width: ${props.cols * CELL_SIZE}px;
    height: ${CELL_SIZE}px;
    background-color: ${props.theme.colors.document.background};
    background-image: linear-gradient(
      90deg,
      ${props.theme.colors.tracker.rollCell.border} 2px,
      transparent 1px
    );
    background-size: ${CELL_SIZE * 8}px ${CELL_SIZE / 3}px;
    background-repeat: repeat-x;
    background-position-y: center;
    border-bottom: 1px solid #808080;
    margin-bottom: -1px;
    border-right: 2px solid ${props.theme.colors.document.background};
  `}
`;

export const SongPianoRoll = ({
  song,
  sequenceId,
  height,
}: SongPianoRollProps) => {
  const dispatch = useDispatch();

  const playing = useSelector((state: RootState) => state.tracker.playing);
  const hoverNote = useSelector((state: RootState) => state.tracker.hoverNote);
  const startPlaybackPosition = useSelector(
    (state: RootState) => state.tracker.startPlaybackPosition
  );

  const patternId = song?.sequence[sequenceId] || 0;

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

  const setPlaybackPosition = useCallback(
    (e: any) => {
      const col = Math.floor(e.offsetX / CELL_SIZE);

      dispatch(
        trackerActions.setDefaultStartPlaybackPosition([sequenceId, col])
      );
      ipcRenderer.send("music-data-send", {
        action: "position",
        position: [sequenceId, col],
      });
    },
    [dispatch, sequenceId]
  );

  const playingRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (playingRowRef && playingRowRef.current) {
      if (playing) {
        scrollIntoView(playingRowRef.current, {
          scrollMode: "if-needed",
          block: "nearest",
          inline: "end",
        });
      }
    }
  }, [playing, playbackState]);

  const [patternsPanelOpen, setPatternsPanelOpen] = useState(true);
  const togglePatternsPanel = useCallback(() => {
    setPatternsPanelOpen(!patternsPanelOpen);
  }, [patternsPanelOpen, setPatternsPanelOpen]);

  const selectedChannel = useSelector(
    (state: RootState) => state.tracker.selectedChannel
  );
  const visibleChannels = useSelector(
    (state: RootState) => state.tracker.visibleChannels
  );

  const v = [
    selectedChannel,
    ...visibleChannels.filter((c) => c !== selectedChannel),
  ].reverse();

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        height: height,
      }}
    >
      <div
        style={{
          position: "relative",
          flexGrow: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            overflow: "auto",
            height: "100%",
            zIndex: 1,
          }}
        >
          <SongGridHeader
            cols={64}
            onMouseDown={(e) => {
              setPlaybackPosition(e.nativeEvent);
            }}
          >
            <RollPlaybackTracker
              ref={playingRowRef}
              style={{
                display: playbackState[0] === sequenceId ? "" : "none",
                transform: `translateX(${10 + playbackState[1] * CELL_SIZE}px)`,
              }}
            />
          </SongGridHeader>
          <div
            style={{
              display: "flex",
              position: "relative",
              width: "100%",
              zIndex: 1,
            }}
          >
            <Piano>
              {Array(6)
                .fill("")
                .map((_, i) => (
                  <>
                    <PianoKey
                      color="white"
                      highlight={hoverNote === MAX_NOTE - i * 12}
                    ></PianoKey>
                    <PianoKey
                      color="black"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 1)}
                    ></PianoKey>
                    <PianoKey
                      color="white"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 2)}
                      tall
                    ></PianoKey>
                    <PianoKey
                      color="black"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 3)}
                    ></PianoKey>
                    <PianoKey
                      color="white"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 4)}
                      tall
                    ></PianoKey>
                    <PianoKey
                      color="black"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 5)}
                    ></PianoKey>
                    <PianoKey
                      color="white"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 6)}
                    ></PianoKey>
                    <PianoKey
                      color="white"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 7)}
                    ></PianoKey>
                    <PianoKey
                      color="black"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 8)}
                    ></PianoKey>
                    <PianoKey
                      color="white"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 9)}
                      tall
                    ></PianoKey>
                    <PianoKey
                      color="black"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 10)}
                    ></PianoKey>
                    <PianoKey
                      color="white"
                      highlight={hoverNote === MAX_NOTE - (i * 12 + 11)}
                    >
                      C{8 - i}
                    </PianoKey>
                  </>
                ))}
            </Piano>
            <SongGrid tabIndex={0}>
              <RollChannelGrid cellSize={CELL_SIZE} />
              {v.map((i) => (
                <RollChannel
                  channelId={i}
                  active={selectedChannel === i}
                  patternId={patternId}
                  patterns={song?.patterns[patternId]}
                  cellSize={CELL_SIZE}
                />
              ))}
            </SongGrid>
          </div>
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
        <div
          style={{
            position: "relative",
          }}
        >
          <SequenceEditor
            direction="horizontal"
            sequence={song?.sequence}
            patterns={song?.patterns.length}
            playingSequence={playbackState[0]}
          />
        </div>
      )}
    </div>
  );
};
