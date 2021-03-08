#ifndef __FLASHER_H_INCLUDE
#define __FLASHER_H_INCLUDE

#include <gb/gb.h>

void restore_sram_bank(UINT8 bank) __banked;
void restore_sram() __banked;

UINT8 save_sram(UINT8 count) __banked;

#endif