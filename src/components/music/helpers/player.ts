import type {
  MusicPosition,
  MusicExportFormat,
  MusicPlaybackState,
} from "shared/lib/music/types";
import compiler from "./compiler";
import storage from "./storage";
import emulator, { createEmulator, type EmulatorController } from "./emulator";
import { Song, SubPatternCell } from "shared/lib/uge/types";
import { lo, hi } from "shared/lib/helpers/8bit";
import {
  ERROR_AUDIO_ENCODE_FAILED,
  ERROR_TIMED_OUT,
} from "shared/lib/music/constants";

let currentSong: Song | null = null;

let onSongProgressIntervalId: ReturnType<typeof setTimeout> | undefined;
let romFile: Uint8Array;

let isExporting = false;
let isPlayingSong = false;
let isPreviewPlaying = false;
let metronomeEnabled = false;
let lastPlaybackUpdateKey: string | null = null;
let lastPlaybackRowKey: string | null = null;

const channels: [boolean, boolean, boolean, boolean] = [
  false,
  false,
  false,
  false,
];
const previewEmulator = createEmulator();

let onIntervalCallback = (_updateData: MusicPlaybackState) => {};
let onPreviewPlaybackTimeout: ReturnType<typeof setTimeout> | undefined;

const exportMaxRenderSeconds = 60 * 10;
const gameBoyFrameDuration = 70224 / 4194304;
const previewPrebufferSeconds = 0.2;
const previewPrebufferMaxIterations = 24;

const playMetronomeTick = (currentTick: number) => {
  const { currentTime, scheduledTime } = emulator.getAudioClock();
  const startTime = Math.max(
    currentTime,
    scheduledTime - currentTick * gameBoyFrameDuration,
  );

  emulator.playTone(1760, 0.05, startTime, 0.12);
};

const resetPositionCallback = () => {
  lastPlaybackUpdateKey = null;
  lastPlaybackRowKey = null;
};

const onPlaybackPositionUpdate = (update: MusicPlaybackState) => {
  const { sequence, row, tick, ticksPerRow } = update;
  const updateKey = `${sequence}:${row}:${tick}:${ticksPerRow}`;
  if (updateKey === lastPlaybackUpdateKey) {
    return;
  }
  lastPlaybackUpdateKey = updateKey;

  onIntervalCallback(update);

  const rowKey = `${sequence}:${row}`;
  if (rowKey === lastPlaybackRowKey) {
    return;
  }
  lastPlaybackRowKey = rowKey;

  if (!metronomeEnabled || row % 4 !== 0) {
    return;
  }

  playMetronomeTick(tick);
};

type RenderedSongAudio = {
  leftChunks: Float32Array[];
  rightChunks: Float32Array[];
  sampleRate: number;
};

type MediabunnyModule = typeof import("mediabunny");

let mp3EncoderRegistered = false;
let flacEncoderRegistered = false;
let mediabunnyModulePromise: Promise<MediabunnyModule> | null = null;

const getRamAddress = (sym: string) => {
  return compiler.getRamSymbols().indexOf(sym);
};

const getRomAddress = (sym: string) => {
  return compiler.getRomSymbols().indexOf(sym);
};

const getMediabunny = async () => {
  if (!mediabunnyModulePromise) {
    mediabunnyModulePromise = import("mediabunny");
  }
  return mediabunnyModulePromise;
};

const isPlayerPaused = (targetEmulator: EmulatorController = emulator) => {
  const isPlayerPausedAddr = getRamAddress("is_player_paused");
  return targetEmulator.readMem(isPlayerPausedAddr) === 1;
};

const doPause = (targetEmulator: EmulatorController = emulator) => {
  const _if = targetEmulator.readMem(0xff0f);
  targetEmulator.writeMem(0xff0f, _if | 0b00001000);

  while (!isPlayerPaused(targetEmulator)) {
    targetEmulator.step("frame");
  }
};

const doResume = (targetEmulator: EmulatorController = emulator) => {
  const doResumePlayerAddr = getRamAddress("do_resume_player");
  targetEmulator.writeMem(doResumePlayerAddr, 1);

  while (isPlayerPaused(targetEmulator)) {
    targetEmulator.step("frame");
  }
};

