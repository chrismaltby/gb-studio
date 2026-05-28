import { Binjgb, BinjgbModule } from "./WasmModuleWrapper";

type StepType = "single" | "frame" | "run";

type Emu = number | undefined;

type EmulatorModule = {
  HEAP8: Uint8Array;
  _free: (value: number) => void;
  _malloc: (value: number) => number;
  _emulator_new_simple: (
    romPtr: number,
    romSize: number,
    sampleRate: number,
    audioBufferSize: number,
  ) => Emu;
  _emulator_delete: (emu: Emu) => void;
  _emulator_get_ticks_f64: (emu: Emu) => number;
  _emulator_run_until_f64: (emu: Emu, ticks: number) => number;
  _emulator_read_mem: (emu: Emu, addr: number) => number;
  _emulator_write_mem: (emu: Emu, addr: number, value: number) => void;
  _set_audio_channel_mute: (
    emu: Emu,
    channel: number,
    muted: boolean,
  ) => boolean;
  _get_audio_buffer_ptr: (emu: Emu) => number;
  _get_audio_buffer_capacity: (emu: Emu) => number;
};

type AudioCaptureListener = (
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
) => void;

export type EmulatorController = {
  init: (romData: Uint8Array) => void;
  writeMem: (addr: number, data: number) => void;
  readMem: (addr: number) => number;
  step: (stepType: StepType) => boolean | undefined;
  updateRom: (romData: Uint8Array) => boolean;
  setChannel: (channel: number, muted: boolean) => boolean;
  resetAudio: () => void;
  getAudioClock: () => {
    currentTime: number;
    scheduledTime: number;
    bufferDuration: number;
  };
  playTone: (
    frequency: number,
    duration: number,
    startTime?: number,
    volume?: number,
  ) => void;
  setAudioCapture: (listener: AudioCaptureListener) => void;
  removeAudioCapture: () => void;
  isAvailable: () => boolean;
};

const audioBufferSize = 2048;

let audioCtx: AudioContext;
let masterGain: GainNode;

/* see: 
  https://gist.github.com/surma/b2705b6cca29357ebea1c9e6e15684cc
  https://github.com/webpack/webpack/issues/7352
*/
const locateFile = (module: unknown) => (path: string) => {
  if (path.endsWith(".wasm")) {
    return module;
  }
  return path;
};

let Module: EmulatorModule;
Binjgb({
  locateFile: locateFile(BinjgbModule),
}).then((module: EmulatorModule) => {
  Module = module;
});

