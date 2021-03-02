import React, { useState, useRef } from "react";
import styled from "styled-components";
import l10n from "../../lib/helpers/l10n";
import { PatternCell } from "../../lib/helpers/uge/song/PatternCell";
import { Song } from "../../lib/helpers/uge/song/Song";
import { SplitPaneVerticalDivider } from "../ui/splitpane/SplitPaneDivider";
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
`;

export const SongTracker = ({
  id,
  data,
  sequenceId,
  height
}: SongTrackerProps) => {
  const [playbackState, setPlaybackState] = useState([-1, -1]);
  console.log(playbackState);

  const list = useRef<HTMLInputElement>(null);

  const patternId = data?.sequence[sequenceId] || 0;

  if (list && list.current) {
    list.current.children[playbackState[1]]?.scrollIntoView();
  }


  return (
    <div>
      <div style={{ position: "relative" }}>
        <SplitPaneHeader
          onToggle={() => { }}
          collapsed={false}
        >
          {l10n("FIELD_SEQUENCES")}
        </SplitPaneHeader>
        <SequenceEditor
          id={id}
          data={data?.sequence}
          playbackState={playbackState}
        />
      </div>
      <SplitPaneVerticalDivider />
      <div style={{ position: "relative", overflow: "auto", flexGrow: 1, height: height }}>
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