const clearPreviewTimeout = () => {
  if (onPreviewPlaybackTimeout) {
    clearTimeout(onPreviewPlaybackTimeout);
  }
  onPreviewPlaybackTimeout = undefined;
};

const stopPreview = () => {
  clearPreviewTimeout();
  isPreviewPlaying = false;

  if (previewEmulator.isAvailable() && !isPlayerPaused(previewEmulator)) {
    doPause(previewEmulator);
  }

  if (previewEmulator.isAvailable()) {
    previewEmulator.resetAudio();
  }
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
    emulator.init(romFile);
    previewEmulator.init(romFile);
    if (onInit) {
      onInit(file);
    }

    // const doResumePlayerAddr = getRamAddress("do_resume_player");

    const updateTracker = () => {
      if (isExporting) {
        return;
      }
      emulator.step("run");
      if (isPreviewPlaying) {
        previewEmulator.step("run");
      }
      // console.log(
      //   "RUN",
      //   `Is Player Paused: ${isPlayerPaused()}`,
      //   `Do resume Player: ${emulator.readMem(doResumePlayerAddr)}`,
      //   `OxFF0F: ${emulator.readMem(0xff0f)}`,
      //   `Order Count: ${emulator.readMem(getRamAddress("order_cnt"))}`,
      // );
    };
    setInterval(updateTracker, 1000 / 64);
  };

  compiler.compile(["-t", "-w"], onCompileDone, () => {});
};

const setChannel = (
  channel: number,
  muted: boolean,
): [boolean, boolean, boolean, boolean] => {
  const unmutedChannels = channels.filter((i) => !i);
  if (unmutedChannels.length <= 1) {
    // Unmute all channels except selected one
    for (let i = 0; i < channels.length; i++) {
      channels[i] = emulator.setChannel(i, i === channel);
    }
  } else {
    // Mute selected
    channels[channel] = emulator.setChannel(channel, muted);
  }
  return [channels[0], channels[1], channels[2], channels[3]];
};

const setSolo = (
  channel: number,
  enabled: boolean,
): [boolean, boolean, boolean, boolean] => {
  if (enabled) {
    for (let i = 0; i < channels.length; i++) {
      channels[i] = emulator.setChannel(i, i !== channel);
    }
  } else {
    for (let i = 0; i < channels.length; i++) {
      channels[i] = emulator.setChannel(i, false);
    }
  }
  return [channels[0], channels[1], channels[2], channels[3]];
};

const loadSong = (song: Song) => {
  stopPreview();
  updateRom(song);
  emulator.step("frame");
  stop();
  resetPositionCallback();
  resetChannels();
};

const loadSound = (sfx?: string) => {
  stopPreview();
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
    emulator.init(romFile);
    previewEmulator.init(romFile);
    playSound();
  };

  compiler.compile(["-t", "-w"], onCompileDone, console.log);
};

const play = (song: Song, position?: MusicPosition) => {
  stopPreview();
  updateRom(song);
  emulator.step("frame");
  stop();
  resetPositionCallback();

  if (position) {
    // console.log("POS", position);
    setStartPosition(position);
  }

  const ticksPerRowAddr = getRamAddress("ticks_per_row");
  emulator.writeMem(ticksPerRowAddr, song.ticksPerRow);

  // console.log("PLAY SONG HERE?", isPlayerPaused());

  if (isPlayerPaused()) {
    isPlayingSong = true;

    // console.log("RESET MUTE BACK TO", channels);
    emulator.setChannel(0, channels[0]);
    emulator.setChannel(1, channels[1]);
    emulator.setChannel(2, channels[2]);
    emulator.setChannel(3, channels[3]);

    const currentOrderAddr = getRamAddress("current_order");
    const rowAddr = getRamAddress("row");
    const tickAddr = getRamAddress("tick");
    const ticksPerRowAddr = getRamAddress("ticks_per_row");

    const orderCntAddr = getRamAddress("order_cnt");
    emulator.writeMem(orderCntAddr, song.sequence.length * 2);

    doResume();

    const updateUI = () => {
      onPlaybackPositionUpdate({
        sequence: emulator.readMem(currentOrderAddr) / 2,
        row: emulator.readMem(rowAddr),
        tick: emulator.readMem(tickAddr),
        ticksPerRow: emulator.readMem(ticksPerRowAddr),
      });
    };
    updateUI();
    onSongProgressIntervalId = setInterval(updateUI, 1000 / 64);
  }
};

