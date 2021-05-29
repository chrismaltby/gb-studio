import { ipcRenderer } from "electron";
import React, { useCallback } from "react";
import styled, { css } from "styled-components";
import { Button } from "ui/buttons/Button";
import { AudioOffIcon, AudioOnIcon } from "ui/icons/Icons";

interface SongGridHeaderCellProps {
  channel?: number;
  size?: "normal" | "small";
  children?: React.ReactNode;
  muted?: boolean;
}

interface WrapperProps {
  size?: "normal" | "small";
}
const Wrapper = styled.span<WrapperProps>`
  display: inline-block;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
  color: ${(props) => props.theme.colors.tracker.text};
  background: ${(props) => props.theme.colors.tracker.background};
  border-width: 0 1px 0 0;
  border-color: ${(props) => props.theme.colors.tracker.border};
  border-style: solid;
  margin: 0;
  padding: 4px 4px 4px 2px;
  height: 20px;
  ${(props) =>
    props.size === "small"
      ? css`
          width: 40px;
        `
      : css`
          width: 126px;
        `}
`;

export const SongGridHeaderCell = ({
  size,
  children,
  channel,
  muted,
}: SongGridHeaderCellProps) => {
  const setMute = useCallback(() => {
    ipcRenderer.send("music-data-send", {
      action: "set-mute",
      channel: channel,
      muted: !muted,
    });
  }, [muted, channel]);

  return (
    <Wrapper size={size}>
      {channel !== undefined ? (
        <Button variant="transparent" size="small" onClick={setMute}>
          {muted ? <AudioOffIcon /> : <AudioOnIcon />}
        </Button>
      ) : (
        ""
      )}
      <span style={{ paddingLeft: 10 }} onClick={setMute}>
        {children}
      </span>
    </Wrapper>
  );
};
