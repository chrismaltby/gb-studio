import React, { useCallback } from "react";
import trackerActions from "store/features/tracker/trackerActions";
import { Button } from "ui/buttons/Button";
import {
  ChannelMuteIcon,
  ChannelSoloIcon,
  EyeClosedIcon,
  EyeOpenIcon,
} from "ui/icons/Icons";
import styled, { css } from "styled-components";
import API from "renderer/lib/api";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { StyledButton } from "ui/buttons/style";
import l10n from "shared/lib/lang/l10n";

interface ChannelSelectFieldProps {
  name: string;
  label: string;
  shortLabel: string;
  title: string;
  index: number;
  muted: boolean;
  solo: boolean;
  size?: "small" | "medium";
}

const Wrapper = styled.div<{
  $size?: "small" | "medium";
  $selected: boolean;
  $active: boolean;
}>`
  display: flex;
  flex-direction: column;

  border: 2px solid transparent;
  border-radius: 6px;
  transition: none;

  ${(props) =>
    props.$active &&
    css`
      background: ${props.theme.colors.panel.background};
      border: 2px solid ${props.theme.colors.panel.background};
      box-shadow: 0px 0px 1px 1px ${props.theme.colors.panel.border};
    `}
`;

const ChannelButton = styled(Button)`
  flex-grow: 0;
  height: 22px;
  margin-bottom: 5px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0px;
  border-radius: 4px;
  ${StyledButton} {
    flex-grow: 1;
    border-radius: 0px;
    border-right-width: 0;
    width: 25px;
  }
  ${StyledButton}:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    svg {
      min-width: 14px;
      min-height: 14px;
    }
  }
  ${StyledButton}:last-child {
    border-right-width: 1px;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;

  ${StyledButton} {
    border-radius: 0;
    width: 25px;

    svg {
      min-width: 14px;
      min-height: 14px;
    }
  }

  ${StyledButton}:nth-child(1),
  ${StyledButton}:nth-child(2) {
    border-bottom-width: 0;
  }

  ${StyledButton}:nth-child(1),
  ${StyledButton}:nth-child(3) {
    border-right-width: 0;
  }

  ${StyledButton}:nth-child(1) {
    border-top-left-radius: 4px;
  }

  ${StyledButton}:nth-child(2) {
    border-top-right-radius: 4px;
  }

  ${StyledButton}:nth-child(3) {
    border-bottom-left-radius: 4px;
  }

  ${StyledButton}:nth-child(4) {
    border-bottom-right-radius: 4px;
  }
`;

export const ChannelSelectField = ({
  name,
  label,
  shortLabel,
  title,
  index,
  muted,
  solo,
  size,
}: ChannelSelectFieldProps) => {
  const dispatch = useAppDispatch();

  const view = useAppSelector((state) => state.tracker.view);

  const selectedChannel = useAppSelector(
    (state) => state.tracker.selectedChannel,
  );
  const visibleChannels = useAppSelector(
    (state) => state.tracker.visibleChannels,
  );

  const setSelectedChannel = useCallback(
    (channel: number) => () => {
      dispatch(trackerActions.setSelectedChannel(channel));
    },
    [dispatch],
  );
  const toggleVisibleChannel = useCallback(
    (channel: number) => () => {
      const newVisibleChannels = [...visibleChannels];
      const index = visibleChannels.indexOf(channel);
      if (index > -1) {
        newVisibleChannels.splice(index, 1);
      } else {
        newVisibleChannels.push(channel);
      }
      dispatch(trackerActions.setVisibleChannels(newVisibleChannels));
    },
    [dispatch, visibleChannels],
  );

  const setMute = useCallback(() => {
    API.music.sendToMusicWindow({
      action: "set-mute",
      channel: index,
      muted: !muted,
    });
  }, [muted, index]);

  const setSolo = useCallback(() => {
    dispatch(trackerActions.setSelectedChannel(index));
    API.music.sendToMusicWindow({
      action: "set-solo",
      channel: index,
      enabled: !solo,
    });
  }, [dispatch, index, solo]);

  if (size === "small" && view === "roll") {
    return (
      <ButtonGrid>
        <Button
          variant={selectedChannel === index ? "primary" : "normal"}
          size="small"
          onClick={setSelectedChannel(index)}
        >
          {shortLabel}
        </Button>

        <Button
          variant="normal"
          size="small"
          onClick={toggleVisibleChannel(index)}
        >
          {selectedChannel === index || visibleChannels.indexOf(index) > -1 ? (
            <EyeOpenIcon />
          ) : (
            <EyeClosedIcon />
          )}
        </Button>
        <Button
          size="small"
          onClick={setSolo}
          variant={solo ? "primary" : "normal"}
          title={l10n("FIELD_SOLO_CHANNEL")}
        >
          S
        </Button>
        <Button
          size="small"
          onClick={setMute}
          variant={muted ? "primary" : "normal"}
          title={l10n("FIELD_MUTE_CHANNEL")}
        >
          M
        </Button>
      </ButtonGrid>
    );
  }

  return (
    <Wrapper
      $size={size}
      $selected={selectedChannel === index}
      $active={selectedChannel === index && view === "roll"}
    >
      <ChannelButton
        name={name}
        title={title}
        variant={
          selectedChannel === index && view === "roll"
            ? "primary"
            : "transparent"
        }
        size="medium"
        onClick={setSelectedChannel(index)}
      >
        {label}
      </ChannelButton>

      <ButtonGroup>
        {view === "roll" && (
          <Button
            variant="normal"
            size="small"
            onClick={toggleVisibleChannel(index)}
          >
            {selectedChannel === index ||
            visibleChannels.indexOf(index) > -1 ? (
              <EyeOpenIcon />
            ) : (
              <EyeClosedIcon />
            )}
          </Button>
        )}

        <Button
          size="small"
          onClick={setSolo}
          variant={solo ? "primary" : "normal"}
          title={l10n("FIELD_SOLO_CHANNEL")}
        >
          <ChannelSoloIcon />
        </Button>
        <Button
          size="small"
          onClick={setMute}
          variant={muted ? "primary" : "normal"}
          title={l10n("FIELD_MUTE_CHANNEL")}
        >
          <ChannelMuteIcon />
        </Button>
      </ButtonGroup>
    </Wrapper>
  );
};
