	.include	"global.s"

	;; BANKED:	checked, imperfect
	.area	_BASE

_scroll_bkg::
	LDA	HL,2(SP)	; Skip return address
	XOR	A
	CP	(HL)		; Is x != 0
	JR	Z,1$

	LDH	A,(.SCX)	; Yes
	ADD	(HL)
	LDH	(.SCX),A
1$:
	INC	HL
	XOR	A
	CP	(HL)		; Is y != 0
	JR	Z,2$

	LDH	A,(.SCY)	; Yes
	ADD	(HL)
	LDH	(.SCY),A
2$:
	RET
