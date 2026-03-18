import React from "react";
import { useAppSelector } from "store/hooks";
import { PatternChannelNotes } from "./PatternChannelNotes";
import { PianoRollCrosshair } from "./PianoRollCrosshair";
import {
  StyledPianoRollPatternBlockGrid,
  StyledPianoRollPatternBlock,
} from "./style";

interface PianoRollPatternBlockProps {
  patternId: number;
  sequenceId: number;
  displayChannels: number[];
  isDragging: boolean;
}

export const PianoRollPatternBlock = ({
  patternId,
  sequenceId,
  displayChannels,
  isDragging,
}: PianoRollPatternBlockProps) => {
  const songDocument = useAppSelector(
    (state) => state.trackerDocument.present.song,
  );
  const playing = useAppSelector((state) => state.tracker.playing);

  const selectedChannel = useAppSelector(
    (state) => state.tracker.selectedChannel,
  );

  const hoverColumn = useAppSelector((state) => state.tracker.hoverColumn);
  const hoverNote = useAppSelector((state) => state.tracker.hoverNote);
  const hoverSequence = useAppSelector((state) => state.tracker.hoverSequence);

  const selectedPatternCells = useAppSelector(
    (state) => state.tracker.selectedPatternCells,
  );

  const pattern = songDocument?.patterns[patternId] ?? [];

  const isSequenceHovered =
    hoverSequence === sequenceId ||
    (hoverSequence === null && sequenceId === 0);

  return (
    <StyledPianoRollPatternBlock
      $hovered={isSequenceHovered}
      $isPlaying={playing}
    >
      <StyledPianoRollPatternBlockGrid $size="small" />
      <StyledPianoRollPatternBlockGrid $size="large" />

      <PianoRollCrosshair
        hoverColumn={hoverColumn}
        hoverRow={hoverNote}
        isSequenceHovered={isSequenceHovered}
      />

      {displayChannels.map((channelId) => (
        <PatternChannelNotes
          key={channelId}
          channelId={channelId}
          sequenceId={sequenceId}
          isActive={selectedChannel === channelId}
          pattern={pattern}
          selectedPatternCells={selectedPatternCells}
          isDragging={isDragging}
        />
      ))}
    </StyledPianoRollPatternBlock>
  );
};
