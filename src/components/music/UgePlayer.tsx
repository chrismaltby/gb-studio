import React, { useEffect, useRef } from "react";
import { Song } from "shared/lib/uge/types";
import trackerActions from "store/features/tracker/trackerActions";
import API from "renderer/lib/api";
import { MusicDataReceivePacket } from "shared/lib/music/types";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface UgePlayerProps {
  data: Song | null;
  onChannelStatusUpdate?: (channels: boolean[]) => void;
}

export const UgePlayer = ({ data, onChannelStatusUpdate }: UgePlayerProps) => {
  const dispatch = useAppDispatch();
  const currentSongRef = useRef<Song | null>(data);

  useEffect(() => {
    currentSongRef.current = data;
  }, [data]);

  useEffect(() => {
    API.music.openMusic();
    return function close() {
      API.music.closeMusic();
    };
  }, []);

  const play = useAppSelector((state) => state.tracker.playing);
  const exporting = useAppSelector((state) => state.tracker.exporting);

  useEffect(() => {
    const listener = (_event: unknown, d: MusicDataReceivePacket) => {
      switch (d.action) {
        case "initialized":
          if (currentSongRef.current) {
            API.music.sendToMusicWindow({
              action: "load-song",
              song: currentSongRef.current,
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

    const unsubscribeMusicData = API.events.music.response.subscribe(listener);

    return () => {
      unsubscribeMusicData();
    };
  }, [onChannelStatusUpdate, dispatch]);

  useEffect(() => {
    if (exporting) {
      return;
    }
    if (play && currentSongRef.current) {
      API.music.sendToMusicWindow({
        action: "play",
        song: currentSongRef.current,
      });
    } else {
      API.music.sendToMusicWindow({
        action: "stop",
      });
    }
  }, [play, exporting]);

  return <div />;
};
