/* eslint-disable camelcase */
import Binjgb from "../../../../appData/wasm/binjgb/binjgb";
import BinjgbModule from "../../../../appData/wasm/binjgb/binjgb.wasm";

let emu;
let rom_ptr;
let rom_size = 0;
let canvas_ctx;
let canvas_image_data;
let audio_ctx;
let audio_time;
let serial_callback = null;

const audio_buffer_size = 2048;

/* see: 
  https://gist.github.com/surma/b2705b6cca29357ebea1c9e6e15684cc
  https://github.com/webpack/webpack/issues/7352
*/
const locateFile = (module) => (path) => {
  if (path.endsWith(".wasm")) {
    return module;
  }
  return path;
};

let Module;
Binjgb({
  locateFile: locateFile(BinjgbModule),
}).then((module) => {
  Module = module;
});

const init = (canvas, rom_data) => {
  console.log("INIT EMULATOR");
  if (isAvailable()) destroy();

  if (typeof audio_ctx == "undefined") audio_ctx = new AudioContext();

  let required_size = ((rom_data.length - 1) | 0x3fff) + 1;
  if (required_size < 0x8000) required_size = 0x8000;
  if (rom_size < required_size) {
    if (typeof rom_ptr != "undefined") Module._free(rom_ptr);
    rom_ptr = Module._malloc(required_size);
    rom_size = required_size;
  }
  for (let n = 0; n < rom_size; n++) Module.HEAP8[rom_ptr + n] = 0;
  for (let n = 0; n < rom_data.length; n++)
    Module.HEAP8[rom_ptr + n] = rom_data[n];

  emu = Module._emulator_new_simple(
    rom_ptr,
    rom_size,
    audio_ctx.sampleRate,
    audio_buffer_size
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
    canvas_ctx = canvas.getContext("2d");
    canvas_image_data = canvas_ctx.createImageData(canvas.width, canvas.height);
  }

  audio_ctx.resume();
  audio_time = audio_ctx.currentTime;
};

const updateRom = (rom_data) => {
  if (!isAvailable()) {
    console.log("UPDATE ROM: NOT AVAILABLE");
    return false;
  }

  let required_size = ((rom_data.length - 1) | 0x3fff) + 1;
  if (required_size < 0x8000) required_size = 0x8000;
  if (rom_size < required_size) return false;
  for (let n = 0; n < rom_size; n++) Module.HEAP8[rom_ptr + n] = 0;
  for (let n = 0; n < rom_data.length; n++)
    Module.HEAP8[rom_ptr + n] = rom_data[n];
  return true;
};

const destroy = () => {
  if (!isAvailable()) return;
  Module._emulator_delete(emu);
  emu = undefined;
};

const isAvailable = () => typeof emu != "undefined";

const step = (step_type) => {
  if (!isAvailable()) return;
  let ticks = Module._emulator_get_ticks_f64(emu);
  if (step_type === "single") ticks += 1;
  else if (step_type === "frame") ticks += 70224;
  while (true) {
    const result = Module._emulator_run_until_f64(emu, ticks);
    if (result & 2) processAudioBuffer();
    if (result & 8)
      // Breakpoint hit
      return true;
    if (result & 16)
      // Illegal instruction
      return true;
    if (result !== 2 && step_type !== "run") return false;
    if (step_type === "run") {
      if (result & 4) {
        // Sync to the audio buffer, make sure we have 100ms of audio data buffered.
        if (audio_time < audio_ctx.currentTime + 0.1) ticks += 70224;
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
  canvas_image_data.data.set(buffer);
  canvas_ctx.putImageData(canvas_image_data, 0, 0);
};

const renderVRam = (canvas) => {
  if (!isAvailable()) return;
  const ctx = canvas.getContext("2d");
  const image_data = canvas_ctx.createImageData(256, 256);
  const ptr = Module._malloc(4 * 256 * 256);
  Module._emulator_render_vram(emu, ptr);
  const buffer = new Uint8Array(Module.HEAP8.buffer, ptr, 4 * 256 * 256);
  image_data.data.set(buffer);
  ctx.putImageData(image_data, 0, 0);
  Module._free(ptr);
};

const renderBackground = (canvas, type) => {
  if (!isAvailable()) return;
  const ctx = canvas.getContext("2d");
  const image_data = canvas_ctx.createImageData(256, 256);
  const ptr = Module._malloc(4 * 256 * 256);
  Module._emulator_render_background(emu, ptr, type);
  const buffer = new Uint8Array(Module.HEAP8.buffer, ptr, 4 * 256 * 256);
  image_data.data.set(buffer);
  ctx.putImageData(image_data, 0, 0);
  Module._free(ptr);
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
const setPC = (pc) => Module._emulator_set_PC(emu, pc);
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
const readMem = (addr) => {
  if (!isAvailable()) return 0xff;
  return Module._emulator_read_mem(emu, addr);
};
const writeMem = (addr, data) => {
  if (!isAvailable()) {
    console.log("WRITE MEM NOT AVAILABLE");
    return;
  }
  console.log("WRITE MEM", addr, data);
  return Module._emulator_write_mem(emu, addr, data);
};

const setBreakpoint = (pc) => {
  if (!isAvailable()) return;
  Module._emulator_set_breakpoint(emu, pc);
};
const clearBreakpoints = () => {
  if (!isAvailable()) return;
  Module._emulator_clear_breakpoints(emu);
};

const setKeyPad = (key, down) => {
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

const setChannel = (channel, muted) => {
  if (!isAvailable()) return muted;
  return Module._set_audio_channel_mute(emu, channel, muted);
};

const setSerialCallback = (callback) => {
  serial_callback = callback;
};

const serialCallback = (value) => {
  if (serial_callback) serial_callback(value);
};

function processAudioBuffer() {
  if (audio_time < audio_ctx.currentTime) audio_time = audio_ctx.currentTime;

  const input_buffer = new Uint8Array(
    Module.HEAP8.buffer,
    Module._get_audio_buffer_ptr(emu),
    Module._get_audio_buffer_capacity(emu)
  );
  const volume = 0.5;
  const buffer = audio_ctx.createBuffer(
    2,
    audio_buffer_size,
    audio_ctx.sampleRate
  );
  const channel0 = buffer.getChannelData(0);
  const channel1 = buffer.getChannelData(1);

  for (let i = 0; i < audio_buffer_size; i++) {
    channel0[i] = (input_buffer[2 * i] * volume) / 255;
    channel1[i] = (input_buffer[2 * i + 1] * volume) / 255;
  }
  const bufferSource = audio_ctx.createBufferSource();
  bufferSource.buffer = buffer;
  bufferSource.connect(audio_ctx.destination);
  bufferSource.start(audio_time);
  const buffer_sec = audio_buffer_size / audio_ctx.sampleRate;
  audio_time += buffer_sec;
}

export default {
  init,
  writeMem,
  readMem,
  step,
  updateRom,
  setChannel,
};
