import React from "react";
import { useAppSelector } from "store/hooks";
import styled, { css } from "styled-components";
import { ChannelSelectField } from "./ChannelSelectField";
import { StyledButton } from "ui/buttons/style";

interface SongEditorRightToolsPanelProps {
  channelStatus: boolean[];
  size?: "small" | "medium";
}

interface WrapperProps {
  size?: "small" | "medium";
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  background: ${(props) => props.theme.colors.document.background};
  ${(props) =>
    props.size === "small"
      ? css`
          ${ChannelSelectGroup} ${StyledButton} {
            min-width: 10px;
          }
        `
      : ""}
`;

const ChannelSelectGroup = styled.div`
  display: flex;
  flex-direction: row;
  & > * {
    padding-left: 5px;
  }
`;

const SongEditorRightToolsPanel = ({
  channelStatus,
  size,
}: SongEditorRightToolsPanelProps) => {
  const view = useAppSelector((state) => state.tracker.view);

  return (
    <Wrapper size={size}>
      {view === "roll" ? (
        <>
          <ChannelSelectGroup>
            <ChannelSelectField
              name="channelDuty1"
              label={size === "medium" ? "Duty 1" : "D1"}
              title="Duty 1"
              index={0}
              muted={channelStatus[0]}
            />
            <ChannelSelectField
              name="channelDuty2"
              label={size === "medium" ? "Duty 2" : "D2"}
              title="Duty 2"
              index={1}
              muted={channelStatus[1]}
            />
            <ChannelSelectField
              name="channelWave"
              label={size === "medium" ? "Wave" : "W"}
              title="Wave"
              index={2}
              muted={channelStatus[2]}
            />
            <ChannelSelectField
              name="channelNoise"
              label={size === "medium" ? "Noise" : "N"}
              title="Noise"
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
