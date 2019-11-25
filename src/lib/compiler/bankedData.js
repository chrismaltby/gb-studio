import { cIntArray, cIntArrayExternDeclaration } from "../helpers/cGeneration";

const BANKED_DATA_NOT_ARRAY = "BANKED_DATA_NOT_ARRAY";
const BANKED_DATA_TOO_LARGE = "BANKED_DATA_TOO_LARGE";
const BANKED_COUNT_OVERFLOW = "BANKED_COUNT_OVERFLOW";
const GB_MAX_BANK_SIZE = 16384; // Calculated by adding bytes until address overflow
const MIN_DATA_BANK = 6; // First 16 banks are reserved by game engine
const MAX_BANKS = 512; // GBDK supports max of 512 banks

const MBC1 = "MBC1";
const MBC5 = "MBC5";
const MBC1_DISALLOWED_BANKS = [0x20, 0x40, 0x60];

class BankedData {
  constructor({
    bankSize = GB_MAX_BANK_SIZE,
    bankOffset = MIN_DATA_BANK,
    bankController = MBC5
  } = {}) {
    this.bankSize = bankSize;
    this.bankOffset = bankOffset;
    this.bankController = bankController;
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

    const writeBank = this.getWriteBank();

    if (!this.data[this.currentBank]) {
      // First bank
      const ptr = {
        bank: writeBank,
        offset: 0
      };
      this.data[this.currentBank] = newData;
      return ptr;
    }
    if (this.data[this.currentBank].length + newData.length > this.bankSize) {
      // Current bank is over size, make a new one
      this.currentBank++;
      const nextWriteBank = this.getWriteBank();
      const ptr = {
        bank: nextWriteBank,
        offset: 0
      };
      this.data[this.currentBank] = newData;
      return ptr;
    }
    const ptr = {
      bank: writeBank,
      offset: this.data[this.currentBank].length
    };
    // Bank has room, append contents
    this.data[this.currentBank] = [].concat(
      this.data[this.currentBank],
      newData
    );
    return ptr;
  }

  dataWillFitCurrentBank(newData) {
    return (
      (this.data[this.currentBank] || []).length + newData.length <=
      this.bankSize
    );
  }

  currentBankSize() {
    return (this.data[this.currentBank] || []).length;
  }

  getWriteBank() {
    const bank = this.currentBank + this.bankOffset;
    if (this.bankController === MBC1) {
      if (MBC1_DISALLOWED_BANKS.indexOf(bank) > -1) {
        this.currentBank++;
        return this.getWriteBank();
      }
    }
    return bank;
  }

  nextBank() {
    if (this.data[this.currentBank] && this.data[this.currentBank].length > 0) {
      this.currentBank++;
    }
  }

  romBanksNeeded() {
    const maxBank = this.data.length + this.bankOffset;
    const nearestPow2 = Math.pow(2, Math.ceil(Math.log(maxBank) / Math.log(2)));
    if (nearestPow2 > MAX_BANKS) {
      throw BANKED_COUNT_OVERFLOW;
    }
    return nearestPow2;
  }

  exportRaw() {
    return this.data;
  }

  exportCData() {
    return this.data
      .map((data, index) => {
        const bank = index + this.bankOffset;
        return `#pragma bank=${bank}\n\n${cIntArray(
          `bank_${bank}_data`,
          data
        )}\n`;
      })
      .filter(i => i);
  }

  exportCHeader() {
    return `#ifndef BANKS_H\n#define BANKS_H\n\n${this.data
      .map((data, index) => {
        const bank = index + this.bankOffset;
        return cIntArrayExternDeclaration(`bank_${bank}_data`);
      })
      .filter(i => i)
      .join("\n")}\n\n#endif\n`;
  }

  exportUsedBankNumbers() {
    return [...Array(this.bankOffset + this.data.length).keys()].map(
      bankNum => !!this.data[bankNum - this.bankOffset]
    );
  }
}

export default BankedData;
export {
  BANKED_DATA_NOT_ARRAY,
  BANKED_DATA_TOO_LARGE,
  BANKED_COUNT_OVERFLOW,
  GB_MAX_BANK_SIZE,
  MIN_DATA_BANK,
  MAX_BANKS,
  MBC1,
  MBC5
};
