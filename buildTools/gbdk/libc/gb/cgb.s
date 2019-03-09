	.include "global.s"

	.title	"CGB support"
	.module	CGB

	;; BANKED: checked, imperfect
	.area	_BASE

_set_bkg_palette::		; Non-banked
	PUSH	BC
	PUSH	DE

	LDA	HL,9(SP)	; Skip return address and registers
	LD	B,(HL)		; BC = rgb_data
	DEC	HL
	LD	C,(HL)
	DEC	HL
	LD	D,(HL)		; D = nb_palettes
	DEC	HL
	LD	E,(HL)		; E = first_palette

	LD	A,D		; A = nb_palettes
	ADD	E
	ADD	A		; A *= 8
	ADD	A
	ADD	A
	LD	D,A

        LD      A,E		; E = first_palette
	ADD	A		; A *= 8
	ADD	A
	ADD	A
	LD	E,A		; A = first BCPS data
1$:
	LDH	A,(.STAT)
	AND	#0x02
	JR	NZ,1$

	LD	A,E
	LDH	(.BCPS),A
	LD	A,(BC)
	LDH	(.BCPD),A
	INC	BC		; next rgb_data
	INC	E		; next BCPS
	LD	A,E
	CP	A,D
	JR	NZ,1$

	POP	DE
	POP	BC
	RET

_set_sprite_palette::		; Non-banked
	PUSH	BC
	PUSH	DE

	LDA	HL,9(SP)	; Skip return address and registers
	LD	B,(HL)		; BC = rgb_data
	DEC	HL
	LD	C,(HL)
	DEC	HL
	LD	D,(HL)		; D = nb_palettes
	DEC	HL
	LD	E,(HL)		; E = first_palette

	LD	A,D		; A = nb_palettes
	ADD	E
	ADD	A		; A *= 8
	ADD	A
	ADD	A
	LD	D,A

        LD      A,E		; E = first_palette
	ADD	A		; A *= 8
	ADD	A
	ADD	A
	LD	E,A		; A = first BCPS data
1$:
	LDH	A,(.STAT)
	AND	#0x02
	JR	NZ,1$

	LD	A,E
	LDH	(.OCPS),A
	LD	A,(BC)
	LDH	(.OCPD),A
	INC	BC		; next rgb_data
	INC	E		; next BCPS
	LD	A,E
	CP	A,D
	JR	NZ,1$

	POP	DE
	POP	BC
	RET

	.area	_CODE
_set_bkg_palette_entry::	; Banked
	PUSH	BC
	PUSH	DE

	LDA	HL,.BANKOV+4+3(SP); Skip return address and registers
	LD	B,(HL)		; BC = rgb_data
	DEC	HL
	LD	C,(HL)
	DEC	HL
	LD	D,(HL)		; D = pal_entry
	DEC	HL
	LD	E,(HL)		; E = first_palette

        LD      A,E		; E = first_palette
	ADD	A		; A *= 8
	ADD	A
	ADD	A
	ADD	D		; A += 2 * pal_entry
	ADD	D
	LD	E,A		; A = first BCPS data

1$:
	LDH	A,(.STAT)
	AND	#0x02
	JR	NZ,1$

	LD	A,E
	LDH	(.BCPS),A
	LD	A,C
	LDH	(.BCPD),A
	INC	E		; next BCPS

	LD	A,E
	LDH	(.BCPS),A
	LD	A,B
	LDH	(.BCPD),A

	POP	DE
	POP	BC
	RET

_set_sprite_palette_entry::
	PUSH	BC
	PUSH	DE

	LDA	HL,.BANKOV+4+3(SP); Skip return address and registers
	LD	B,(HL)		; BC = rgb_data
	DEC	HL
	LD	C,(HL)
	DEC	HL
	LD	D,(HL)		; D = pal_entry
	DEC	HL
	LD	E,(HL)		; E = first_palette

        LD      A,E		; E = first_palette
	ADD	A		; A *= 8
	ADD	A
	ADD	A
	ADD	D		; A += 2 * pal_entry
	ADD	D
	LD	E,A		; A = first BCPS data

1$:
	LDH	A,(.STAT)
	AND	#0x02
	JR	NZ,1$

	LD	A,E
	LDH	(.OCPS),A
	LD	A,C
	LDH	(.OCPD),A
	INC	E		; next BCPS

	LD	A,E
	LDH	(.OCPS),A
	LD	A,B
	LDH	(.OCPD),A

	POP	DE
	POP	BC
	RET

	.area	_CODE
_cpu_slow::			; Banked
	LDH	A,(.KEY1)
	AND	#0x80		; Is GBC in double speed mode?
	RET	Z		; No, already in single speed

shift_speed:
	LDH	A,(.IE)
	PUSH	AF

	XOR	A		; A = 0
	LDH	(.IE),A		; Disable interrupts
	LDH	(.IF),A

	LD	A,#0x30
	LDH	(.P1),A

	LD	A,#0x01
	LDH	(.KEY1),A

	STOP

	POP	AF
	LDH	(.IE),A

	RET

_cpu_fast::			; Banked
	LDH	A,(.KEY1)
	AND	#0x80		; Is GBC in double speed mode?
	RET	NZ		; Yes, exit
        JR	shift_speed


_cgb_compatibility::		; Banked

	LD	A,#0x80
	LDH	(.BCPS),A	; Set default bkg palette
	LD	A,#0xff		; White
	LDH	(.BCPD),A
	LD	A,#0x7f
	LDH	(.BCPD),A
	LD	A,#0xb5		; Light gray
	LDH	(.BCPD),A
	LD	A,#0x56
	LDH	(.BCPD),A
	LD	A,#0x4a		; Dark gray
	LDH	(.BCPD),A
	LD	A,#0x29
	LDH	(.BCPD),A
	LD	A,#0x00		; Black
	LDH	(.BCPD),A
	LD	A,#0x00
	LDH	(.BCPD),A

	LD	A,#0x80
	LDH	(.OCPS),A	; Set default sprite palette
	LD	A,#0xff		; White
	LDH	(.OCPD),A
	LD	A,#0x7f
	LDH	(.OCPD),A
	LD	A,#0xb5		; Light gray
	LDH	(.OCPD),A
	LD	A,#0x56
	LDH	(.OCPD),A
	LD	A,#0x4a		; Dark gray
	LDH	(.OCPD),A
	LD	A,#0x29
	LDH	(.OCPD),A
	LD	A,#0x00		; Black
	LDH	(.OCPD),A
	LD	A,#0x00
	LDH	(.OCPD),A

	RET
