;/***************************************************************************
; *                                                                         *
; * Module  : rand.s                                                        *
; *                                                                         *
; * Purpose : A rand() generator using the linear congruential method       *
; *                                                                         *
; * Version : 1.01, January 7 1998                                          *
; *             Added _initrand to set seed without recompiling             *
; *           1, January 6 1998                                             *
; *                                                                         *
; * Author  : Luc Van den Borre ( Homepage : NOC.BASE.ORG )                 *
; *                                                                         *
; **************************************************************************/

	;; BANKED:	checked
	
	;; Why use an algorithm for generating random numbers?
	;;
	;; - Given a certain seed value, the same sequence of random numbers is generated
	;;   every time. This is a good thing when debugging (reproducible). On the other
	;;   hand, you've got 2^16 seed values, each of which will produce a sequence of
	;;   numbers that stays different for any of the other sequences for 'an appreciable
	;;   time.' (I can't say how long exactly.)
	;;
	;; - The linear congruential method is one of the 'best' random number generators
	;;   around. However, this implementation uses a 16 bit accumulator, while at least
	;;   32 bits are needed for a generator that passes all the statistical tests.
	;;   Still, I'm relatively confident that this is random enough for even the most
	;;   demanding game.
	;;
	;;   Compare this to getting random values from one of the hardware registers
	;;   (not reproducible, might not have all values). An array might be the best bet
	;;   if you don't need a lot of values (or have lots of memory spare),
	;;   or if you want values to be within a certain range.
	;;   And both would be faster than this. Also, this definitely isn't the fastest
	;;   algorithm I know, and certainly for games less strict algorithms might be
	;;   appropriate (shift and xor ?).
	;;   It's your choice - but if you're doing Monte Carlo physics simulations on the
	;;   GameBoy, this is a safe bet!

	.include	"global.s"

	.area	_BSS
.randhi::			; Storage for last random number (or seed)
	.ds	0x01
.randlo::
	.ds	0x01

	.area	_CODE

	;; Random number generator using the linear congruential method
	;;  X(n+1) = (a*X(n)+c) mod m
	;; with a = 17, m = 16 and c = $5c93 (arbitrarily)
	;; The seed value is also chosen arbitrarily as $a27e
	;; Ref : D. E. Knuth, "The Art of Computer Programming" , Volume 2
	;;
	;; Exit conditions
	;;   DE = Random number [0,2^16-1]
	;;
	;; Registers used:
	;;   A, HL (need not be saved) and DE (return register)
	;;

_rand::				; Banked
_randw::			; Banked
	LD	A,(.randlo)
	LD	L,A
	LD	E,A		; Save randlo
	LD	A,(.randhi)
	LD	D,A		; Save randhi

	SLA	L		; * 16
	RLA
	SLA	L
	RLA
	SLA	L
	RLA
	SLA	L
	RLA
	LD	H,A		; Save randhi*16

	LD	A,E		; Old randlo
	ADD	A,L		; Add randlo*16
	LD	L,A		; Save randlo*17

	LD	A,H		; randhi*16
	ADC	A,D		; Add old randhi
	LD	H,A		; Save randhi*17

	LD	A,L		; randlo*17
	ADD	A,#0x93
	LD	(.randlo),A
	LD	D,A		; Return register
	LD	A,H		; randhi*17
	ADC	A,#0x5c
	LD	(.randhi),A
	LD	E,A		; Return register

	;; Note D is the low byte,E the high byte. This is intentional because
	;; the high byte can be slightly 'more random' than the low byte, and I presume
	;; most will cast the return value to a UBYTE. As if someone will use this, tha!
	RET

	;; This sets the seed value. Call it whenever you like
	;;
	;; Exit conditions
	;;   None
	;;
	;; Registers used:
	;;   A, HL (need not be saved) and DE (return register)
	;;
	.area	_BASE
_initrand::			; Non banked
	LDA	HL,2(SP)
.initrand::
	LD	A,(HL+)
	LD	(.randlo),A
	LD	A,(HL)
	LD	(.randhi),A
	RET
