#ifndef _LOADSAVE_H_INCLUDE
#define _LOADSAVE_H_INCLUDE

#include <gb/gb.h>

#define SRAM_BANKS_TO_SAVE 3
#define SRAM_BANK_SIZE 0x2000

// initializes saving capabilities
void data_init() __banked;

// save state to SRAM
void data_save(UBYTE slot) __banked;

// load state from SRAM
UBYTE data_load(UBYTE slot) __banked;

// clear state in SRAM
void data_clear(UBYTE slot) __banked;

// peek count VM variables from idx into dest
UBYTE data_peek(UBYTE slot, UINT16 idx, UBYTE count, UINT16 * dest) __banked;

#endif