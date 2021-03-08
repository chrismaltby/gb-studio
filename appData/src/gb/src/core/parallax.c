#pragma bank 1

#include <string.h>

#include "parallax.h"

parallax_row_t parallax_rows[3];
parallax_row_t * parallax_row;

static const parallax_row_t parallax_rows_defaults[3] = { PARALLAX_STEP(0, 2, 2), PARALLAX_STEP(2, 4, 1), PARALLAX_STEP(4, 0, 0)}; 
void parallax_init() __banked {
    memcpy(parallax_rows, parallax_rows_defaults, sizeof(parallax_rows)); 
}

void parallax_LCD_isr() __naked __nonbanked {
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
        and #0x02
        jr nz, 2$

        ld a, e
        ld (#_SCX_REG), a
        ld a, d
        ldh (#_SCY_REG), a

        ldh a, (#_LYC_REG)
        or a
        jr z, 3$
        inc hl                  ; skip shift
        inc hl                  ; skip tile_start
        inc hl                  ; skip tile_height

        ld a, l   
        ld (#_parallax_row), a
        ld a, h
        ld (#_parallax_row + 1), a
        ret
3$:
        ld a, #<_parallax_rows
        ld (#_parallax_row), a
        ld a, #>_parallax_rows
        ld (#_parallax_row + 1), a
        ret
__endasm;
}
