import { Binjgb, BinjgbModule } from "./WasmModuleWrapper";

type StepType = "single" | "frame" | "run";

let emu: any;
let romPtr: number;
let romSize = 0;
let audioCtx: AudioContext;
let audioTime: number;

const audioBufferSize = 2048;

/* see: 
  https://gist.github.com/surma/b2705b6cca29357ebea1c9e6e15684cc
  https://github.com/webpack/webpack/issues/7352
*/
const locateFile = (module: any) => (path: string) => {
  if (path.endsWith(".wasm")) {
    return module;
  }
  return path;
};

let Module: any;
Binjgb({
  locateFile: locateFile(BinjgbModule),
}).then((module: any) => {
  Module = module;
});

const init = (romData: Uint8Array) => {
  console.log("INIT EMULATOR");
  if (isAvailable()) destroy();

  if (typeof audioCtx == "undefined") audioCtx = new AudioContext();

  let requiredSize = ((romData.length - 1) | 0x3fff) + 1;
  if (requiredSize < 0x8000) requiredSize = 0x8000;
  if (romSize < requiredSize) {
    if (typeof romPtr != "undefined") Module._free(romPtr);
    romPtr = Module._malloc(requiredSize);
    romSize = requiredSize;
  }
  for (let n = 0; n < romSize; n++) Module.HEAP8[romPtr + n] = 0;
  for (let n = 0; n < romData.length; n++)
    Module.HEAP8[romPtr + n] = romData[n];

  emu = Module._emulator_new_simple(
    romPtr,
    romSize,
    audioCtx.sampleRate,
    audioBufferSize
  );
  audioCtx.resume();
  audioTime = audioCtx.currentTime;
};

const updateRom = (romData: Uint8Array) => {
  if (!isAvailable()) {
    console.log("UPDATE ROM: NOT AVAILABLE");
    return false;
  }

  let requiredSize = ((romData.length - 1) | 0x3fff) + 1;
  if (requiredSize < 0x8000) requiredSize = 0x8000;
  if (romSize < requiredSize) return false;
  for (let n = 0; n < romSize; n++) Module.HEAP8[romPtr + n] = 0;
  for (let n = 0; n < romData.length; n++)
    Module.HEAP8[romPtr + n] = romData[n];
  return true;
};

const destroy = () => {
  if (!isAvailable()) return;
  Module._emulator_delete(emu);
  emu = undefined;
};

const isAvailable = () => typeof emu != "undefined";

const step = (stepType: StepType) => {
  if (!isAvailable()) return;
  let ticks = Module._emulator_get_ticks_f64(emu);
  if (stepType === "single") ticks += 1;
  else if (stepType === "frame") ticks += 70224;
  while (true) {
    const result = Module._emulator_run_until_f64(emu, ticks);
    if (result & 2) processAudioBuffer();
    if (result & 8)
      // Breakpoint hit
      return true;
    if (result & 16)
      // Illegal instruction
      return true;
    if (result !== 2 && stepType !== "run") return false;
    if (stepType === "run") {
      if (result & 4) {
        // Sync to the audio buffer, make sure we have 100ms of audio data buffered.
        if (audioTime < audioCtx.currentTime + 0.1) ticks += 70224;
        else return false;
      }
    }
  }
};

const readMem = (addr: number) => {
  if (!isAvailable()) return 0xff;
  return Module._emulator_read_mem(emu, addr);
};

const writeMem = (addr: number, data: number) => {
  if (!isAvailable()) {
    console.log("WRITE MEM NOT AVAILABLE");
    return;
  }
  console.log("WRITE MEM", addr, data);
  return Module._emulator_write_mem(emu, addr, data);
};

const setChannel = (channel: number, muted: boolean) => {
  if (!isAvailable()) return muted;
  return Module._set_audio_channel_mute(emu, channel, muted);
};

function processAudioBuffer() {
  if (audioTime < audioCtx.currentTime) audioTime = audioCtx.currentTime;

  const inputBuffer = new Uint8Array(
    Module.HEAP8.buffer,
    Module._get_audio_buffer_ptr(emu),
    Module._get_audio_buffer_capacity(emu)
  );
  const volume = 0.5;
  const buffer = audioCtx.createBuffer(2, audioBufferSize, audioCtx.sampleRate);
  const channel0 = buffer.getChannelData(0);
  const channel1 = buffer.getChannelData(1);

  for (let i = 0; i < audioBufferSize; i++) {
    channel0[i] = (inputBuffer[2 * i] * volume) / 255;
    channel1[i] = (inputBuffer[2 * i + 1] * volume) / 255;
  }
  const bufferSource = audioCtx.createBufferSource();
  bufferSource.buffer = buffer;
  bufferSource.connect(audioCtx.destination);
  bufferSource.start(audioTime);
  const bufferSec = audioBufferSize / audioCtx.sampleRate;
  audioTime += bufferSec;
}

export default {
  init,
  writeMem,
  readMem,
  step,
  updateRom,
  setChannel,
};
