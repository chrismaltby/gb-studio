import {
  playTone,
  stopTone,
  playBuffer,
  stopBuffer,
  decodeAudioData,
} from "renderer/lib/soundfx/soundfx";
import { assetsRoot } from "consts";
import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import musicActions from "store/features/music/musicActions";
import navigationActions from "store/features/navigation/navigationActions";
import actions from "./soundfxActions";
import { soundSelectors } from "store/features/entities/entitiesState";
import { Sound } from "shared/lib/entities/entitiesTypes";
import { assetPath } from "shared/lib/helpers/assets";
import API from "renderer/lib/api";

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

async function playSound(sound: Sound, effectIndex: number) {
  const filename = assetPath("sounds", sound);

  if (sound.type === "wav") {
    API.soundfx.playWav(filename);
  } else if (sound.type === "vgm") {
    API.soundfx.playVGM(filename);
  } else if (sound.type === "fxhammer") {
    API.soundfx.playFXHammer(filename, effectIndex);
  }
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

const soundfxMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action) => {
    if (actions.playSoundFxBeep.match(action)) {
      pause();
      play(`effect_beep_${action.payload.pitch}.mp3`);
    } else if (actions.playSoundFxTone.match(action)) {
      pause();
      oscillator = playTone(
        action.payload.frequency,
        action.payload.duration * 1000
      );
    } else if (actions.playSoundFxCrash.match(action)) {
      play("effect_crash.mp3");
    } else if (actions.playSoundFx.match(action)) {
      const state = store.getState();
      const sound = soundSelectors.selectById(state, action.payload.effect);
      if (sound) {
        playSound(sound, action.payload.effectIndex);
      }
    } else if (actions.pauseSoundFx.match(action)) {
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

export default soundfxMiddleware;
