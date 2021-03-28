#ifndef _VM_PALETTE_H_INCLUDE
#define _VM_PALETTE_H_INCLUDE

#include <gb/gb.h>

#include "vm.h"
#include "palette.h"

#define PALETTE_COMMIT 1
#define PALETTE_BKG    2
#define PALETTE_SPRITE 4

void vm_load_palette(SCRIPT_CTX * THIS, UBYTE mask, UBYTE options) __banked;

#endif