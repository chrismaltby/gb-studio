/* eslint-disable camelcase */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-webpack-loader-syntax */

import hardware_inc from "!!raw-loader!./hUGEDriver/include/hardware.inc";
import hUGEDriver_asm from "!!raw-loader!./hUGEDriver/hUGEDriver.asm";
import hUGE_inc from "!!raw-loader!./hUGEDriver/include/hUGE.inc";
import hUGE_note_table_inc from "!!raw-loader!./hUGEDriver/include/hUGE_note_table.inc";
import player_asm from "!!raw-loader!./hUGEDriver/player.asm";

const files = {
  "include/hardware.inc": hardware_inc,
  "include/hUGE.inc": hUGE_inc,
  "include/hUGE_note_table.inc": hUGE_note_table_inc,
  "hUGEDriver.asm": hUGEDriver_asm,
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
