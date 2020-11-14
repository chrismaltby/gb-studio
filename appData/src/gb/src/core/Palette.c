#include "Palette.h"

UBYTE palette_dirty = FALSE;
UBYTE palette_update_mask = 0x3F;

UWORD SprPalette[32];
UWORD BkgPalette[32];

UWORD SprPaletteBuffer[32];
UWORD BkgPaletteBuffer[32];
