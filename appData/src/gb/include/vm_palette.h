#ifndef _VM_PALETTE_H_INCLUDE
#define _VM_PALETTE_H_INCLUDE

#include <gb/gb.h>

#include "vm.h"
#include "palette.h"

BANKREF_EXTERN(VM_PALETTE)

#define PALETTE_COMMIT 1u
#define PALETTE_BKG    2u
#define PALETTE_SPRITE 4u

void vm_load_palette(SCRIPT_CTX * THIS, UBYTE mask, UBYTE options) OLDCALL BANKED;

#endif