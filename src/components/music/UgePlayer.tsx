import { ipcRenderer } from "electron";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Song } from "lib/helpers/uge/song/Song";
import { RootState } from "store/configureStore";
// import Player from "./helpers/player";
import trackerActions from "store/features/tracker/trackerActions";

interface UgePlayerProps {
  data: Song | null;
  onPlaybackUpdate?: (update: number[]) => void;
  onChannelStatusUpdate?: (channels: boolean[]) => void;
}

export const UgePlayer = ({
  data,
  onPlaybackUpdate,
  onChannelStatusUpdate,
}: UgePlayerProps) => {
  const dispatch = useDispatch();

  useEffect(() => {
    ipcRenderer.send("open-music");
    return function close() {
      ipcRenderer.send("close-music");
    };
  }, []);

  const play = useSelector((state: RootState) => state.tracker.playing);

  useEffect(() => {
    ipcRenderer.removeAllListeners("music-data");
    ipcRenderer.on("music-data", (event, d) => {
      switch (d.action) {
        case "initialized":
          ipcRenderer.send("music-data-send", {
            action: "load-song",
            song: data,
          });
          break;
        case "loaded":
          dispatch(trackerActions.playerReady(true));
          break;
        case "update":
          if (onPlaybackUpdate) {
            onPlaybackUpdate(d.update);
          }
          break;
        case "muted":
          const message = d.message;
          if (onChannelStatusUpdate) {
            onChannelStatusUpdate(message.channels);
          }
          break;
        case "log":
          break;
        default:
          console.log(`Action ${d.action} not supported`);
      }
    });
  }, [onChannelStatusUpdate, onPlaybackUpdate, play, data]);

  useEffect(() => {
    if (play) {
      ipcRenderer.send("music-data-send", {
        action: "play",
        song: data,
      });
    } else {
      ipcRenderer.send("music-data-send", {
        action: "stop",
      });
    }
  }, [play, data]);

  return <div />;
};
