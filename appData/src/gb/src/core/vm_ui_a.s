    .module     vm_ui_a
    .include    "global.s"

    .area   _DATA

__itoa_fmt_len::
    .ds 0x01
.itoa_fmt_buf::
    .ds 0x03

    .area   _CODE_255

.globl b_itoa_fmt
b_itoa_fmt = 255

_itoa_fmt::
    push    BC
    ldhl    SP, #8
    ld      A, (HL+)
    ld      E, A
    ld      A, (HL+)
    ld      D, A        ; DE: int
    ld      A, (HL+)
    ld      C, A
    ld      B, (HL)     ; BC: dest

    push    BC

    ld      A, D
    add     A, A
    jr      C, 3$
    call    .utoa_fmt
    jr      2$
3$:
    rra         ; DE = abs(DE)
    cpl
    ld      D, A
    ld      A, E
    cpl
    ld      E, A
    inc     DE
    
    ld      HL, #__itoa_fmt_len
    ld      A, (HL)
    or      A
    jr      Z, 1$
    dec     (HL)
1$:
    ld      A, #'-'
    ld      (BC), A
    inc     BC

    call    .utoa_fmt
2$:
    ld      H, B
    ld      L, C
    pop     DE
    ld      A, D
    cpl
    ld      D, A
    ld      A, E
    cpl
    ld      E, A
    inc     DE
    add     HL, DE
    ld      D, H
    ld      E, L

    pop     BC
    ret

.utoa_fmt::             ; convert unsigned int into ascii
    push    BC

    ld      HL, #(.itoa_fmt_buf + 2)
    
    xor     A           ; clear value
    ld      (HL-), A
    ld      (HL-), A
    ld      (HL), A

    ld      B, #16
1$:
    sla     E
    rl      D
    
    ld      A, (HL)
    adc     A
    daa
    ld      (HL+), A
    ld      A, (HL)
    adc     A
    daa
    ld      (HL+), A
    ld      A, (HL)
    adc     A
    daa
    ld      (HL-), A
    dec     HL

    dec     B
    jr      NZ, 1$

    pop     BC

    ld      A, (__itoa_fmt_len)
    sub     #5
    jr      C, 8$
    jr      Z, 8$
    ld      D, A
    ld      A, #'0'
9$: 
    ld      (BC), A
    inc     BC
    dec     D
    jr      NZ, 9$
    ld      A, #5
    ld      (__itoa_fmt_len), A
8$: 

    ld      A, (__itoa_fmt_len)
    or      A
    jr      Z, 7$
    ld      A, #1
7$: 
    ld      D, A
    ld      E, #'0'
    ld      HL, #(.itoa_fmt_buf + 2)
    
    ld      A, (HL-)
    and     #0x0f
    add     D
    jr      Z, 3$
    sub     D
    add     A, E
    ld      D, #1       ; make D nonzero
    ld      (BC), A
    inc     BC

    ld      A, (__itoa_fmt_len)
    or      A
    jr      Z, 3$
    cp      #5
    jr      NC, 3$
    dec     BC  
3$:
    ld      A, (HL)
    swap    A
    and     #0x0f
    add     D
    jr      Z, 4$
    sub     D
    add     A, E
    ld      D, #1       ; make D nonzero
    ld      (BC), A
    inc     BC

    ld      A, (__itoa_fmt_len)
    or      A
    jr      Z, 4$
    cp      #4
    jr      NC, 4$
    dec     BC  
4$:
    ld      A, (HL-)
    and     #0x0f
    add     D
    jr      Z, 5$
    sub     D
    add     A, E
    ld      D, #1       ; make D nonzero
    ld      (BC), A
    inc     BC  

    ld      A, (__itoa_fmt_len)
    or      A
    jr      Z, 5$
    cp      #3
    jr      NC, 5$
    dec     BC  
5$:
    ld      A, (HL)
    swap    A
    and     #0x0f
    add     D
    jr      Z, 6$
    sub     D
    add     A, E
    ld      (BC), A
    inc     BC

    ld      A, (__itoa_fmt_len)
    or      A
    jr      Z, 6$
    cp      #2
    jr      NC, 6$
    dec     BC  
6$:
    ld      A, (HL)
    and     #0x0f
    add     A, E
    ld      (BC), A
    inc     BC
    
    xor     A
    ld      (BC), A     ; write trailing #0

    ret
    