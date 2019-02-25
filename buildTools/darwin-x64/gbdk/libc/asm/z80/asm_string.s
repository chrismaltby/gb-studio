	;; Implementation of some string functions in
	;; assembler.

	;; Why - because I want a better dhrystone score :)

; char *strcpy(char *dest, const char *source)
_strcpy::
	push	bc

	ex	de,hl
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
	pop	bc
	ret

; void *memcpy(void *dest, const void *source, int count)
_memcpy::
	;; dest is in HL
	push	bc

	push	hl
	ld	hl,#6
	add	hl,sp
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
	pop	hl
	
	push	de

	ldir

	pop	hl
	pop	bc
	ret

; int strcmp(const char *s1, const char *s2) 
_strcmp::
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
	ret
	