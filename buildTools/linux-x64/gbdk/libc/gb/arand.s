;/***************************************************************************
; *                                                                         *
; * Module  : arand.s                                                       *
; *                                                                         *
; * Purpose : A random number generator using the lagged additive method    *
; *                                                                         *
; * Version : 1, January 11 1998                                            *
; *                                                                         *
; * Author  : Luc Van den Borre ( Homepage : NOC.BASE.ORG )                 *
; *                                                                         *
; **************************************************************************/

	;; BANKED: checked
	.include	"global.s"

	.globl	.initrand
	.globl	_rand

	.area	_BSS
.randarr:
	.ds	55
.raxj:
	.ds	0x01
.raxk:
	.ds	0x01

	.area	_CODE

	;; arand() operates on an array of 55 arbitrary values (here : bytes).
	;; It adds two values of the array together, replaces one of the values
	;; with the result, and returns the result.
	;; At start, the indices into the array refer to the 55th and 24th element.
	;; After each call, each index is decreased, and looped around if necessary.
	;; This kind of works, but the values produces are less good than those by
	;; rand(), mainly because it operates on bytes instead of words.
	;; Ref : D. E. Knuth, "The Art of Computer Programming" , Volume 2
	;;
	;; Exit conditions
	;;   DE = Random number (byte!)
	;;
	;; Registers used:
	;;   all
	;;
_arand::			; Banked
	PUSH	BC
	LD	D,#0
	LD	HL,#.randarr-1
	LD	A,(.raxj)
	LD	E,A
	DEC	A		; Decrease the pointer
	JR	NZ,1$
	LD	A,#55
1$:
	LD	(.raxj),A
	ADD	HL,DE
	LD	B,(HL)

	LD	HL,#.randarr-1	; Ooh...
	LD	A,(.raxk)
	LD	E,A
	DEC	A		; Decrease the pointer
	JR	NZ,2$
	LD	A,#55
2$:
	LD	(.raxk),A
	ADD	HL,DE
	LD	A,(HL)

	ADD	A,B
	LD	(HL),A		; Store new value

	POP	BC

	LD	D,#0
	LD	E,A

	RET

	;; _initarand calls the _rand function to fill the array with random values
	;; Note that this also sets the seed value of the _rand function first,
	;; like _initrand
	;;
	;; Exit conditions
	;;   None
	;;
	;; Registers used:
	;;   all
	;;
_initarand::			; Banked
	LDA	HL,.BANKOV(SP)
	CALL	.initrand

	PUSH	BC
	LD	A,#55
	LD	HL,#.randarr
1$:
	DEC	A
	LD	(.raxj),A
	LD	B,H
	LD	C,L
	CALL	_rand
	LD	H,B
	LD	L,C

	LD	(HL),D
	INC	HL
	LD	(HL),E
	INC	HL
	
	LD	A,(.raxj)
	CP	#0
	JR	NZ,1$

	LD	A,#24		; Now the array has been filled,set the pointers
	LD	(.raxj),A
	LD	A,#55
	LD	(.raxk),A

	POP	BC
	RET
