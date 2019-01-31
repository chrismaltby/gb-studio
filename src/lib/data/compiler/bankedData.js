import {
  cIntArray,
  cIntArrayExternDeclaration
} from "../../helpers/cGeneration";

const BANKED_DATA_NOT_ARRAY = "BANKED_DATA_NOT_ARRAY";
const BANKED_DATA_TOO_LARGE = "BANKED_DATA_TOO_LARGE";
const GB_MAX_BANK_SIZE = 16394; // Calculated by adding bytes until address overflow

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
  exportRaw() {
    return this.data;
  }
  exportCData(bankOffset = 0) {
    return this.data.map((data, index) => {
      const bank = index + bankOffset;
      return `#pragma bank=${bank}\n\n${cIntArray(
        `bank_${bank}_data`,
        data
      )}\n`;
    });
  }
  exportCHeader(bankOffset = 0) {
    return `#ifndef BANKS_H\n#define BANKS_H\n\n${this.data
      .map((data, index) => {
        const bank = index + bankOffset;
        return cIntArrayExternDeclaration(`bank_${bank}_data`);
      })
      .join("\n")}\n#endif\n`;
  }
}

export default BankedData;

export { BANKED_DATA_NOT_ARRAY, BANKED_DATA_TOO_LARGE, GB_MAX_BANK_SIZE };
