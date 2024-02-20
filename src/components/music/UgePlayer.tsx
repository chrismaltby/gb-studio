import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Song } from "shared/lib/uge/song/Song";
import { RootState } from "store/configureStore";
import trackerActions from "store/features/tracker/trackerActions";
import API from "renderer/lib/api";
import { MusicDataPacket } from "shared/lib/music/types";

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

  const play = useSelector((state: RootState) => state.tracker.playing);

  useEffect(() => {
    const listener = (_event: unknown, d: MusicDataPacket) => {
      switch (d.action) {
        case "initialized":
          if (data) {
            API.music.sendMusicData({
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

    API.music.musicDataSubscribe(listener);

    return () => {
      API.music.musicDataUnsubscribe(listener);
    };
  }, [onChannelStatusUpdate, play, data, dispatch]);

  useEffect(() => {
    if (play && data) {
      console.log("PLAY");
      API.music.sendMusicData({
        action: "play",
        song: data,
      });
    } else {
      API.music.sendMusicData({
        action: "stop",
      });
    }
  }, [play, data]);

  return <div />;
};
