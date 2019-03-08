	;; Implementation of some string functions in
	;; assembler.

	;; Why - because I want a better dhrystone score :)

; char *strcpy(char *dest, const char *source)
_strcpy::
	push	bc
	push	de
	push	ix
	ld	ix,#0
	add	ix,sp
	ld	e,8(ix)
	ld	d,9(ix)
	ld	l,10(ix)
	ld	h,11(ix)
	xor	a,a
	push	de
1$:
	cp	(hl)
;	ld	a,(hl)
	ldi
;	ld	(hl),a
;	inc	hl
;	inc	de
;	or	a,a
	jp	nz,1$

	pop	hl
	pop	ix
	pop	de
	pop	bc
	ret

; void *memcpy(void *dest, const void *source, int count)
_memcpy::
	push	de
	push	bc
	ld	hl,#6
	add	hl,sp
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl)
	ex	af,af'
	inc	hl
	ld	a,(hl)
	inc	hl
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
	ld	h,a
	ex	af,af'
	ld	l,a

	push	de

	ldir

	pop	hl
	pop	bc
	pop	de
	ret

; int strcmp(const char *s1, const char *s2) 
_strcmp::
	push	de
	push	ix
	ld	ix,#0
	add	ix,sp
	ld	e,6(ix)
	ld	d,7(ix)
	ld	l,8(ix)
	ld	h,9(ix)

	jp	1$
2$:	
	ld	a,(de)
	sub	(hl)
	jr	nz,4$
	;; A == 0
	cp	(hl)
	jr	z,3$
1$:	
	inc	de
	inc	hl
	jp	2$

3$:
	ld	hl,#0
	jp	5$
4$:
	ld	hl,#1
	jp	nc,5$
	ld	hl,#-1
5$:
	pop	ix
	pop	de
	ret
	