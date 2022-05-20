        .include        "global.s"

        .area   _DATA

.image_tile_width::
        .ds     0x01

        .area   _HOME

_set_bkg_submap::
        ldhl    sp, #2
        ld      a, (hl+)        ; b = x
        ld      b, a
        ld      c, (hl)         ; c = y
        
        ldhl    sp, #8
        ld      a, (hl)
        ldhl    sp, #4
        sub     (hl)
        ld      (.image_tile_width), a ; .image_tile_width contains corrected width map width
        add     (hl)

        ld      d, #0
        ld      e, a
        ld      a, c
        MUL_DE_BY_A_RET_HL
        ld      a, b
        ADD_A_REG16 h, l
        ld      d, h
        ld      e, l

        ldhl    sp, #6
        ld      a,(hl+)         
        ld      h,(hl)          
        ld      l,a             
        add     hl, de
        ld      b, h
        ld      c, l

        ldhl    sp, #2
        ld      a, (hl+)        ; d = x
        and     #0x1f
        ld      d, a
        ld      a, (hl)         ; e = y
        and     #0x1f
        ld      e, a

        ldhl    sp, #5
        ld      a,(hl-)         ; a = h
        ld      h,(hl)          ; h = w
        ld      l,a             ; l = h

        jr      .set_xy_bkg_submap

_set_xy_win_submap::
        ldhl    sp, #2
        ld      a, (hl+)
        ld      c, a
        ld      a, (hl+)
        ld      b, a

        ldh     a, (__current_bank)
        push    af
        ld      a, (hl+)
        ldh	(__current_bank),a
        ld      (#rROMB0), a

        ld      a, (hl+)
        inc     hl
        inc     hl
        sub     (hl)
        ld      (.image_tile_width), a
        dec     hl
        dec     hl

        ld      a, (hl+)        ; d = x
        and     #0x1f
        ld      d, a
        ld      a, (hl+)        ; e = y
        and     #0x1f
        ld      e, a

        ld      a, (hl+)
        ld      l, (hl)
        ld      h, a

        call    .set_xy_win_submap
        
        pop     af
        ldh	(__current_bank),a
        ld      (#rROMB0), a
        ret

        ;; set window tile table from bc at xy = de of size wh = hl
.set_xy_win_submap::
        push    hl              ; store wh
        ldh     a,(.LCDC)
        bit     LCDCF_B_WIN9C00,a
        jr      z,.is98
        jr      .is9c
        ;; set background tile table from (bc) at xy = de of size wh = hl
.set_xy_bkg_submap::
        push    hl              ; store wh
        ldh     a,(.LCDC)
        bit     LCDCF_B_BG9C00,a
        jr      nz,.is9c
.is98:
        ld      hl,#0x9800
        jr      .set_xy_submap
.is9c:
        ld      hl,#0x9c00
        ;; set background tile from (bc) at xy = de, size wh on stack, to vram from address (hl)
.set_xy_submap::
        push    bc              ; store source

        swap    e
        rlc     e
        ld      a,e
        and     #0x03
        add     h
        ld      b,a
        ld      a,#0xe0
        and     e
        add     d
        ld      c,a             ; dest bc = hl + 0x20 * y + x

        pop     hl              ; hl = source
        pop     de              ; de = wh
        push    de              ; store wh
        push    bc              ; store dest

3$:                             ; copy w tiles
        WAIT_STAT
        ld      a, (hl+)
        ld      (bc), a
        
        ld      a, c            ; inc dest and wrap around
        and     #0xe0
        ld      e, a
        ld      a, c
        inc     a
        and     #0x1f
        or      e
        ld      c, a

        dec     d
        jr      nz, 3$

        ld      a, (.image_tile_width)
        ADD_A_REG16 h, l

        pop     bc
        pop     de

        dec     e
        ret     z

        push    de

        ld      a, b            ; next row and wrap around
        and     #0xfc
        ld      e, a            ; save high bits

        ld      a,#0x20

        add     c
        ld      c, a
        adc     b
        sub     c
        and     #0x03
        or      e               ; restore high bits
        ld      b, a

        push    bc
        
        jr      3$
