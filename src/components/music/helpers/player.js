/* eslint-disable camelcase */
import compiler from "./compiler";
import storage from "./storage";
import emulator from "./emulator";
import {
  note2freq,
  NR10,
  NR11,
  NR12,
  NR13,
  NR14,
  NR30,
  NR31,
  NR32,
  NR33,
  NR34,
  NR41,
  NR42,
  NR43,
  NR44,
  AUD3_WAVE_RAM,
  NR21,
  NR22,
  NR23,
  NR24,
} from "./music_constants";
import { hi, lo } from "lib/helpers/8bit";

let update_handle = null;
let rom_file = null;
let current_song = null;

let current_sequence = -1;
let current_row = -1;

let timeoutId = null;

const channels = [false, false, false, false];

let onIntervalCallback = (updateData) => {};

const getMemAddress = (sym) => {
  return compiler.getRamSymbols().findIndex((v) => {
    return v === sym;
  });
};

const isPlayerPaused = () => {
  const is_player_paused = getMemAddress("is_player_paused");
  return emulator.readMem(is_player_paused) === 1;
};

const doPause = () => {
  const _if = emulator.readMem(0xff0f);
  console.log(_if);
  emulator.writeMem(0xff0f, _if | 0b00001000);
  console.log(emulator.readMem(0xff0f));

  while (!isPlayerPaused()) {
    console.log("PAUSING...");
    emulator.step("frame");
  }

  console.log("PAUSED");
};

const doResume = () => {
  const do_resume_player = getMemAddress("do_resume_player");
  emulator.writeMem(do_resume_player, 1);

  while (isPlayerPaused()) {
    console.log("RESUMING...");
    emulator.step("frame");
  }

  console.log("RESUMED");
};

const bitpack = (value, bitResolution) => {
  const bitsString = Math.abs(value || 0).toString(2);

  let missingValues = "";
  for (let i = 0; i < bitResolution - bitsString.length; i++) {
    missingValues = missingValues + "0";
  }

  return missingValues + bitsString.slice(0, bitResolution);
};

const note2noise = (note) => {
  // https://docs.google.com/spreadsheets/d/1O9OTAHgLk1SUt972w88uVHp44w7HKEbS/edit#gid=75028951
  // if A > 7 then begin
  //   B := (A-4) div 4;
  //   C := (A mod 4)+4;
  //   A := (C or (B shl 4))
  // end;
  let pitch = 64 > note ? 63 - note : 192 + note;
  return pitch > 7 ? (((pitch - 4) >> 2) << 4) + (pitch & 3) + 4 : pitch;
};

const initPlayer = (onInit, sfx) => {
  compiler.setLogCallback(console.log);
  compiler.setLinkOptions(["-t", "-w"]);

  // Load an empty song
  let songFile = `include "include/hUGE.inc"
    
  SECTION "song", ROM0[$1000]
  
  SONG_DESCRIPTOR::
  db 7  ; tempo
  dw song_order_cnt
  dw song_order1, song_order1, song_order1, song_order1
  dw 0, 0, 0
  dw 0
  dw 0
  
  song_order_cnt: db 1
  song_order1: dw P0
  
  P0:
   dn ___,0,$B01
   
  `;
  if (sfx) {
    songFile += `my_sfx:: db ${sfx}`;
  }
  storage.update("song.asm", songFile);

  compiler.compile((file, start_address, addr_to_line) => {
    rom_file = file;
    if (onInit) {
      onInit(file);
    }
    emulator.init(null, rom_file);

    const do_resume_player = getMemAddress("do_resume_player");

    const updateTracker = () => {
      emulator.step("run");
      console.log(
        "RUN",
        `Is Player Paused: ${isPlayerPaused()}`,
        `Do resume Player: ${emulator.readMem(do_resume_player)}`,
        `OxFF0F: ${emulator.readMem(0xff0f)}`,
        `Order Count: ${emulator.readMem(getMemAddress("order_cnt"))}`
      );
    };
    setInterval(updateTracker, 1000 / 64);
  });
};

const setChannel = (channel, muted) => {
  channels[channel] = emulator.setChannel(channel, muted);
  return channels;
};

