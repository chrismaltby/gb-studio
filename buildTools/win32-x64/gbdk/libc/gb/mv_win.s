	.include	"global.s"

	.area	_CODE

_move_win::
	LDA	HL,2(SP)	; Skip return address
	LD	A,(HL+)
	LDH	(.WX),A
	LD	A,(HL+)
	LDH	(.WY),A
	RET
