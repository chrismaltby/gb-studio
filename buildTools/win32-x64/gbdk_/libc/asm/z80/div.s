	;; Originally from GBDK by Pascal Felber.
	.area	_CODE

__divschar::	
	push	de
	push	bc
	ld	hl,#6
	add	hl,sp

	ld	c,(hl)
	inc	hl
	ld	e,(hl)
	call	.div8

	ld	l,c
	
	pop	bc
	pop	de
	ret
	
__modschar::
	push	de
	push	bc
	ld	hl,#6
	add	hl,sp

	ld	c,(hl)
	inc	hl
	ld	e,(hl)
	call	.div8

	ld	l,e
	
	pop	bc
	pop	de
	ret

__divsint::
	push	bc
	ld	b,h
	ld	c,l

	call	.div16

	ld	l,c
	ld	h,b
	
	pop	bc
	ret
	
__modsint::
	push	de
	push	bc
	ld	hl,#6
	add	hl,sp

	ld	c,(hl)
	inc	hl
	ld	b,(hl)
	inc	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	call	.div16

	ld	l,e
	ld	h,d
	
	pop	bc
	pop	de
	ret

	;; Unsigned
__divuchar::	
	push	de
	push	bc
	push	ix
	ld	ix,#0
	add	ix,sp

	ld	c,8(ix)
	ld	e,9(ix)
	call	.divu8

	ld	l,c
	
	pop	ix
	pop	bc
	pop	de
	ret
	
__moduchar::
	push	de
	push	bc
	push	ix
	ld	ix,#0
	add	ix,sp

	ld	c,8(ix)
	ld	e,9(ix)
	call	.divu8

	ld	l,e
	
	pop	ix
	pop	bc
	pop	de
	ret

__divuint::
	push	bc
	ld	b,h
	ld	c,l
	call	.divu16

	ld	l,c
	ld	h,b
	
	pop	bc
	ret
	
__moduint::
	push	bc
	ld	b,h
	ld	c,l

	call	.divu16

	ld	l,e
	ld	h,d
	
	pop	bc
	ret
	
.div8::
.mod8::
	LD	A,C		; Sign extend
	RLCA
	SBC	A
	LD	B,A
	LD	A,E		; Sign extend
	RLCA
	SBC	A
	LD	D,A

	; Fall through to .div16
	
	;; 16-bit division
	;; 
	;; Entry conditions
	;;   BC = dividend
	;;   DE = divisor
	;; 
	;; Exit conditions
	;;   BC = quotient
	;;   DE = remainder
	;;   If divisor is non-zero, carry=0
	;;   If divisor is 0, carry=1 and both quotient and remainder are 0
	;;
	;; Register used: AF,BC,DE,HL
.div16::
.mod16::
	;; Determine sign of quotient by xor-ing high bytes of dividend
	;;  and divisor. Quotient is positive if signs are the same, negative
	;;  if signs are different
	;; Remainder has same sign as dividend
	LD	A,B		; Get high byte of dividend
	LD	(.srem),A	; Save as sign of remainder
	XOR	D		; Xor with high byte of divisor
	LD	(.squot),A	; Save sign of quotient
	;; Take absolute value of divisor
	BIT	7,D
	jp	Z,.chkde	; Jump if divisor is positive
	SUB	A		; Substract divisor from 0
	SUB	E
	LD	E,A
	SBC	A		; Propagate borrow (A=0xFF if borrow)
	SUB	D
	LD	D,A
	;; Take absolute value of dividend
.chkde:
	BIT	7,B
	jp	Z,.dodiv	; Jump if dividend is positive
	SUB	A		; Substract dividend from 0
	SUB	C
	LD	C,A
	SBC	A		; Propagate borrow (A=0xFF if borrow)
	SUB	B
	LD	B,A
	;; Divide absolute values
.dodiv:
	CALL	.divu16
	RET	C		; Exit if divide by zero
	;; Negate quotient if it is negative
	LD	A,(.squot)
	AND	#0x80
	jp	Z,.dorem	; Jump if quotient is positive
	SUB	A		; Substract quotient from 0
	SUB	C
	LD	C,A
	SBC	A		; Propagate borrow (A=0xFF if borrow)
	SUB	B
	LD	B,A
.dorem:
	;; Negate remainder if it is negative
	LD	A,(.srem)
	AND	#0x80
	RET	Z		; Return if remainder is positive
	SUB	A		; Substract remainder from 0
	SUB	E
	LD	E,A
	SBC	A		; Propagate remainder (A=0xFF if borrow)
	SUB	D
	LD	D,A
	RET

.divu8::
.modu8::
	LD	B,#0x00
	LD	D,B
	; Fall through to divu16

.divu16::
.modu16::
	;; Check for division by zero
	LD	A,E
	OR	D
	jp	NZ,.divide	; Branch if divisor is non-zero
	LD	BC,#0x00	; Divide by zero error
	LD	D,B
	LD	E,C
	SCF			; Set carry, invalid result
	RET
.divide:
	ld	hl,#0
;	LD	L,C		; L = low byte of dividend/quotient
;	LD	H,B		; H = high byte of dividend/quotient
;	LD	BC,#0x00	; BC = remainder
	OR	A		; Clear carry to start
	ex	af,af
	LD	A,#16		; 16 bits in dividend
.dvloop:
	;; Shift next bit of quotient into bit 0 of dividend
	;; Shift next MSB of dividend into LSB of remainder
	;; BC holds both dividend and quotient. While we shift a bit from
	;;  MSB of dividend, we shift next bit of quotient in from carry
	;; HL holds remainder
	;; Do a 32-bit left shift, shifting carry to L, L to H,
	;;  H to C, C to B
	ex	af,af'
	RL	C		; Carry (next bit of quotient) to bit 0
	RL	B		; Clears carry since BC was 0
	adc	hl,hl		

	;; If remainder is >= divisor, next bit of quotient is 1. This
	;;  bit goes to carry
	PUSH	HL		; Save current remainder
	sbc	hl,de
;	LD	A,C		; Substract divisor from remainder
;	SBC	E
;	LD	C,A
;	LD	A,B
;	SBC	D
;	LD	B,A
	CCF			; Complement borrow so 1 indicates a
				;  successful substraction (this is the
				;  next bit of quotient)
	jp	C,.drop		; Jump if remainder is >= dividend
	POP	HL		; Otherwise, restore remainder
	jp	.nodrop
.drop:
	INC	SP
	INC	SP
.nodrop:
	ex	af,af'
	DEC	A		; DEC does not affect carry flag
	jp	NZ,.dvloop
	ex	af,af'
	;; Shift last carry bit into quotient
	LD	D,H		; DE = remainder
	LD	E,L
	RL	C		; Carry to L
;	LD	C,L		; C = low byte of quotient
	RL	B
;	LD	B,H		; B = high byte of quotient
	OR	A		; Clear carry, valid result
	RET

	.area	_BSS

.srem:
	.ds 0x01		; Sign of quotient
.squot:
	.ds 0x01		; Sign of remainder
.dcnt:
	.ds 0x01		; Counter for division
