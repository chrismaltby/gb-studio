#pragma bank 255

#include <gb/gb.h>
#include <bankdata.h>

#include "system.h"
#include "compat.h"
#include "flasher.h"

extern void _start_save;

void restore_sram_bank(UINT8 bank) BANKED {
    SWITCH_RAM_BANK(bank, RAM_BANKS_ONLY);
    MemcpyBanked((UINT8 *)0xA000, (UINT8 *)(0x4000 + ((bank & 1) << 13)), 0x2000, (UBYTE)&_start_save + (bank >> 1));
}

void restore_sram() BANKED {
    for (UINT8 i = 0; i < 4; i++)
        restore_sram_bank(i);
}

extern UINT8 erase_flash() OLDCALL BANKED;                  // erases FLASH sector: 64K or 4 banks
extern UINT8 save_sram_banks(UINT8 count) OLDCALL BANKED;   // copies up to count SRAM banks to FLASH

UINT8 save_sram(UINT8 count) BANKED {
    UINT8 _save = _current_ram_bank;
    if (!erase_flash()) return 0;
    UINT8 res = save_sram_banks(count);
    SWITCH_RAM_BANK(_save, RAM_BANKS_AND_FLAGS);
    return res;
}