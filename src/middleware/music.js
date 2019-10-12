import ScripTracker from "../lib/vendor/scriptracker/scriptracker";
import {
  PLAY_MUSIC,
  PAUSE_MUSIC,
  PLAY_SOUNDFX_BEEP,
  PLAY_SOUNDFX_TONE,
  PLAY_SOUNDFX_CRASH,
  SET_SECTION,
  SET_NAVIGATION_ID
} from "../actions/actionTypes";

let modPlayer;

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

function onSongLoaded(player) {
  player.play();
}

function play(filename) {
  if (modPlayer) {
    modPlayer.loadModule(filename);
  }
}

function pause() {
  if (modPlayer && modPlayer.isPlaying) {
    modPlayer.stop();
  }
}

export default store => next => action => {
  if (action.type === PLAY_MUSIC) {
    play(action.filename);
  } else if (action.type === PAUSE_MUSIC) {
    pause();
  } else if (
    action.type === PLAY_SOUNDFX_BEEP ||
    action.type === PLAY_SOUNDFX_TONE ||
    action.type === PLAY_SOUNDFX_CRASH
  ) {
    pause();
  } else if (action.type === SET_SECTION) {
    pause();
  } else if (action.type === SET_NAVIGATION_ID) {
    pause();
  }
  return next(action);
};
