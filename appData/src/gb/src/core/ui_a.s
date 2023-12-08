        .include        "global.s"

        .globl _vwf_current_rotate, _vwf_current_mask, _vwf_inverse_map, _vwf_tile_data

        ; must be in the same bank with ui.c
        .area _CODE_1

_ui_swap_tiles::
        ld hl, #_vwf_tile_data
        ld de, #(_vwf_tile_data + 16)
        .rept 16
            ld a, (de)
            ld (hl+), a
            inc de
        .endm
        ld a, (_text_bkg_fill)
        .rept 16
            ld (hl+), a
        .endm
        ret

_ui_print_make_mask_lr::
        ldhl sp, #2

        ld a, (hl+)
        or a
        ld de, #0xffff
        ret z

        ld e, a
        ld a, d         ; 0xff
1$:
        srl a
        dec e
        jr nz, 1$

        ld e, (hl)
        inc e
        jr 2$
3$:
        scf
        rra
        rr d
2$:
        dec e
        jr nz, 3$

        ld e, a
        ret

_ui_print_make_mask_rl::
        ldhl sp, #2

        ld a, (hl+)
        or a
        ld de, #0xffff
        ret z

        ld e, a
        ld a, d         ; 0xff
1$:
        sla a
        dec e
        jr nz, 1$

        ld e, (hl)
        inc e
        jr 2$
3$:
        scf
        rla
        rl d
2$:
        dec e
        jr nz, 3$

        ld e, a
        ret

        .area _CODE

; used from NONBANKED code, so should be nonbanked too, because bank is random
_ui_time_masks::
        .db #0x00, #0x00, #0x01, #0x03, #0x07, #0x0f, #0x1f, #0x3f

; void ui_print_shift_char(void * dest, const void * src, UBYTE bank);

_ui_print_shift_char::
        ldhl sp, #6

        ldh a, (__current_bank)
        push af
        ld a, (hl-)
        ldh (__current_bank), a
        ld  (#rROMB0), a

        ld a, (hl-)
        ld d, a
        ld a, (hl-)
        ld e, a
        ld a, (hl-)
        ld l, (hl)
        ld h, a

        ld a, #8
3$:
        push af

        ld a, (de)
        ld c, a
        ld a, (_vwf_inverse_map)
        xor c
        ld c, a
        inc de

        ld a, (de)
        ld b, a
        ld a, (_vwf_inverse_map)
        xor b
        ld b, a
        inc de

        ld a, (_vwf_current_rotate)
        sla a
        jr z, 1$
        jr c, 4$
        srl a
        srl a
        jr nc, 6$
        srl c
        srl b
6$:
        or a
        jr z, 1$
2$:
        srl c
        srl b
        srl c
        srl b
        dec a
        jr nz, 2$
        jr 1$
4$:
        srl a
        srl a
        jr nc, 7$
        sla c
        sla b
7$:     or a
        jr z, 1$
5$:
        sla c
        sla b
        sla c
        sla b
        dec a
        jr nz, 5$
1$:
        ld a, (_vwf_current_mask)
        and (hl)
        ld (hl), a
        ld a, (_vwf_current_mask)
        cpl
        and c
        or (hl)
        ld (hl+), a

        ld a, (_vwf_current_mask)
        and (hl)
        ld (hl), a
        ld a, (_vwf_current_mask)
        cpl
        and b
        or (hl)
        ld (hl+), a

        pop af
        dec a
        jr nz, 3$

        pop af
        ldh (__current_bank),a
        ld  (#rROMB0), a

        ret

; void ui_draw_frame_row(void * dest, UBYTE tile, UBYTE width);

_ui_draw_frame_row::
        ldhl sp, #5
        ld a, (hl-)
        ld c, a
        ld a, (hl-)
        ld e, a
        ld a, (hl-)
        ld l, (hl)
        ld h, a

.ui_draw_frame_row::
        ld a, c
        or a
        jr z, 2$

        WAIT_STAT
        ld a, e
        ld (hl+), a

        dec c
        jr z, 2$

        inc e

        ld b, c
        dec b
        jr z, 1$
3$:
        WAIT_STAT
        ld a, e
        ld (hl+), a
        dec c
        dec b
        jr nz, 3$
1$:
        inc e
        WAIT_STAT
        ld (hl), e
2$:
        ret