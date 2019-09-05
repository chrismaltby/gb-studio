	nop

	adc	r1,r31
	add	r2,r30
	adiw	r24,54
	and	r4,r29
	andi	r16,253
	asr	r5
	bclr	7
	bld	r6,6
lab1:	nop
	brbc	0,lab1
	brbc	1,lab1
	brbc	2,lab1
	brbc	3,lab1
	brbc	4,lab1
	brbc	5,lab1
	brbc	6,lab1
	brbc	7,lab1
lab2:	brbs	0,lab3
	brbs	1,lab3
	brbs	2,lab3
	brbs	3,lab3
	brbs	4,lab3
	brbs	5,lab3
	brbs	6,lab3
	brbs	7,lab3
lab3:	brcc	lab4
	brcc	lab3
lab4:	brcs	lab5
	brcs	lab4
lab5:	breq	lab6
	breq	lab5
lab6:	brge	lab7
	brge	lab6
lab7:	brhc	lab8
	brhc	lab7
lab8:	brhs	lab9
	brhs	lab8
lab9:	brid	lab10
	brid	lab9
lab10:	brie	lab11
	brie	lab10
lab11:	brlo	lab12
	brlo	lab11
lab12:	brlt	lab13
	brlt	lab12
lab13:	brmi	lab14
	brmi	lab13
lab14:	brne	lab15
	brne	lab14
lab15:	brpl	lab16
	brpl	lab15
lab16:	brsh	lab17
	brsh	lab16
lab17:	brtc	lab18
	brtc	lab17
lab18:	brts	lab19
	brts	lab18
lab19:	brvc	lab20
	brvc	lab19
lab20:	brvs	lab21
	brvs	lab20
lab21:	bset	6
	bst	r7,5
	call	0
	call	lab1
	call	lab22
	nop
lab22:	cbi	$8,4
	
	clc
	clh
	cli
	cln
	cls
	clt
	clv
	clz

	com	r9
	cp	r10,r11
	cpc	r12,r13
	cpi	r16,95
	cpse	r14,r15
	dec	r17
	eor	r18,r19
	icall
	ijmp
	in	r20,9
	inc	r21
	jmp	lab1
	jmp	lab23
	ld	r22,x
	ld	r23,x+
	ld	r24,-x
	ld	r25,y
	ld	r26,y+
	ld	r27,-y
	ldd	r28,y+63
	ld	r29,z
	ld	r30,z+
	ld	r31,-z
	ldd	r0,z+1
	ldi	r17,170
	lds	r1,12345
	lpm
	;elpm
	lsr	r2
	mov	r3,r4
	mul	r5,r6
	neg	r7
	or	r8,r9
	ori	r18,85
	out	9,r10
	pop	r11
	push	r12
	rcall	lab1
	rcall	lab23
	nop
lab23:	ret
	reti
	rjmp	lab23
	rjmp	lab24
	nop
lab24:	ror	r13
	sbc	r14,r15
	sbci	r19,83
	sbi	10,2
	sbic	11,3
	sbis	12,4
	sbiw	r26,60
	sbr	r19,254
	sbrc	r20,5
	sbrs	r21,6
	sec
	seh
	sei
	sen
	ses
	set
	sev
	sez

	ser	r22	
	sleep
	st	x,r23
	st	x+,r24
	st	-x,r25
	st	y,r26
	st	y+,r27
	st	-y,r28
	std	y+34,r29
	st	z,r30
	st	z+,r31
	st	-z,r0
	st	z+35,r1
	sts	$ff00,r2
	sub	r3,r4
	subi	r31,123
	swap	r4
	wdr
	
	nop
a:	jmp	a

	.db	"(c) 1999 Talker Bt."
