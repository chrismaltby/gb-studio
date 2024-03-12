import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Song } from "shared/lib/uge/song/Song";
import trackerActions from "store/features/tracker/trackerActions";
import API from "renderer/lib/api";
import { MusicDataPacket } from "shared/lib/music/types";
import { useAppSelector } from "store/hooks";

interface UgePlayerProps {
  data: Song | null;
  onChannelStatusUpdate?: (channels: boolean[]) => void;
}

export const UgePlayer = ({ data, onChannelStatusUpdate }: UgePlayerProps) => {
  const dispatch = useDispatch();

  useEffect(() => {
    API.music.openMusic();
    return function close() {
      API.music.closeMusic();
    };
  }, []);

  const play = useAppSelector((state) => state.tracker.playing);

  useEffect(() => {
    const listener = (_event: unknown, d: MusicDataPacket) => {
      switch (d.action) {
        case "initialized":
          if (data) {
            API.music.sendToMusicWindow({
              action: "load-song",
              song: data,
            });
          }
          break;
        case "loaded":
          dispatch(trackerActions.playerReady(true));
          break;
        case "muted":
          if (onChannelStatusUpdate) {
            onChannelStatusUpdate(d.channels);
          }
          break;
      }
    };

    API.events.music.data.on(listener);

    return () => {
      API.events.music.data.off(listener);
    };
  }, [onChannelStatusUpdate, play, data, dispatch]);

  useEffect(() => {
    if (play && data) {
      console.log("PLAY");
      API.music.sendToMusicWindow({
        action: "play",
        song: data,
      });
    } else {
      API.music.sendToMusicWindow({
        action: "stop",
      });
    }
  }, [play, data]);

  return <div />;
};
