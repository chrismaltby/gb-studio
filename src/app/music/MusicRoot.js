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
    case "play":
      player.play(d.song);
      ipcRenderer.send("music-data-receive", {
        action: "log",
        message: "playing",
      });
      break;
    case "stop":
      player.stop();
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
    default:
      log(`Action ${d.action} not supported`);
  }
});
