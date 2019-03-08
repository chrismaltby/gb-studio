	.include        "global.s"

	;; BANKED:	checked
	.area	_BASE

	;; Store window tile table into (BC) at xy = DE of size WH = HL
	;; WH >= (1,1)
.get_xy_wtt::
	PUSH	HL		; Store WH
	PUSH	HL		; Store WH
	LDH	A,(.LCDC)
	BIT	6,A
	JR	NZ,1$
	LD	HL,#0x9800	; HL = origin
	JR	.get_xy_tt
1$:
	LD	HL,#0x9C00	; HL = origin
	JR	.get_xy_tt
	;; Store background tile table into (BC) at XY = DE of size WH = HL
	;; WH >= (1,1)
.get_xy_btt::
	PUSH	HL		; Store WH
	LDH	A,(.LCDC)
	BIT	3,A
	JR	NZ,1$
	LD	HL,#0x9800	; HL = origin
	JR	.get_xy_tt
1$:
	LD	HL,#0x9C00	; HL = origin
;	JR	.get_xy_tt

.get_xy_tt::
	PUSH	BC		; Store source
	XOR	A
	OR	E
	JR	Z,2$

	LD	BC,#0x20	; One line is 20 tiles
1$:
	ADD	HL,BC		; Y coordinate
	DEC	E
	JR	NZ,1$
2$:
	LD	B,#0x00		; X coordinate
	LD	C,D
	ADD	HL,BC

	POP	BC		; BC = source
	POP	DE		; DE = WH
	PUSH	HL		; Store origin
	PUSH	DE		; Store WH
3$:
	LDH	A,(.STAT)
	AND	#0x02
	JR	NZ,3$

	LD	A,(HL+)		; Copy W tiles
	LD	(BC),A
	INC	BC
	DEC	D
	JR	NZ,3$
	POP	HL		; HL = WH
	LD	D,H		; Restore D = W
	POP	HL		; HL = origin
	DEC	E
	JR	Z,4$

	PUSH	BC		; Next line
	LD	BC,#0x20	; One line is 20 tiles
	ADD	HL,BC
	POP	BC

	PUSH	HL		; Store current origin
	PUSH	DE		; Store WH
	JR	3$
4$:
	RET

_get_tiles::
	PUSH	BC

	LDA	HL,11(SP)	; Skip return address and registers
	LD	D,(HL)		; DE = src
	DEC	HL
	LD	E,(HL)
	DEC	HL
	LD	B,(HL)		; BC = dst
	DEC	HL
	LD	C,(HL)
	LDA	HL,4(SP)	; Skip return address and registers
	PUSH	DE		; Store address on stack for set_xy_tt
	LD	D,(HL)		; D = x
	INC	HL
	LD	E,(HL)		; E = y
	INC	HL
	LD	A,(HL+)		; A = w
	LD	L,(HL)		; L = h
	LD	H,A		; H = w

	CALL	.get_xy_tt

	POP	BC
	RET
