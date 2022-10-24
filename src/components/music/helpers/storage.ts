/* eslint-disable camelcase */

import hardware_inc from "./include/hardware_inc";
import hugeDriver_asm from "./include/hUGEDriver_asm";
import hUGE_inc from "./include/hUGE_inc";
import hUGE_note_table_inc from "./include/hUGE_note_table_inc";
import player_asm from "./include/player_asm";

const files = {
  "include/hardware.inc": hardware_inc,
  "include/hUGE.inc": hUGE_inc,
  "include/hUGE_note_table.inc": hUGE_note_table_inc,
  "hUGEDriver.asm": hugeDriver_asm,
  "player.asm": player_asm,
} as Record<string, Uint8Array | string>;

const getFiles = () => files;

const update = (name: string, code: ArrayBuffer | string | null) => {
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
