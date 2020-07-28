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

.macro _signed_sub_a regH regL ?lbl

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


        ; We negate A (since HL - A
        ; is the same as HL + -A)
        ; neg
        ; _signed_sub_a regH, regL
    ;     ; Now add the "upper byte"
    ;     ; The flags are already set by NEG
    ;     ; The JP PE is because -$80 becomes
    ;     ; +$80 so we need to handle it too
    ;     jp    p, lbl
    ;     jp    pe, lbl
    ;     dec   h
    ; lbl:
        
    ;     ; Then add the low byte
    ;     add   a, l
    ;     ld    l, a
    ;     adc   a, h
    ;     sub   l
    ;     ld    h, a
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

.macro _sub16 h1 l1 h2 l2
    ld a, l1
    sub a, l2
    ld l1, A

    ld a, h1
    sbc h2
    ld h1, A
.endm

.macro _if_lt_16 h2 l2 h1 l1 tmp lbl
        ld a, l1
        sub a, l2
        ld	tmp, a
        ld	a, h1
        sbc	a, h2
        ld	tmp, a
        bit	7, tmp
        jr	Z, lbl    
.endm

.macro _if_lt_u16 h1 l1 h2 l2 lbl
        ld	a, l1
        sub	a, l2
        ld	a, h1
        sbc	a, h2
        jr	c, lbl
.endm

.macro _if_gt_16 h1 l1 h2 l2 tmp lbl
        ld a, l1
        sub a, l2
        ld	tmp, a
        ld	a, h1
        sbc	a, h2
        ld	tmp, a
        bit	7, tmp
        jr	Z, lbl    
.endm

;    0000 21r00r00             62 	ld	hl, #_camera_tmp_a
;    0003 7E                   63 	ld	a, (hl)
;    0004 21r02r00             64 	ld	hl, #_camera_tmp_b
;    0007 96                   65 	sub	a, (hl)
;    0008 4F                   66 	ld	c, a
;    0009 21r01r00             67 	ld	hl, #_camera_tmp_a + 1
;    000C 7E                   68 	ld	a, (hl)
;    000D 21r03r00             69 	ld	hl, #_camera_tmp_b + 1
;    0010 9E                   70 	sbc	a, (hl)
;    0011 47                   71 	ld	b, a
;    0012 CB 78                72 	bit	7, b
;    0014 28 08                73 	jr	Z,00102$