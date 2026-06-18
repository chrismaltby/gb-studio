export const getValidPlaybackSequenceId = (
  playing: boolean,
  playbackSequenceId: number,
  loopSequenceId: number | undefined,
  sequenceLength: number,
): number | undefined => {
  const sequenceId = loopSequenceId ?? playbackSequenceId;
  return playing && sequenceId >= 0 && sequenceId < sequenceLength
    ? sequenceId
    : undefined;
};
