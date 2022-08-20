import { Binjgb, BinjgbModule } from "./WasmModuleWrapper";

type SerialCallback = (v: any) => void;

type StepTypes = "single" | "frame" | "run";

let emu: any;
let romPtr: number;
let romSize = 0;
let canvasCtx: CanvasRenderingContext2D | null;
let canvasImageData: ImageData;
let audioCtx: AudioContext;
let audioTime: number;
let serialCallback: SerialCallback;

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

const init = (canvas: HTMLCanvasElement | null, romData: Uint8Array) => {
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
  Module._emulator_set_bw_palette_simple(
    emu,
    0,
    0xffc2f0c4,
    0xffa8b95a,
    0xff6e601e,
    0xff001b2d
  );
  Module._emulator_set_bw_palette_simple(
    emu,
    1,
    0xffc2f0c4,
    0xffa8b95a,
    0xff6e601e,
    0xff001b2d
  );
  Module._emulator_set_bw_palette_simple(
    emu,
    2,
    0xffc2f0c4,
    0xffa8b95a,
    0xff6e601e,
    0xff001b2d
  );
  Module._emulator_set_default_joypad_callback(emu, 0);

  if (canvas) {
    canvasCtx = canvas.getContext("2d");
    if (canvasCtx) {
      canvasImageData = canvasCtx.createImageData(canvas.width, canvas.height);
    }
  }

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

const step = (stepType: StepTypes) => {
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

const renderScreen = () => {
  if (!isAvailable()) return;
  const buffer = new Uint8Array(
    Module.HEAP8.buffer,
    Module._get_frame_buffer_ptr(emu),
    Module._get_frame_buffer_size(emu)
  );
  canvasImageData.data.set(buffer);
  canvasCtx?.putImageData(canvasImageData, 0, 0);
};

const renderVRam = (canvas: HTMLCanvasElement) => {
  if (!isAvailable()) return;
  const ctx = canvas.getContext("2d");
  if (canvasCtx) {
    const imageData = canvasCtx.createImageData(256, 256);
    const ptr = Module._malloc(4 * 256 * 256);
    Module._emulator_render_vram(emu, ptr);
    const buffer = new Uint8Array(Module.HEAP8.buffer, ptr, 4 * 256 * 256);
    imageData?.data.set(buffer);
    ctx?.putImageData(imageData, 0, 0);
    Module._free(ptr);
  }
};

const renderBackground = (canvas: HTMLCanvasElement, type: any) => {
  if (!isAvailable()) return;
  const ctx = canvas.getContext("2d");
  if (canvasCtx) {
    const imageData = canvasCtx.createImageData(256, 256);
    const ptr = Module._malloc(4 * 256 * 256);
    Module._emulator_render_background(emu, ptr, type);
    const buffer = new Uint8Array(Module.HEAP8.buffer, ptr, 4 * 256 * 256);
    imageData?.data.set(buffer);
    ctx?.putImageData(imageData, 0, 0);
    Module._free(ptr);
  }
};

const getWRam = () => {
  if (!isAvailable()) return;

  const ptr = Module._emulator_get_wram_ptr(emu);
  return new Uint8Array(Module.HEAP8.buffer, ptr, 0x8000);
};

const getHRam = () => {
  if (!isAvailable()) return;

  const ptr = Module._emulator_get_hram_ptr(emu);
  return new Uint8Array(Module.HEAP8.buffer, ptr, 0x7f);
};

const getPC = () => Module._emulator_get_PC(emu);
const setPC = (pc: number) => Module._emulator_set_PC(emu, pc);
const getSP = () => Module._emulator_get_SP(emu);
const getA = () => Module._emulator_get_A(emu);
const getBC = () => Module._emulator_get_BC(emu);
const getDE = () => Module._emulator_get_DE(emu);
const getHL = () => Module._emulator_get_HL(emu);

const getFlags = () => {
  const flags = Module._emulator_get_F(emu);
  let result = "";
  if (flags & 0x80) result += "Z ";
  if (flags & 0x10) result += "C ";
  if (flags & 0x20) result += "H ";
  if (flags & 0x40) result += "N ";
  return result;
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

const setBreakpoint = (pc: number) => {
  if (!isAvailable()) return;
  Module._emulator_set_breakpoint(emu, pc);
};
const clearBreakpoints = () => {
  if (!isAvailable()) return;
  Module._emulator_clear_breakpoints(emu);
};

const setKeyPad = (key: string, down: boolean) => {
  if (!isAvailable()) return;
  if (key === "right") Module._set_joyp_right(emu, down);
  if (key === "left") Module._set_joyp_left(emu, down);
  if (key === "up") Module._set_joyp_up(emu, down);
  if (key === "down") Module._set_joyp_down(emu, down);
  if (key === "a") Module._set_joyp_A(emu, down);
  if (key === "b") Module._set_joyp_B(emu, down);
  if (key === "select") Module._set_joyp_select(emu, down);
  if (key === "start") Module._set_joyp_start(emu, down);
};

const setChannel = (channel: number, muted: boolean) => {
  if (!isAvailable()) return muted;
  return Module._set_audio_channel_mute(emu, channel, muted);
};

const setSerialCallback = (callback: SerialCallback) => {
  serialCallback = callback;
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
