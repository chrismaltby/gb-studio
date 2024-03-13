import compiler from "./compiler";
import storage from "./storage";
import emulator from "./emulator";
import { Song } from "shared/lib/uge/song/Song";
import { lo, hi } from "shared/lib/helpers/8bit";
import { SubPatternCell } from "shared/lib/uge/song/SubPatternCell";

type PlaybackPosition = [number, number];

let currentSong: Song | null = null;

let onSongProgressIntervalId: number | undefined;
let romFile: Uint8Array;

let currentSequence = -1;
let currentRow = -1;

const channels = [false, false, false, false];

let onIntervalCallback = (_updateData: PlaybackPosition) => {};

const getRamAddress = (sym: string) => {
  return compiler.getRamSymbols().indexOf(sym);
};

const getRomAddress = (sym: string) => {
  return compiler.getRomSymbols().indexOf(sym);
};

const isPlayerPaused = () => {
  const isPlayerPausedAddr = getRamAddress("is_player_paused");
  return emulator.readMem(isPlayerPausedAddr) === 1;
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
  const doResumePlayerAddr = getRamAddress("do_resume_player");
  emulator.writeMem(doResumePlayerAddr, 1);

  while (isPlayerPaused()) {
    console.log("RESUMING...");
    emulator.step("frame");
  }

  console.log("RESUMED");
};

const initPlayer = (onInit: (file: Uint8Array) => void, sfx?: string) => {
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

  const onCompileDone = (file?: Uint8Array) => {
    if (!file) return;

    romFile = file;
    if (onInit) {
      onInit(file);
    }
    emulator.init(romFile);

    const doResumePlayerAddr = getRamAddress("do_resume_player");

    const updateTracker = () => {
      emulator.step("run");
      console.log(
        "RUN",
        `Is Player Paused: ${isPlayerPaused()}`,
        `Do resume Player: ${emulator.readMem(doResumePlayerAddr)}`,
        `OxFF0F: ${emulator.readMem(0xff0f)}`,
        `Order Count: ${emulator.readMem(getRamAddress("order_cnt"))}`
      );
    };
    setInterval(updateTracker, 1000 / 64);
  };

  compiler.compile(["-t", "-w"], onCompileDone, console.log);
};

const setChannel = (channel: number, muted: boolean) => {
  channels[channel] = emulator.setChannel(channel, muted);
  return channels;
};

const loadSong = (song: Song) => {
  updateRom(song);
  emulator.step("frame");
  stop();
};

const play = (song: Song, position?: PlaybackPosition) => {
  console.log("PLAY");
  updateRom(song);

  if (position) {
    console.log("POS", position);
    setStartPosition(position);
  }

  const ticksPerRowAddr = getRamAddress("ticks_per_row");
  emulator.writeMem(ticksPerRowAddr, song.ticks_per_row);

  if (isPlayerPaused()) {
    emulator.setChannel(0, channels[0]);
    emulator.setChannel(1, channels[1]);
    emulator.setChannel(2, channels[2]);
    emulator.setChannel(3, channels[3]);

    const currentOrderAddr = getRamAddress("current_order");
    const rowAddr = getRamAddress("row");

    const orderCntAddr = getRamAddress("order_cnt");
    emulator.writeMem(orderCntAddr, song.sequence.length * 2);

    doResume();

    const updateUI = () => {
      const oldRow = currentRow;
      currentSequence = emulator.readMem(currentOrderAddr) / 2;
      currentRow = emulator.readMem(rowAddr);
      if (oldRow !== currentRow) {
        console.log(`Sequence: ${currentSequence}, Row: ${currentRow}`);
        onIntervalCallback([currentSequence, currentRow]);
      }
    };
    onSongProgressIntervalId = setInterval(updateUI, 1000 / 64);
  }
};

const playSound = () => {
  doPause();

  console.log("=======SFX=======");

  const mySfxAddr = getRomAddress("my_sfx");
  const sfxPlayBankAddr = getRamAddress("_sfx_play_bank");
  const sfxPlaySampleAddr = getRamAddress("_sfx_play_sample");

  console.log(
    mySfxAddr,
    emulator.readMem(sfxPlayBankAddr),
    emulator.readMem(sfxPlaySampleAddr),
    emulator.readMem(sfxPlaySampleAddr + 1),
    sfxPlaySampleAddr,
    sfxPlayBankAddr
  );
  emulator.writeMem(sfxPlayBankAddr, 1);

  emulator.writeMem(sfxPlaySampleAddr, lo(mySfxAddr));
  emulator.writeMem(sfxPlaySampleAddr + 1, hi(mySfxAddr));

  const b0 = emulator.readMem(sfxPlaySampleAddr);
  const b1 = emulator.readMem(sfxPlaySampleAddr + 1);
  const v = (b1 << 8) | b0;
  console.log("SFX", v, b0, b1);

  console.log("=======SFX=======");
  doResume();

  const sfxUpdate = setInterval(() => {
    const b0 = emulator.readMem(sfxPlaySampleAddr);
    const b1 = emulator.readMem(sfxPlaySampleAddr + 1);
    const v = (b1 << 8) | b0;

    console.log("SFX", v, b0, b1);
    if (v === 0) {
      doPause();
      clearInterval(sfxUpdate);
    }
  }, 1000 / 64);
};

