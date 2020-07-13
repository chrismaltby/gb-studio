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

.macro _load16 regH regL ptr
    ; Load position into de (little endian)
        ld hl, ptr
        ld regL, (hl)
        inc hl
        ld regH, (hl)
.endm

_MoveActors_b::

    ; ; Debug set win pos to top left
    ;     ; ld	hl, #_win_pos_x
    ;     ; ld	(hl), #0x00
    ;     ; ld	hl, #_win_pos_y
    ;     ; ld	(hl), #0x00

    ;     ld b, #0                                ;; b = 0
    ; loop_cond:
    ;     ld hl, #_actors_active_size             ;; hl = *actors_active_size
    ;     ld a, (hl)                              ;; a = actors_active_size
    ;     cp b                                    ;; compare a and b
    ;     jp z, loop_exit                         ;; if b == a goto loop_exit


    ; ; Load actor index
    ;     ld 


    ;     inc b                                   ;; b++
    ;     jp loop_cond                            ;; goto loop_cond
    ; loop_exit:

        ; ld 


    ; Debug set win pos x to b
        ; ld	hl, #_win_pos_x
        ; ld	(hl), b


    ; Debug reposition player

    ; Load moving into hl
        ld hl, #(_actors + 7)
        ld a, (hl)
        cp a, #0
        jp z, not_moving

    move_x:

    ; Load dirx into a
        ld hl, #(_actors + 5)        
        ld a, (hl)        

    ; If not moving x skip to y
        cp a, #0
        jp z, move_y

    ; ; Load position into de (little endian)
    ;     ld hl, #_actors
    ;     ld e, (hl)
    ;     inc hl
    ;     ld d, (hl)

        _load16 d e ^/#(_actors)/




    ; 

    ; ; Increment position
        ; inc de

        ; ld hl, (hl)

    ;     ; ld	(hl), #0x80
        ; ld a, #1

    
    ; Add a to hl
        ; add   a, e    ; A = A+L
        ; ld    e, a    ; L = A+L
        ; adc   a, d    ; A = A+L+H+carry
        ; sub   e       ; A = H+carry
        ; ld    d, a    ; H = H+carry

    ; add   a, e    ; A = A+L
    ; ld    e, a    ; L = A+L
    ; adc   a, d    ; A = A+L+H+carry
    ; sub   e       ; A = H+carry
    ; ld    d, a    ; H = H+carry



    ; If A is negative, we need
    ; to substract $100 from HL
    ; (since A's "upper byte" is
    ; $FF00)
;         bit 7, a                ; set z if a signed bit is 0
;         jp z, positive          ; if z is set jump to positive
;         dec   d                 ; if negative decrement upper byte
;     positive:
    
; ;     ; Then do addition as usual
; ;     ; (to handle the "lower byte")
;     add   a, e
;     ld    e, a
;     adc   a, d
;     sub   e
;     ld    d, a


        _signed_add_a d e

    ; Set player position from de
        ld hl, #_actors
        ld (hl), e
        inc hl
        ld (hl), d

    move_y:
    ; Load dir into a
        ld hl, #(_actors + 6)        
        ld a, (hl)

    ; If not moving y skip to end
        cp a, #0
        jp z, not_moving


        ; ld a, #-1
; 
        _load16 d e ^/#(_actors + 2)/

        _signed_add_a d e

    ; Set player position from de
        ld hl, #(_actors + 2)
        ld (hl), e
        inc hl
        ld (hl), d

    not_moving:

        ret

