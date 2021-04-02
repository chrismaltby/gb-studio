#ifndef PALETTE_H
#define PALETTE_H

#include <gb/gb.h>
#include "gbs_types.h"

extern UBYTE DMG_palette[3];
extern palette_entry_t SprPalette[8];
extern palette_entry_t BkgPalette[8];

void palette_init() __banked;

#ifdef CGB
void CGBZeroPalette(UBYTE reg) __banked;
#endif

#ifdef SGB
#define SGB_PALETTES_NONE 0
#define SGB_PALETTES_01 1
#define SGB_PALETTES_23 2
void SGBTransferPalettes(UBYTE palettes) __banked;
#endif

#endif
