	.title	Test of Z80 / HD64180 assembler

	offset	=	0x55		;arbitrary constants
	n	=	0x20
	nn	=	0x0584

	; notes:
	;	Leading 'a' operand is optional.
	;	If offset is ommitted 0 is assumed.

	;***********************************************************
	; add with carry to 'a'
	adc	a,(hl)			;8E
	adc	a,offset(ix)		;DD 8E 55
	adc	a,offset(iy)		;FD 8E 55
	adc	a,a			;8F
	adc	a,b			;88
	adc	a,c			;89
	adc	a,d			;8A
	adc	a,e			;8B
	adc	a,h			;8C
	adc	a,l			;8D
	adc	a,#n			;CE 20
	;***********************************************************
	adc	(hl)			;8E
	adc	offset(ix)		;DD 8E 55
	adc	offset(iy)		;FD 8E 55
	adc	a			;8F
	adc	b			;88
	adc	c			;89
	adc	d			;8A
	adc	e			;8B
	adc	h			;8C
	adc	l			;8D
	adc	#n			;CE 20
	;***********************************************************
	; add with carry register pair to 'hl'
	adc	hl,bc			;ED 4A
	adc	hl,de			;ED 5A
	adc	hl,hl			;ED 6A
	adc	hl,sp			;ED 7A
	;***********************************************************
	; add operand to 'a'
	add	a,(hl)			;86
	add	a,offset(ix)		;DD 86 55
	add	a,offset(iy)		;FD 86 55
	add	a,a			;87
	add	a,b			;80
	add	a,c			;81
	add	a,d			;82
	add	a,e			;83
	add	a,h			;84
	add	a,l			;85
	add	a,#n			;C6 20
	;***********************************************************
	; add register pair to 'hl'
	add	hl,bc			;09
	add	hl,de			;19
	add	hl,hl			;29
	add	hl,sp			;39
	;***********************************************************
	; add register pair to 'ix'
	add	ix,bc			;DD 09
	add	ix,de			;DD 19
	add	ix,ix			;DD 29
	add	ix,sp			;DD 39
	;***********************************************************
	; add register pair to 'iy'
	add	iy,bc			;FD 09
	add	iy,de			;FD 19
	add	iy,iy			;FD 29
	add	iy,sp			;FD 39
	;***********************************************************
	; logical 'and' operand with 'a'
	and	a,(hl)			;A6
	and	a,offset(ix)		;DD A6 55
	and	a,offset(iy)		;FD A6 55
	and	a,a			;A7
	and	a,b			;A0
	and	a,c			;A1
	and	a,d			;A2
	and	a,e			;A3
	and	a,h			;A4
	and	a,l			;A5
	and	a,#n			;E6 20
	;***********************************************************
	; test bit of location or register
	bit	0,(hl)			;CB 46
	bit	0,offset(ix)		;DD CB 55 46
	bit	0,offset(iy)		;FD CB 55 46
	bit	0,a			;CB 47
	bit	0,b			;CB 40
	bit	0,c			;CB 41
	bit	0,d			;CB 42
	bit	0,e			;CB 43
	bit	0,h			;CB 44
	bit	0,l			;CB 45
	bit	1,(hl)			;CB 4E
	bit	1,offset(ix)		;DD CB 55 4E
	bit	1,offset(iy)		;FD CB 55 4E
	bit	1,a			;CB 4F
	bit	1,b			;CB 48
	bit	1,c			;CB 49
	bit	1,d			;CB 4A
	bit	1,e			;CB 4B
	bit	1,h			;CB 4C
	bit	1,l			;CB 4D
	bit	2,(hl)			;CB 56
	bit	2,offset(ix)		;DD CB 55 56
	bit	2,offset(iy)		;FD CB 55 56
	bit	2,a			;CB 57
	bit	2,b			;CB 50
	bit	2,c			;CB 51
	bit	2,d			;CB 52
	bit	2,e			;CB 53
	bit	2,h			;CB 54
	bit	2,l			;CB 55
	bit	3,(hl)			;CB 5E
	bit	3,offset(ix)		;DD CB 55 5E
	bit	3,offset(iy)		;FD CB 55 5E
	bit	3,a			;CB 5F
	bit	3,b			;CB 58
	bit	3,c			;CB 59
	bit	3,d			;CB 5A
	bit	3,e			;CB 5B
	bit	3,h			;CB 5C
	bit	3,l			;CB 5D
	bit	4,(hl)			;CB 66
	bit	4,offset(ix)		;DD CB 55 66
	bit	4,offset(iy)		;FD CB 55 66
	bit	4,a			;CB 67
	bit	4,b			;CB 60
	bit	4,c			;CB 61
	bit	4,d			;CB 62
	bit	4,e			;CB 63
	bit	4,h			;CB 64
	bit	4,l			;CB 65
	bit	5,(hl)			;CB 6E
	bit	5,offset(ix)		;DD CB 55 6E
	bit	5,offset(iy)		;FD CB 55 6E
	bit	5,a			;CB 6F
	bit	5,b			;CB 68
	bit	5,c			;CB 69
	bit	5,d			;CB 6A
	bit	5,e			;CB 6B
	bit	5,h			;CB 6C
	bit	5,l			;CB 6D
	bit	6,(hl)			;CB 76
	bit	6,offset(ix)		;DD CB 55 76
	bit	6,offset(iy)		;FD CB 55 76
	bit	6,a			;CB 77
	bit	6,b			;CB 70
	bit	6,c			;CB 71
	bit	6,d			;CB 72
	bit	6,e			;CB 73
	bit	6,h			;CB 74
	bit	6,l			;CB 75
	bit	7,(hl)			;CB 7E
	bit	7,offset(ix)		;DD CB 55 7E
	bit	7,offset(iy)		;FD CB 55 7E
	bit	7,a			;CB 7F
	bit	7,b			;CB 78
	bit	7,c			;CB 79
	bit	7,d			;CB 7A
	bit	7,e			;CB 7B
	bit	7,h			;CB 7C
	bit	7,l			;CB 7D
	;***********************************************************
	; call subroutine at nn if condition is true
	call	C,nn			;DC 84 05
	call	M,nn			;FC 84 05
	call	NC,nn			;D4 84 05
	call	NZ,nn			;C4 84 05
	call	P,nn			;F4 84 05
	call	PE,nn			;EC 84 05
	call	PO,nn			;E4 84 05
	call	Z,nn			;CC 84 05
	;***********************************************************
	; unconditional call to subroutine at nn
	call	nn			;CD 84 05
	;***********************************************************
	; complement carry flag
	ccf				;3F
	;***********************************************************
	; compare operand with 'a'
	cp	a,(hl)			;BE
	cp	a,offset(ix)		;DD BE 55
	cp	a,offset(iy)		;FD BE 55
	cp	a,a			;BF
	cp	a,b			;B8
	cp	a,c			;B9
	cp	a,d			;BA
	cp	a,e			;BB
	cp	a,h			;BC
	cp	a,l			;BD
	cp	a,#n			;FE 20
	;***********************************************************
	; compare location (hl) and 'a'
	; decrement 'hl' and 'bc'
	cpd				;ED A9
	;***********************************************************
	; compare location (hl) and 'a'
	; decrement 'hl' and 'bc'
	; repeat until 'bc' = 0
	cpdr				;ED B9
	;***********************************************************
	; compare location (hl) and 'a'
	; increment 'hl' and decrement 'bc'
	cpi				;ED A1
	;***********************************************************
	; compare location (hl) and 'a'
	; increment 'hl' and decrement 'bc'
	; repeat until 'bc' = 0
	cpir				;ED B1
	;***********************************************************
	; 1's complement of 'a'
	cpl				;2F
	;***********************************************************
	; decimal adjust 'a'
	daa				;27
	;***********************************************************
	; decrement operand
	dec	(hl)			;35
	dec	offset(ix)		;DD 35 55
	dec	offset(iy)		;FD 35 55
	dec	a			;3D
	dec	b			;05
	dec	bc			;0B
	dec	c			;0D
	dec	d			;15
	dec	de			;1B
	dec	e			;1D
	dec	h			;25
	dec	hl			;2B
	dec	ix			;DD 2B
	dec	iy			;FD 2B
	dec	l			;2D
	dec	sp			;3B
	;***********************************************************
	; disable interrupts
	di				;F3
	;***********************************************************
	; decrement b and jump relative if b # 0
	djnz	.+0x12			;10 10
	;***********************************************************
	; enable interrupts
	ei				;FB
	;***********************************************************
	; exchange location and (sp)
	ex	(sp),hl			;E3
	ex	(sp),ix			;DD E3
	ex	(sp),iy			;FD E3
	;***********************************************************
	; exchange af and af'
	ex	af,af'			;08
	;***********************************************************
	; exchange de and hl
	ex	de,hl			;EB
	;***********************************************************
	; exchange:
	;	bc <-> bc'
	;	de <-> de'
	;	hl <-> hl'
	exx				;D9
	;***********************************************************
	; halt (wait for interrupt or reset)
	halt				;76
	;***********************************************************
	; set interrupt mode
	im	0			;ED 46
	im	1			;ED 56
	im	2			;ED 5E
	;***********************************************************
	; load 'a' with input from device n
	in	a,(n)			;DB 20
	;***********************************************************
	; load register with input from (c)
	in	a,(c)			;ED 78
	in	b,(c)			;ED 40
	in	c,(c)			;ED 48
	in	d,(c)			;ED 50
	in	e,(c)			;ED 58
	in	h,(c)			;ED 60
	in	l,(c)			;ED 68
	;***********************************************************
	; increment operand
	inc	(hl)			;34
	inc	offset(ix)		;DD 34 55
	inc	offset(iy)		;FD 34 55
	inc	a			;3C
	inc	b			;04
	inc	bc			;03
	inc	c			;0C
	inc	d			;14
	inc	de			;13
	inc	e			;1C
	inc	h			;24
	inc	hl			;23
	inc	ix			;DD 23
	inc	iy			;FD 23
	inc	l			;2C
	inc	sp			;33
	;***********************************************************
	; load location (hl) with input
	; from port (c)
	; decrement 'hl' and 'b'
	ind				;ED AA
	;***********************************************************
	; load location (hl) with input
	; from port (c)
	; decrement 'hl' and 'b'
	; repeat until 'b' = 0
	indr				;ED BA
	;***********************************************************
	; load location (hl) with input
	; from port (c)
	; increment 'hl' and decrement 'b'
	ini				;ED A2
	;***********************************************************
	; load location (hl) with input
	; from port (c)
	; increment 'hl' and decrement 'b'
	; repeat until 'b' = 0
	inir				;ED B2
	;***********************************************************
	; unconditional jump to location nn
	jp	nn			;C3 84 05
	jp	(hl)			;E9
	jp	(ix)			;DD E9
	jp	(iy)			;FD E9
	;***********************************************************
	; jump to location if condition is true
	jp	C,nn			;DA 84 05
	jp	M,nn			;FA 84 05
	jp	NC,nn			;D2 84 05
	jp	NZ,nn			;C2 84 05
	jp	P,nn			;F2 84 05
	jp	PE,nn			;EA 84 05
	jp	PO,nn			;E2 84 05
	jp	Z,nn			;CA 84 05
	;***********************************************************
	; unconditional jump relative to PC+e
	jr	jr1+0x10		;18 10
	;***********************************************************
	; jump relative to PC+e if condition is true
