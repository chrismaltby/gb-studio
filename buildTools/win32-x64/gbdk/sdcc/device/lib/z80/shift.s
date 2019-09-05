        ;;
__rrulong_rrx_s::                
        ld      hl,#2+4
        add     hl,sp
                
        ld      c,(hl)
        dec     hl
        ld      d,(hl)
        dec     hl
        ld      e,(hl)
        dec     hl
        ld      a,(hl)
        dec     hl
        ld      l,(hl)
        ld      h,a

        ld      a,c
1$:
        or      a,a
        ret     z

        rr      d
        rr      e
        rr      h
        rr      l

        dec     a
        jp      1$

__rrslong_rrx_s::        
        ld      hl,#2+4
        add     hl,sp
                
        ld      c,(hl)
        dec     hl
        ld      d,(hl)
        dec     hl
        ld      e,(hl)
        dec     hl
        ld      a,(hl)
        dec     hl
        ld      l,(hl)
        ld      h,a

        ld      a,c
1$:
        or      a,a
        ret     z

        sra     d
        rr      e
        rr      h
        rr      l

        dec     a
        jp      1$
        
__rlslong_rrx_s::                
__rlulong_rrx_s::                
        ld      hl,#2+4
        add     hl,sp
        
        ld      c,(hl)
        dec     hl
        ld      d,(hl)
        dec     hl
        ld      e,(hl)
        dec     hl
        ld      a,(hl)
        dec     hl
        ld      l,(hl)
        ld      h,a

        ld      a,c
1$:
        or      a,a
        ret     z

        rl      l
        rl      h
        rl      e
        rl      d

        dec     a        
        jp      1$
