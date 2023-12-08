import { ipcRenderer } from "electron";
import player from "components/music/helpers/player.ts";
import { playNotePreview } from "components/music/helpers/notePreview";

const log = (log) => {
  console.log(log);
};

const onPlayerInit = (file) => {
  if (!file) {
    log(`COMPILE ERROR`);
  } else {
    log(file);
    log(`COMPILE DONE`);
    ipcRenderer.send("music-data-receive", {
      action: "initialized",
    });
  }
};

const sfx = decodeURIComponent(window.location.hash).slice(1);

player.initPlayer(onPlayerInit, sfx);

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
      player.play(d.song, d.position);
      ipcRenderer.send("music-data-receive", {
        action: "log",
        message: "playing",
      });
      break;
    case "play-sound":
      player.playSound();
      ipcRenderer.send("music-data-receive", {
        action: "log",
        message: "playing SFX",
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
      let waves = d.waveForms || [];
      if (waves.length === 0) {
        waves = player.getCurrentSong().waves;
      }
      playNotePreview(d.note, d.type, d.instrument, d.square2, waves);
      ipcRenderer.send("music-data-receive", {
        action: "log",
        message: "preview",
      });
      break;
    default:
      log(`Action ${d.action} not supported`);
  }
});
