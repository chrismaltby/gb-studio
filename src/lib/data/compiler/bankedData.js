import {
  cIntArray,
  cIntArrayExternDeclaration
} from "../../helpers/cGeneration";

const BANKED_DATA_NOT_ARRAY = "BANKED_DATA_NOT_ARRAY";
const BANKED_DATA_TOO_LARGE = "BANKED_DATA_TOO_LARGE";
const BANKED_COUNT_OVERFLOW = "BANKED_COUNT_OVERFLOW";
const GB_MAX_BANK_SIZE = 16394; // Calculated by adding bytes until address overflow
const MIN_DATA_BANK = 16; // First 16 banks are reserved by game engine
const MAX_BANKS = 512; // GBDK supports max of 512 banks

class BankedData {
  constructor(bankSize = GB_MAX_BANK_SIZE) {
    this.bankSize = bankSize;
    this.data = [];
    this.currentBank = 0;
  }
  push(newData) {
    if (!Array.isArray(newData)) {
      throw BANKED_DATA_NOT_ARRAY;
    }
    if (newData.length > this.bankSize) {
      throw BANKED_DATA_TOO_LARGE;
    }
    if (!this.data[this.currentBank]) {
      // First bank
      const ptr = {
        bank: this.currentBank,
        offset: 0
      };
      this.data[this.currentBank] = newData;
      return ptr;
    } else if (
      this.data[this.currentBank].length + newData.length >
      this.bankSize
    ) {
      // Current bank is over size, make a new one
      this.currentBank++;
      const ptr = {
        bank: this.currentBank,
        offset: 0
      };
      this.data[this.currentBank] = newData;
      return ptr;
    } else {
      const ptr = {
        bank: this.currentBank,
        offset: this.data[this.currentBank].length
      };
      // Bank has room, append contents
      this.data[this.currentBank] = [].concat(
        this.data[this.currentBank],
        newData
      );
      return ptr;
    }
  }
  nextBank() {
    if (this.data[this.currentBank] && this.data[this.currentBank].length > 0) {
      this.currentBank++;
    }
  }
  romBanksNeeded(bankOffset = MIN_DATA_BANK) {
    const maxBank = this.data.length + bankOffset;
    const nearestPow2 = Math.pow(2, Math.ceil(Math.log(maxBank) / Math.log(2)));
    if (nearestPow2 > MAX_BANKS) {
      throw BANKED_COUNT_OVERFLOW;
    }
    return nearestPow2;
  }
  exportRaw() {
    return this.data;
  }
  exportCData(bankOffset = MIN_DATA_BANK) {
    return this.data.map((data, index) => {
      const bank = index + bankOffset;
      return `#pragma bank=${bank}\n\n${cIntArray(
        `bank_${bank}_data`,
        data
      )}\n`;
    });
  }
  exportCHeader(bankOffset = MIN_DATA_BANK) {
    return `#ifndef BANKS_H\n#define BANKS_H\n\n${this.data
      .map((data, index) => {
        const bank = index + bankOffset;
        return cIntArrayExternDeclaration(`bank_${bank}_data`);
      })
      .join("\n")}\n#endif\n`;
  }
}

export default BankedData;
export {
  BANKED_DATA_NOT_ARRAY,
  BANKED_DATA_TOO_LARGE,
  BANKED_COUNT_OVERFLOW,
  GB_MAX_BANK_SIZE,
  MIN_DATA_BANK,
  MAX_BANKS
};
