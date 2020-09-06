import { Middleware } from "@reduxjs/toolkit";
import ScripTracker from "../../../lib/vendor/scriptracker/scriptracker";
import { RootState } from "../../configureStore";
import soundfxActions from "../soundfx/soundfxActions";
import navigationActions from "../navigation/navigationActions";
import actions from "./musicActions";

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
  if (actions.playMusic.match(action)) {
    play(action.payload.filename);
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
