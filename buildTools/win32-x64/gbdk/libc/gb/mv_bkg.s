	.include	"global.s"

	;; BANKED:	checked
	.area	_BASE

_move_bkg::
	LDA	HL,2(SP)	; Skip return address
	LD	A,(HL+)
	LDH	(.SCX),A
	LD	A,(HL+)
	LDH	(.SCY),A
2$:
	RET
