	.include        "global.s"

	.PAL_01		= 0x00
	.PAL_23		= 0x01
	.PAL_03		= 0x02
	.PAL_12		= 0x03
	.ATTR_BLK	= 0x04
	.ATTR_LIN	= 0x05
	.ATTR_DIV	= 0x06
	.ATTR_CHR	= 0x07
	.SOUND		= 0x08
	.SOU_TRN	= 0x09
	.PAL_SET	= 0x0A
	.PAL_TRN	= 0x0B
	.ATRC_EN	= 0x0C
	.TEST_EN	= 0x0D
	.ICON_EN	= 0x0E
	.DATA_SND	= 0x0F
	.DATA_TRN	= 0x10
	.MLT_REQ	= 0x11
	.JUMP		= 0x12
	.CHR_TRN	= 0x13
	.PCT_TRN	= 0x14
	.ATTR_TRN	= 0x15
	.ATTR_SET	= 0x16
	.MASK_EN	= 0x17
	.OBJ_TRN	= 0x18

	.area   _CODE

	;; Check if running on SGB
	;;   Set A to 0xFF when running on SGB
	;;   Clear A when running on DMG
.sgb_check::
_sgb_check::			; Banked
	LD	HL,#.MLT_REQ_2
	CALL	.sgb_transfer
	CALL	.wait4
	LDH	A,(.P1)
	AND	#0x03
	CP	#0x03
	JR	NZ,.sgb_mode

	LD	A,#0x20		; Controller read (dummy)
	LDH	(.P1),A
	LDH	A,(.P1)
	LDH	A,(.P1)
	CPL
	AND	#0x0F
	SWAP	A
	LD	B,A
	LD	A,#0x30
	LDH	(.P1),A
	LD	A,#0x10
	LDH	(.P1),A
	LDH	A,(.P1)
	LDH	A,(.P1)
	LDH	A,(.P1)
	LDH	A,(.P1)
	LDH	A,(.P1)
	LDH	A,(.P1)
	LD	A,#0x30
	LDH	(.P1),A
	LDH	 A,(.P1)
	AND	#0x03
	CP	#0x03
	JR	NZ,.sgb_mode

.dmg_mode:
;	LD	HL,#.MLT_REQ_1
;	CALL	.sgb_transfer
;	CALL	.wait4
	XOR	A
	RET

.sgb_mode:
	LD	HL,#.MLT_REQ_1
	CALL	.sgb_transfer
	CALL	.wait4
	LD	A,#0xFF
	RET

.sgb_transfer::
	LD	A,(HL)		; Top of command data
	AND	#0x03
	RET	Z
	LD	B,A		; Number of translated packet
	LD	C,#0x00		; Lower part of #FF00
1$:
	PUSH	BC
	XOR	A		; Start to write
	LDH	(C),A
	LD	A,#0x30
	LDH	(C),A
	LD	B,#0x10		; Set counter to transfer 16 byte
2$:	LD	E,#0x08		; Set counter to transfer 8 bit
	LD	A,(HL+)
	LD	D,A

3$:
	BIT	0,D
	LD	A,#0x10		; P14 = high, P15 = low  (output "1")
	JR	NZ,4$
	LD	A,#0x20		; P14 = low,  P15 = high (output "0")
4$:
	LDH	(C),A
	LD	A,#0x30		; P14 = high, P15 = high
	LDH	(C),A
	RR	D		; Shift 1 bit to right
	DEC	E
	JR	NZ,3$

	DEC	B
	JR	NZ,2$
	LD	A,#0x20		; 129th bit "0" output
	LDH	(C),A
	LD	A,#0x30
	LDH	(C),A

	POP	BC
	DEC	B
	RET	Z
	CALL	.wait4		; Software wait for about 4 frames
	JR	1$

.wait4:
	LD	DE,#7000
1$:
	NOP			; 1 +
	NOP			; 1 +
	NOP			; 1 +
	DEC	DE		; 2 +
	LD	A,D		; 1 +
	OR	E		; 1 +
	JR	NZ,1$		; 3 = 10 cycles
	RET

.MLT_REQ_1:
	.byte	.MLT_REQ*8|1,0x00,0x00,0x00,0x00,0x00,0x00,0x00
	.byte	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00
.MLT_REQ_2:
	.byte	.MLT_REQ*8|1,0x01,0x00,0x00,0x00,0x00,0x00,0x00
	.byte	0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00
