	.include	"global.s"

	.globl	.copy_vram

	;; BANKED:	checked
	.area	_BASE

_set_bkg_data::
_set_win_data::
	LDH	A,(.LCDC)
	BIT	4,A
	JP	NZ,_set_sprite_data

	PUSH	BC

	LDA	HL,7(SP)	; Skip return address and registers
	LD	B,(HL)		; BC = data
	DEC	HL
	LD	C,(HL)
	DEC	HL
	LD	E,(HL)		; E = nb_tiles
	DEC	HL
	LD	L,(HL)		; L = first_tile
	PUSH	HL

	XOR	A
	OR	E		; Is nb_tiles == 0?
	JR	NZ,1$
	LD	DE,#0x1000	; DE = nb_tiles = 256
	JR	2$
1$:
	LD	H,#0x00		; HL = nb_tiles
	LD	L,E
	ADD	HL,HL		; HL *= 16
	ADD	HL,HL
	ADD	HL,HL
	ADD	HL,HL
	LD	D,H		; DE = nb_tiles
	LD	E,L
2$:
	POP	HL		; HL = first_tile
	LD	A,L
	RLCA			; Sign extend (patterns have signed numbers)
	SBC	A
	LD	H,A
	ADD	HL,HL		; HL *= 16
	ADD	HL,HL
	ADD	HL,HL
	ADD	HL,HL

	PUSH	BC
	LD	BC,#0x9000
	ADD	HL,BC
	POP	BC

3$:				; Special version of '.copy_vram'
	BIT	3,H		; Bigger than 0x9800
	JR	Z,4$
	BIT	4,H
	JR	Z,4$
	RES	4,H		; Switch to 0x8800
4$:
	LDH	A,(.STAT)
	AND	#0x02
	JR	NZ,4$

	LD	A,(BC)
	LD	(HL+),A
	INC	BC
	DEC	DE
	LD	A,D
	OR	E
	JR	NZ,3$

	POP	BC
	RET

_set_sprite_data::
	PUSH	BC

	LDA	HL,7(SP)	; Skip return address and registers
	LD	B,(HL)		; BC = data
	DEC	HL
	LD	C,(HL)
	DEC	HL
	LD	E,(HL)		; E = nb_tiles
	DEC	HL
	LD	L,(HL)		; L = first_tile
	PUSH	HL

	XOR	A
	OR	E		; Is nb_tiles == 0?
	JR	NZ,1$
	LD	DE,#0x1000	; DE = nb_tiles = 256
	JR	2$
1$:
	LD	H,#0x00		; HL = nb_tiles
	LD	L,E
	ADD	HL,HL		; HL *= 16
	ADD	HL,HL
	ADD	HL,HL
	ADD	HL,HL
	LD	D,H		; DE = nb_tiles
	LD	E,L
2$:
	POP	HL		; HL = first_tile
	LD	H,#0x00
	ADD	HL,HL		; HL *= 16
	ADD	HL,HL
	ADD	HL,HL
	ADD	HL,HL

	PUSH	BC
	LD	BC,#0x8000
	ADD	HL,BC
	POP	BC

	CALL	.copy_vram

	POP	BC
	RET
