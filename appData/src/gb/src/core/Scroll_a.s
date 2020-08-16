_SetTile::
    ;bc = r, hl = t
        ldhl	sp,#2
        ld	c,(hl)
        inc	hl
        ld	b,(hl)
        ldhl	sp,#4

    ;while 0xff41 & 02 != 0 (cannot write)
        ld	de,#0xff41
    1$:
        ld	a,(de)
        and	a, #0x02
        jr	NZ,1$

    ;Write tile
        ld	a,(hl)
        ld	(bc),a

    ;Check again stat is 0 or 1
        ld	a,(de)
        and	a, #0x02
        jr	NZ,1$
        ret

_WaitForMode0Or1::
    ;while 0xff41 & 02 != 0 (cannot write)
        ld	de,#0xff41
    wait:
        ld	a,(de)
        and	a, #0x02
        jr	NZ,wait
        ret
