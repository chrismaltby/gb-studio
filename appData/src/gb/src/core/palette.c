#pragma bank 255

#ifdef SGB
    #include <gb/sgb.h>
#endif
#include <string.h>

#include "compat.h"
#include "gbs_types.h"
#include "palette.h"
#include "system.h"

UBYTE DMG_palette[3];

palette_entry_t SprPalette[8];
//palette_entry_t BkgPalette[8]; // moved into absolute.c to free 64 bytes of WRAM (move after shadow_OAM[] which is 256-boundary aligned)

void palette_init() BANKED {
#ifdef CGB
    if (_is_CGB) {
        memset(BkgPalette, 0, sizeof(BkgPalette));
        memset(SprPalette, 0, sizeof(SprPalette));
        return;
    }
#endif
    DMG_palette[0] = DMG_palette[2] = DMG_PALETTE(3, 2, 1, 0);
    DMG_palette[1] = DMG_PALETTE(3, 1, 0, 2);
}

#ifdef CGB
void CGBZeroPalette(UBYTE reg) OLDCALL BANKED NAKED {
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
        bit STATF_B_BUSY, a
        jr nz, 1$
        xor a
        ldh (c), a

        dec b
        jr nz, 1$

        ret   
__endasm;
}
#endif

#ifdef SGB
typedef struct sgb_pal_packet_t {
    UBYTE cmd;
    UWORD palettes[7];
} sgb_pal_packet_t;

void SGBTransferPalettes(UBYTE palettes) BANKED {
    sgb_pal_packet_t data;
    data.cmd = (SGB_PAL_01 << 3) | 1;
    if (palettes & SGB_PALETTES_01) {
        data.cmd = (SGB_PAL_01 << 3) | 1;
        memcpy(data.palettes, &BkgPalette[4], sizeof(palette_entry_t));
        memcpy(&data.palettes[4], &BkgPalette[5].c1, sizeof(palette_entry_t) - sizeof(UWORD));
        sgb_transfer((void *)&data);
    }
    if (palettes & SGB_PALETTES_23) {
        data.cmd = (SGB_PAL_23 << 3) | 1;
        memcpy(data.palettes, &BkgPalette[6], sizeof(palette_entry_t));
        memcpy(&data.palettes[4], &BkgPalette[7].c1, sizeof(palette_entry_t) - sizeof(UWORD));
        sgb_transfer((void *)&data);
    }
}
#endif