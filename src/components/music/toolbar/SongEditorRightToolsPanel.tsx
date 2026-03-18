import React, { useMemo } from "react";
import styled, { css } from "styled-components";
import { ChannelSelectField } from "./ChannelSelectField";
import { StyledButton } from "ui/buttons/style";

interface SongEditorRightToolsPanelProps {
  channelStatus: boolean[];
  size?: "small" | "medium";
}

interface WrapperProps {
  $size?: "small" | "medium";
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  top: 0px;
  right: 4px;
  z-index: 10;
  display: flex;

  background: ${(props) => props.theme.colors.background};
  ${(props) =>
    props.$size === "small"
      ? css`
          ${ChannelSelectGroup} {
            gap: 3px;
          }
          ${ChannelSelectGroup} ${StyledButton} {
            min-width: 10px;
          }
        `
      : ""}
  height: 60px;
  align-items: center;
`;

const ChannelSelectGroup = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
`;

const SongEditorRightToolsPanel = ({
  channelStatus,
  size,
}: SongEditorRightToolsPanelProps) => {
  const soloChannel = useMemo(() => {
    const firstUnmuted = channelStatus.findIndex((x) => !x);
    const lastUnmuted = channelStatus.findLastIndex((x) => !x);
    if (firstUnmuted !== -1 && firstUnmuted === lastUnmuted) {
      return firstUnmuted;
    }
    return -1;
  }, [channelStatus]);

  return (
    <Wrapper $size={size}>
      <ChannelSelectGroup>
        <ChannelSelectField
          name="channelDuty1"
          label="Duty 1"
          shortLabel="D1"
          title="Duty 1"
          index={0}
          muted={channelStatus[0] && soloChannel === -1}
          solo={soloChannel === 0}
          size={size}
        />
        <ChannelSelectField
          name="channelDuty2"
          label="Duty 2"
          shortLabel="D2"
          title="Duty 2"
          index={1}
          muted={channelStatus[1] && soloChannel === -1}
          solo={soloChannel === 1}
          size={size}
        />
        <ChannelSelectField
          name="channelWave"
          label="Wave"
          shortLabel="W"
          title="Wave"
          index={2}
          muted={channelStatus[2] && soloChannel === -1}
          solo={soloChannel === 2}
          size={size}
        />
        <ChannelSelectField
          name="channelNoise"
          label="Noise"
          shortLabel="N"
          title="Noise"
          index={3}
          muted={channelStatus[3] && soloChannel === -1}
          solo={soloChannel === 3}
          size={size}
        />
      </ChannelSelectGroup>
    </Wrapper>
  );
};

export default SongEditorRightToolsPanel;
