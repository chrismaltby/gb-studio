	.area _CODE
_putchar::
	push	ix
	ld	ix,#0
	add	ix,sp

	ld	l,4(ix)
	ld	a,#0
	out	(0xff),a

	pop	ix
	ret
	
			
