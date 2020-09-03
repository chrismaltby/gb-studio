import { Middleware } from "@reduxjs/toolkit";
import ScripTracker from "../../../lib/vendor/scriptracker/scriptracker";
import { playMusic, pauseMusic } from "./musicSlice";
import { RootState } from "../../configureStore";
import { actions as soundfxActions } from "../soundfx/soundfxMiddleware";
import { actions as navigationActions } from "../navigation/navigationSlice";

let modPlayer: ScripTracker;

function initMusic() {
  modPlayer = new ScripTracker();
  modPlayer.on(ScripTracker.Events.playerReady, onSongLoaded);
  window.removeEventListener("click", initMusic);
  window.removeEventListener("keydown", initMusic);
}

// Initialise audio on first click
window.addEventListener("click", initMusic);
window.addEventListener("keydown", initMusic);
window.addEventListener("blur", pause);

function onSongLoaded(player: ScripTracker) {
  player.play();
}

function play(filename: string) {
  if (modPlayer) {
    modPlayer.loadModule(`file://${filename}`);
  }
}

function pause() {
  if (modPlayer && modPlayer.isPlaying) {
    modPlayer.stop();
  }
}

const musicMiddleware: Middleware<{}, RootState> = (store) => (next) => (
  action
) => {
  if (playMusic.match(action)) {
    play(action.payload.filename);
  } else if (pauseMusic.match(action)) {
    pause();
  } else if (
    soundfxActions.playSoundFxBeep.match(action) ||
    soundfxActions.playSoundFxTone.match(action) ||
    soundfxActions.playSoundFxCrash.match(action) ||
    navigationActions.setSection.match(action) ||
    navigationActions.setNavigationId.match(action)
  ) {
    store.dispatch(pauseMusic());
  }

  return next(action);
};

export default musicMiddleware;
