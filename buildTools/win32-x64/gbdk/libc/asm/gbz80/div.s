	;; Originally from GBDK by Pascal Felber.
	.area	_CODE

__divschar_rrx_s::       
        ld      hl,#2+1
        add     hl,sp
        
        ld      e,(hl)
        dec     hl
        ld      l,(hl)
        
        ;; Fall through
__divschar_rrx_hds::
        ld      c,l
        
        call    .div8

	ld	e,c
        ld      d,b
        	
	ret
	
__modschar_rrx_s::       
        ld      hl,#2+1
        add     hl,sp
        
        ld      e,(hl)
        dec     hl
        ld      l,(hl)
        
        ;; Fall through
__modschar_rrx_hds::
        ld      c,l

       	call	.div8

        ;; Already in DE
        
	ret

__divsint_rrx_s::        
        ld      hl,#2+3
        add     hl,sp
        
        ld      d,(hl)
        dec     hl
        ld      e,(hl)
        dec     hl
        ld      a,(hl)
        dec     hl
        ld      l,(hl)
        ld      h,a
        
        ;; Fall through
__divsint_rrx_hds::
	ld	b,h
	ld	c,l

	call	.div16

	ld	e,c
	ld	d,b
	
	ret
	
__modsint_rrx_s::
        ld      hl,#2+3
        add     hl,sp
        
        ld      d,(hl)
        dec     hl
        ld      e,(hl)
        dec     hl
        ld      a,(hl)
        dec     hl
        ld      l,(hl)
        ld      h,a

        ;; Fall through
__modsint_rrx_hds::
	ld	b,h
	ld	c,l

	call	.div16

        ;; Already in DE
	
	ret

	;; Unsigned
__divuchar_rrx_s::       
        ld      hl,#2+1
        add     hl,sp
        
        ld      e,(hl)
        dec     hl
        ld      l,(hl)
        
        ;; Fall through
__divuchar_rrx_hds::
        ld      c,l
	call	.divu8

	ld	e,c
        ld      d,b
        
	ret
	
__moduchar_rrx_s::       
        ld      hl,#2+1
        add     hl,sp
        
        ld      e,(hl)
        dec     hl
        ld      l,(hl)
        
        ;; Fall through
__moduchar_rrx_hds::
        ld      c,l
	call	.divu8

        ;; Already in DE

        ret

__divuint_rrx_s::                
        ld      hl,#2+3
        add     hl,sp
        
        ld      d,(hl)
        dec     hl
        ld      e,(hl)
        dec     hl
        ld      a,(hl)
        dec     hl
        ld      l,(hl)
        ld      h,a

        ;; Fall through
__divuint_rrx_hds::
	ld	b,h
	ld	c,l
	call	.divu16

	ld	e,c
	ld	d,b
	
	ret
	
__moduint_rrx_s::                
        ld      hl,#2+3
        add     hl,sp
        
        ld      d,(hl)
        dec     hl
        ld      e,(hl)
        dec     hl
        ld      a,(hl)
        dec     hl
        ld      l,(hl)
        ld      h,a
        ;; Fall through
        
__moduint_rrx_hds::
	ld	b,h
	ld	c,l

	call	.divu16

        ;; Already in DE
	
	ret
	
.div8::
.mod8::
	LD	A,C		; Sign extend
	RLCA
	SBC	A
	LD	B,A
	LD	A,E		; Sign extend
	RLCA
	SBC	A
	LD	D,A

	; Fall through to .div16
	
	;; 16-bit division
	;; 
	;; Entry conditions
	;;   BC = dividend
	;;   DE = divisor
	;; 
	;; Exit conditions
	;;   BC = quotient
	;;   DE = remainder
	;;   If divisor is non-zero, carry=0
	;;   If divisor is 0, carry=1 and both quotient and remainder are 0
	;;
	;; Register used: AF,BC,DE,HL
