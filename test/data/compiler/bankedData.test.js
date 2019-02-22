import BankedData, {
  BANKED_DATA_NOT_ARRAY,
  BANKED_DATA_TOO_LARGE,
  BANKED_COUNT_OVERFLOW,
  GB_MAX_BANK_SIZE,
  MIN_DATA_BANK
} from "../../../src/lib/compiler/bankedData";
import {
  cIntArray,
  cIntArrayExternDeclaration
} from "../../../src/lib/helpers/cGeneration";

test("Should create empty banked data structure", () => {
  const banked = new BankedData(1);
  expect(banked.exportRaw()).toEqual([]);
});

test("Should set bank size to provided value", () => {
  const banked = new BankedData({ bankSize: 99 });
  expect(banked.bankSize).toBe(99);
});

test("Should set default bank size to gb max available", () => {
  const banked = new BankedData();
  expect(banked.bankSize).toBe(GB_MAX_BANK_SIZE);
});

test("Should put data below bank size into first bank", () => {
  const banked = new BankedData({ bankSize: 1 });
  banked.push([42]);
  expect(banked.exportRaw()).toEqual([[42]]);
});

test("Should put data that fits into current bank into same bank", () => {
  const banked = new BankedData({ bankSize: 2 });
  banked.push([42]);
  banked.push([99]);
  expect(banked.exportRaw()).toEqual([[42, 99]]);
});

test("Should put data that doesn't fit into new bank", () => {
  const banked = new BankedData({ bankSize: 2 });
  banked.push([42]);
  banked.push([99, 100]);
  expect(banked.exportRaw()).toEqual([[42], [99, 100]]);
});

test("Should return pointer to start of first bank", () => {
  const banked = new BankedData({ bankSize: 1 });
  const ptr = banked.push([42]);
  expect(ptr).toEqual({
    bank: MIN_DATA_BANK,
    offset: 0
  });
});

test("Should return pointer to a location in first bank", () => {
  const banked = new BankedData({ bankSize: 3 });
  banked.push([42, 99]);
  const ptr = banked.push([5]);
  expect(ptr).toEqual({
    bank: MIN_DATA_BANK,
    offset: 2
  });
});

test("Should return pointer to start of second bank", () => {
  const banked = new BankedData({ bankSize: 3 });
  banked.push([42, 99]);
  const ptr = banked.push([5, 6]);
  expect(ptr).toEqual({
    bank: MIN_DATA_BANK + 1,
    offset: 0
  });
});

test("Should return pointer to a location in second bank", () => {
  const banked = new BankedData({ bankSize: 3 });
  banked.push([42, 99]);
  banked.push([5, 6]);
  const ptr = banked.push([7]);
  expect(ptr).toEqual({
    bank: MIN_DATA_BANK + 1,
    offset: 2
  });
});

test("Should throw error if data entry is missing", async () => {
  const banked = new BankedData({ bankSize: 1 });
  expect(() => banked.push()).toThrow(BANKED_DATA_NOT_ARRAY);
});

test("Should throw error if data entry is not an array", async () => {
  const banked = new BankedData({ bankSize: 1 });
  expect(() => banked.push(42)).toThrow(BANKED_DATA_NOT_ARRAY);
});

test("Should throw error if single data entry is larger than bank size", async () => {
  const banked = new BankedData({ bankSize: 1 });
  expect(() => banked.push([1, 2])).toThrow(BANKED_DATA_TOO_LARGE);
});

test("Should construct C data from input", async () => {
  const banked = new BankedData({ bankSize: 2 });
  banked.push([0]);
  banked.push([1, 2]);
  expect(banked.exportCData()).toEqual([
    `#pragma bank=${MIN_DATA_BANK}\n\n${cIntArray(
      `bank_${MIN_DATA_BANK}_data`,
      [0]
    )}\n`,
    `#pragma bank=${MIN_DATA_BANK + 1}\n\n${cIntArray(
      `bank_${MIN_DATA_BANK + 1}_data`,
      [1, 2]
    )}\n`
  ]);
});

test("Should construct C data from input with offset", async () => {
  const banked = new BankedData({ bankSize: 2, bankOffset: 100 });
  banked.push([0]);
  banked.push([1, 2]);
  expect(banked.exportCData()).toEqual([
    `#pragma bank=100\n\n${cIntArray("bank_100_data", [0])}\n`,
    `#pragma bank=101\n\n${cIntArray("bank_101_data", [1, 2])}\n`
  ]);
});

test("Should construct C header from input", async () => {
  const banked = new BankedData({ bankSize: 2 });
  banked.push([0]);
  banked.push([1, 2]);
  expect(banked.exportCHeader()).toEqual(
    `#ifndef BANKS_H\n#define BANKS_H\n\n${cIntArrayExternDeclaration(
      `bank_${MIN_DATA_BANK}_data`
    )}\n${cIntArrayExternDeclaration(
      `bank_${MIN_DATA_BANK + 1}_data`
    )}\n\n#endif\n`
  );
});

test("should calculate rom banks needed to store banked data", () => {
  const banked = new BankedData({ bankSize: 2 });
  banked.push([0]);
  banked.push([1, 2]);
  expect(banked.romBanksNeeded()).toBe(32);
});

test("should calculate rom banks needed to store banked data when offset", () => {
  const banked = new BankedData({ bankSize: 2, bankOffset: 64 });
  banked.push([0]);
  banked.push([1, 2]);
  expect(banked.romBanksNeeded()).toBe(128);
});

test("should throw if unsupported number of rom banks are required", () => {
  const banked = new BankedData({ bankSize: 2, bankOffset: 1024 });
  banked.push([0]);
  expect(() => banked.romBanksNeeded()).toThrow(BANKED_COUNT_OVERFLOW);
});
