import {
  PLAY_SOUNDFX_BEEP,
  PLAY_SOUNDFX_TONE,
  PLAY_SOUNDFX_CRASH,
  PAUSE_SOUNDFX,
  PLAY_MUSIC,
  PAUSE_MUSIC,
  SET_SECTION,
  SET_NAVIGATION_ID
} from "../actions/actionTypes";
import {
  playTone,
  stopTone,
  playBuffer,
  stopBuffer,
  decodeAudioData
} from "../lib/soundfx/soundfx";

let oscillator = null;
let bufferSource = null;

function initMusic() {
  window.removeEventListener("click", initMusic);
  window.removeEventListener("keydown", initMusic);
}

// Initialise audio on first click
window.addEventListener("click", initMusic);
window.addEventListener("keydown", initMusic);
window.addEventListener("blur", pause);

function play(filename) {
  const url = `../assets/soundfx/${filename}`;
  fetch(url)
    .then(response => response.arrayBuffer())
    .then(decodeAudioData)
    .then(data => {
      bufferSource = playBuffer(data);
    });
}

function pause() {
  if (oscillator) {
    stopTone(oscillator);
    oscillator = null;
  }
  if (bufferSource) {
    stopBuffer(bufferSource);
    bufferSource = null;
  }
}

export default store => next => action => {
  if (action.type === PLAY_SOUNDFX_BEEP) {
    pause();
    play(`effect_beep_${action.pitch}.mp3`);
  } else if (action.type === PLAY_SOUNDFX_TONE) {
    pause();
    oscillator = playTone(action.frequency, action.duration * 1000);
  } else if (action.type === PLAY_SOUNDFX_CRASH) {
    play("effect_crash.mp3");
  } else if (action.type === PAUSE_SOUNDFX) {
    pause();
  } else if (action.type === PLAY_MUSIC) {
    pause();
  } else if (action.type === PAUSE_MUSIC) {
    pause();
  } else if (action.type === SET_SECTION) {
    pause();
  } else if (action.type === SET_NAVIGATION_ID) {
    pause();
  }
  return next(action);
};