const stop = (position?: PlaybackPosition) => {
  console.log("STOP!");

  if (!isPlayerPaused()) {
    doPause();
  }

  if (position) {
    setStartPosition(position);
  }

  clearInterval(onSongProgressIntervalId);
  onSongProgressIntervalId = undefined;
};

const setStartPosition = (position: PlaybackPosition) => {
  let wasPlaying = false;

  if (!isPlayerPaused()) {
    wasPlaying = true;
    doPause();
  }

  const newOrderAddr = getRamAddress("new_order");
  const newRowAddr = getRamAddress("new_row");
  const tickAddr = getRamAddress("tick");

  emulator.writeMem(newOrderAddr, position[0] * 2);
  emulator.writeMem(newRowAddr, position[1]);
  emulator.writeMem(tickAddr, 0);

  if (wasPlaying) {
    doResume();
  }
};

const updateRom = (song: Song) => {
  currentSong = song;

  const addr = getRomAddress("SONG_DESCRIPTOR");

  patchRom(romFile, song, addr);

  emulator.updateRom(romFile);
};

function patchRom(targetRomFile: Uint8Array, song: Song, startAddr: number) {
  console.log("PATCH ROM");
  const buf = new Uint8Array(targetRomFile.buffer);

  let addr = startAddr;
  let headerIndex = addr;

  function writeCurrentAddress() {
    buf[headerIndex + 0] = addr & 0xff;
    buf[headerIndex + 1] = addr >> 8;
    headerIndex += 2;
  }

  // write ticks_per_row (1 byte)
  buf[addr] = song.ticks_per_row;
  headerIndex += 1; // move header index to the order_cnt pointer position
  addr += 1;

  /* skip the set of header indexes to:
    - order count (1 word)
    - orders (4 words)
    - instruments (3 words)
    - routines (1 word) 
    - waves (1 word)
  */
  addr += 20;

  // write the order_cnt value in memory (1 byte)
  buf[addr] = song.sequence.length * 2;
  // write the address to the order_cnt in the order_cnt header index
  writeCurrentAddress();
  addr += 1;

  const ordersAddr = [];
  for (let n = 0; n < 4; n++) {
    // store the address to the order definition to use later
    ordersAddr.push(addr);
    // write the address in the orderN header index
    writeCurrentAddress();
    // skip the definition of the order (64 words)
    addr += 64 * 2;
  }

  const writeSubPatternCell = (cell: SubPatternCell, isLast: boolean) => {
    const jump = cell.jump !== null && isLast ? 1 : cell.jump ?? 0;

    buf[addr++] = cell.note ?? 90;
    buf[addr++] = (jump << 4) | (cell.effectcode ?? 0);
    buf[addr++] = cell.effectparam ?? 0;
  };

  const subpatternAddr: { [idx: string]: number } = {};

  for (let n = 0; n < song.duty_instruments.length; n++) {
    const instr = song.duty_instruments[n];
    subpatternAddr[`DutySP${instr.index}`] = instr.subpattern_enabled
      ? addr
      : 0;
    const pattern = song.duty_instruments[n].subpattern;
    for (let idx = 0; idx < 32; idx++) {
      writeSubPatternCell(pattern[idx], idx === 32 - 1);
    }
  }

  for (let n = 0; n < song.wave_instruments.length; n++) {
    const instr = song.wave_instruments[n];
    subpatternAddr[`WaveSP${instr.index}`] = instr.subpattern_enabled
      ? addr
      : 0;
    const pattern = song.wave_instruments[n].subpattern;
    for (let idx = 0; idx < 32; idx++) {
      writeSubPatternCell(pattern[idx], idx === 32 - 1);
    }
  }

  for (let n = 0; n < song.noise_instruments.length; n++) {
    const instr = song.noise_instruments[n];
    subpatternAddr[`NoiseSP${instr.index}`] = instr.subpattern_enabled
      ? addr
      : 0;
    const pattern = song.noise_instruments[n].subpattern;
    for (let idx = 0; idx < 32; idx++) {
      writeSubPatternCell(pattern[idx], idx === 32 - 1);
    }
  }

  console.log(subpatternAddr);

  for (let n = 0; n < song.duty_instruments.length; n++) {
    const instr = song.duty_instruments[n];

    const sweep =
      (instr.frequency_sweep_time << 4) |
      (instr.frequency_sweep_shift < 0 ? 0x08 : 0x00) |
      Math.abs(instr.frequency_sweep_shift);
    const lenDuty =
      (instr.duty_cycle << 6) |
      ((instr.length !== null ? 64 - instr.length : 0) & 0x3f);
    let envelope =
      (instr.initial_volume << 4) |
      (instr.volume_sweep_change > 0 ? 0x08 : 0x00);
    if (instr.volume_sweep_change !== 0)
      envelope |= 8 - Math.abs(instr.volume_sweep_change);
    const subpattern = subpatternAddr[`DutySP${instr.index}`] ?? 0;
    const highmask = 0x80 | (instr.length !== null ? 0x40 : 0);

    buf[addr + n * (4 + 2) + 0] = sweep;
    buf[addr + n * (4 + 2) + 1] = lenDuty;
    buf[addr + n * (4 + 2) + 2] = envelope;
    buf[addr + n * (4 + 2) + 3] = subpattern & 0xff;
    buf[addr + n * (4 + 2) + 4] = subpattern >> 8;
    buf[addr + n * (4 + 2) + 5] = highmask;
  }
  // write the pointer to the duty instruments to the first instruments header index
  writeCurrentAddress();
  // skip the duty instruments definition (16 * (3 bytes + 1 word + 1 byte) per instrument)
  addr += 16 * (4 + 2);

  for (let n = 0; n < song.wave_instruments.length; n++) {
    const instr = song.wave_instruments[n];

    const length = (instr.length !== null ? instr.length : 0) & 0xff;
    const volume = instr.volume << 5;
    const waveForm = instr.wave_index;
    const subpattern = subpatternAddr[`WaveSP${instr.index}`] ?? 0;
    const highmask = 0x80 | (instr.length !== null ? 0x40 : 0);

    buf[addr + n * (4 + 2) + 0] = length;
    buf[addr + n * (4 + 2) + 1] = volume;
    buf[addr + n * (4 + 2) + 2] = waveForm;
    buf[addr + n * (4 + 2) + 3] = subpattern & 0xff;
    buf[addr + n * (4 + 2) + 4] = subpattern >> 8;
    buf[addr + n * (4 + 2) + 5] = highmask;
  }
  // write the pointer to the wave instruments to the second instruments header index
  writeCurrentAddress();
  // skip the wave instruments definition (16 * (3 bytes + 1 word + 1 byte) per instrument)
  addr += 16 * (4 + 2);

  for (let n = 0; n < song.noise_instruments.length; n++) {
    const instr = song.noise_instruments[n];

    let envelope =
      (instr.initial_volume << 4) |
      (instr.volume_sweep_change > 0 ? 0x08 : 0x00);
    if (instr.volume_sweep_change !== 0)
      envelope |= 8 - Math.abs(instr.volume_sweep_change);
    const subpattern = subpatternAddr[`NoiseSP${instr.index}`] ?? 0;
    let highmask = (instr.length !== null ? 64 - instr.length : 0) & 0x3f;
    if (instr.length !== null) highmask |= 0x40;
    if (instr.bit_count === 7) highmask |= 0x80;

    buf[addr + n * (4 + 2) + 0] = envelope;
    buf[addr + n * (4 + 2) + 1] = subpattern & 0xff;
    buf[addr + n * (4 + 2) + 2] = subpattern >> 8;
    buf[addr + n * (4 + 2) + 3] = highmask;
    buf[addr + n * (4 + 2) + 4] = 0;
    buf[addr + n * (4 + 2) + 5] = 0;
  }
  // write the pointer to the noise instruments to the third instruments header index
  writeCurrentAddress();
  // skip the noise instruments definition (16 * (1 byte + 1 word + 3 bytes) per instrument)
  addr += 16 * (4 + 2);

  // write 0 to the routines header index
  buf[headerIndex + 0] = 0;
  buf[headerIndex + 1] = 0;
  headerIndex += 2;

  for (let n = 0; n < song.waves.length; n++) {
    for (let idx = 0; idx < 16; idx++)
      buf[addr + n * 16 + idx] =
        (song.waves[n][idx * 2] << 4) | song.waves[n][idx * 2 + 1];
  }
  // write the pointer to the waves definition to the waves header index
  writeCurrentAddress();
  addr += 16 * 16;

  for (let track = 0; track < 4; track++) {
    const patternAddr = [];
    for (let n = 0; n < song.patterns.length; n++) {
      const pattern = song.patterns[n];
      patternAddr.push(addr);

      for (let idx = 0; idx < pattern.length; idx++) {
        const cell = pattern[idx][track];
        buf[addr++] = cell.note !== null ? cell.note : 90;
        buf[addr++] =
          ((cell.instrument !== null ? cell.instrument + 1 : 0) << 4) |
          (cell.effectcode !== null ? cell.effectcode : 0);
        buf[addr++] = cell.effectparam !== null ? cell.effectparam : 0;
      }
    }

    let orderAddr = ordersAddr[track];
    for (let n = 0; n < song.sequence.length; n++) {
      buf[orderAddr++] = patternAddr[song.sequence[n]] & 0xff;
      buf[orderAddr++] = patternAddr[song.sequence[n]] >> 8;
    }
  }
}

const getCurrentSong = () => currentSong;

const reset = () => emulator.init(romFile);

const player = {
  initPlayer,
  loadSong,
  play,
  playSound,
  stop,
  setChannel,
  setStartPosition,
  getCurrentSong,
  setOnIntervalCallback: (cb: (position: PlaybackPosition) => void) => {
    onIntervalCallback = cb;
  },
  reset
};

export default player;
