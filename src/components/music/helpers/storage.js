/* eslint-disable camelcase */

import hardware_inc from "./include/hardware_inc";
import hugeDriver_asm from "./include/hUGEDriver_asm";
import hUGE_inc from "./include/hUGE_inc";
import hUGE_note_table_inc from "./include/hUGE_note_table_inc";
import player_asm from "./include/player_asm";

const files = {
  "HARDWARE.INC": hardware_inc,
  "hUGE.inc": hUGE_inc,
  "hUGEDriver.asm": hugeDriver_asm,
  "hUGE_note_table.inc": hUGE_note_table_inc,
  "main.asm": player_asm,
  //     "main.asm": `INCLUDE "hardware.inc"

  // SECTION "entry", ROM0[$100]
  //   jp start

  // SECTION "main", ROM0[$150]
  // start:
  //   nop
  // haltLoop:
  //   halt
  //   jr haltLoop
  // `
};

const getFiles = () => files;

const update = (name, code) => {
  if (typeof name !== "undefined") {
    if (code === null) {
      delete files[name];
    } else if (code instanceof ArrayBuffer) {
      files[name] = new Uint8Array(code);
    } else {
      files[name] = code;
    }
  }
  localStorage.rgbds_storage = JSON.stringify(files);
};

export default {
  update,
  getFiles,
};