const ensureAudioContext = () => {
  if (typeof audioCtx === "undefined") {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
};

export const createEmulator = (): EmulatorController => {
  let emu: Emu;
  let romPtr: number;
  let romSize = 0;
  let audioTime = 0;
  let audioCaptureListener: AudioCaptureListener | undefined;
  const activeSources = new Set<AudioBufferSourceNode>();

  const isAvailable = () => typeof emu !== "undefined";

  const playBuffer = (buffer: AudioBuffer, time: number) => {
    const ctx = ensureAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(masterGain);
    source.start(time);

    activeSources.add(source);

    source.onended = () => {
      activeSources.delete(source);
      source.disconnect();
    };
  };

  const stopAllAudio = () => {
    const ctx = ensureAudioContext();
    for (const source of activeSources) {
      try {
        source.stop(ctx.currentTime);
      } catch {}
      source.disconnect();
    }
    activeSources.clear();
  };

  const resetAudio = () => {
    const ctx = ensureAudioContext();
    stopAllAudio();
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    audioTime = ctx.currentTime;
  };

  const playTone = (
    frequency: number,
    duration: number,
    startTime?: number,
    volume = 0.12,
  ) => {
    const ctx = ensureAudioContext();
    const time = Math.max(startTime ?? ctx.currentTime, ctx.currentTime);
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, time);

    gainNode.gain.setValueAtTime(0.0001, time);
    gainNode.gain.exponentialRampToValueAtTime(volume, time + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    oscillator.start(time);
    oscillator.stop(time + duration);
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  };

  const destroy = () => {
    if (!isAvailable()) return;
    Module._emulator_delete(emu);
    emu = undefined;
  };

  const init = (romData: Uint8Array) => {
    if (isAvailable()) destroy();

    const ctx = ensureAudioContext();

    let requiredSize = ((romData.length - 1) | 0x3fff) + 1;
    if (requiredSize < 0x8000) requiredSize = 0x8000;
    romPtr = Module._malloc(requiredSize);
    romSize = requiredSize;

    const romView = Module.HEAP8.subarray(romPtr, romPtr + romSize);
    romView.fill(0);
    romView.set(romData);

    // Note: this takes ownership of `romPtr`, even if init fails.
    //       The ROM will be freed when `emulator_delete` is called from `destroy()`, and not leaked.
    emu = Module._emulator_new_simple(
      romPtr,
      romSize,
      ctx.sampleRate,
      audioBufferSize,
    );
    ctx.resume();
    audioTime = ctx.currentTime;
  };

  const updateRom = (romData: Uint8Array) => {
    if (!isAvailable()) {
      return false;
    }

    let requiredSize = ((romData.length - 1) | 0x3fff) + 1;
    if (requiredSize < 0x8000) requiredSize = 0x8000;
    if (romSize < requiredSize) return false;

    const romView = Module.HEAP8.subarray(romPtr, romPtr + romSize);
    romView.fill(0);
    romView.set(romData);

    return true;
  };

  const processAudioBuffer = () => {
    const ctx = ensureAudioContext();
    if (audioTime < ctx.currentTime) {
      audioTime = ctx.currentTime;
    }

    const inputBuffer = new Uint8Array(
      Module.HEAP8.buffer,
      Module._get_audio_buffer_ptr(emu),
      Module._get_audio_buffer_capacity(emu),
    );

    const volume = 0.5;
    const channel0 = new Float32Array(audioBufferSize);
    const channel1 = new Float32Array(audioBufferSize);

    for (let i = 0; i < audioBufferSize; i++) {
      channel0[i] = (inputBuffer[2 * i] * volume) / 255;
      channel1[i] = (inputBuffer[2 * i + 1] * volume) / 255;
    }

    if (audioCaptureListener) {
      audioCaptureListener(channel0, channel1, ctx.sampleRate);
    } else {
      const buffer = ctx.createBuffer(2, audioBufferSize, ctx.sampleRate);
      buffer.getChannelData(0).set(channel0);
      buffer.getChannelData(1).set(channel1);
      playBuffer(buffer, audioTime);
    }

    const bufferSec = audioBufferSize / ctx.sampleRate;
    audioTime += bufferSec;
  };

  const step = (stepType: StepType) => {
    if (!isAvailable()) return;

    const ctx = ensureAudioContext();
    let ticks = Module._emulator_get_ticks_f64(emu);
    if (stepType === "single") ticks += 1;
    else if (stepType === "frame") ticks += 70224;
    while (true) {
      const result = Module._emulator_run_until_f64(emu, ticks);
      if (result & 2) processAudioBuffer();
      if (result & 8) return true;
      if (result & 16) return true;
      if (result !== 2 && stepType !== "run") return false;
      if (stepType === "run") {
        if (result & 4) {
          if (audioTime < ctx.currentTime + 0.1) ticks += 70224;
          else return false;
        }
      }
    }
  };

  return {
    init,
    writeMem: (addr: number, data: number) => {
      if (!isAvailable()) {
        return;
      }
      Module._emulator_write_mem(emu, addr, data);
    },
    readMem: (addr: number) => {
      if (!isAvailable()) return 0xff;
      return Module._emulator_read_mem(emu, addr);
    },
    step,
    updateRom,
    setChannel: (channel: number, muted: boolean) => {
      if (!isAvailable()) return muted;
      return Module._set_audio_channel_mute(emu, channel, muted);
    },
    resetAudio,
    getAudioClock: () => {
      const ctx = ensureAudioContext();
      return {
        currentTime: ctx.currentTime,
        scheduledTime: audioTime,
        bufferDuration: audioBufferSize / ctx.sampleRate,
      };
    },
    playTone,
    setAudioCapture: (listener: AudioCaptureListener) => {
      audioCaptureListener = listener;
    },
    removeAudioCapture: () => {
      audioCaptureListener = undefined;
    },
    isAvailable,
  };
};

const emulator = createEmulator();

export default emulator;
