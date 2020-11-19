.LCDC = 0xFF40
.STAT = 0xFF41

_SetTile::
        ; de = addr, hl = &t
        ldhl    sp,#2
        ld      a,(hl+)
        ld      e, a
        ld      a,(hl+)
        ld      d, a

        ; while 0xff41 & 02 != 0 (cannot write)
    1$:
        ldh     a,(.STAT)
        and     a, #0x02
        jr      NZ,1$

        ; Write tile
        ld      a,(hl)
        ld      (de),a
        ret

_WaitForMode0Or1::
    1$:
        ldh     a,(.STAT)
        and     a, #0x02
        jr      NZ,1$
        ret

_GetWinAddr::
        ldh     a,(.LCDC)
        bit     6,a
        jr      Z,.is98
        jr      .is9c
_GetBkgAddr::
        ldh     a,(.LCDC)
        bit     3,a
        jr      NZ,.is9c
.is98:
        ld      DE,#0x9800	; DE = origin
        ret
.is9c:
        ld      DE,#0x9C00  ; DE = origin
        ret