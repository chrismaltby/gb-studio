        .include        "global.s"

        .globl _vwf_current_rotate, _vwf_current_mask, _vwf_inverse_map

        .area _CODE

; used from __nonbanked code, so should be nonbanked too, because bank is random
_ui_time_masks::
        .db #0x00, #0x00, #0x00, #0x01, #0x03, #0x07, #0x0f, #0x1f

; void ui_print_shift_char(void * dest, const void * src, UBYTE bank);

_ui_print_shift_char::
        ldhl sp, #6
        
        ldh a, (__current_bank)
        push af
        ld a, (hl-)
        ldh (__current_bank), a
        ld  (#0x2000), a

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
        or c
        ld (hl+), a

        ld a, (_vwf_current_mask)
        and (hl)
        or b
        ld (hl+), a

        pop af
        dec a
        jr nz, 3$

        pop af
        ldh (__current_bank),a
        ld  (#0x2000), a

        ret
