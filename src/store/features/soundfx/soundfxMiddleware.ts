import {
  playTone,
  stopTone,
  playBuffer,
  stopBuffer,
  decodeAudioData,
} from "lib/soundfx/soundfx";
import { assetsRoot } from "consts";
import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import musicActions from "../music/musicActions";
import navigationActions from "../navigation/navigationActions";
import actions from "./soundfxActions";
import { soundSelectors } from "../entities/entitiesState";
import { ipcRenderer } from "electron";
import { compileWav } from "lib/compiler/sounds/compileWav";
import { Sound } from "../entities/entitiesTypes";
import { compileVGM } from "lib/compiler/sounds/compileVGM";
import { CompileSoundOptions } from "lib/compiler/sounds/compileSound";
import { compileFXHammerSingle } from "lib/compiler/sounds/compileFXHammer";
import { assetFilename } from "shared/lib/helpers/assets";
import { MusicDataPacket } from "shared/lib/music/types";

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

async function playSound(
  sound: Sound,
  effectIndex: number,
  { projectRoot }: CompileSoundOptions
) {
  const filename = assetFilename(projectRoot, "sounds", sound);

  let sfx = "";
  if (sound.type === "wav") {
    sfx = await compileWav(filename, "asm");
  } else if (sound.type === "vgm") {
    ({ output: sfx } = await compileVGM(filename, "asm"));
  } else if (sound.type === "fxhammer") {
    ({ output: sfx } = await compileFXHammerSingle(
      filename,
      effectIndex,
      "asm"
    ));
  }

  console.log("SFX", sfx);

  const listener = async (_event: unknown, d: MusicDataPacket) => {
    if (d.action === "initialized") {
      ipcRenderer.send("music-data-send", {
        action: "play-sound",
      });
    }
  };
  ipcRenderer.once("music-data", listener);
  ipcRenderer.send("open-music", sfx);
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
        const projectRoot = state.document.root;
        playSound(sound, action.payload.effectIndex, { projectRoot });
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
