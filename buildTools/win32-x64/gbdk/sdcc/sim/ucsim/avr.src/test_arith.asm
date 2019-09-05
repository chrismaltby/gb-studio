	nop
	clr	r0
	out	$3f,r0
	
;	jmp	t2

	ldi	r16,$12
	mov	r2,r16
	inc	r16
	inc	r2
	ldi	r17,$ff
	inc	r17
	ldi	r18,$7f
	inc	r18
	nop
t1:
	ldi	r16,10		; 10+20
	ldi	r17,20
	add	r16,r17
	in	r0,$3f
	mov	r18,r16
	ldi	r16,127		; 127+10
	ldi	r17,10
	add	r16,r17
	in	r1,$3f
	mov	r19,r16
	ldi	r16,255		; 255+2
	ldi	r17,2
	add	r16,r17
	in	r2,$3f
	mov	r20,r16
	ldi	r16,255		; 255+1
	ldi	r17,1
	add	r16,r17
	in	r3,$3f
	mov	r21,r16
	ldi	r16,10		; 10+6
	ldi	r17,6
	add	r16,r17
	in	r4,$3f
	mov	r22,r16
	nop
	ldi	r16,-10		; -10-20
	ldi	r17,-20
	add	r16,r17
	in	r5,$3f
	mov	r23,r16
	ldi	r16,-120	; -120-30
	ldi	r17,-30
	add	r16,r17
	in	r6,$3f
	mov	r24,r16
	nop
	ldi	r16,254		; 254+1 +0
	ldi	r17,1
	clc
	adc	r16,r17
	in	r7,$3f
	mov	r25,r16
	ldi	r16,254		; 254+1 +1
	sec
	adc	r16,r17
	in	r8,$3f
	mov	r26,r16
	nop
t2:
	ldi	r24,0
	ldi	r25,0
	adiw	r24,20
	ldi	r26,low($0fff)
	ldi	r27,high($0fff)
	adiw	r26,2
	ldi	r28,low($fff0)
	ldi	r29,high($fff0)
	adiw	r28,$f
	adiw	r28,1
done:
	jmp	done
		
copyright:
	.db	"(c) 2000 Talker Bt."
