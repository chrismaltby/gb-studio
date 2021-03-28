#pragma bank 3

#include "palette.h"

#include <string.h>

UBYTE palette_update_mask;

UWORD SprPalette[32];
UWORD BkgPalette[32];

void palette_init() __banked {
    palette_update_mask = 0x3F;

    #ifdef CGB
        if (_cpu == CGB_TYPE) {
            memset(BkgPalette, 0, sizeof(BkgPalette));
            memset(SprPalette, 0, sizeof(SprPalette));
            return;
        }
    #endif
    BkgPalette[0] = SprPalette[0] = 0xE4u; 
    SprPalette[4] = 0xE0u;
}

#ifdef CGB
void CGBZeroPalette(UBYTE reg) __banked __naked {
    reg;
__asm
        ldhl sp, #6
        ld c, (hl)
        ld a, #0x80
        ldh (c), a
        inc c

        ld b, #(8 * 4 * 2)
1$:
        ldh a, (_STAT_REG)
        and #0x02
        jr nz, 1$
        xor a
        ldh (c), a

        dec b
        jr nz, 1$

        ret   
__endasm;
}
#endif