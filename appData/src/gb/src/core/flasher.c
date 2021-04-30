#pragma bank 4

#include <gb/gb.h>
#include <bankdata.h>

#include "flasher.h"

extern void _start_save;

void restore_sram_bank(UINT8 bank) __banked {
    MemcpyBanked((UINT8 *)0xA000, (UINT8 *)(0x4000 + ((bank & 1) << 13)), 0x2000, (UBYTE)&_start_save + (bank >> 1));
}

void restore_sram() __banked {
    for (UINT8 i = 0; i < 4; i++)
        restore_sram_bank(i);
}

extern UINT8 erase_flash();                 // erases FLASH sector: 64K or 4 banks
extern UINT8 save_sram_banks(UINT8 count);  // copies up to count SRAM banks to FLASH

UINT8 save_sram(UINT8 count) __banked {
    if (!erase_flash()) return 0;
    return save_sram_banks(count);
}