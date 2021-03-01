import React, {  } from "react";
import styled from "styled-components";
import { Song } from "../../lib/helpers/uge/song/Song";
import { SongRow } from "./SongRow";

interface SongTrackerProps {
  id: string,
  sequenceId: number,
  data?: Song,
  playbackState: number[]
}

const Wrapper = styled.div`
  white-space: nowrap;
`;

export const SongTracker = ({
  data,
  sequenceId,
  playbackState
}: SongTrackerProps) => {
  return (
    <Wrapper>
      <span>{playbackState[0]},{playbackState[1]}</span>
      {data?.patterns[sequenceId].map((row:any[], i:number) =>
        <SongRow 
          id={`__${i}`}
          n={i}
          row={row}
          selected={playbackState[1] === i}
        />
      )}
    </Wrapper>
  )
}