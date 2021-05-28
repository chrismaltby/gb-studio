import { createAction } from "@reduxjs/toolkit";

const playSoundFxBeep = createAction<{ pitch: number }>("soundfx/playBeep");
const playSoundFxTone =
  createAction<{ frequency: number; duration: number }>("soundfx/playTone");
const playSoundFxCrash = createAction("soundfx/playCrash");
const pauseSoundFx = createAction("soundfx/pause");

export default {
  playSoundFxBeep,
  playSoundFxTone,
  playSoundFxCrash,
  pauseSoundFx,
};
