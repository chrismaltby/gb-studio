	;; Originally from GBDK by Pascal Felber.
	
	;; BANKED: checked
	.area	_BASE
__mulschar::	
__muluchar::
	push	bc
	lda	hl,4(sp)
	ld	c,(hl)
	inc	hl
	ld	e,(hl)
	call	.mulu8

	ld	e,l
	pop	bc
	ret

__mulsint::
__muluint::
	push	bc
	lda	hl,4(sp)
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
	inc	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	call	.mulu16

	ld	e,l
	ld	d,h
	pop	bc
	ret	
		
.mul8:
.mulu8:
	LD	B,#0x00		; Sign extend is not necessary with mul
	LD	D,B
	; Fall through
	
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
.mul16::	
.mulu16::	
	LD	HL,#0x00	; Product = 0
	LD	A,#15		; Count = bit length - 1
	;; Shift-and-add algorithm
	;; If MSB of multiplier is 1, add multiplicand to partial product
	;; Shift partial product, multiplier left 1 bit
.mlp:
	SLA	E		; Shift multiplier left 1 bit
	RL	D
	JR	NC,.mlp1	; Jump if MSB of multiplier = 0
	ADD	HL,BC		; Add multiplicand to partial product
.mlp1:
	ADD	HL,HL		; Shift partial product left
	DEC	A
	JR	NZ,.mlp		; Continue until count = 0
	;; Add multiplicand one last time if MSB of multiplier is 1
	BIT	7,D		; Get MSB of multiplier
	JR	Z,.mend		; Exit if MSB of multiplier is 0
	ADD	HL,BC		; Add multiplicand to product
.mend:
	RET			; HL = result

