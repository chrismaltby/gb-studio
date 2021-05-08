import { ipcRenderer } from "electron";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Song } from "../../lib/helpers/uge/song/Song";
import { RootState } from "../../store/configureStore";
// import Player from "./helpers/player";

interface UgePlayerProps {
  data: Song | null,
  onPlaybackUpdate?: Function,
  onChannelStatusUpdate?: Function,
}

export const UgePlayer = ({
  data,
  onPlaybackUpdate,
  onChannelStatusUpdate,
}: UgePlayerProps) => {
  useEffect(() => {
    ipcRenderer.send(
      "open-music"
    );
    return function close() {
      ipcRenderer.send("close-music");
    }
  }, []);

  const play = useSelector(
    (state: RootState) => state.tracker.present.playing
  );

  useEffect(() => {
    ipcRenderer.removeAllListeners("music-data");
    ipcRenderer.on("music-data", (event, d) => {
      switch (d.action) {
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
        case "log":
          break;
        default:
          console.log(`Action ${d.action} not supported`);
      }
    })
  }, [onPlaybackUpdate, play]);

  useEffect(() => {
    if (play) {
      ipcRenderer.send(
        "music-data-send",
        {
          action: "play",
          song: data
        }
      );
    } else {
      ipcRenderer.send(
        "music-data-send",
        {
          action: "stop",
        }
      );
    }
  }, [play, data])

  return (
    <div />
  )
}