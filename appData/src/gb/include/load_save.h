#ifndef _LOADSAVE_H_INCLUDE
#define _LOADSAVE_H_INCLUDE

#include <gb/gb.h>

// initializes saving capabilities
void data_init() __banked;

// check SRAM contains valid save blob
UBYTE data_is_saved(UBYTE slot) __banked;

// save state to SRAM
void data_save(UBYTE slot) __banked;

// load state from SRAM
UBYTE data_load(UBYTE slot) __banked;

#endif