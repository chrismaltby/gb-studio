#ifndef __FLASHER_H_INCLUDE
#define __FLASHER_H_INCLUDE

#include <gbdk/platform.h>

void restore_sram_bank(UINT8 bank) BANKED;
void restore_sram(void) BANKED;

UINT8 save_sram(UINT8 count) BANKED;

#endif