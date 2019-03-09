	.include	"global.s"

	.globl	.set_xy_btt
	;; BANKED:	checked
	.area	_BASE

_set_bkg_tiles::
	PUSH	BC

	LDA	HL,4(SP)	; Skip return address and registers
	LD	D,(HL)		; D = x
	INC	HL
	LD	E,(HL)		; E = y
	LDA	HL,9(SP)
	LD	B,(HL)		; BC = tiles
	DEC	HL
	LD	C,(HL)
	DEC	HL
	LD	A,(HL-)		; A = h
	LD	H,(HL)		; H = w
	LD	L,A		; L = h

	CALL	.set_xy_btt

	POP	BC
	RET
