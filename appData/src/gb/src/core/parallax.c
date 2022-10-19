#pragma bank 255

#include <gb/hardware.h>
#include <string.h>

#include "parallax.h"

parallax_row_t parallax_rows[3];
parallax_row_t * parallax_row;

static const parallax_row_t parallax_rows_defaults[3] = { PARALLAX_STEP(0, 2, 2), PARALLAX_STEP(2, 4, 1), PARALLAX_STEP(4, 0, 0)}; 
void parallax_init() BANKED {
    memcpy(parallax_rows, parallax_rows_defaults, sizeof(parallax_rows)); 
}

void parallax_LCD_isr() NONBANKED NAKED {
__asm
        ld hl, #_parallax_row
        ld a, (hl+)
        ld h, (hl)
        ld l, a

        ld a, (hl+)             ; scx
        ld e, a
        ld a, (hl+)             ; next_y
        ldh (#_LYC_REG), a
        or a
        jr z, 1$
        ld d, #0
        jr 2$
1$:
        ld a, (#_draw_scroll_y)
        ld d, a
2$:
        ldh a, (#_STAT_REG)
        bit STATF_B_BUSY, a
        jr nz, 2$

        ld a, e
        ld (#_SCX_REG), a
        ld a, d
        ldh (#_SCY_REG), a

        ldh a, (#_LYC_REG)
        or a
        jr z, 3$

        ld  de, #4
        add  hl, de             ; skip shift, tile_start, tile_height, shadow_scx 

        ld d, h
        ld a, l   
        ld hl,#_parallax_row 
        ld (hl+), a
        ld (hl), d
        ret
3$:
        ld hl,#_parallax_row 
        ld a, #<_parallax_rows
        ld (hl+), a
        ld (hl), #>_parallax_rows
        ret
__endasm;
}
