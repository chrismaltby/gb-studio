import React, { useRef, useCallback } from "react";
import { Song } from "shared/lib/uge/types";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  PIANO_ROLL_PIANO_WIDTH,
  PIANO_ROLL_CELL_SIZE,
  TRACKER_PATTERN_LENGTH,
} from "consts";
import {
  StyledPianoRollScrollHeaderFooterSpacer,
  StyledPianoRollScrollTopWrapper,
  StyledPianoRollSequenceHeader,
  StyledPianoRollSequenceHeaderPattern,
  StyledPianoRollSequenceHeaderOrder,
  StyledPianoRollSequenceHeaderText,
  StyledPianoRollPlayhead,
} from "./style";
import clamp from "shared/lib/helpers/clamp";
import trackerActions from "store/features/tracker/trackerActions";
import {
  calculateDocumentWidth,
  calculatePlaybackTrackerPosition,
  fromAbsCol,
} from "./helpers";
import API from "renderer/lib/api";
import l10n from "shared/lib/lang/l10n";

interface PianoRollSequenceBarProps {
  song: Song;
  playbackOrder: number;
  playbackRow: number;
}

export const PianoRollSequenceBar = ({
  song,
  playbackOrder,
  playbackRow,
}: PianoRollSequenceBarProps) => {
  const dispatch = useAppDispatch();

  const playing = useAppSelector((state) => state.tracker.playing);

  const sequenceLength = song.sequence.length;
  const documentWidth = calculateDocumentWidth(sequenceLength);

  const headerRef = useRef<HTMLDivElement>(null);
  const lastPositionRef = useRef<[number, number] | null>(null);

  const setPlaybackPosition = useCallback(
    (sequenceId: number, col: number) => {
      const next: [number, number] = [sequenceId, col];
      const prev = lastPositionRef.current;

      if (prev && prev[0] === next[0] && prev[1] === next[1]) {
        return;
      }

      lastPositionRef.current = next;

      dispatch(trackerActions.setDefaultStartPlaybackPosition(next));

      API.music.sendToMusicWindow({
        action: "position",
        position: next,
      });
    },
    [dispatch],
  );

  const updatePlaybackPosition = useCallback(
    (e: MouseEvent) => {
      const header = headerRef.current;
      if (!header) {
        return;
      }

      const rect = header.getBoundingClientRect();
      const x = e.clientX - rect.left - PIANO_ROLL_PIANO_WIDTH;

      const totalCols = sequenceLength * TRACKER_PATTERN_LENGTH;

      const absCol = clamp(
        Math.floor(x / PIANO_ROLL_CELL_SIZE),
        0,
        totalCols - 1,
      );

      const { sequenceId, column } = fromAbsCol(absCol);

      setPlaybackPosition(sequenceId, column);
    },
    [sequenceLength, setPlaybackPosition],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const handleMouseMove = (ev: MouseEvent) => {
        updatePlaybackPosition(ev);
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      updatePlaybackPosition(e.nativeEvent);
    },
    [updatePlaybackPosition],
  );

  const playheadX = calculatePlaybackTrackerPosition(
    playbackOrder,
    playbackRow,
  );

  return (
    <StyledPianoRollScrollTopWrapper
      ref={headerRef}
      style={{ minWidth: PIANO_ROLL_PIANO_WIDTH + documentWidth }}
      onMouseDown={onMouseDown}
    >
      <StyledPianoRollScrollHeaderFooterSpacer />
      {song.sequence.map((pattern, i) => (
        <StyledPianoRollSequenceHeader key={`${i}:${pattern}`}>
          <StyledPianoRollSequenceHeaderOrder>
            <StyledPianoRollSequenceHeaderText>
              {i + 1}
            </StyledPianoRollSequenceHeaderText>
          </StyledPianoRollSequenceHeaderOrder>

          <StyledPianoRollSequenceHeaderPattern $patternIndex={pattern}>
            <StyledPianoRollSequenceHeaderText>
              {l10n("FIELD_PATTERN")} {String(pattern).padStart(2, "0")}
            </StyledPianoRollSequenceHeaderText>
          </StyledPianoRollSequenceHeaderPattern>
        </StyledPianoRollSequenceHeader>
      ))}
      <StyledPianoRollPlayhead
        $isPlaying={playing}
        style={{ transform: `translateX(${playheadX}px)` }}
      />
    </StyledPianoRollScrollTopWrapper>
  );
};
