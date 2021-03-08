#pragma bank 1

#include "palette.h"

#include <string.h>

UBYTE palette_update_mask;

UWORD SprPalette[32];
UWORD BkgPalette[32];

UWORD SprPaletteBuffer[32];
UWORD BkgPaletteBuffer[32];

void palette_init() __banked {
    palette_update_mask = 0x3F;
    memset(BkgPalette, 0, sizeof(BkgPalette));
    memset(SprPalette, 0, sizeof(SprPalette));
    memset(BkgPaletteBuffer, 0, sizeof(BkgPaletteBuffer));
    memset(SprPaletteBuffer, 0, sizeof(SprPaletteBuffer));
}
