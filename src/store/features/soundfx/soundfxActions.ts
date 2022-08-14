import { createAction } from "@reduxjs/toolkit";

const playSoundFxBeep = createAction<{ pitch: number }>("soundfx/playBeep");
const playSoundFxTone =
  createAction<{ frequency: number; duration: number }>("soundfx/playTone");
const playSoundFxCrash = createAction("soundfx/playCrash");
const playSoundFx =
  createAction<{ effect: string; effectIndex: number }>("soundfx/playSfx");
const pauseSoundFx = createAction("soundfx/pause");

export default {
  playSoundFxBeep,
  playSoundFxTone,
  playSoundFxCrash,
  playSoundFx,
  pauseSoundFx,
};
