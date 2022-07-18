        .include        "global.s"

        .area  _EHL_TRAMPOLINE (ABS)

        .org   0x08

___sdcc_bcall_ehl::                     ; Performs a long call.
        ldh     a,(__current_bank)
        push    af                      ; Push the current bank onto the stack
        ld      a, e
        ldh     (__current_bank),a
        ld      (.MBC_ROM_PAGE),a       ; Perform the switch
        rst     0x20
        pop     af                      ; Pop the old bank
        ldh     (__current_bank),a
        ld      (.MBC_ROM_PAGE),a
        ret