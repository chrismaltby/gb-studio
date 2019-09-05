;X	=	0x001a
;XL	=	0x001a
;XH	=	0x001b
;Y	=	0x001c
;YL	=	0x001c
;YH	=	0x001d
;Z	=	0x001e
;ZL	=	0x001e
.equ	ZH	=$1f

	jmp	t42
	
	ldi	r16,0
	ldi	r16,16
	ldi	r17,0
	ldi	r17,17
	ldi	r30,0
	ldi	r30,30
	ldi	r30,255
t1:
	ldi	r30,low(copyright)
	ldi	r31,high(copyright)
	lpm
	ldi	r30,low(copyright+1)
	ldi	r31,high(copyright+1)
	lpm
t2:
	ldi	r31,0
	ldi	r30,100
	ldi	r16,$65
	std	z+1,r16
	std	z+63,r16
	ldd	r1,z+1
	ldd	r2,z+63
t21:
	ldi	r31,0
	ldi	r30,255
	ldi	r18,88
	std	z,r18
	ld	r6,z+
	ld	r7,-z
t3:
	ldi	r29,0
	ldi	r28,100
	ldi	r17,$45
	std	y+2,r17
	std	y+62,r17
	ldd	r3,y+2
	ldd	r4,y+62
t31:
	ldi	r29,0
	ldi	r28,255
	ldi	r19,$55
	std	y,r19
	ld	r8,y+
	ld	r9,-y
t32:
	ldi	r27,0
	ldi	r26,255
	ldi	r19,$70
	st	x,r19
	ld	r20,x
	ld	r10,x+
	ld	r11,-x
t4:
	ldi	r31,0
	ldi	r30,255
	ldi	r16,66
	ldi	r17,77
	st	z+,r16
	st	-z,r17
t41:
	ldi	r29,0
	ldi	r28,255
	ldi	r18,88
	ldi	r19,99
	st	y+,r18
	st	-y,r19
t42:
	ldi	r27,0
	ldi	r26,255
	ldi	r20,22
	ldi	r21,11
	st	x+,r20
	st	-x,r21

	lds	r5,162
	sts	161,r5

	nop
	
copyright:
	.db	"(c) 2000 Talker Bt."
