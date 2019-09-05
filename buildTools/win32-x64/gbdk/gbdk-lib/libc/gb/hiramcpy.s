	.include	"global.s"

	;; BANKED:	checked
	.area	_BASE

	;; Copy memory zone to HIRAM
	;; 
	;; Entry conditions
	;;   C = destination
	;;   B = length
	;;   HL = source
	;; 
	;; Register used: AF, BC, HL
.hiramcpy::
1$:
	LD	A,(HL+)
	LDH	(C),A
	INC	C
	DEC	B
	JR	NZ,1$
	RET

_hiramcpy::
	PUSH	BC

	LDA	HL,4(SP)	; Skip return address and registers
	LD	C,(HL)		; C = dst
	LDA	HL,7(SP)
	LD	B,(HL)		; B = n
	DEC	HL
	LD	A,(HL-)		; HL = src
	LD	L,(HL)
	LD	H,A
	CALL	.hiramcpy

	POP	BC
	RET