const loadSong = (song) => {
  updateRom(song);
  emulator.step("frame");
  stop();
};

const play = (song, position) => {
  console.log("PLAY");
  updateRom(song);

  if (position) {
    console.log("POS", position);
    setStartPosition(position);
  }

  const ticks_per_row_addr = getMemAddress("ticks_per_row");
  emulator.writeMem(ticks_per_row_addr, song.ticks_per_row);

  if (isPlayerPaused()) {
    emulator.setChannel(0, channels[0]);
    emulator.setChannel(1, channels[1]);
    emulator.setChannel(2, channels[2]);
    emulator.setChannel(3, channels[3]);

    const current_order_addr = getMemAddress("current_order");
    const row_addr = getMemAddress("row");

    const order_cnt_addr = getMemAddress("order_cnt");
    emulator.writeMem(order_cnt_addr, song.sequence.length * 2);

    doResume();

    const updateUI = () => {
      const old_row = current_row;
      current_sequence = emulator.readMem(current_order_addr) / 2;
      current_row = emulator.readMem(row_addr);
      if (old_row !== current_row) {
        console.log(`Sequence: ${current_sequence}, Row: ${current_row}`);
        onIntervalCallback([current_sequence, current_row]);
      }
    };
    update_handle = setInterval(updateUI, 15.625);
  }
};

const playSound = () => {
  doPause();

  console.log("=======SFX=======");

  const my_sfx_addr = compiler.getRomSymbols().indexOf("my_sfx");
  const sfx_play_bank_addr = getMemAddress("_sfx_play_bank");
  const sfx_play_sample_addr = getMemAddress("_sfx_play_sample");

  console.log(
    my_sfx_addr,
    emulator.readMem(sfx_play_bank_addr),
    emulator.readMem(sfx_play_sample_addr),
    emulator.readMem(sfx_play_sample_addr + 1),
    sfx_play_sample_addr,
    sfx_play_bank_addr
  );
  emulator.writeMem(sfx_play_bank_addr, 1);

  emulator.writeMem(sfx_play_sample_addr, lo(my_sfx_addr));
  emulator.writeMem(sfx_play_sample_addr + 1, hi(my_sfx_addr));

  const b0 = emulator.readMem(sfx_play_sample_addr);
  const b1 = emulator.readMem(sfx_play_sample_addr + 1);
  const v = (b1 << 8) | b0;
  console.log("SFX", v, b0, b1);

  console.log("=======SFX=======");
  doResume();

  const sfx_update = setInterval(() => {
    const b0 = emulator.readMem(sfx_play_sample_addr);
    const b1 = emulator.readMem(sfx_play_sample_addr + 1);
    const v = (b1 << 8) | b0;

    console.log("SFX", v, b0, b1);
    if (v === 0) {
      doPause();
      clearInterval(sfx_update);
    }
  }, 1000 / 64);
};

