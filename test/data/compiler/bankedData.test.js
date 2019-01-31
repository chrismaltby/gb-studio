import BankedData, {
  BANKED_DATA_NOT_ARRAY,
  BANKED_DATA_TOO_LARGE
} from "../../../src/lib/data/compiler/bankedData";

test("Should create empty banked data structure", () => {
  const banked = new BankedData(1);
  expect(banked.export()).toEqual([]);
});

test("Should put data below bank size into first bank", () => {
  const banked = new BankedData(1);
  banked.push([42]);
  expect(banked.export()).toEqual([[42]]);
});

test("Should put data that fits into current bank into same bank", () => {
  const banked = new BankedData(2);
  banked.push([42]);
  banked.push([99]);
  expect(banked.export()).toEqual([[42, 99]]);
});

test("Should put data that doesn't fit into new bank", () => {
  const banked = new BankedData(2);
  banked.push([42]);
  banked.push([99, 100]);
  expect(banked.export()).toEqual([[42], [99, 100]]);
});

test("Should return pointer to start of first bank", () => {
  const banked = new BankedData(1);
  const ptr = banked.push([42]);
  expect(ptr).toEqual({
    bank: 0,
    offset: 0
  });
});

test("Should return pointer to a location in first bank", () => {
  const banked = new BankedData(3);
  banked.push([42, 99]);
  const ptr = banked.push([5]);
  expect(ptr).toEqual({
    bank: 0,
    offset: 2
  });
});

test("Should return pointer to start of second bank", () => {
  const banked = new BankedData(3);
  banked.push([42, 99]);
  const ptr = banked.push([5, 6]);
  expect(ptr).toEqual({
    bank: 1,
    offset: 0
  });
});

test("Should return pointer to a location in second bank", () => {
  const banked = new BankedData(3);
  banked.push([42, 99]);
  banked.push([5, 6]);
  const ptr = banked.push([7]);
  expect(ptr).toEqual({
    bank: 1,
    offset: 2
  });
});

test("Should throw error if data entry is missing", async () => {
  const banked = new BankedData(1);
  expect(() => banked.push()).toThrow(BANKED_DATA_NOT_ARRAY);
});

test("Should throw error if data entry is not an array", async () => {
  const banked = new BankedData(1);
  expect(() => banked.push(42)).toThrow(BANKED_DATA_NOT_ARRAY);
});

test("Should throw error if single data entry is larger than bank size", async () => {
  const banked = new BankedData(1);
  expect(() => banked.push([1, 2])).toThrow(BANKED_DATA_TOO_LARGE);
});
