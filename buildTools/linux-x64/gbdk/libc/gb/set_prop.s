	.include	"global.s"

	;; BANKED:	checked, imperfect
	.area	_BASE

	;; Set properties of sprite number C to D
.set_sprite_prop::
	LD	HL,#.OAM+3	; Calculate origin of sprite info

	SLA	C		; Multiply C by 4
	SLA	C
	LD	B,#0x00
	ADD	HL,BC

	LD	A,D		; Set sprite properties
	LD	(HL),A
	RET

_set_sprite_prop::
	PUSH	BC

	LDA	HL,4(SP)	; Skip return address and registers
	LD	C,(HL)		; C = nb
	INC	HL
	LD	D,(HL)		; D = prop

	CALL	.set_sprite_prop

	POP	BC
	RET
