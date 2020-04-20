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
    this.dataWriteBanks = []
    this.currentBank = -1;
  }

  push(newData) {
    if (!Array.isArray(newData)) {
      throw BANKED_DATA_NOT_ARRAY;
    }
    if (newData.length > this.bankSize) {
      throw BANKED_DATA_TOO_LARGE;
    }

    const lookBehindDistance = 10;

    // Find an existing bank to fit the data
    for(let i=Math.max(0, this.data.length - lookBehindDistance); i<this.data.length; i++) {
      if (this.data[i].length + newData.length <= this.bankSize) {
        // Found a bank to write to
        const ptr = {
          bank: this.dataWriteBanks[i],
          offset: this.data[i].length
        };
        // Append contents
        this.data[i] = [].concat(
          this.data[i],
          newData
        );
        return ptr;
      }
    }

    // Create a new bank
    this.currentBank++;
    const writeBank = this.getWriteBank();
    this.data.push(newData);
    this.dataWriteBanks.push(writeBank);
    const ptr = {
      bank: writeBank,
      offset: 0
    };
    return ptr;
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

  getMaxWriteBank() {
    return this.dataWriteBanks[this.dataWriteBanks.length - 1];
  }

  exportRaw() {
    return this.data;
  }

  exportCData() {
    return this.data
      .map((data, index) => {
        const bank = this.dataWriteBanks[index];
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
        const bank = this.dataWriteBanks[index];
        return cIntArrayExternDeclaration(`bank_${bank}_data`);
      })
      .filter(i => i)
      .join("\n")}\n\n#endif\n`;
  }

  exportUsedBankNumbers() {
    const maxBank = this.dataWriteBanks[this.dataWriteBanks.length - 1];
    return [...Array(maxBank + 1).keys()].map(
      bankNum => this.dataWriteBanks.indexOf(bankNum) > -1
    );
  }

  mutate(fn) {
    for(let bank=0; bank<this.data.length; bank++) {
      for(let offset=0; offset<this.data[bank].length; offset++) {
        this.data[bank][offset] = fn(this.data[bank][offset]);
      }
    }
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
