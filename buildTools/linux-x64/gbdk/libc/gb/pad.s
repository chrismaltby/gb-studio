	.include	"global.s"

	;; BANKED:	checked
	.area	_BASE

	;; Wait until all buttons have been released
.padup::
_waitpadup::
	PUSH	AF		; Save modified registers
	PUSH	BC
1$:
	LD	B,#0xFF
2$:
	CALL	.jpad
	OR	A		; Have all buttons been released?
	JR	NZ,1$		; Not yet

	DEC	B
	JR	NZ,2$
	POP	BC		; Restore registers
	POP	AF
	RET

	;; Get Keypad Button Status
	;; The following bits are set if pressed:
	;;   0x80 - Start   0x08 - Down
	;;   0x40 - Select  0x04 - Up
	;;   0x20 - B	    0x02 - Left
	;;   0x10 - A	    0x01 - Right
.jpad::
	PUSH	BC		; Save modified registers
	LD	A,#0x20
	LDH	(.P1),A		; Turn on P15

	LDH	A,(.P1)		; Delay
	LDH	A,(.P1)
	CPL
	AND	#0x0F
	SWAP	A
	LD	B,A
	LD	A,#0x10
	LDH	(.P1),A		; Turn on P14
	LDH	A,(.P1)		; Delay
	LDH	A,(.P1)
	LDH	A,(.P1)
	LDH	A,(.P1)
	LDH	A,(.P1)
	LDH	A,(.P1)
	CPL
	AND	#0x0F
	OR	B
	SWAP	A
	LD	B,A
	LD	A,#0x30
	LDH	(.P1),A		; Turn off P14 and P15 (reset joypad)
	LD	A,B
	POP	BC		; Restore registers
	RET

	;; Wait for the key in B to be pressed
.wait_pad::
1$:
	CALL	.jpad		; Read pad
	AND	B		; Compare with mask?
	JR	Z,1$		; Loop if no intersection
	RET

_joypad::
	CALL	.jpad
	LD	E,A		; Return result in DE
	RET

_waitpad::
	PUSH	BC
	LDA	HL,4(SP)	; Skip return address and registers
	LD	B,(HL)
	CALL	.wait_pad
	LD	E,A		; Return result in DE
	POP	BC
	RET
