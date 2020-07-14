.macro _signed_add_a regH regL ?lbl
        ; If A is negative, we need
        ; to substract $100 from HL
        ; (since A's "upper byte" is
        ; $FF00)
        bit 7, a                    ; set z if a signed bit is 0
        jr z, lbl                   ; if z is set jump to positive
        dec   regH                  ; if negative decrement upper byte
    lbl:
        ; Then do addition as usual
        ; (to handle the "lower byte")
        add   a, regL
        ld    regL, a
        adc   a, regH
        sub   regL
        ld    regH, a
.endm

.macro _add_a regH regL
        ; Then do addition as usual
        ; (to handle the "lower byte")
        add   a, regL
        ld    regL, a
        adc   a, regH
        sub   regL
        ld    regH, a
.endm
