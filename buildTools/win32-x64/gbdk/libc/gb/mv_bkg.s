	.include	"global.s"

	.area	_CODE

_move_bkg::
	LDA	HL,2(SP)	; Skip return address
	LD	A,(HL+)
	LDH	(.SCX),A
	LD	A,(HL+)
	LDH	(.SCY),A
2$:
	RET
