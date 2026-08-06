import {
  createOverlapParser,
  parseUsageOverflow,
  reservedWramAreaArgs,
} from "lib/compiler/romUsage";
import {
  isBank0Overflow,
  isWramOverflow,
  sumOverflow,
} from "shared/lib/debugger/usage";

describe("parseUsageOverflow", () => {
  test("It should read the overflow romusage prints for an overrun region", () => {
    // Real output from a build whose WRAM no longer fits
    const line =
      "* WARNING: Area _DATA    at  c0a0 ->  e197 extends past end of memory region at  dfff (Overflow by 408 bytes)";

    expect(parseUsageOverflow(line)).toEqual({
      area: "_DATA",
      address: 0xdfff,
      bytes: 408,
    });
  });

  test("It should ignore lines that are not overflow warnings", () => {
    expect(parseUsageOverflow("Romusage 1.3.2, by bbbbbr")).toBeUndefined();
    expect(parseUsageOverflow('{"banks":')).toBeUndefined();
    expect(
      parseUsageOverflow("* WARNING: Something else entirely"),
    ).toBeUndefined();
  });
});

describe("createOverlapParser", () => {
  // Real output from a build whose data has grown into the stack
  const overlapWarning = [
    "* WARNING: Areas overlapp by 171 bytes: Possible bank overflow.",
    "          _DATA 0xd000 -> 0xdeaa (3755 bytes )",
    "          STACK 0xde00 -> 0xdeff (256 bytes, EXCLUSIVE)",
  ];

  test("It should read the overlap once the area line arrives", () => {
    const parse = createOverlapParser();

    expect(parse(overlapWarning[0])).toBeUndefined();
    expect(parse(overlapWarning[1])).toEqual({
      area: "_DATA",
      address: 0xd000,
      bytes: 171,
    });
    // The second area of the same warning is not a further overlap
    expect(parse(overlapWarning[2])).toBeUndefined();
  });

  test("It should ignore area lines with no overlap warning before them", () => {
    const parse = createOverlapParser();
    expect(
      parse("          _DATA 0xd000 -> 0xdeaa (3755 bytes )"),
    ).toBeUndefined();
  });

  test("It should handle several overlap warnings in a row", () => {
    const parse = createOverlapParser();
    overlapWarning.forEach((line) => parse(line));

    expect(parse("* WARNING: Areas overlapp by 25 bytes:")).toBeUndefined();
    expect(parse("   _INITIALIZED 0xdeab -> 0xdec3 (25 bytes )")).toEqual({
      area: "_INITIALIZED",
      address: 0xdeab,
      bytes: 25,
    });
  });
});

describe("reservedWramAreaArgs", () => {
  test("It should reserve the areas the map file cannot see", () => {
    // Without these romusage reports engine claimed WRAM as free
    expect(reservedWramAreaArgs()).toEqual([
      "-e:SHADOW_OAM:C000:A0",
      "-e:STACK:DE00:100",
      "-e:ABSOLUTE_DATA:DF00:100",
    ]);
  });
});

describe("overflow attribution", () => {
  const wramOverflow = { area: "_DATA", address: 0xdfff, bytes: 408 };
  const bank0Overflow = { area: "_CODE", address: 0x3fff, bytes: 120 };

  test("It should attribute an overflow to the region that was overrun", () => {
    expect(isWramOverflow(wramOverflow)).toBe(true);
    expect(isBank0Overflow(wramOverflow)).toBe(false);
    expect(isBank0Overflow(bank0Overflow)).toBe(true);
    expect(isWramOverflow(bank0Overflow)).toBe(false);
  });

  test("It should total only the overflows for the region asked for", () => {
    const overflows = [wramOverflow, bank0Overflow];
    expect(sumOverflow(overflows, isWramOverflow)).toBe(408);
    expect(sumOverflow(overflows, isBank0Overflow)).toBe(120);
    expect(sumOverflow([], isWramOverflow)).toBe(0);
  });
});
