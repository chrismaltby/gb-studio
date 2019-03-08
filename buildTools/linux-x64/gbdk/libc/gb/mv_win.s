	.include	"global.s"

	;; BANKED:	checked
	.area	_BASE

_move_win::
	LDA	HL,2(SP)	; Skip return address
	LD	A,(HL+)
	LDH	(.WX),A
	LD	A,(HL+)
	LDH	(.WY),A
	RET
