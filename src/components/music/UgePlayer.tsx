import { ipcRenderer } from "electron";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Song } from "../../lib/helpers/uge/song/Song";
import { RootState } from "../../store/configureStore";
// import Player from "./helpers/player";

interface UgePlayerProps {
  song: string,
  data: Song | null,
  onPlaybackUpdate?: Function
}

export const UgePlayer = ({
  data,
  onPlaybackUpdate
}: UgePlayerProps) => {

  useEffect(() => {
    console.log("OPEN MUSIC")
    ipcRenderer.send(
      "open-music"
    );
  }, []);

  const play = useSelector(
    (state: RootState) => state.tracker.playing
  );

  useEffect(() => {
    console.log('set playback update');

    ipcRenderer.removeAllListeners("music-data");
    ipcRenderer.on("music-data", (event, d) => {
      switch (d.action) {
        case "update":
          if (onPlaybackUpdate) {
            console.log(d.update);
            onPlaybackUpdate(d.update);
          }
          break;
        case "log":
          console.log(d.message);
          break;
        default:
          console.log(`Action ${d.action} not supported`);
      }
    })
  }, [onPlaybackUpdate, play]);

  useEffect(() => {
    console.log(play);
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