const playPreview = (song: Song, length: number) => {
  if (!romFile) {
    return;
  }

  stopPreview();

  const previewRomFile = new Uint8Array(romFile);
  const addr = getRomAddress("SONG_DESCRIPTOR");
  patchRom(previewRomFile, song, addr);

  previewEmulator.init(previewRomFile);
  previewEmulator.step("frame");
  previewEmulator.resetAudio();

  const newOrderAddr = getRamAddress("new_order");
  const newRowAddr = getRamAddress("new_row");
  const tickAddr = getRamAddress("tick");
  previewEmulator.writeMem(newOrderAddr, 0);
  previewEmulator.writeMem(newRowAddr, 0);
  previewEmulator.writeMem(tickAddr, 0);

  const ticksPerRowAddr = getRamAddress("ticks_per_row");
  previewEmulator.writeMem(ticksPerRowAddr, song.ticksPerRow);

  if (isPlayerPaused(previewEmulator)) {
    previewEmulator.setChannel(0, false);
    previewEmulator.setChannel(1, false);
    previewEmulator.setChannel(2, false);
    previewEmulator.setChannel(3, false);

    const orderCntAddr = getRamAddress("order_cnt");
    previewEmulator.writeMem(orderCntAddr, song.sequence.length * 2);

    doResume(previewEmulator);
    isPreviewPlaying = true;
    for (
      let iteration = 1;
      iteration <= previewPrebufferMaxIterations;
      iteration++
    ) {
      previewEmulator.step("run");
      const audioClock = previewEmulator.getAudioClock();
      const bufferedSeconds = audioClock.scheduledTime - audioClock.currentTime;
      if (bufferedSeconds >= previewPrebufferSeconds) {
        break;
      }
    }

    onPreviewPlaybackTimeout = setTimeout(() => {
      stopPreview();
    }, length);
  }
};

const playSound = () => {
  doPause();

  // console.log("=======SFX=======");

  const mySfxAddr = getRomAddress("my_sfx");
  const sfxPlayBankAddr = getRamAddress("_sfx_play_bank");
  const sfxPlaySampleAddr = getRamAddress("_sfx_play_sample");

  // console.log(
  //   mySfxAddr,
  //   emulator.readMem(sfxPlayBankAddr),
  //   emulator.readMem(sfxPlaySampleAddr),
  //   emulator.readMem(sfxPlaySampleAddr + 1),
  //   sfxPlaySampleAddr,
  //   sfxPlayBankAddr,
  // );
  emulator.writeMem(sfxPlayBankAddr, 1);

  emulator.writeMem(sfxPlaySampleAddr, lo(mySfxAddr));
  emulator.writeMem(sfxPlaySampleAddr + 1, hi(mySfxAddr));

  // const b0 = emulator.readMem(sfxPlaySampleAddr);
  // const b1 = emulator.readMem(sfxPlaySampleAddr + 1);
  // const v = (b1 << 8) | b0;
  // console.log("SFX", v, b0, b1);

  // console.log("=======SFX=======");
  doResume();

  const sfxUpdate = setInterval(() => {
    const b0 = emulator.readMem(sfxPlaySampleAddr);
    const b1 = emulator.readMem(sfxPlaySampleAddr + 1);
    const v = (b1 << 8) | b0;

    // console.log("SFX", v, b0, b1);
    if (v === 0) {
      doPause();
      clearInterval(sfxUpdate);
    }
  }, 1000 / 64);
};

const stop = (position?: MusicPosition) => {
  isPlayingSong = false;
  resetPositionCallback();

  if (!isPlayerPaused()) {
    doPause();
  }

  if (position) {
    setStartPosition(position);
  }

  if (onSongProgressIntervalId) {
    clearInterval(onSongProgressIntervalId);
  }
  onSongProgressIntervalId = undefined;
};

