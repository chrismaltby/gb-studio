	;; Originally from GBDK by Pascal Felber.
	
	.area	_CODE

__mulschar_rrx_s::
        ld      hl,#2
        add     hl,sp

        ld      e,(hl)
        inc     hl
        ld      l,(hl)                

        ;; Fall through
__mulschar_rrx_hds::
        ;; Need to sign extend before going in.
        ld      c,l
        
        ld      a,l
        rla
        sbc     a,a
        ld      b,a

        ld      a,e
        rla
        sbc     a,a
        ld      d,a

        jp      .mul16

__muluchar_rrx_s::
        ld      hl,#2
        add     hl,sp

        ld      e,(hl)

        inc     hl
        ld      c,(hl)                

        ;; Clear the top
        xor     a
        ld      d,a
        ld      b,a
        
        jp      .mulu16
        
__mulsint_rrx_s::
__muluint_rrx_s::
        ld      hl,#2
        add     hl,sp
        
        ld      e,(hl)
        inc     hl
        ld      d,(hl)
        inc     hl
        ld      a,(hl)
        inc     hl
        ld      h,(hl)
        ld      l,a

        ;; Fall through
        
__muluchar_rrx_hds::
__mulsint_rrx_hds::
__muluint_rrx_hds::
	;; Parameters:
	;;	HL, DE (left, right irrelivent)
	ld	b,h
	ld	c,l
	
	;; 16-bit multiplication
	;; 
	;; Entry conditions
	;;   BC = multiplicand
	;;   DE = multiplier
	;; 
	;; Exit conditions
	;;   DE = less significant word of product
	;;
	;; Register used: AF,BC,DE,HL
.mul16:
.mulu16:
        ld      hl,#0
        ld      a,b
        ; ld c,c
        ld      b,#16

        ;; Optimise for the case when this side has 8 bits of data or
        ;; less.  This is often the case with support address calls.
        or      a
        jp      nz,1$
        
        ld      b,#8
        ld      a,c
1$:
        ;; Taken from z88dk, which originally borrowed from the
        ;; Spectrum rom.
        add     hl,hl
        rl      c
        rla                     ;DLE 27/11/98
        jr      nc,2$
        add     hl,de
2$:     
        djnz    1$
        ret
