#ifndef _SYSTEM_H_INCLUDE
#define _SYSTEM_H_INCLUDE

#include <gb/gb.h>

// System fields
extern UBYTE _is_CGB;
extern UBYTE _is_SGB;

// SRAM bank switching with saving of state 
extern volatile UBYTE _current_ram_bank;

#define RAM_BANKS_ONLY 0x0fu
#define RAM_BANKS_AND_FLAGS 0xffu

inline void SWITCH_RAM_BANK(UBYTE bank, UBYTE mask) { SWITCH_RAM(_current_ram_bank = ((_current_ram_bank & ~mask) | (bank & mask))); } 

#endif