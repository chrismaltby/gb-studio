	;; Implementation of some string functions in
	;; assembler.

	;; Why - because I want a better dhrystone score :)

; char *strcpy(char *dest, const char *source)
_strcpy::
	lda	hl,2(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a

	push	de
1$:	
	ld	a,(hl+)
	ld	(de),a
	inc	de
	or	a,a
	jr	nz,1$

	pop	de
	ret

; void *memcpy(void *dest, const void *source, int count)
_memcpy::
	push	bc
	lda	hl,6(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
	lda	hl,4(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a

	inc	b
	inc	c
	push	hl

	jr	2$
1$:
	ld	a,(de)
	ld	(hl+),a
	inc	de
2$:
	dec	c
	jr	nz,1$
	dec	b
	jr	nz,1$	

	pop	de
	pop	bc
	ret

; int strcmp(const char *s1, const char *s2) 
_strcmp::
	lda	hl,2(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a

	jr	1$
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
	jr	2$

3$:
	ld	de,#0
	jr	5$
4$:
	ld	de,#1
	jr	nc,5$
	ld	de,#-1
5$:
	ret
	