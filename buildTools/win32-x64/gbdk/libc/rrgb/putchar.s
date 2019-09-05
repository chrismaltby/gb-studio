	.area _CODE
_putchar::
	lda	hl,2(sp)
	ld	l,(hl)
	ld	a,#0
	rst	0x00
	ret
	
.if 0
_putchar::
	push	ix
	ld	ix,#0
	add	ix,sp

	ld	l,4(ix)
	ld	a,#0
	out	(0xff),a

	pop	ix
	ret
.endif
			
