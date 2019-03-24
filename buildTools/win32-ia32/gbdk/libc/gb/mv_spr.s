	.include	"global.s"

	;; BANKED:	checked
	.area	_BASE

	;; Move sprite number C at XY = DE
.mv_sprite::
	LD	HL,#.OAM	; Calculate origin of sprite info
	SLA	C		; Multiply C by 4
	SLA	C
	LD	B,#0x00
	ADD	HL,BC

	LD	A,E		; Set Y
	LD	(HL+),A

	LD	A,D		; Set X
	LD	(HL+),A
	RET

_move_sprite::
	PUSH	BC

	LDA	HL,4(SP)	; Skip return address and registers
	LD	C,(HL)		; C = nb
	INC	HL
	LD	D,(HL)		; D = x
	INC	HL
	LD	E,(HL)		; E = y

	CALL	.mv_sprite

	POP	BC
	RET
