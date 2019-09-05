	nop
	jmp	skip
	nop
skip:
	ldi	r16,12
	ldi	r17,13
	cpse	r16,r17
	inc	r16
	cpse	r16,r17
	inc	r16
	inc	r16
	nop
	nop
	ldi	r16,0
	sbrc	r16,0
	nop
	sbrc	r16,1
	jmp	0
	sbrs	r16,2
	ldi	r16,$ff
	sbrs	r16,7
	nop
	sbrs	r16,6
	jmp	0
	nop	
t0:
;	rjmp	-$100
	bclr	0
	brbs	0,b0_1
	brbc	0,b0_1
	nop
b2_0:
	nop
b1_0:
	bclr	1
	brbs	1,b1_1
	brbc	1,b1_1
	nop
b0_1:
	bset	0
	brbc	0,b1_0
	brbs	0,b1_0
	nop
b1_1:
	bset	1
	brbc	1,b2_0
	brbs	1,b2_0
	nop
t1:
	ldi	r30,low(t11)
	ldi	r31,high(t11)
	ijmp
	nop
t11:
	rjmp	t2
	nop
t2:
	rjmp	t0
	nop

copyright:
	.db	"(c) 2000 talker Bt."