const preview = (note, type, instrument, square2, waves = []) => {
  console.log(note, instrument, square2);
  const noteFreq = note2freq[note];

  if (waves.length === 0) {
    waves = current_song.waves;
  }

  switch (type) {
    case "duty":
      if (!square2) {
        const regs = {
          NR10:
            "0" +
            bitpack(instrument.frequency_sweep_time, 3) +
            (instrument.frequency_sweep_shift < 0 ? 1 : 0) +
            bitpack(Math.abs(instrument.frequency_sweep_shift), 3),
          NR11:
            bitpack(instrument.duty_cycle, 2) +
            bitpack(
              instrument.length !== null && instrument.length !== 0
                ? 64 - instrument.length
                : 0,
              6
            ),
          NR12:
            bitpack(instrument.initial_volume, 4) +
            (instrument.volume_sweep_change > 0 ? 1 : 0) +
            bitpack(
              instrument.volume_sweep_change !== 0
                ? 8 - Math.abs(instrument.volume_sweep_change)
                : 0,
              3
            ),
          NR13: bitpack(noteFreq & 0b11111111, 8),
          NR14:
            "1" + // Initial
            (instrument.length !== null ? 1 : 0) +
            "000" +
            bitpack((noteFreq & 0b0000011100000000) >> 8, 3),
        };

        console.log("-------------");
        console.log(`NR10`, regs.NR10, parseInt(regs.NR10, 2));
        console.log(`NR11`, regs.NR11, parseInt(regs.NR11, 2));
        console.log(`NR12`, regs.NR12, parseInt(regs.NR12, 2));
        console.log(`NR13`, regs.NR13, parseInt(regs.NR13, 2));
        console.log(`NR14`, regs.NR14, parseInt(regs.NR14, 2));
        console.log("=============");

        emulator.writeMem(NR10, parseInt(regs.NR10, 2));
        emulator.writeMem(NR11, parseInt(regs.NR11, 2));
        emulator.writeMem(NR12, parseInt(regs.NR12, 2));
        emulator.writeMem(NR13, parseInt(regs.NR13, 2));
        emulator.writeMem(NR14, parseInt(regs.NR14, 2));
      } else {
        const regs = {
          NR21:
            bitpack(instrument.duty_cycle, 2) +
            bitpack(
              instrument.length !== null && instrument.length !== 0
                ? 64 - instrument.length
                : 0,
              6
            ),
          NR22:
            bitpack(instrument.initial_volume, 4) +
            (instrument.volume_sweep_change > 0 ? 1 : 0) +
            bitpack(
              instrument.volume_sweep_change !== 0
                ? 8 - Math.abs(instrument.volume_sweep_change)
                : 0,
              3
            ),
          NR23: bitpack(noteFreq & 0b11111111, 8),
          NR24:
            "1" + // Initial
            (instrument.length !== null ? 1 : 0) +
            "000" +
            bitpack((noteFreq & 0b0000011100000000) >> 8, 3),
        };

        console.log("-------------");
        console.log(`NR21`, regs.NR21, parseInt(regs.NR21, 2));
        console.log(`NR22`, regs.NR22, parseInt(regs.NR22, 2));
        console.log(`NR23`, regs.NR23, parseInt(regs.NR23, 2));
        console.log(`NR24`, regs.NR24, parseInt(regs.NR24, 2));
        console.log("=============");

        emulator.writeMem(NR21, parseInt(regs.NR21, 2));
        emulator.writeMem(NR22, parseInt(regs.NR22, 2));
        emulator.writeMem(NR23, parseInt(regs.NR23, 2));
        emulator.writeMem(NR24, parseInt(regs.NR24, 2));
      }
      break;
    case "wave":
      // Copy Wave Form
      const wave = waves[instrument.wave_index];
      for (let idx = 0; idx < 16; idx++) {
        emulator.writeMem(
          AUD3_WAVE_RAM + idx,
          (wave[idx * 2] << 4) | wave[idx * 2 + 1]
        );
      }

      const regs = {
        NR30: "1" + bitpack(0, 7),
        NR31: bitpack(
          (instrument.length !== null ? 256 - instrument.length : 0) & 0xff,
          8
        ),
        NR32: "00" + bitpack(instrument.volume, 2) + "00000",
        NR33: bitpack(noteFreq & 0b11111111, 8),
        NR34:
          "1" + // Initial
          (instrument.length !== null ? 1 : 0) +
          "000" +
          bitpack((noteFreq & 0b0000011100000000) >> 8, 3).toString(2),
      };

      console.log("-------------");
      console.log(`NR30`, regs.NR30, parseInt(regs.NR30, 2));
      console.log(`NR31`, regs.NR31, parseInt(regs.NR31, 2));
      console.log(`NR32`, regs.NR32, parseInt(regs.NR32, 2));
      console.log(`NR33`, regs.NR33, parseInt(regs.NR33, 2));
      console.log(`NR34`, regs.NR34, parseInt(regs.NR34, 2));
      console.log("=============");

      emulator.writeMem(NR30, parseInt(regs.NR30, 2));
      emulator.writeMem(NR31, parseInt(regs.NR31, 2));
      emulator.writeMem(NR32, parseInt(regs.NR32, 2));
      emulator.writeMem(NR33, parseInt(regs.NR33, 2));
      emulator.writeMem(NR34, parseInt(regs.NR34, 2));

      break;
    case "noise":
      const regs = {
        NR41:
          "00" +
          bitpack(instrument.length !== null ? 64 - instrument.length : 0, 6),
        NR42:
          bitpack(instrument.initial_volume, 4) +
          (instrument.volume_sweep_change > 0 ? 1 : 0) +
          bitpack(
            instrument.volume_sweep_change !== 0
              ? 8 - Math.abs(instrument.volume_sweep_change)
              : 0,
            3
          ),
        NR43: bitpack(
          note2noise(note + instrument.noise_macro[0]) +
            (instrument.bit_count === 7 ? 8 : 0),
          8
        ),
        NR44:
          "1" + // Initial
          (instrument.length !== null ? 1 : 0) +
          "000000",
      };

      emulator.step("frame");
      let noiseStep = 0;
      clearInterval(noiseTimer);
      const noiseTimer = setInterval(() => {
        if (noiseStep > 5) {
          clearInterval(noiseTimer);
          return;
        }
        console.log("noise macro step = " + noiseStep);
        emulator.writeMem(
          NR43,
          note2noise(note + instrument.noise_macro[noiseStep]) +
            (instrument.bit_count === 7 ? 8 : 0),
          8
        );
        noiseStep++;
      }, 1000 / 64);

      console.log("-------------");
      console.log(`NR41`, regs.NR41, parseInt(regs.NR41, 2));
      console.log(`NR42`, regs.NR42, parseInt(regs.NR42, 2));
      console.log(`NR43`, regs.NR43, parseInt(regs.NR43, 2));
      console.log(`NR44`, regs.NR44, parseInt(regs.NR44, 2));
      console.log("=============");

      emulator.writeMem(NR41, parseInt(regs.NR41, 2));
      emulator.writeMem(NR42, parseInt(regs.NR42, 2));
      emulator.writeMem(NR43, parseInt(regs.NR43, 2));
      emulator.writeMem(NR44, parseInt(regs.NR44, 2));

      break;
    default:
      break;
  }

  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(() => {
    emulator.writeMem(NR12, 0);
    emulator.writeMem(NR22, 0);
    emulator.writeMem(NR30, 0);
    emulator.writeMem(NR42, 0);
  }, 2000);
};

