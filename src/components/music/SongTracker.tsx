import React, { useState, useRef } from "react";
import styled from "styled-components";
import l10n from "../../lib/helpers/l10n";
import { PatternCell } from "../../lib/helpers/uge/song/PatternCell";
import { Song } from "../../lib/helpers/uge/song/Song";
import { SplitPaneHorizontalDivider, SplitPaneVerticalDivider } from "../ui/splitpane/SplitPaneDivider";
import { SplitPaneHeader } from "../ui/splitpane/SplitPaneHeader";
import { SequenceEditor } from "./SequenceEditor";
import { SongRow } from "./SongRow";
import { UgePlayer } from "./UgePlayer";

interface SongTrackerProps {
  id: string,
  sequenceId: number,
  data: Song | null,
  height: number
}

const Wrapper = styled.div`
  white-space: nowrap;
  background: ${(props) => props.theme.colors.sidebar.background};
`;

export const SongTracker = ({
  id,
  data,
  sequenceId,
  height
}: SongTrackerProps) => {
  const [playbackState, setPlaybackState] = useState([-1, -1]);

  const list = useRef<HTMLInputElement>(null);

  const patternId = data?.sequence[sequenceId] || 0;

  if (list && list.current) {
    list.current.children[playbackState[1]]?.scrollIntoView();
  }

  return (
    <div style={{
      display: "flex",
      width: "100%",
    }}>
      <div style={{ position: "relative" }}>
        <SequenceEditor
          id={id}
          data={data?.sequence}
          playbackState={playbackState}
          height={height}
        />
      </div>
      <SplitPaneHorizontalDivider />
      <div style={{ 
          position: "relative", 
          overflow: "auto", 
          flexGrow: 1, 
          height 
        }}>
        <Wrapper
          ref={list}
        >
          {data?.patterns[patternId]?.map((row: PatternCell[], i: number) =>
            <SongRow
              id={`__${i}`}
              n={i}
              row={row}
              selected={playbackState[1] === i}
            />
          )}
        </Wrapper>
      </div>
      <UgePlayer
        song={id}
        data={data}
        onPlaybackUpdate={setPlaybackState}
      />
    </div>
  )
}