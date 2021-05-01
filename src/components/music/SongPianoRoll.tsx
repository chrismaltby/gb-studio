import React, { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { css } from "styled-components";
import { PatternCell } from "../../lib/helpers/uge/song/PatternCell";
import { Song } from "../../lib/helpers/uge/song/Song";
import { RootState } from "../../store/configureStore";
import trackerActions from "../../store/features/tracker/trackerActions";
import { SplitPaneVerticalDivider } from "../ui/splitpane/SplitPaneDivider";
import { SequenceEditor } from "./SequenceEditor";
import { UgePlayer } from "./UgePlayer";
import scrollIntoView from 'scroll-into-view-if-needed';
import { instrumentColors } from "./InstrumentSelect";
import { SplitPaneHeader } from "../ui/splitpane/SplitPaneHeader";
import l10n from "../../lib/helpers/l10n";

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

interface RollChannelProps {
  rows: number,
  cols: number,
  size: number,
}

const RollChannel = styled.div<RollChannelProps>`
  position: relative;
  margin: 20px;
  ${(props) => css`
    width: ${props.cols * props.size}px;
    height: ${props.rows * props.size}px;
    background-image: 
      linear-gradient(${props.theme.colors.tracker.text} 1px, transparent 1px), 
      linear-gradient(90deg, ${props.theme.colors.tracker.text} 1px, transparent 1px);
    border-bottom: 1px solid ${props.theme.colors.tracker.text};
    border-right: 1px solid ${props.theme.colors.tracker.text};
    background-size: ${props.size}px ${props.size}px;
  `}
`;

interface NoteProps {
  size: number
}

const Note = styled.div<NoteProps>`
  position: absolute;
  width: ${(props) => `${props.size - 1}px`};
  height: ${(props) => `${props.size -1}px`};
  border: 1px solid black;
  text-align: center;
  line-height: 1.1em;
`;

export const SongPianoRoll = ({
  id,
  song,
  sequenceId,
  height
}: SongPianoRollProps) => {
  const dispatch = useDispatch();

  const [playbackState, setPlaybackState] = useState([-1, -1]);
  const playing = useSelector(
    (state: RootState) => state.tracker.playing
  );
  const octaveOffset = useSelector(
    (state: RootState) => state.tracker.octaveOffset
  );
  const tool = useSelector(
    (state: RootState) => state.tracker.tool
  );
  const defaultInstruments = useSelector(
    (state: RootState) => state.tracker.defaultInstruments
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

  const removeNote = useCallback((channel: number, column: number) => (e: any) => {
    if (e.button === 2 || tool === "eraser" && e.button === 0) {
      dispatch(
        trackerActions.editPatternCell({
          patternId: patternId,
          cell: [column, channel],
          changes: {
            "instrument": null,
            "note": null,
          },
        })  
      );
    } else if (tool === "pencil" && e.button === 0) {
      dispatch(
        trackerActions.editPatternCell({
          patternId: patternId,
          cell: [column, channel],
          changes: { "instrument": defaultInstruments[channel] },
        })
      ); 
    }
  }, [defaultInstruments, dispatch, patternId, tool]);

  const handleMouseDown = useCallback((e: any) => {
    const cell = e.target.dataset["channel"]; 
    if (cell !== undefined && tool === "pencil" && e.button === 0) {
      const col = Math.floor(e.offsetX / CELL_SIZE); 
      const note = 11 - Math.floor(e.offsetY / CELL_SIZE); 
      const changes = {
        "instrument": defaultInstruments[cell],
        "note": note + octaveOffset * 12,
      };
      dispatch(
        trackerActions.editPatternCell({
          patternId: patternId,
          cell: [col, cell],
          changes: changes,
        })
      );
    }
  }, [tool, defaultInstruments, octaveOffset, dispatch, patternId]);

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
            onMouseDown={(e) => { handleMouseDown(e.nativeEvent) }}
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
              data-channel={i}
              rows={12}
              cols={64}
              size={CELL_SIZE}
            >
              {song?.patterns[patternId]?.map((column: PatternCell[], columnIdx: number) => {
                const cell = column[i];
                const octave = cell.note === null ? 0 : ~~(cell.note / 12) + 3;

                if (cell.note !== null) {
                  return (
                    <>
                      <Note 
                        key={`note_${columnIdx}_${i}`}
                        onMouseDown={removeNote(i, columnIdx)}
                        size={CELL_SIZE}
                        className={cell.instrument !== null ? `label--${instrumentColors[cell.instrument]}` : ""}
                        style={{ 
                          left: `${columnIdx * CELL_SIZE}px`,
                          bottom: `${((cell.note % 12) * CELL_SIZE) - 1}px`, 
                        }}
                      >
                        {(cell.effectcode)?.toString(16).toUpperCase()}
                      </Note>
                      {(octave !== (3 + octaveOffset)) ? 
                        <Note
                          key={`note_octave_${columnIdx}_${i}`}
                          size={CELL_SIZE}
                          style={{ 
                            borderWidth: 0,
                            left: `${columnIdx * CELL_SIZE + 1}px`,
                            bottom: `${octave < (3 + octaveOffset) ? `-${CELL_SIZE}px` : ""}`, 
                            top: `${octave > (3 + octaveOffset) ? `-${CELL_SIZE}px` : ""}`, 
                          }}
                        >
                          {octave}
                        </Note>
                      : "" }
                    </>
                  )
                }
                return "";
              })}
            </RollChannel>
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