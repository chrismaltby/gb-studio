import { Dispatch, Middleware } from "@reduxjs/toolkit";
import ScripTracker from "renderer/lib/vendor/scriptracker/scriptracker";
import { RootState } from "store/configureStore";
import soundfxActions from "store/features/soundfx/soundfxActions";
import navigationActions from "store/features/navigation/navigationActions";
import actions from "./musicActions";
import { musicSelectors } from "store/features/entities/entitiesState";
import { MusicSettings } from "shared/lib/entities/entitiesTypes";
import { assetPath } from "shared/lib/helpers/assets";
import API from "renderer/lib/api";

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
      `gbs://project/${filename}`,
      !!settings.disableSpeedConversion,
    );
  }
}

async function playUGE(filename: string, _settings: MusicSettings) {
  API.music.playUGE(filename);
}

function pause() {
  if (modPlayer && modPlayer.isPlaying) {
    modPlayer.stop();
  }
  API.music.closeMusic();
}

const musicMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action) => {
    if (actions.playMusic.match(action)) {
      const state = store.getState();
      const track = musicSelectors.selectById(state, action.payload.musicId);
      if (track) {
        const filename = assetPath("music", track);
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
