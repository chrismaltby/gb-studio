import { ipcRenderer } from "electron";
import player from "components/music/helpers/player.js";

const log = (log) => {
  console.log(log);
};

player.initPlayer((file) => {
  if (!file) {
    log(`COMPILE ERROR`);
  } else {
    log(file);
    log(`COMPILE DONE`);
    ipcRenderer.send("music-data-receive", {
      action: "initialized",
    });
  }
});

player.setOnIntervalCallback((playbackUpdate) => {
  log(playbackUpdate);
  ipcRenderer.send("music-data-receive", {
    action: "update",
    update: playbackUpdate,
  });
});

ipcRenderer.on("music-data", (event, d) => {
  log(d);
  switch (d.action) {
    case "load-song":
      player.loadSong(d.song);
      ipcRenderer.send("music-data-receive", {
        action: "log",
        message: "load song",
      });
      ipcRenderer.send("music-data-receive", {
        action: "loaded",
      });
      break;
    case "play":
      player.play(d.song);
      ipcRenderer.send("music-data-receive", {
        action: "log",
        message: "playing",
      });
      break;
    case "stop":
      player.stop(d.position);
      ipcRenderer.send("music-data-receive", {
        action: "log",
        message: "stop",
      });
      break;
    case "position":
      player.setStartPosition(d.position);
      ipcRenderer.send("music-data-receive", {
        action: "log",
        message: "position",
      });
      break;
    case "set-mute":
      const channels = player.setChannel(d.channel, d.muted);
      ipcRenderer.send("music-data-receive", {
        action: "muted",
        message: {
          channels,
        },
      });
      break;
    case "preview":
      player.preview(
        d.note,
        d.type,
        d.instrument,
        d.square2,
        d.waveForms || []
      );
      ipcRenderer.send("music-data-receive", {
        action: "log",
        message: "preview",
      });
      break;
    default:
      log(`Action ${d.action} not supported`);
  }
});
