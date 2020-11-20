        .area   _CODE_1

; extracts token from string
_GetToken_b::
        push    bc
        lda     hl, 6(sp)
        ld      a, (hl-)
        ld      d, a
        ld      a, (hl-)
        ld      l, (hl)
        ld      h, a
        xor     a
        ld      e, a            ; e: length
        ld      b, a
        ld      c, a            ; bc: result
1$:
        ld      a, (hl+)
        cp      d
        jr      z, 3$           ; terminator found
        cp      #'0'
        jr      c, 2$
        cp      #('9' + 1)
        jr      nc, 2$
        sub     #'0'

        push    hl
        ld      h, b
        ld      l, c
        add     hl, hl
        add     hl, hl
        add     hl, bc
        add     hl, hl          ; hl = bc * 10

        add     l
        ld      c, a
        adc     h
        sub     c
        ld      b, a            ; bc = hl + a
        pop     hl

        inc     e
        ld      a, e
        cp      #5
        jr      c,  1$

        jr      2$              ; token too long
3$:
        ld      a, e
        or      a
        jr      z, 2$           ; token too short
        cp      #5
        jr      nc, 2$          ; token too long

        ; token is ok
        lda     hl, 7(sp)
        ld      a, (hl+)
        ld      h, (hl)
        ld      l, a
        ld      (hl), c
        inc     hl
        ld      (hl), b         ; *res = bc

        inc     e               ; include terminator

        pop     bc
        ret
2$:
        ; token is bad
        ld      e, #0
        pop     bc
        ret