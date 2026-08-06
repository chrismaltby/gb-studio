import type { UsageData, UsageOverflow } from "lib/compiler/romUsage";

export type UsageBank = UsageData["banks"][number];

/**
 * Banked + non banked ROM areas.
 * The sum of these is the total size of the cartridge.
 */
export const isRomBank = (bank: UsageBank) => bank.name.startsWith("ROM_");

/**
 * Fixed ROM bank, always visible at 0x0000-0x3FFF.
 * Holds the engine core, so it's the first area to run out of space.
 */
export const isRomBank0 = (bank: UsageBank) => bank.name === "ROM_0";

/**
 * Work RAM available to a GB Studio game: WRAM_LO (0xC000-0xCFFF) and
 * WRAM_HI_0 (0xD000-0xDFFF). The extra Game Boy Color WRAM banks
 * (WRAM_HI_1 to WRAM_HI_7) are never switched in, so they don't count.
 */
export const isWramBank = (bank: UsageBank) =>
  bank.name === "WRAM_LO" || bank.name === "WRAM_HI_0";

/** Reported against a WRAM address, so WRAM has run out of room */
export const isWramOverflow = (overflow: UsageOverflow) =>
  overflow.address >= 0xc000 && overflow.address <= 0xdfff;

/** Reported against a bank 0 address, so the fixed ROM bank has run out */
export const isBank0Overflow = (overflow: UsageOverflow) =>
  overflow.address < 0x4000;

/**
 * How many bytes a region was overrun by. Romusage caps each bank's used
 * value at the bank size, so without this an overflowing region just reads
 * as exactly full.
 */
export const sumOverflow = (
  overflows: UsageOverflow[],
  filter: (overflow: UsageOverflow) => boolean,
) =>
  overflows.filter(filter).reduce((memo, overflow) => memo + overflow.bytes, 0);

/**
 * Total used/size in bytes for every bank matching the given filter.
 */
export const sumUsage = (
  banks: UsageBank[],
  filter: (bank: UsageBank) => boolean,
) => {
  let used = 0;
  let size = 0;
  for (const bank of banks) {
    if (filter(bank)) {
      used += Number(bank.used);
      size += Number(bank.size);
    }
  }
  return { used, size };
};
