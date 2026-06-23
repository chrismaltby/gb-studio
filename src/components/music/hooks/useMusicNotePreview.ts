import { useCallback } from "react";
import { useAppStore } from "store/hooks";
import {
  playDutyNotePreview,
  playNoiseNotePreview,
  playWaveNotePreview,
} from "components/music/helpers/notePreview";
import { NOTE_C5 } from "consts";
import throttle from "lodash/throttle";
import { Song } from "shared/lib/uge/types";

type PreviewArgs = {
  note?: number;
  instrumentId?: number;
  channelId?: 0 | 1 | 2 | 3;
  effectCode?: number | null;
  effectParam?: number;
};

type ThrottledPreviewArgs = PreviewArgs & {
  song: Song | undefined;
  selectedChannel: 0 | 1 | 2 | 3;
  selectedInstrumentId: number | undefined;
};

const playMusicNotePreviewThrottled = throttle(
  ({
    song,
    selectedChannel,
    selectedInstrumentId,
    channelId,
    note,
    instrumentId,
    effectCode,
    effectParam,
  }: ThrottledPreviewArgs) => {
    if (!song) {
      return;
    }

    const previewChannel = channelId ?? selectedChannel;
    const previewNote = note ?? NOTE_C5;
    const previewInstrumentId = instrumentId ?? selectedInstrumentId ?? 0;
    const previewEffectCode = effectCode ?? 0;
    const previewEffectParams = effectParam ?? 0;

    if (previewChannel === 0 || previewChannel === 1) {
      const instrument = song.dutyInstruments[previewInstrumentId];
      if (!instrument) {
        return;
      }

      playDutyNotePreview(
        previewNote,
        instrument,
        previewChannel === 1 ? 1 : 0,
        previewEffectCode,
        previewEffectParams,
      );
      return;
    }

    if (previewChannel === 2) {
      const instrument = song.waveInstruments[previewInstrumentId];
      if (!instrument) {
        return;
      }

      const wave = song.waves[instrument.waveIndex];
      if (!wave) {
        return;
      }

      playWaveNotePreview(
        previewNote,
        instrument,
        wave,
        previewEffectCode,
        previewEffectParams,
      );
      return;
    }

    if (previewChannel === 3) {
      const instrument = song.noiseInstruments[previewInstrumentId];
      if (!instrument) {
        return;
      }

      playNoiseNotePreview(
        previewNote,
        instrument,
        previewEffectCode,
        previewEffectParams,
      );
    }
  },
  100,
  { leading: true, trailing: true },
);

export const useMusicNotePreview = () => {
  const store = useAppStore();

  return useCallback(
    (args: PreviewArgs) => {
      const state = store.getState();
      const song = state.trackerDocument.present.song;
      const selectedChannel = state.tracker.selectedChannel;
      const selectedInstrumentId = state.tracker.selectedInstrumentId;

      playMusicNotePreviewThrottled({
        ...args,
        song,
        selectedChannel,
        selectedInstrumentId,
      });
    },
    [store],
  );
};
