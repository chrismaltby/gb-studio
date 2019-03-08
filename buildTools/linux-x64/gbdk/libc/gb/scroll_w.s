	.include	"global.s"

	;; BANKED:	checked, imperfect
	.area	_BASE

_scroll_win::
	LDA	HL,2(SP)	; Skip return address
	XOR	A
	CP	(HL)		; Is x != 0
	JR	Z,1$

	LDH	A,(.WX)		; Yes
	ADD	(HL)
	LDH	(.WX),A
1$:
	INC	HL
	XOR	A
	CP	(HL)		; Is y != 0
	JR	Z,2$

	LDH	A,(.WY)		; Yes
	ADD	(HL)
	LDH	(.WY),A
2$:
	RET
