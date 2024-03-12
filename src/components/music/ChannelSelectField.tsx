import React, { useCallback } from "react";
import trackerActions from "store/features/tracker/trackerActions";
import { Button } from "ui/buttons/Button";
import {
  AudioOffIcon,
  AudioOnIcon,
  EyeClosedIcon,
  EyeOpenIcon,
} from "ui/icons/Icons";
import styled from "styled-components";
import API from "renderer/lib/api";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface ChannelSelectFieldProps {
  name: string;
  label: string;
  index: number;
  muted: boolean;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChannelButton = styled(Button)`
  flex-grow: 0;
  height: 22px;
  width: 56px;
  margin: 0 2px;
`;

const ActionGroup = styled.div`
  display: flex;
  flex-rirection: row;

  & > Button {
    padding: 0;
    flex-grow: 1;
  }
`;

export const ChannelSelectField = ({
  name,
  label,
  index,
  muted,
}: ChannelSelectFieldProps) => {
  const dispatch = useAppDispatch();

  const selectedChannel = useAppSelector(
    (state) => state.tracker.selectedChannel
  );
  const visibleChannels = useAppSelector(
    (state) => state.tracker.visibleChannels
  );

  const setSelectedChannel = useCallback(
    (channel: number) => () => {
      dispatch(trackerActions.setSelectedChannel(channel));
    },
    [dispatch]
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
    [dispatch, visibleChannels]
  );

  const setMute = useCallback(() => {
    API.music.sendToMusicWindow({
      action: "set-mute",
      channel: index,
      muted: !muted,
    });
  }, [muted, index]);

  return (
    <Wrapper>
      <ChannelButton
        name={name}
        variant={selectedChannel === index ? "primary" : "transparent"}
        size="medium"
        active={selectedChannel === index}
        onClick={setSelectedChannel(index)}
      >
        {label}
      </ChannelButton>
      <ActionGroup>
        <Button
          variant="transparent"
          size="small"
          onClick={toggleVisibleChannel(index)}
        >
          {visibleChannels.indexOf(index) > -1 ? (
            <EyeOpenIcon />
          ) : (
            <EyeClosedIcon />
          )}
        </Button>
        <Button variant="transparent" size="small" onClick={setMute}>
          {muted ? <AudioOffIcon /> : <AudioOnIcon />}
        </Button>
      </ActionGroup>
    </Wrapper>
  );
};
