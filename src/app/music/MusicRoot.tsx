import player, { PlaybackPosition } from "components/music/helpers/player";
import { playNotePreview } from "components/music/helpers/notePreview";
import API from "renderer/lib/api";

const log = (log: unknown) => {
  console.log(log);
};

const onPlayerInit = (file: Uint8Array) => {
  if (!file) {
    log(`COMPILE ERROR`);
  } else {
    log(file);
    log(`COMPILE DONE`);
    API.music.sendToProjectWindow({
      action: "initialized",
    });
  }
};

const sfx = decodeURIComponent(window.location.hash).slice(1);

player.initPlayer(onPlayerInit, sfx);

player.setOnIntervalCallback((playbackUpdate) => {
  log(playbackUpdate);
  position = playbackUpdate;
  API.music.sendToProjectWindow({
    action: "update",
    update: playbackUpdate,
  });
});

let position: PlaybackPosition = [0, 0];

API.events.music.data.subscribe((_event, d) => {
  log(d);
  switch (d.action) {
    case "load-song":
      player.reset();
      player.loadSong(d.song);
      API.music.sendToProjectWindow({
        action: "log",
        message: "load song",
      });
      API.music.sendToProjectWindow({
        action: "loaded",
      });
      break;
    case "load-sound":
      player.loadSound(d.sound);
      break;
    case "play":
      if (d.position) {
        position = d.position;
      }
      player.reset();
      player.play(d.song, position);
      API.music.sendToProjectWindow({
        action: "log",
        message: "playing",
      });
      break;
    case "play-sound":
      player.playSound();
      API.music.sendToProjectWindow({
        action: "log",
        message: "playing SFX",
      });
      break;
    case "stop":
      if (d.position) {
        position = d.position;
      }
      player.stop(d.position);
      API.music.sendToProjectWindow({
        action: "log",
        message: "stop",
      });
      break;
    case "position":
      if (d.position) {
        position = d.position;
      }
      player.setStartPosition(d.position);
      API.music.sendToProjectWindow({
        action: "log",
        message: "position",
      });
      break;
    case "set-mute":
      const channels = player.setChannel(d.channel, d.muted);
      API.music.sendToProjectWindow({
        action: "muted",
        channels,
      });
      break;
    case "preview":
      let waves = d.waveForms || [];
      const song = player.getCurrentSong();
      if (waves.length === 0 && song) {
        waves = song.waves;
      }
      playNotePreview(d.note, d.type, d.instrument, d.square2, waves);
      API.music.sendToProjectWindow({
        action: "log",
        message: "preview",
      });
      break;
    default:
      log(`Action ${d.action} not supported`);
  }
});
