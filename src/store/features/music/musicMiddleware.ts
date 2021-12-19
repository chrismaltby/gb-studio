import { Dispatch, Middleware } from "@reduxjs/toolkit";
import ScripTracker from "lib/vendor/scriptracker/scriptracker";
import { RootState } from "store/configureStore";
import soundfxActions from "../soundfx/soundfxActions";
import navigationActions from "../navigation/navigationActions";
import actions from "./musicActions";
import { musicSelectors } from "../entities/entitiesState";
import { assetFilename } from "lib/helpers/gbstudio";
import { MusicSettings } from "../entities/entitiesTypes";
import { ipcRenderer } from "electron";
import { readFile } from "fs-extra";
import { loadUGESong } from "lib/helpers/uge/ugeHelper";
import toArrayBuffer from "lib/helpers/toArrayBuffer";

let modPlayer: ScripTracker;

export function initMusic() {
  modPlayer = new ScripTracker();
  modPlayer.on(ScripTracker.Events.playerReady, onSongLoaded);
  window.removeEventListener("click", initMusic);
  window.removeEventListener("keydown", initMusic);
  return modPlayer;
}

// Initialise audio on first click
window.addEventListener("click", initMusic);
window.addEventListener("keydown", initMusic);

function onSongLoaded(player: ScripTracker) {
  player.play();
}

function playMOD(filename: string, settings: MusicSettings) {
  if (modPlayer) {
    modPlayer.loadModule(
      `file://${filename}`,
      !!settings.disableSpeedConversion
    );
  }
}

async function playUGE(filename: string, _settings: MusicSettings) {
  const fileData = toArrayBuffer(await readFile(filename));
  const data = loadUGESong(fileData);
  const listener = async (_event: any, d: any) => {
    if (d.action === "initialized") {
      ipcRenderer.send("music-data-send", {
        action: "play",
        song: data,
      });
    }
  };
  ipcRenderer.once("music-data", listener);
  ipcRenderer.send("open-music");
}

function pause() {
  if (modPlayer && modPlayer.isPlaying) {
    modPlayer.stop();
  }
  if (ipcRenderer) {
    ipcRenderer.send("close-music");
  }
}

const musicMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action) => {
    if (actions.playMusic.match(action)) {
      const state = store.getState();
      const track = musicSelectors.selectById(state, action.payload.musicId);
      if (track) {
        const projectRoot = state.document.root;
        const filename = assetFilename(projectRoot, "music", track);
        if (track.type === "uge") {
          playUGE(filename, track.settings);
        } else {
          playMOD(filename, track.settings);
        }
      }
    } else if (actions.pauseMusic.match(action)) {
      pause();
    } else if (
      soundfxActions.playSoundFxBeep.match(action) ||
      soundfxActions.playSoundFxTone.match(action) ||
      soundfxActions.playSoundFxCrash.match(action) ||
      navigationActions.setSection.match(action) ||
      navigationActions.setNavigationId.match(action)
    ) {
      store.dispatch(actions.pauseMusic());
    }

    return next(action);
  };

export default musicMiddleware;
