/* eslint-disable camelcase */
import compiler from "./compiler";
import storage from "./storage";
import emulator from "./emulator";

let interval_handle = null;
let update_handle = null;
let rom_file = null;
let muted_channels_mask = 0;

let current_sequence = -1;
let current_row = -1;

let onIntervalCallback = (updateData) => { };

const initPlayer = (onInit) => {
  compiler.setLogCallback(console.log);
  compiler.setLinkOptions(['-t', '-w']);

  storage.update("song.asm", "SECTION \"song\", ROM0[$1000]\n_song_descriptor:: ds $8000 - @")

  compiler.compile((file, start_address, addr_to_line) => {
    rom_file = file;
    if (onInit) {
      onInit(file);
    }
  });
}

const toggleMute = (channel) => {
  const mask = 1 << channel;
  if (muted_channels_mask & mask) {
    muted_channels_mask &= ~mask;
    return false;
  }
  muted_channels_mask |= mask;
  emulator.writeMem(0xFF12 + channel * 5, 0)
  return true;
}

const play = (song) => {
  stop();
  updateRom(song);

  const current_order_addr = compiler.getRamSymbols().findIndex((v) => { return v === "current_order" });
  const row_addr = compiler.getRamSymbols().findIndex((v) => { return v === "row" });
  const mute_addr = compiler.getRamSymbols().findIndex((v) => { return v === "mute_channels" });

  emulator.init(null, rom_file);

  const updateTracker = () => {
    emulator.writeMem(mute_addr, muted_channels_mask)
    emulator.step("run");
  }
  interval_handle = setInterval(updateTracker, 10);

  const updateUI = () => {
    const old_row = current_row;

    current_sequence = emulator.readMem(current_order_addr) / 2;
    current_row = emulator.readMem(row_addr);
    if (old_row !== current_row) {
      onIntervalCallback([current_sequence, current_row]);
    }
  }
  update_handle = setInterval(updateUI, 10);
}

const stop = () => {
  if (interval_handle === null)
    return;
  clearInterval(interval_handle);
  window.cancelAnimationFrame(update_handle);
  interval_handle = null;
}

const updateRom = (song) => {
  let addr = compiler.getRomSymbols().indexOf("_song_descriptor");
  const buf = new Uint8Array(rom_file.buffer);

  buf[addr] = song.ticks_per_row;
  let header_idx = addr + 1;
  addr += 21;

  buf[addr] = song.sequence.length * 2;
  function addAddr(size) {
    buf[header_idx + 0] = addr & 0xFF;
    buf[header_idx + 1] = addr >> 8;
    header_idx += 2;
    addr += size;
  }
  addAddr(1);

  const orders_addr = []
  for (let n = 0; n < 4; n++) {
    orders_addr.push(addr);
    addAddr(64 * 2);
  }
  for (let n = 0; n < song.duty_instruments.length; n++) {
    const instr = song.duty_instruments[n];

    const nr10 = (instr.frequency_sweep_time << 4) | (instr.frequency_sweep_shift < 0 ? 0x08 : 0x00) | Math.abs(instr.frequency_sweep_shift);
    const nr11 = (instr.duty_cycle << 6) | ((instr.length !== null ? 64 - instr.length : 0) & 0x3f);
    let nr12 = (instr.initial_volume << 4) | (instr.volume_sweep_change > 0 ? 0x08 : 0x00);
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
    const nr32 = (instr.volume << 5);
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

    let nr42 = (instr.initial_volume << 4) | (instr.volume_sweep_change > 0 ? 0x08 : 0x00);
    if (instr.volume_sweep_change !== 0)
      nr42 |= 8 - Math.abs(instr.volume_sweep_change);
    let param1 = (instr.length !== null ? 64 - instr.length : 0) & 0x3f;
    if (instr.length !== null)
      param1 |= 0x40;
    if (instr.bit_count === 7)
      param1 |= 0x80;

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
      buf[addr + n * 16 + idx] = (song.waves[n][idx * 2] << 4) | (song.waves[n][idx * 2 + 1]);
  }
  addAddr(16 * 16);

  for (let track = 0; track < 4; track++) {
    const pattern_addr = []
    for (let n = 0; n < song.patterns.length; n++) {
      const pattern = song.patterns[n];
      pattern_addr.push(addr);

      for (let idx = 0; idx < pattern.length; idx++) {
        const cell = pattern[idx][track];
        buf[addr++] = cell.note !== null ? cell.note : 90;
        buf[addr++] = ((cell.instrument !== null ? (cell.instrument + 1) : 0) << 4) | (cell.effectcode !== null ? cell.effectcode : 0);
        buf[addr++] = cell.effectparam !== null ? cell.effectparam : 0;
      }
    }

    let order_addr = orders_addr[track];
    for (let n = 0; n < song.sequence.length; n++) {
      buf[order_addr++] = pattern_addr[song.sequence[n]] & 0xFF;
      buf[order_addr++] = pattern_addr[song.sequence[n]] >> 8;
    }
  }
  emulator.updateRom(rom_file);
}

export default {
  initPlayer,
  play,
  stop,
  toggleMute,
  updateRom,
  setOnIntervalCallback: (cb) => {
    onIntervalCallback = cb
  }
}