const setStartPosition = (position: MusicPosition) => {
  let wasPlaying = false;
  resetPositionCallback();

  if (!isPlayerPaused()) {
    wasPlaying = true;
    doPause();
  }

  const newOrderAddr = getRamAddress("new_order");
  const newRowAddr = getRamAddress("new_row");
  const tickAddr = getRamAddress("tick");

  emulator.writeMem(newOrderAddr, position.sequence * 2);
  emulator.writeMem(newRowAddr, position.row);
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

const renderSongAudio = async (
  song: Song,
  loopCount = 1,
): Promise<RenderedSongAudio> => {
  const leftChunks: Float32Array[] = [];
  const rightChunks: Float32Array[] = [];
  let sampleRate = 44100;
  const targetLoopCount = Math.max(1, Math.floor(loopCount));
  let reachedTargetLoopCount = false;
  let capturedSamples = 0;
  let lastPosition = "0:0";
  const visitedPositions = new Map<string, number>();

  emulator.setAudioCapture((left, right, captureSampleRate) => {
    sampleRate = captureSampleRate;
    leftChunks.push(left);
    rightChunks.push(right);
    capturedSamples += left.length;
  });
  emulator.resetAudio();

  const ticksPerRowAddr = getRamAddress("ticks_per_row");
  const currentOrderAddr = getRamAddress("current_order");
  const rowAddr = getRamAddress("row");
  const orderCntAddr = getRamAddress("order_cnt");
  const previousChannels: [boolean, boolean, boolean, boolean] = [...channels];

  try {
    updateRom(song);
    stop({ sequence: 0, row: 0 });
    setStartPosition({ sequence: 0, row: 0 });

    emulator.writeMem(ticksPerRowAddr, song.ticksPerRow);
    emulator.writeMem(orderCntAddr, song.sequence.length * 2);
    emulator.setChannel(0, false);
    emulator.setChannel(1, false);
    emulator.setChannel(2, false);
    emulator.setChannel(3, false);

    if (isPlayerPaused()) {
      doResume();
    }

    visitedPositions.set(lastPosition, 1);

    while (
      !reachedTargetLoopCount &&
      capturedSamples < exportMaxRenderSeconds * sampleRate
    ) {
      emulator.step("frame");

      const currentSequence = emulator.readMem(currentOrderAddr) / 2;
      const currentRow = emulator.readMem(rowAddr);
      const currentPosition = `${currentSequence}:${currentRow}`;

      if (currentPosition !== lastPosition) {
        const nextVisitCount = (visitedPositions.get(currentPosition) ?? 0) + 1;

        if (nextVisitCount > targetLoopCount) {
          reachedTargetLoopCount = true;
          break;
        }

        visitedPositions.set(currentPosition, nextVisitCount);
        lastPosition = currentPosition;
      }
    }
  } finally {
    stop({ sequence: 0, row: 0 });
    emulator.setChannel(0, previousChannels[0]);
    emulator.setChannel(1, previousChannels[1]);
    emulator.setChannel(2, previousChannels[2]);
    emulator.setChannel(3, previousChannels[3]);
    emulator.removeAudioCapture();
    emulator.resetAudio();
  }

  if (!reachedTargetLoopCount) {
    throw new Error(ERROR_TIMED_OUT);
  }

  return {
    leftChunks,
    rightChunks,
    sampleRate,
  };
};

const interleaveAudioChunks = (
  leftChunks: Float32Array[],
  rightChunks: Float32Array[],
) => {
  const sampleCount = leftChunks.reduce(
    (memo, chunk) => memo + chunk.length,
    0,
  );
  const interleaved = new Float32Array(sampleCount * 2);
  let offset = 0;

  for (let chunkIndex = 0; chunkIndex < leftChunks.length; chunkIndex++) {
    const left = leftChunks[chunkIndex];
    const right = rightChunks[chunkIndex];
    for (let i = 0; i < left.length; i++) {
      interleaved[offset++] = left[i];
      interleaved[offset++] = right[i];
    }
  }

  return interleaved;
};

const ensureAudioEncoder = async (
  format: MusicExportFormat,
  sampleRate: number,
) => {
  const mediabunny = await getMediabunny();
  const options = {
    numberOfChannels: 2,
    sampleRate,
    bitrate: mediabunny.QUALITY_HIGH,
  } as const;
  const codec = format === "wav" ? "pcm-s16" : format;
  const nativeSupported = await mediabunny.canEncodeAudio(codec, options);

  if (nativeSupported) {
    return codec;
  }

  if (format === "mp3") {
    if (!mp3EncoderRegistered) {
      const { registerMp3Encoder } = await import("@mediabunny/mp3-encoder");
      registerMp3Encoder();
      mp3EncoderRegistered = true;
    }
  } else if (!flacEncoderRegistered) {
    const { registerFlacEncoder } = await import("@mediabunny/flac-encoder");
    registerFlacEncoder();
    flacEncoderRegistered = true;
  }

  const supportedAfterRegister = await mediabunny.canEncodeAudio(
    codec,
    options,
  );

  if (!supportedAfterRegister) {
    throw new Error(ERROR_AUDIO_ENCODE_FAILED);
  }

  return codec;
};

const encodeAudio = async (
  audio: RenderedSongAudio,
  format: MusicExportFormat,
) => {
  const mediabunny = await getMediabunny();
  const codec = await ensureAudioEncoder(format, audio.sampleRate);

  const target = new mediabunny.BufferTarget();

  let outputFormat;

  if (format === "wav") {
    outputFormat = new mediabunny.WavOutputFormat();
  } else if (format === "mp3") {
    outputFormat = new mediabunny.Mp3OutputFormat();
  } else {
    outputFormat = new mediabunny.FlacOutputFormat();
  }

  const output = new mediabunny.Output({
    format: outputFormat,
    target,
  });

  const source =
    format === "wav"
      ? new mediabunny.AudioSampleSource({ codec })
      : new mediabunny.AudioSampleSource({
          codec,
          bitrate: mediabunny.QUALITY_HIGH,
          transform: format === "flac" ? { sampleFormat: "s16" } : undefined,
        });

  output.addAudioTrack(source);
  await output.start();

  const audioSample = new mediabunny.AudioSample({
    format: "f32",
    sampleRate: audio.sampleRate,
    numberOfChannels: 2,
    timestamp: 0,
    data: interleaveAudioChunks(audio.leftChunks, audio.rightChunks),
  });

  try {
    await source.add(audioSample);
    await output.finalize();
  } finally {
    audioSample.close();
  }

  if (!target.buffer) {
    throw new Error(ERROR_AUDIO_ENCODE_FAILED);
  }

  return new Uint8Array(target.buffer);
};

const exportSong = async (
  song: Song,
  format: MusicExportFormat,
  loopCount = 1,
) => {
  isExporting = true;
  try {
    const audio = await renderSongAudio(song, loopCount);
    const data = await encodeAudio(audio, format);
    return data;
  } finally {
    isExporting = false;
  }
};

function patchRom(targetRomFile: Uint8Array, song: Song, startAddr: number) {
  // console.log("PATCH ROM");
  const buf = new Uint8Array(targetRomFile.buffer);

  let addr = startAddr;
  let headerIndex = addr;

  function writeCurrentAddress() {
    buf[headerIndex + 0] = addr & 0xff;
    buf[headerIndex + 1] = addr >> 8;
    headerIndex += 2;
  }

  // write ticks_per_row (1 byte)
  buf[addr] = song.ticksPerRow;
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
    const jump = cell.jump !== null && isLast ? 1 : (cell.jump ?? 0);

    buf[addr++] = cell.note ?? 90;
    buf[addr++] = (jump << 4) | (cell.effectCode ?? 0);
    buf[addr++] = cell.effectParam ?? 0;
  };

  const subpatternAddr: { [idx: string]: number } = {};

  for (let n = 0; n < song.dutyInstruments.length; n++) {
    const instr = song.dutyInstruments[n];
    subpatternAddr[`DutySP${instr.index}`] = instr.subpatternEnabled ? addr : 0;
    const pattern = song.dutyInstruments[n].subpattern;
    for (let idx = 0; idx < 32; idx++) {
      writeSubPatternCell(pattern[idx], idx === 32 - 1);
    }
  }

  for (let n = 0; n < song.waveInstruments.length; n++) {
    const instr = song.waveInstruments[n];
    subpatternAddr[`WaveSP${instr.index}`] = instr.subpatternEnabled ? addr : 0;
    const pattern = song.waveInstruments[n].subpattern;
    for (let idx = 0; idx < 32; idx++) {
      writeSubPatternCell(pattern[idx], idx === 32 - 1);
    }
  }

  for (let n = 0; n < song.noiseInstruments.length; n++) {
    const instr = song.noiseInstruments[n];
    subpatternAddr[`NoiseSP${instr.index}`] = instr.subpatternEnabled
      ? addr
      : 0;
    const pattern = song.noiseInstruments[n].subpattern;
    for (let idx = 0; idx < 32; idx++) {
      writeSubPatternCell(pattern[idx], idx === 32 - 1);
    }
  }

  // console.log(subpatternAddr);

  for (let n = 0; n < song.dutyInstruments.length; n++) {
    const instr = song.dutyInstruments[n];

    const sweep =
      (instr.frequencySweepTime << 4) |
      (instr.frequencySweepShift < 0 ? 0x08 : 0x00) |
      Math.abs(instr.frequencySweepShift);
    const lenDuty =
      (instr.dutyCycle << 6) |
      ((instr.length !== null ? 64 - instr.length : 0) & 0x3f);
    let envelope =
      (instr.initialVolume << 4) | (instr.volumeSweepChange > 0 ? 0x08 : 0x00);
    if (instr.volumeSweepChange !== 0)
      envelope |= 8 - Math.abs(instr.volumeSweepChange);
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

  for (let n = 0; n < song.waveInstruments.length; n++) {
    const instr = song.waveInstruments[n];

    const length = (instr.length !== null ? 256 - instr.length : 0) & 0xff;
    const volume = instr.volume << 5;
    const waveForm = instr.waveIndex;
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

  for (let n = 0; n < song.noiseInstruments.length; n++) {
    const instr = song.noiseInstruments[n];

    let envelope =
      (instr.initialVolume << 4) | (instr.volumeSweepChange > 0 ? 0x08 : 0x00);
    if (instr.volumeSweepChange !== 0)
      envelope |= 8 - Math.abs(instr.volumeSweepChange);
    const subpattern = subpatternAddr[`NoiseSP${instr.index}`] ?? 0;
    let highmask = (instr.length !== null ? 64 - instr.length : 0) & 0x3f;
    if (instr.length !== null) highmask |= 0x40;
    if (instr.bitCount === 7) highmask |= 0x80;

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

  const patternAddr = [];
  for (let n = 0; n < song.patterns.length; n++) {
    const pattern = song.patterns[n];
    patternAddr.push(addr);

    for (let idx = 0; idx < pattern.length; idx++) {
      const cell = pattern[idx];
      buf[addr++] = cell.note !== null ? cell.note : 90;
      buf[addr++] =
        ((cell.instrument !== null ? cell.instrument + 1 : 0) << 4) |
        (cell.effectCode !== null ? cell.effectCode : 0);
      buf[addr++] = cell.effectParam !== null ? cell.effectParam : 0;
    }
  }

  for (let track = 0; track < 4; track++) {
    let orderAddr = ordersAddr[track];
    for (let n = 0; n < song.sequence.length; n++) {
      buf[orderAddr++] = patternAddr[song.sequence[n].channels[track]] & 0xff;
      buf[orderAddr++] = patternAddr[song.sequence[n].channels[track]] >> 8;
    }
  }
}

const getCurrentSong = () => currentSong;

const reset = () => {
  if (!romFile) {
    return;
  }
  emulator.init(romFile);
  previewEmulator.init(romFile);
  stopPreview();
  resetPositionCallback();
};

const resetChannels = () => {
  for (let i = 0; i < 3; i++) {
    channels[i] = false;
  }
};

const player = {
  initPlayer,
  loadSong,
  loadSound,
  play,
  playPreview,
  playSound,
  isPlayingSong: () => isPlayingSong,
  stop,
  setChannel,
  setSolo,
  setStartPosition,
  setMetronomeEnabled: (enabled: boolean) => {
    metronomeEnabled = enabled;
    if (!enabled) {
      resetPositionCallback();
    }
  },
  getCurrentSong,
  setOnIntervalCallback: (cb: (update: MusicPlaybackState) => void) => {
    onIntervalCallback = cb;
  },
  reset,
  exportSong,
};

export default player;
