#ifndef _VM_LOAD_SAVE_H_INCLUDE
#define _VM_LOAD_SAVE_H_INCLUDE

#include <gb/gb.h>

#include "vm.h"

BANKREF_EXTERN(VM_LOAD_SAVE)

// sets signature of save slot to zero
void vm_save_clear(SCRIPT_CTX * THIS, UBYTE slot) OLDCALL BANKED;

// copies count global variables from save slot starting from idxC (positive index only) and further into VM memory starting from idxB and further
// result of the operation is stored into idxA
void vm_save_peek(SCRIPT_CTX * THIS, INT16 idxA, INT16 idxB, INT16 idxC, UWORD count, UBYTE slot) OLDCALL BANKED;

#endif