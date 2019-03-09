	.include	"global.s"

	;; BANKED:	checked, imperfect
	.area	_BASE

	;; Set sprite number C to tile D
.set_sprite_tile::
	LD	HL,#.OAM+2	; Calculate origin of sprite info

	SLA	C		; Multiply C by 4
	SLA	C
	LD	B,#0x00
	ADD	HL,BC

	LD	A,D		; Set sprite number
	LD	(HL),A
	RET

_set_sprite_tile::
	PUSH	BC

	LDA	HL,4(SP)	; Skip return address and registers
	LD	C,(HL)		; C = nb
	INC	HL
	LD	D,(HL)		; D = tile

	CALL	.set_sprite_tile

	POP	BC
	RET
