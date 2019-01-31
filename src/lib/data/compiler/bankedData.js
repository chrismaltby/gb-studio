const BANKED_DATA_NOT_ARRAY = "BANKED_DATA_NOT_ARRAY";
const BANKED_DATA_TOO_LARGE = "BANKED_DATA_TOO_LARGE";

class BankedData {
  constructor(bankSize) {
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
  export() {
    return this.data;
  }
}

export default BankedData;

export { BANKED_DATA_NOT_ARRAY, BANKED_DATA_TOO_LARGE };
