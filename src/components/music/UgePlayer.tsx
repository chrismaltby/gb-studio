import { ipcRenderer } from "electron";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Song } from "lib/helpers/uge/song/Song";
import { RootState } from "store/configureStore";
import trackerActions from "store/features/tracker/trackerActions";

interface UgePlayerProps {
  data: Song | null;
  onChannelStatusUpdate?: (channels: boolean[]) => void;
}

export const UgePlayer = ({ data, onChannelStatusUpdate }: UgePlayerProps) => {
  const dispatch = useDispatch();

  useEffect(() => {
    ipcRenderer.send("open-music");
    return function close() {
      ipcRenderer.send("close-music");
    };
  }, []);

  const play = useSelector((state: RootState) => state.tracker.playing);

  useEffect(() => {
    const listener = (_event: any, d: any) => {
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
        case "muted":
          const message = d.message;
          if (onChannelStatusUpdate) {
            onChannelStatusUpdate(message.channels);
          }
          break;
        case "update":
        case "log":
          break;
        default:
          console.log(`Action ${d.action} not supported`);
      }
    };

    ipcRenderer.on("music-data", listener);

    return () => {
      ipcRenderer.removeListener("music-data", listener);
    };
  }, [onChannelStatusUpdate, play, data, dispatch]);

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
