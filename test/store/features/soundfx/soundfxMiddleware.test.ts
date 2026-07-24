/**
 * @jest-environment jsdom
 */

import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import API from "renderer/lib/api";
import { playTone, stopTone } from "renderer/lib/soundfx/soundfx";
import { registerMusicListeners } from "store/features/music/musicListeners";
import soundfxActions from "store/features/soundfx/soundfxActions";
import soundfxMiddleware from "store/features/soundfx/soundfxMiddleware";
import type { RootState } from "store/storeTypes";
import { dummyRootState } from "../../../dummydata";

jest.mock("renderer/lib/soundfx/soundfx", () => ({
  playTone: jest.fn(() => ({})),
  stopTone: jest.fn(),
  playBuffer: jest.fn(),
  stopBuffer: jest.fn(),
  decodeAudioData: jest.fn(),
}));

afterEach(() => {
  jest.restoreAllMocks();
});

test("Should pause music before playing a tone", () => {
  const closeMusic = jest.spyOn(API.music, "closeMusic");
  const listenerMiddleware = createListenerMiddleware<RootState>();
  registerMusicListeners(listenerMiddleware.startListening);
  const store = configureStore({
    reducer: () => dummyRootState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      })
        .prepend(listenerMiddleware.middleware)
        .concat(soundfxMiddleware),
  });

  store.dispatch(
    soundfxActions.playSoundFxTone({
      frequency: 440,
      duration: 1,
    }),
  );

  expect(closeMusic).toHaveBeenCalledTimes(1);
  expect(playTone).toHaveBeenCalledWith(440, 1000);
  expect(closeMusic.mock.invocationCallOrder[0]).toBeLessThan(
    jest.mocked(playTone).mock.invocationCallOrder[0],
  );
  expect(stopTone).not.toHaveBeenCalled();
});