; 	add	sp, #-14
; ;src/core/Actor_b.c:26: for (i = 0; i != actors_active_size; i++) {
; 	xor	a, a
; 	ldhl	sp,	#13
; 	ld	(hl), a
; 00110$:
; 	ld	hl, #_actors_active_size
; 	ld	a, (hl)
; 	ldhl	sp,	#13
; 	sub	a, (hl)
; 	jp	Z,00112$
; ;src/core/Actor_b.c:27: a = actors_active[i];
; 	ld	de, #_actors_active
; 	ldhl	sp,	#13
; 	ld	l, (hl)
; 	ld	h, #0x00
; 	add	hl, de
; 	ld	c, l
; 	ld	b, h
; 	ld	a, (bc)
; ;src/core/Actor_b.c:29: if (actors[a].moving) {
; 	ld	c, a
; 	ld	b, #0x00
; 	ld	l, c
; 	ld	h, b
; 	add	hl, hl
; 	add	hl, bc
; 	add	hl, hl
; 	add	hl, hl
; 	add	hl, hl
; 	add	hl, hl
; 	ld	c, l
; 	ld	b, h
; 	ld	hl, #_actors
; 	add	hl, bc
; 	ld	c, l
; 	ld	b, h
; 	ld	hl, #0x0015
; 	add	hl, bc
; 	ld	a, l
; 	ld	d, h
; 	ldhl	sp,	#11
; 	ld	(hl+), a
; 	ld	(hl), d
; 	dec	hl
; 	ld	e, (hl)
; 	inc	hl
; 	ld	d, (hl)
; 	ld	a,(de)
; 	or	a, a
; 	jp	Z, 00111$
; ;src/core/Actor_b.c:30: if (actors[a].move_speed == 0) {
; 	ld	hl, #0x0016
; 	add	hl, bc
; 	inc	sp
; 	inc	sp
; 	push	hl
; 	pop	de
; 	push	de
; 	ld	a,(de)
; 	ldhl	sp,	#2
; 	ld	(hl), a
; ;src/core/Actor_b.c:33: actors[a].pos.x += (WORD)actors[a].dir.x;
; 	ld	hl, #0x0003
; 	add	hl, bc
; 	ld	a, l
; 	ld	d, h
; 	ldhl	sp,	#3
; 	ld	(hl+), a
; 	ld	(hl), d
; 	ld	hl, #0x000d
; 	add	hl, bc
; 	ld	a, l
; 	ld	d, h
; 	ldhl	sp,	#5
; 	ld	(hl+), a
; 	ld	(hl), d
; ;src/core/Actor_b.c:34: actors[a].pos.y += (WORD)actors[a].dir.y;
; 	ld	hl, #0x0005
; 	add	hl, bc
; 	ld	a, l
; 	ld	d, h
; 	ldhl	sp,	#7
; 	ld	(hl+), a
; 	ld	(hl), d
; 	ld	hl, #0x000e
; 	add	hl, bc
; 	ld	a, l
; 	ld	d, h
; 	ldhl	sp,	#9
; 	ld	(hl+), a
; 	ld	(hl), d
; ;src/core/Actor_b.c:30: if (actors[a].move_speed == 0) {
; 	ldhl	sp,	#2
; 	ld	a, (hl)
; 	or	a, a
; 	jp	NZ, 00104$
; ;src/core/Actor_b.c:32: if (IS_FRAME_2) {
; 	ld	hl, #_game_time
; 	ld	a, (hl)
; 	rrca
; 	jp	C,00111$
; ;src/core/Actor_b.c:33: actors[a].pos.x += (WORD)actors[a].dir.x;
; 	ldhl	sp,#(4 - 1)
; 	ld	e, (hl)
; 	inc	hl
; 	ld	d, (hl)
; 	ld	a,(de)
; 	ldhl	sp,	#11
; 	ld	(hl+), a
; 	inc	de
; 	ld	a, (de)
; 	ld	(hl), a
; 	ldhl	sp,#(6 - 1)
; 	ld	e, (hl)
; 	inc	hl
; 	ld	d, (hl)
; 	ld	a,(de)
; 	ld	c, a
; 	rla
; 	sbc	a, a
; 	ld	b, a
; 	ldhl	sp,	#11
; 	ld	a, (hl+)
; 	ld	h, (hl)
; 	ld	l, a
; 	add	hl, bc
; 	ld	c, l
; 	ld	b, h
; 	ldhl	sp,	#3
; 	ld	a, (hl+)
; 	ld	h, (hl)
; 	ld	l, a
; 	ld	(hl), c
; 	inc	hl
; 	ld	(hl), b
; ;src/core/Actor_b.c:34: actors[a].pos.y += (WORD)actors[a].dir.y;
; 	ldhl	sp,#(8 - 1)
; 	ld	e, (hl)
; 	inc	hl
; 	ld	d, (hl)
; 	ld	a,(de)
; 	ldhl	sp,	#11
; 	ld	(hl+), a
; 	inc	de
; 	ld	a, (de)
; 	ld	(hl-), a
; 	dec	hl
; 	dec	hl
; 	ld	e, (hl)
; 	inc	hl
; 	ld	d, (hl)
; 	ld	a,(de)
; 	ld	c, a
; 	rla
; 	sbc	a, a
; 	ld	b, a
; 	inc	hl
; 	ld	a, (hl+)
; 	ld	h, (hl)
; 	ld	l, a
; 	add	hl, bc
; 	ld	c, l
; 	ld	b, h
; 	ldhl	sp,	#7
; 	ld	a, (hl+)
; 	ld	h, (hl)
; 	ld	l, a
; 	ld	(hl), c
; 	inc	hl
; 	ld	(hl), b
; 	jp	00111$
; 00104$:
; ;src/core/Actor_b.c:37: actors[a].pos.x += (WORD)(actors[a].dir.x * actors[a].move_speed);
; 	ldhl	sp,#(4 - 1)
; 	ld	e, (hl)
; 	inc	hl
; 	ld	d, (hl)
; 	ld	a,(de)
; 	ldhl	sp,	#11
; 	ld	(hl+), a
; 	inc	de
; 	ld	a, (de)
; 	ld	(hl), a
; 	ldhl	sp,#(6 - 1)
; 	ld	e, (hl)
; 	inc	hl
; 	ld	d, (hl)
; 	ld	a,(de)
; 	ld	b, a
; 	ldhl	sp,	#2
; 	ld	a, (hl)
; 	push	af
; 	inc	sp
; 	push	bc
; 	inc	sp
; 	call	__muluschar
; 	add	sp, #2
; 	ld	c, e
; 	ld	b, d
; 	ldhl	sp,	#11
; 	ld	a, (hl+)
; 	ld	h, (hl)
; 	ld	l, a
; 	add	hl, bc
; 	ld	c, l
; 	ld	b, h
; 	ldhl	sp,	#3
; 	ld	a, (hl+)
; 	ld	h, (hl)
; 	ld	l, a
; 	ld	(hl), c
; 	inc	hl
; 	ld	(hl), b
; ;src/core/Actor_b.c:38: actors[a].pos.y += (WORD)(actors[a].dir.y * actors[a].move_speed);        
; 	ldhl	sp,#(8 - 1)
; 	ld	e, (hl)
; 	inc	hl
; 	ld	d, (hl)
; 	ld	a,(de)
; 	ldhl	sp,	#11
; 	ld	(hl+), a
; 	inc	de
; 	ld	a, (de)
; 	ld	(hl-), a
; 	dec	hl
; 	dec	hl
; 	ld	e, (hl)
; 	inc	hl
; 	ld	d, (hl)
; 	ld	a,(de)
; 	ld	b, a
; 	pop	de
; 	push	de
; 	ld	a,(de)
; 	push	af
; 	inc	sp
; 	push	bc
; 	inc	sp
; 	call	__muluschar
; 	add	sp, #2
; 	ld	c, e
; 	ld	b, d
; 	ldhl	sp,	#11
; 	ld	a, (hl+)
; 	ld	h, (hl)
; 	ld	l, a
; 	add	hl, bc
; 	ld	c, l
; 	ld	b, h
; 	ldhl	sp,	#7
; 	ld	a, (hl+)
; 	ld	h, (hl)
; 	ld	l, a
; 	ld	(hl), c
; 	inc	hl
; 	ld	(hl), b
; 00111$:
; ;src/core/Actor_b.c:26: for (i = 0; i != actors_active_size; i++) {
; 	ldhl	sp,	#13
; 	inc	(hl)
; 	jp	00110$
; 00112$:
; ;src/core/Actor_b.c:42: }
; 	add	sp, #14
; 	ret