const stop = (position) => {
  console.log("STOP!");

  if (!isPlayerPaused()) {
    doPause();
  }

  if (position) {
    setStartPosition(position);
  }

  clearInterval(update_handle);
  update_handle = null;
};

const setStartPosition = (position) => {
  let wasPlaying = false;

  if (!isPlayerPaused()) {
    wasPlaying = true;
    doPause();
  }

  const new_order_addr = getMemAddress("new_order");
  const new_row_addr = getMemAddress("new_row");
  const huge_tick = getMemAddress("tick");

  emulator.writeMem(new_order_addr, position[0] * 2);
  emulator.writeMem(new_row_addr, position[1]);
  emulator.writeMem(huge_tick, 0);

  if (wasPlaying) {
    doResume();
  }
};

const updateRom = (song) => {
  current_song = song;

  let addr = compiler.getRomSymbols().indexOf("SONG_DESCRIPTOR");

  const buf = new Uint8Array(rom_file.buffer);

  buf[addr] = song.ticks_per_row;
  let header_idx = addr + 1;
  addr += 21;

  buf[addr] = song.sequence.length * 2;
  function addAddr(size) {
    buf[header_idx + 0] = addr & 0xff;
    buf[header_idx + 1] = addr >> 8;
    header_idx += 2;
    addr += size;
  }
  addAddr(1);

  const orders_addr = [];
  for (let n = 0; n < 4; n++) {
    orders_addr.push(addr);
    addAddr(64 * 2);
  }
  for (let n = 0; n < song.duty_instruments.length; n++) {
    const instr = song.duty_instruments[n];

    const nr10 =
      (instr.frequency_sweep_time << 4) |
      (instr.frequency_sweep_shift < 0 ? 0x08 : 0x00) |
      Math.abs(instr.frequency_sweep_shift);
    const nr11 =
      (instr.duty_cycle << 6) |
      ((instr.length !== null ? 64 - instr.length : 0) & 0x3f);
    let nr12 =
      (instr.initial_volume << 4) |
      (instr.volume_sweep_change > 0 ? 0x08 : 0x00);
    if (instr.volume_sweep_change !== 0)
      nr12 |= 8 - Math.abs(instr.volume_sweep_change);
    const nr14 = 0x80 | (instr.length !== null ? 0x40 : 0);

    buf[addr + n * 4 + 0] = nr10;
    buf[addr + n * 4 + 1] = nr11;
    buf[addr + n * 4 + 2] = nr12;
    buf[addr + n * 4 + 3] = nr14;
  }
  addAddr(16 * 4);
  for (let n = 0; n < song.wave_instruments.length; n++) {
    const instr = song.wave_instruments[n];

    const nr31 = (instr.length !== null ? instr.length : 0) & 0xff;
    const nr32 = instr.volume << 5;
    const wave_nr = instr.wave_index;
    const nr34 = 0x80 | (instr.length !== null ? 0x40 : 0);

    buf[addr + n * 4 + 0] = nr31;
    buf[addr + n * 4 + 1] = nr32;
    buf[addr + n * 4 + 2] = wave_nr;
    buf[addr + n * 4 + 3] = nr34;
  }
  addAddr(16 * 4);
  for (let n = 0; n < song.noise_instruments.length; n++) {
    const instr = song.noise_instruments[n];

    let nr42 =
      (instr.initial_volume << 4) |
      (instr.volume_sweep_change > 0 ? 0x08 : 0x00);
    if (instr.volume_sweep_change !== 0)
      nr42 |= 8 - Math.abs(instr.volume_sweep_change);
    let param1 = (instr.length !== null ? 64 - instr.length : 0) & 0x3f;
    if (instr.length !== null) param1 |= 0x40;
    if (instr.bit_count === 7) param1 |= 0x80;

    buf[addr + n * 8 + 0] = nr42;
    buf[addr + n * 8 + 1] = param1;
    buf[addr + n * 8 + 2] = instr.noise_macro ? instr.noise_macro[0] : 0;
    buf[addr + n * 8 + 3] = instr.noise_macro ? instr.noise_macro[1] : 0;
    buf[addr + n * 8 + 4] = instr.noise_macro ? instr.noise_macro[2] : 0;
    buf[addr + n * 8 + 5] = instr.noise_macro ? instr.noise_macro[3] : 0;
    buf[addr + n * 8 + 6] = instr.noise_macro ? instr.noise_macro[4] : 0;
    buf[addr + n * 8 + 7] = instr.noise_macro ? instr.noise_macro[5] : 0;
  }
  addAddr(16 * 8);
  buf[header_idx + 0] = 0;
  buf[header_idx + 1] = 0;
  header_idx += 2;
  for (let n = 0; n < song.waves.length; n++) {
    for (let idx = 0; idx < 16; idx++)
      buf[addr + n * 16 + idx] =
        (song.waves[n][idx * 2] << 4) | song.waves[n][idx * 2 + 1];
  }
  addAddr(16 * 16);

  for (let track = 0; track < 4; track++) {
    const pattern_addr = [];
    for (let n = 0; n < song.patterns.length; n++) {
      const pattern = song.patterns[n];
      pattern_addr.push(addr);

      for (let idx = 0; idx < pattern.length; idx++) {
        const cell = pattern[idx][track];
        buf[addr++] = cell.note !== null ? cell.note : 90;
        buf[addr++] =
          ((cell.instrument !== null ? cell.instrument + 1 : 0) << 4) |
          (cell.effectcode !== null ? cell.effectcode : 0);
        buf[addr++] = cell.effectparam !== null ? cell.effectparam : 0;
      }
    }

    let order_addr = orders_addr[track];
    for (let n = 0; n < song.sequence.length; n++) {
      buf[order_addr++] = pattern_addr[song.sequence[n]] & 0xff;
      buf[order_addr++] = pattern_addr[song.sequence[n]] >> 8;
    }
  }

  emulator.updateRom(rom_file);
};

export default {
  initPlayer,
  loadSong,
  play,
  playSound,
  stop,
  preview,
  setChannel,
  setStartPosition,
  setOnIntervalCallback: (cb) => {
    onIntervalCallback = cb;
  },
  getRomFile: () => rom_file,
};
