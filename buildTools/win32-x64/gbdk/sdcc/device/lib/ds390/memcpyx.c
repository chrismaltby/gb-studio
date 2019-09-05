#include <string.h>

void xdata * memcpyx (
	void xdata * dst,
	void xdata * src,
	int count
	) _naked
{
    /* Shut compiler up about unused parameters. */
    dst; src; count;
    
/* AUTO_TOGGLE uses the '390 DPTS toggle bit. */    
#define AUTO_TOGGLE    
_asm
    ; Destination is in DPTR. Save it on stack so we can return it at end.
    
    push dpx
    push dph
    push dpl
    
    mov  dps, #0x1        ; Alternate DPTR.
    
    ; count  is in _memcpyx_PARM_3
    mov  dptr, #_memcpyx_PARM_3
    movx a, @dptr
    inc dptr
    mov r2, a
    movx a, @dptr
    mov r3, a

    ; src is in _memcpyx_PARM_2
    mov  dptr, #_memcpyx_PARM_2
    movx a, @dptr
    inc  dptr
    push acc
    movx a, @dptr
    inc  dptr
    push acc
    movx a, @dptr
    mov  dpx1, a
    pop  dph1
    pop  dpl1

#ifdef AUTO_TOGGLE
    mov	dps, #0x21	; Current DPTR is alt DPTR, toggle after each op.
#else
    mov dps, #0x0	; Current DPTR is normal DPTR, no toggle.
#endif    
    
    ; src is in alt DPTR, dst is in normal DPTR, count is in r2/r3.
    
    ; If we have zero bytes to copy, quick out.
    mov	 a, r2
    orl  a, r3
    jz   _memcpy_done

    ; increment r3 if r2 != 0 (makes djnz end-of-loop sequence possible).
    inc r3
    cjne r2, #0x0, _memcpyx_loopTop
    dec r3

_memcpyx_loopTop:

#ifdef AUTO_TOGGLE
    movx a, @dptr
    movx @dptr, a
    inc dptr
    inc dptr
#else
    inc dps
    movx a, @dptr
    inc dptr
    dec dps 
    movx @dptr, a
    inc dptr
#endif    

    djnz r2, _memcpyx_loopTop
    djnz r3, _memcpyx_loopTop
    
_memcpy_done:

#ifdef AUTO_TOGGLE
    mov dps, #0x0
#endif    

    pop dpl
    pop dph
    pop dpx
    ret
_endasm;    
    
}