jr1:	jr	C,jr2+0x10		;38 10
jr2:	jr	NC,jr3+0x10		;30 10
jr3:	jr	NZ,jr4+0x10		;20 10
jr4:	jr	Z,jr5+0x10		;28 10
jr5:
	;***********************************************************
	; load source to destination
	ld	a,(hl)			;7E
	ld	a,offset(ix)		;DD 7E 55
	ld	a,offset(iy)		;FD 7E 55
	ld	a,a			;7F
	ld	a,b			;78
	ld	a,c			;79
	ld	a,d			;7A
	ld	a,e			;7B
	ld	a,h			;7C
	ld	a,l			;7D
	ld	a,#n			;3E 20
	ld	b,(hl)			;46
	ld	b,offset(ix)		;DD 46 55
	ld	b,offset(iy)		;FD 46 55
	ld	b,a			;47
	ld	b,b			;40
	ld	b,c			;41
	ld	b,d			;42
	ld	b,e			;43
	ld	b,h			;44
	ld	b,l			;45
	ld	b,#n			;06 20
	ld	c,(hl)			;4E
	ld	c,offset(ix)		;DD 4E 55
	ld	c,offset(iy)		;FD 4E 55
	ld	c,a			;4F
	ld	c,b			;48
	ld	c,c			;49
	ld	c,d			;4A
	ld	c,e			;4B
	ld	c,h			;4C
	ld	c,l			;4D
	ld	c,#n			;0E 20
	ld	d,(hl)			;56
	ld	d,offset(ix)		;DD 56 55
	ld	d,offset(iy)		;FD 56 55
	ld	d,a			;57
	ld	d,b			;50
	ld	d,c			;51
	ld	d,d			;52
	ld	d,e			;53
	ld	d,h			;54
	ld	d,l			;55
	ld	d,#n			;16 20
	ld	e,(hl)			;5E
	ld	e,offset(ix)		;DD 5E 55
	ld	e,offset(iy)		;FD 5E 55
	ld	e,a			;5F
	ld	e,b			;58
	ld	e,c			;59
	ld	e,d			;5A
	ld	e,e			;5B
	ld	e,h			;5C
	ld	e,l			;5D
	ld	e,#n			;1E 20
	ld	h,(hl)			;66
	ld	h,offset(ix)		;DD 66 55
	ld	h,offset(iy)		;FD 66 55
	ld	h,a			;67
	ld	h,b			;60
	ld	h,c			;61
	ld	h,d			;62
	ld	h,e			;63
	ld	h,h			;64
	ld	h,l			;65
	ld	h,#n			;26 20
	ld	l,(hl)			;6E
	ld	l,offset(ix)		;DD 6E 55
	ld	l,offset(iy)		;FD 6E 55
	ld	l,a			;6F
	ld	l,b			;68
	ld	l,c			;69
	ld	l,d			;6A
	ld	l,e			;6B
	ld	l,h			;6C
	ld	l,l			;6D
	ld	l,#n			;2E 20
	;***********************************************************
	ld	i,a			;ED 47
	ld	r,a			;ED 4F
	ld	a,i			;ED 57
	ld	a,r			;ED 5F
	;***********************************************************
	ld	(bc),a			;02
	ld	(de),a			;12
	ld	a,(bc)			;0A
	ld	a,(de)			;1A
	;***********************************************************
	ld	(hl),a			;77
	ld	(hl),b			;70
	ld	(hl),c			;71
	ld	(hl),d			;72
	ld	(hl),e			;73
	ld	(hl),h			;74
	ld	(hl),l			;75
	ld	(hl),#n			;36 20
	;***********************************************************
	ld	offset(ix),a		;DD 77 55
	ld	offset(ix),b		;DD 70 55
	ld	offset(ix),c		;DD 71 55
	ld	offset(ix),d		;DD 72 55
	ld	offset(ix),e		;DD 73 55
	ld	offset(ix),h		;DD 74 55
	ld	offset(ix),l		;DD 75 55
	ld	offset(ix),#n		;DD 36 55 20
	;***********************************************************
	ld	offset(iy),a		;FD 77 55
	ld	offset(iy),b		;FD 70 55
	ld	offset(iy),c		;FD 71 55
	ld	offset(iy),d		;FD 72 55
	ld	offset(iy),e		;FD 73 55
	ld	offset(iy),h		;FD 74 55
	ld	offset(iy),l		;FD 75 55
	ld	offset(iy),#n		;FD 36 55 20
	;***********************************************************
	ld	(nn),a			;32 84 05
	ld	(nn),bc			;ED 43 84 05
	ld	(nn),de			;ED 53 84 05
	ld	(nn),hl			;22 84 05
	ld	(nn),sp			;ED 73 84 05
	ld	(nn),ix			;DD 22 84 05
	ld	(nn),iy			;FD 22 84 05
	;***********************************************************
	ld	a,(nn)			;3A 84 05
	ld	bc,(nn)			;ED 4B 84 05
	ld	de,(nn)			;ED 5B 84 05
	ld	hl,(nn)			;2A 84 05
	ld	sp,(nn)			;ED 7B 84 05
	ld	ix,(nn)			;DD 2A 84 05
	ld	iy,(nn)			;FD 2A 84 05
	;***********************************************************
	ld	bc,#nn			;01 84 05
	ld	de,#nn			;11 84 05
	ld	hl,#nn			;21 84 05
	ld	sp,#nn			;31 84 05
	ld	ix,#nn			;DD 21 84 05
	ld	iy,#nn			;FD 21 84 05
	;***********************************************************
	ld	sp,hl			;F9
	ld	sp,ix			;DD F9
	ld	sp,iy			;FD F9
	;***********************************************************
	; load location (hl)
	; with location (de)
	; decrement de, hl
	; decrement bc
	ldd				;ED A8
	;***********************************************************
	; load location (hl)
	; with location (de)
	; decrement de, hl
	; decrement bc
	; repeat until bc = 0
	lddr				;ED B8
	;***********************************************************
	; load location (hl)
	; with location (de)
	; increment de, hl
	; decrement bc
	ldi				;ED A0
	;***********************************************************
	; load location (hl)
	; with location (de)
	; increment de, hl
	; decrement bc
	; repeat until bc = 0
	ldir				;ED B0
	;***********************************************************
	; 2's complement of 'a'
	neg				;ED 44
	;***********************************************************
	; no operation
	nop				;00
	;***********************************************************
	; logical 'or' operand with 'a'
	or	a,(hl)			;B6
	or	a,offset(ix)		;DD B6 55
	or	a,offset(iy)		;FD B6 55
	or	a,a			;B7
	or	a,b			;B0
	or	a,c			;B1
	or	a,d			;B2
	or	a,e			;B3
	or	a,h			;B4
	or	a,l			;B5
	or	a,#n			;F6 20
	;***********************************************************
	; load output port (c)
	; with location (hl)
	; decrement hl and decrement b
	; repeat until b = 0
	otdr				;ED BB
	;***********************************************************
	; load output port (c)
	; with location (hl)
	; increment hl and decrement b
	; repeat until b = 0
	otir				;ED B3
	;***********************************************************
	; load output port (c) with reg
	out	(c),a			;ED 79
	out	(c),b			;ED 41
	out	(c),c			;ED 49
	out	(c),d			;ED 51
	out	(c),e			;ED 59
	out	(c),h			;ED 61
	out	(c),l			;ED 69
	;***********************************************************
	; load output port (n) with 'a'
	out	(n),a			;D3 20
	;***********************************************************
	; load output port (c)
	; with location (hl)
	; decrement hl and decrement b
	outd				;ED AB
	;***********************************************************
	; load output port (c)
	; with location (hl)
	; increment hl and decrement b
	outi				;ED A3
	;***********************************************************
	; load destination with top of stack
	pop	af			;F1
	pop	bc			;C1
	pop	de			;D1
	pop	hl			;E1
	pop	ix			;DD E1
	pop	iy			;FD E1
	;***********************************************************
	; put source on stack
	push	af			;F5
	push	bc			;C5
	push	de			;D5
	push	hl			;E5
	push	ix			;DD E5
	push	iy			;FD E5
	;***********************************************************
	; reset bit of location or register
	res	0,(hl)			;CB 86
	res	0,offset(ix)		;DD CB 55 86
	res	0,offset(iy)		;FD CB 55 86
	res	0,a			;CB 87
	res	0,b			;CB 80
	res	0,c			;CB 81
	res	0,d			;CB 82
	res	0,e			;CB 83
	res	0,h			;CB 84
	res	0,l			;CB 85
	res	1,(hl)			;CB 8E
	res	1,offset(ix)		;DD CB 55 8E
	res	1,offset(iy)		;FD CB 55 8E
	res	1,a			;CB 8F
	res	1,b			;CB 88
	res	1,c			;CB 89
	res	1,d			;CB 8A
	res	1,e			;CB 8B
	res	1,h			;CB 8C
	res	1,l			;CB 8D
	res	2,(hl)			;CB 96
	res	2,offset(ix)		;DD CB 55 96
	res	2,offset(iy)		;FD CB 55 96
	res	2,a			;CB 97
	res	2,b			;CB 90
	res	2,c			;CB 91
	res	2,d			;CB 92
	res	2,e			;CB 93
	res	2,h			;CB 94
	res	2,l			;CB 95
	res	3,(hl)			;CB 9E
	res	3,offset(ix)		;DD CB 55 9E
	res	3,offset(iy)		;FD CB 55 9E
	res	3,a			;CB 9F
	res	3,b			;CB 98
	res	3,c			;CB 99
	res	3,d			;CB 9A
	res	3,e			;CB 9B
	res	3,h			;CB 9C
	res	3,l			;CB 9D
	res	4,(hl)			;CB A6
	res	4,offset(ix)		;DD CB 55 A6
	res	4,offset(iy)		;FD CB 55 A6
	res	4,a			;CB A7
	res	4,b			;CB A0
	res	4,c			;CB A1
	res	4,d			;CB A2
	res	4,e			;CB A3
	res	4,h			;CB A4
	res	4,l			;CB A5
	res	5,(hl)			;CB AE
	res	5,offset(ix)		;DD CB 55 AE
	res	5,offset(iy)		;FD CB 55 AE
	res	5,a			;CB AF
	res	5,b			;CB A8
	res	5,c			;CB A9
	res	5,d			;CB AA
	res	5,e			;CB AB
	res	5,h			;CB AC
	res	5,l			;CB AD
	res	6,(hl)			;CB B6
	res	6,offset(ix)		;DD CB 55 B6
	res	6,offset(iy)		;FD CB 55 B6
	res	6,a			;CB B7
	res	6,b			;CB B0
	res	6,c			;CB B1
	res	6,d			;CB B2
	res	6,e			;CB B3
	res	6,h			;CB B4
	res	6,l			;CB B5
	res	7,(hl)			;CB BE
	res	7,offset(ix)		;DD CB 55 BE
	res	7,offset(iy)		;FD CB 55 BE
	res	7,a			;CB BF
	res	7,b			;CB B8
	res	7,c			;CB B9
	res	7,d			;CB BA
	res	7,e			;CB BB
	res	7,h			;CB BC
	res	7,l			;CB BD
	;***********************************************************
	; return from subroutine
	ret				;C9
	;***********************************************************
	; return from subroutine if condition is true
	ret	C			;D8
	ret	M			;F8
	ret	NC			;D0
	ret	NZ			;C0
	ret	P			;F0
	ret	PE			;E8
	ret	PO			;E0
	ret	Z			;C8
	;***********************************************************
	; return from interrupt
	reti				;ED 4D
	;***********************************************************
	; return from non-maskable interrupt
	retn				;ED 45
	;***********************************************************
	; rotate left through carry
	rl	a,(hl)			;CB 16
	rl	a,offset(ix)		;DD CB 55 16
	rl	a,offset(iy)		;FD CB 55 16
	rl	a,a			;CB 17
	rl	a,b			;CB 10
	rl	a,c			;CB 11
	rl	a,d			;CB 12
	rl	a,e			;CB 13
	rl	a,h			;CB 14
	rl	a,l			;CB 15
	;***********************************************************
	; rotate left 'a' with carry
	rla				;17
	;***********************************************************
	; rotate left circular
	rlc	a,(hl)			;CB 06
	rlc	a,offset(ix)		;DD CB 55 06
	rlc	a,offset(iy)		;FD CB 55 06
	rlc	a,a			;CB 07
	rlc	a,b			;CB 00
	rlc	a,c			;CB 01
	rlc	a,d			;CB 02
	rlc	a,e			;CB 03
	rlc	a,h			;CB 04
	rlc	a,l			;CB 05
	;***********************************************************
	; rotate left 'a' circular
	rlca				;07
	;***********************************************************
	; rotate digit left and right
	; between 'a' and location (hl)
	rld				;ED 6F
	;***********************************************************
	; rotate right through carry
	rr	a,(hl)			;CB 1E
	rr	a,offset(ix)		;DD CB 55 1E
	rr	a,offset(iy)		;FD CB 55 1E
	rr	a,a			;CB 1F
	rr	a,b			;CB 18
	rr	a,c			;CB 19
	rr	a,d			;CB 1A
	rr	a,e			;CB 1B
	rr	a,h			;CB 1C
	rr	a,l			;CB 1D
	;***********************************************************
	; rotate 'a' right with carry
	rra				;1F
	;***********************************************************
	; rotate right circular
	rrc	a,(hl)			;CB 0E
	rrc	a,offset(ix)		;DD CB 55 0E
	rrc	a,offset(iy)		;FD CB 55 0E
	rrc	a,a			;CB 0F
	rrc	a,b			;CB 08
	rrc	a,c			;CB 09
	rrc	a,d			;CB 0A
	rrc	a,e			;CB 0B
	rrc	a,h			;CB 0C
	rrc	a,l			;CB 0D
	;***********************************************************
	; rotate 'a' right circular
	rrca				;0F
	;***********************************************************
	; rotate digit right and left
	; between 'a' and location (hl)
	rrd				;ED 67
	;***********************************************************
	; restart location
	rst	0x00			;C7
	rst	0x08			;CF
	rst	0x10			;D7
	rst	0x18			;DF
	rst	0x20			;E7
	rst	0x28			;EF
	rst	0x30			;F7
	rst	0x38			;FF
	;***********************************************************
	; subtract with carry to 'a'
	sbc	a,(hl)			;9E
	sbc	a,offset(ix)		;DD 9E 55
	sbc	a,offset(iy)		;FD 9E 55
	sbc	a,a			;9F
	sbc	a,b			;98
	sbc	a,c			;99
	sbc	a,d			;9A
	sbc	a,e			;9B
	sbc	a,h			;9C
	sbc	a,l			;9D
	sbc	a,#n			;DE 20
	;***********************************************************
	; add with carry register pair to 'hl'
	sbc	hl,bc			;ED 42
	sbc	hl,de			;ED 52
	sbc	hl,hl			;ED 62
	sbc	hl,sp			;ED 72
	;***********************************************************
	; set carry flag (C=1)
	scf				;37
	;***********************************************************
	; set bit of location or register
	set	0,(hl)			;CB C6
	set	0,offset(ix)		;DD CB 55 C6
	set	0,offset(iy)		;FD CB 55 C6
	set	0,a			;CB C7
	set	0,b			;CB C0
	set	0,c			;CB C1
	set	0,d			;CB C2
	set	0,e			;CB C3
	set	0,h			;CB C4
	set	0,l			;CB C5
	set	1,(hl)			;CB CE
	set	1,offset(ix)		;DD CB 55 CE
	set	1,offset(iy)		;FD CB 55 CE
	set	1,a			;CB CF
	set	1,b			;CB C8
	set	1,c			;CB C9
	set	1,d			;CB CA
	set	1,e			;CB CB
	set	1,h			;CB CC
	set	1,l			;CB CD
	set	2,(hl)			;CB D6
	set	2,offset(ix)		;DD CB 55 D6
	set	2,offset(iy)		;FD CB 55 D6
	set	2,a			;CB D7
	set	2,b			;CB D0
	set	2,c			;CB D1
	set	2,d			;CB D2
	set	2,e			;CB D3
	set	2,h			;CB D4
	set	2,l			;CB D5
	set	3,(hl)			;CB DE
	set	3,offset(ix)		;DD CB 55 DE
	set	3,offset(iy)		;FD CB 55 DE
	set	3,a			;CB DF
	set	3,b			;CB D8
	set	3,c			;CB D9
	set	3,d			;CB DA
	set	3,e			;CB DB
	set	3,h			;CB DC
	set	3,l			;CB DD
	set	4,(hl)			;CB E6
	set	4,offset(ix)		;DD CB 55 E6
	set	4,offset(iy)		;FD CB 55 E6
	set	4,a			;CB E7
	set	4,b			;CB E0
	set	4,c			;CB E1
	set	4,d			;CB E2
	set	4,e			;CB E3
	set	4,h			;CB E4
	set	4,l			;CB E5
	set	5,(hl)			;CB EE
	set	5,offset(ix)		;DD CB 55 EE
	set	5,offset(iy)		;FD CB 55 EE
	set	5,a			;CB EF
	set	5,b			;CB E8
	set	5,c			;CB E9
	set	5,d			;CB EA
	set	5,e			;CB EB
	set	5,h			;CB EC
	set	5,l			;CB ED
	set	6,(hl)			;CB F6
	set	6,offset(ix)		;DD CB 55 F6
	set	6,offset(iy)		;FD CB 55 F6
	set	6,a			;CB F7
	set	6,b			;CB F0
	set	6,c			;CB F1
	set	6,d			;CB F2
	set	6,e			;CB F3
	set	6,h			;CB F4
	set	6,l			;CB F5
	set	7,(hl)			;CB FE
	set	7,offset(ix)		;DD CB 55 FE
	set	7,offset(iy)		;FD CB 55 FE
	set	7,a			;CB FF
	set	7,b			;CB F8
	set	7,c			;CB F9
	set	7,d			;CB FA
	set	7,e			;CB FB
	set	7,h			;CB FC
	set	7,l			;CB FD
	;***********************************************************
	; shift operand left arithmetic
	sla	a,(hl)			;CB 26
	sla	a,offset(ix)		;DD CB 55 26
	sla	a,offset(iy)		;FD CB 55 26
	sla	a,a			;CB 27
	sla	a,b			;CB 20
	sla	a,c			;CB 21
	sla	a,d			;CB 22
	sla	a,e			;CB 23
	sla	a,h			;CB 24
	sla	a,l			;CB 25
	;***********************************************************
	; shift operand right arithmetic
	sra	a,(hl)			;CB 2E
	sra	a,offset(ix)		;DD CB 55 2E
	sra	a,offset(iy)		;FD CB 55 2E
	sra	a,a			;CB 2F
	sra	a,b			;CB 28
	sra	a,c			;CB 29
	sra	a,d			;CB 2A
	sra	a,e			;CB 2B
	sra	a,h			;CB 2C
	sra	a,l			;CB 2D
	;***********************************************************
	; shift operand right logical
	srl	a,(hl)			;CB 3E
	srl	a,offset(ix)		;DD CB 55 3E
	srl	a,offset(iy)		;FD CB 55 3E
	srl	a,a			;CB 3F
	srl	a,b			;CB 38
	srl	a,c			;CB 39
	srl	a,d			;CB 3A
	srl	a,e			;CB 3B
	srl	a,h			;CB 3C
	srl	a,l			;CB 3D
	;***********************************************************
	; subtract operand from 'a'
	sub	a,(hl)			;96
	sub	a,offset(ix)		;DD 96 55
	sub	a,offset(iy)		;FD 96 55
	sub	a,a			;97
	sub	a,b			;90
	sub	a,c			;91
	sub	a,d			;92
	sub	a,e			;93
	sub	a,h			;94
	sub	a,l			;95
	sub	a,#n			;D6 20
	;***********************************************************
	; logical 'xor' operand with 'a'
	xor	a,(hl)			;AE
	xor	a,offset(ix)		;DD AE 55
	xor	a,offset(iy)		;FD AE 55
	xor	a,a			;AF
	xor	a,b			;A8
	xor	a,c			;A9
	xor	a,d			;AA
	xor	a,e			;AB
	xor	a,h			;AC
	xor	a,l			;AD
	xor	a,#n			;EE 20

	.page
	;***********************************************************
	; Hitachi HD64180 Codes
	;***********************************************************

	.hd64

	;***********************************************************
	; load register with input from port (n)
	in0	a,(n)			;ED 38 20
	in0	b,(n)			;ED 00 20
	in0	c,(n)			;ED 08 20
	in0	d,(n)			;ED 10 20
	in0	e,(n)			;ED 18 20
	in0	h,(n)			;ED 20 20
	in0	l,(n)			;ED 28 20
	;***********************************************************
	; multiplication of each half
	; of the specified register pair
	; with the 16-bit result going to
	; the specified register pair
	mlt	bc			;ED 4C
	mlt	de			;ED 5C
	mlt	hl			;ED 6C
	mlt	sp			;ED 7C
	;***********************************************************
	; load output port (c) with
	; location (hl),
	; decrement hl and b
	; decrement c
	otdm				;ED 8B
	;***********************************************************
	; load output port (c) with
	; location (hl),
	; decrement hl and c
	; decrement b
	; repeat until b = 0
	otdmr				;ED 9B
	;***********************************************************
	; load output port (c) with
	; location (hl),
	; increment hl and b
	; decrement c
	otim				;ED 83
	;***********************************************************
	; load output port (c) with
	; location (hl),
	; increment hl and c
	; decrement b
	; repeat until b = 0
	otimr				;ED 93
	;***********************************************************
	; load output port (n) from register
	out0	(n),a			;ED 39 20
	out0	(n),b			;ED 01 20
	out0	(n),c			;ED 09 20
	out0	(n),d			;ED 11 20
	out0	(n),e			;ED 19 20
	out0	(n),h			;ED 21 20
	out0	(n),l			;ED 29 20
	;***********************************************************
	; enter sleep mode
	slp				;ED 76
	;***********************************************************
	; non-destructive'and' with accumulator and specified operand
	tst	a			;ED 3C
	tst	b			;ED 04
	tst	c			;ED 0C
	tst	d			;ED 14
	tst	e			;ED 1C
	tst	h			;ED 24
	tst	l			;ED 2C
	tst	#n			;ED 64 20
	tst	(hl)			;ED 34
	;***********************************************************
	; non-destructive 'and' of n and the contents of port (c)
	tstio	#n			;ED 74 20
	;***********************************************************

