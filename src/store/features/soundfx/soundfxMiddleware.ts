import {
  playTone,
  stopTone,
  playBuffer,
  stopBuffer,
  decodeAudioData,
} from "../../../lib/soundfx/soundfx";
import { assetsRoot } from "../../../consts";
import { createAction, Middleware } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";
import { actions as musicActions } from "../music/musicSlice";
import { actions as navigationActions } from "../navigation/navigationSlice";

let oscillator: OscillatorNode | undefined = undefined;
let bufferSource: AudioBufferSourceNode | undefined = undefined;

function initMusic() {
  window.removeEventListener("click", initMusic);
  window.removeEventListener("keydown", initMusic);
}

// Initialise audio on first click
window.addEventListener("click", initMusic);
window.addEventListener("keydown", initMusic);
window.addEventListener("blur", pause);

function play(filename: string) {
  const url = `file://${assetsRoot}/soundfx/${filename}`;
  fetch(url)
    .then((response) => response.arrayBuffer())
    .then(decodeAudioData)
    .then((data) => {
      bufferSource = playBuffer(data);
    });
}

function pause() {
  if (oscillator) {
    stopTone(oscillator);
    oscillator = undefined;
  }
  if (bufferSource) {
    stopBuffer(bufferSource);
    bufferSource = undefined;
  }
}

const playSoundFxBeep = createAction<{ pitch: number }>("soundfx/playBeep");
const playSoundFxTone = createAction<{ frequency: number; duration: number }>(
  "soundfx/playTone"
);
const playSoundFxCrash = createAction("soundfx/playCrash");
const pauseSoundFx = createAction("soundfx/pause");

const soundfxMiddleware: Middleware<{}, RootState> = (store) => (next) => (
  action
) => {
  if (playSoundFxBeep.match(action)) {
    pause();
    play(`effect_beep_${action.payload.pitch}.mp3`);
  } else if (playSoundFxTone.match(action)) {
    pause();
    oscillator = playTone(
      action.payload.frequency,
      action.payload.duration * 1000
    );
  } else if (playSoundFxCrash.match(action)) {
    play("effect_crash.mp3");
  } else if (pauseSoundFx.match(action)) {
    pause();
  } else if (
    musicActions.playMusic.match(action) ||
    musicActions.pauseMusic.match(action)
  ) {
    pause();
  } else if (
    navigationActions.setSection.match(action) ||
    navigationActions.setNavigationId.match(action)
  ) {
    pause();
  }

  return next(action);
};

export const actions = {
  playSoundFxBeep,
  playSoundFxTone,
  playSoundFxCrash,
  pauseSoundFx,
};

export default soundfxMiddleware;
