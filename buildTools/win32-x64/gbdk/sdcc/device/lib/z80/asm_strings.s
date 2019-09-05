	;; Implementation of some string functions in
	;; assembler.

	;; Why - because I want a better dhrystone score :)

        ;; strcpy is disabled as the C version is almost as good.
        ;; Just the setup and return is slower.
        .if 0
; char *strcpy(char *dest, const char *source)
_strcpy::
        ;; Fall through to the correct type
__strcpy_rrf_s::
        ld      a,#5
        rst     0x08
__strcpy_rrx_s::
        ld      hl,#2
        add     hl,sp
        ld      e,(hl)
        inc     hl
        ld      d,(hl)
        inc     hl
        ld      c,(hl)
        inc     hl
        ld      b,(hl)
        ;; Setup the return value
        ld      l,c
        ld      h,b
1$:
        ld      a,(bc)
        ld      (de),a
        or      a
        jp      nz,1$

        ret
        ;; Notes on strcpy styles:
        ;;   *de = *hl; hl++; de++; or a; ret z; jp - slower as jp is
        ;; same cost as conditional jump, so condition on ret is more expensive.
        ;;   *de = *bc; bc++; de++; or a, jp nz - OK
        ;; Can't use LDI as need to check for end of string.
        ;; Above also matches the z88dk version.
        .endif
                
; void *memcpy(void *dest, const void *source, int count)
_memcpy::       
        ;; Fall through to correct type
__memcpy_rrf_s::                
        ld      a,#5
        rst     0x08
__memcpy_rrx_s::       
        ;; Using LDIR
        ;; LDIR:        do; *DE = *HL; HL++; BC--; while BC != 0
        
        ;; All registers are already saved.
        ld      hl,#2
        add     hl,sp
        ld      e,(hl)
        inc     hl
        ld      d,(hl)
        inc     hl
        ld      a,(hl)
        inc     hl
        ld      b,(hl)
        inc     hl
        ld      c,(hl)
        inc     hl
        ld      h,(hl)
        ld      l,a
        ld      a,h
        ld      h,b
        ld      b,a

        ;; Pending: could optimise this check to occur earlier.
        or      c
        ret     z

        ldir
        ret

; int strcmp(const char *s1, const char *s2) 
_strcmp::
        ;; Fall through to the correct style
        ;; Fall through to correct type
__strcmp_rrf_s::                
        ld      a,#5
        rst     0x08
__strcmp_rrx_s::       
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
        
1$:     
        ld      a,(de)
        sub     (hl)

        ;; Normally not taken, so use a jr (12/7) instead of jp (10)
        jr      nz,2$

        ;; A == 0
        cp      (hl)

        inc     de
        inc     hl
        ;; Normally taken.  Flag from the cp above.
        jp      nz,1$
2$:     
        ;; Sign extend
        ld      l,a
        rla
        sbc     a
        ld      h,a
        ret
        
