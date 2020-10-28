#include "Palette.h"

UBYTE palette_dirty = FALSE;

UWORD SprPalette[32] = {0};
UWORD BkgPalette[32] = {0};

UWORD SprPaletteBuffer[32] = {0};
UWORD BkgPaletteBuffer[32] = {0};
