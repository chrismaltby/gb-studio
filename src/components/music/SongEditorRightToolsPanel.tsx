import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "store/configureStore";
import { ChannelSelectField } from "./ChannelSelectField";

interface SongEditorRightToolsPanelProps {
  channelStatus: boolean[];
}

const Wrapper = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
`;

const ChannelSelectGroup = styled.div`
  display: flex;
  flex-direction: row;
`;

const SongEditorRightToolsPanel = ({
  channelStatus,
}: SongEditorRightToolsPanelProps) => {
  const view = useSelector((state: RootState) => state.tracker.view);

  return (
    <Wrapper>
      {view === "roll" ? (
        <>
          <ChannelSelectGroup>
            <ChannelSelectField
              name="channelDuty1"
              label="Duty 1"
              index={0}
              muted={channelStatus[0]}
            />
            <ChannelSelectField
              name="channelDuty2"
              label="Duty 2"
              index={1}
              muted={channelStatus[1]}
            />
            <ChannelSelectField
              name="channelWave"
              label="Wave"
              index={2}
              muted={channelStatus[2]}
            />
            <ChannelSelectField
              name="channelNoise"
              label="Noise"
              index={3}
              muted={channelStatus[3]}
            />
          </ChannelSelectGroup>
        </>
      ) : (
        ""
      )}
    </Wrapper>
  );
};

export default SongEditorRightToolsPanel;
