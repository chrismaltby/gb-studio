import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import trackerActions from "store/features/tracker/trackerActions";
import { Button } from "ui/buttons/Button";
import {
  AudioOffIcon,
  AudioOnIcon,
  EyeClosedIcon,
  EyeOpenIcon,
} from "ui/icons/Icons";
import styled from "styled-components";
import { ipcRenderer } from "electron";

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
  const dispatch = useDispatch();

  const selectedChannel = useSelector(
    (state: RootState) => state.tracker.selectedChannel
  );
  const visibleChannels = useSelector(
    (state: RootState) => state.tracker.visibleChannels
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
    ipcRenderer.send("music-data-send", {
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