.div16::
.mod16::
	;; Determine sign of quotient by xor-ing high bytes of dividend
	;;  and divisor. Quotient is positive if signs are the same, negative
	;;  if signs are different
	;; Remainder has same sign as dividend
	LD	A,B		; Get high byte of dividend
	LD	(.srem),A	; Save as sign of remainder
	XOR	D		; Xor with high byte of divisor
	LD	(.squot),A	; Save sign of quotient
	;; Take absolute value of divisor
	BIT	7,D
	JR	Z,.chkde	; Jump if divisor is positive
	SUB	A		; Substract divisor from 0
	SUB	E
	LD	E,A
	SBC	A		; Propagate borrow (A=0xFF if borrow)
	SUB	D
	LD	D,A
	;; Take absolute value of dividend
.chkde:
	BIT	7,B
	JR	Z,.dodiv	; Jump if dividend is positive
	SUB	A		; Substract dividend from 0
	SUB	C
	LD	C,A
	SBC	A		; Propagate borrow (A=0xFF if borrow)
	SUB	B
	LD	B,A
	;; Divide absolute values
.dodiv:
	CALL	.divu16
	RET	C		; Exit if divide by zero
	;; Negate quotient if it is negative
	LD	A,(.squot)
	AND	#0x80
	JR	Z,.dorem	; Jump if quotient is positive
	SUB	A		; Substract quotient from 0
	SUB	C
	LD	C,A
	SBC	A		; Propagate borrow (A=0xFF if borrow)
	SUB	B
	LD	B,A
.dorem:
	;; Negate remainder if it is negative
	LD	A,(.srem)
	AND	#0x80
	RET	Z		; Return if remainder is positive
	SUB	A		; Substract remainder from 0
	SUB	E
	LD	E,A
	SBC	A		; Propagate remainder (A=0xFF if borrow)
	SUB	D
	LD	D,A
	RET

.divu8::
.modu8::
	LD	B,#0x00
	LD	D,B
	; Fall through to divu16

.divu16::
.modu16::
	;; Check for division by zero
	LD	A,E
	OR	D
	JR	NZ,.divide	; Branch if divisor is non-zero
	LD	BC,#0x00	; Divide by zero error
	LD	D,B
	LD	E,C
	SCF			; Set carry, invalid result
	RET
.divide:
	LD	L,C		; L = low byte of dividend/quotient
	LD	H,B		; H = high byte of dividend/quotient
	LD	BC,#0x00	; BC = remainder
	OR	A		; Clear carry to start
	LD	A,#16		; 16 bits in dividend
.dvloop:
	;; Shift next bit of quotient into bit 0 of dividend
	;; Shift next MSB of dividend into LSB of remainder
	;; BC holds both dividend and quotient. While we shift a bit from
	;;  MSB of dividend, we shift next bit of quotient in from carry
	;; HL holds remainder
	;; Do a 32-bit left shift, shifting carry to L, L to H,
	;;  H to C, C to B
	LD	(.dcnt),A
	RL	L		; Carry (next bit of quotient) to bit 0
	RL	H		; Shift remaining bytes
	RL	C
	RL	B		; Clears carry since BC was 0
	;; If remainder is >= divisor, next bit of quotient is 1. This
	;;  bit goes to carry
	PUSH	BC		; Save current remainder
	LD	A,C		; Substract divisor from remainder
	SBC	E
	LD	C,A
	LD	A,B
	SBC	D
	LD	B,A
	CCF			; Complement borrow so 1 indicates a
				;  successful substraction (this is the
				;  next bit of quotient)
	JR	C,.drop		; Jump if remainder is >= dividend
	POP	BC		; Otherwise, restore remainder
	JR	.nodrop
.drop:
	INC	SP
	INC	SP
.nodrop:
	LD	A,(.dcnt)
	DEC	A		; DEC does not affect carry flag
	JR	NZ,.dvloop
	;; Shift last carry bit into quotient
	LD	D,B		; DE = remainder
	LD	E,C
	RL	L		; Carry to L
	LD	C,L		; C = low byte of quotient
	RL	H
	LD	B,H		; B = high byte of quotient
	OR	A		; Clear carry, valid result
	RET

	.area	_BSS

.srem:
	.ds 0x01		; Sign of quotient
.squot:
	.ds 0x01		; Sign of remainder
.dcnt:
	.ds 0x01		; Counter for division
