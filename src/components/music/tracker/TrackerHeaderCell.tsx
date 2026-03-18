import React, { useCallback } from "react";
import API from "renderer/lib/api";
import { StyledTrackerHeaderCell } from "./style";
import { Button } from "ui/buttons/Button";
import { ButtonGroup } from "ui/buttons/ButtonGroup";
import trackerActions from "store/features/tracker/trackerActions";
import { useAppDispatch } from "store/hooks";
import l10n from "shared/lib/lang/l10n";
import { ChannelMuteIcon, ChannelSoloIcon } from "ui/icons/Icons";

interface TrackerHeaderCellProps {
  channel?: number;
  type: "channel" | "patternIndex" | "order";
  children?: React.ReactNode;
  muted?: boolean;
  solo?: boolean;
}

export const TrackerHeaderCell = ({
  type,
  children,
  muted,
  solo,
  channel,
}: TrackerHeaderCellProps) => {
  const dispatch = useAppDispatch();

  const onToggleMuteSolo = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (channel === undefined) {
        return;
      }
      if (e.button === 0) {
        API.music.sendToMusicWindow({
          action: "set-mute",
          channel: channel,
          muted: !muted,
        });
      } else if (e.button === 2) {
        API.music.sendToMusicWindow({
          action: "set-solo",
          channel: channel,
          enabled: true,
        });
      }
    },
    [muted, channel],
  );

  const setMute = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (channel === undefined) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      API.music.sendToMusicWindow({
        action: "set-mute",
        channel,
        muted: !muted,
      });
    },
    [muted, channel],
  );

  const setSolo = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (channel === undefined) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      dispatch(trackerActions.setSelectedChannel(channel));
      API.music.sendToMusicWindow({
        action: "set-solo",
        channel,
        enabled: !solo,
      });
    },
    [dispatch, channel, solo],
  );

  // onMouseDown={setMute}

  return (
    <StyledTrackerHeaderCell
      $type={type}
      $muted={muted}
      $solo={solo}
      onMouseDown={onToggleMuteSolo}
    >
      <span>{children}</span>
      {type === "channel" && (
        <ButtonGroup>
          <Button
            size="small"
            onMouseDown={setSolo}
            title={l10n("FIELD_SOLO_CHANNEL")}
          >
            <ChannelSoloIcon />
          </Button>
          <Button
            size="small"
            onMouseDown={setMute}
            title={l10n("FIELD_MUTE_CHANNEL")}
          >
            <ChannelMuteIcon />
          </Button>
        </ButtonGroup>
      )}
    </StyledTrackerHeaderCell>
  );
};
