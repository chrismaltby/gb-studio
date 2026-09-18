/** Top of the stack, which grows downwards from here. */
export const STACK_TOP_ADDRESS = 0xdf00;

/** ROM capacity available to one compiled source before bank packing. */
export const ROM_BANK_SIZE = 16 * 1024;

/** shadow_OAM, declared at 0xC000 in engine/src/core/absolute.c. */
export const SHADOW_OAM_ADDRESS = 0xc000;
export const SHADOW_OAM_SIZE = 0xa0;

/** Fixed absolute data above the stack, omitted from linker map files. */
export const ABSOLUTE_DATA_SIZE = 0x100;

/** Minimum space retained for the downward-growing stack. */
export const STACK_RESERVE_BYTES = 0x100;

/** WRAM occupied by fixed engine data or deliberately retained for the stack. */
export const RESERVED_WRAM_BYTES =
  SHADOW_OAM_SIZE + ABSOLUTE_DATA_SIZE + STACK_RESERVE_BYTES;
