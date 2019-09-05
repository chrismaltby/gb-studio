;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:17 2019

;--------------------------------------------------------
	.module itoa
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _itoa
;--------------------------------------------------------
; special function registers
;--------------------------------------------------------
;--------------------------------------------------------
; special function bits 
;--------------------------------------------------------
;--------------------------------------------------------
; internal ram data
;--------------------------------------------------------
	.area _DATA
;--------------------------------------------------------
; overlayable items in internal ram 
;--------------------------------------------------------
	.area _OVERLAY
;--------------------------------------------------------
; indirectly addressable internal ram data
;--------------------------------------------------------
	.area _ISEG
;--------------------------------------------------------
; bit data
;--------------------------------------------------------
	.area _BSEG
;--------------------------------------------------------
; external ram data
;--------------------------------------------------------
	.area _XSEG
;--------------------------------------------------------
; global & static initialisations
;--------------------------------------------------------
	.area _GSINIT
	.area _GSFINAL
	.area _GSINIT
;--------------------------------------------------------
; Home
;--------------------------------------------------------
	.area _HOME
	.area _CODE
;--------------------------------------------------------
; code
;--------------------------------------------------------
	.area _CODE
;	itoa.c 5
;	genLabel
;	genFunction
;	---------------------------------
; Function itoa
; ---------------------------------
___itoa_start:
_itoa:
	lda	sp,-8(sp)
;	itoa.c 9
;	genCmpLt
;	AOP_STK for 
	lda	hl,11(sp)
	ld	a,(hl)
	bit	7,a
	jp	z,00102$
;	itoa.c 10
;	genAssign
;	AOP_STK for _itoa_sign_1_1
	lda	hl,6(sp)
	ld	(hl),#0x01
;	itoa.c 11
;	genUminus
;	AOP_STK for 
	xor	a,a
	lda	hl,10(sp)
	ld	a,#0x00
	sbc	a,(hl)
	ld	(hl+),a
	ld	a,#0x00
	sbc	a,(hl)
	ld	(hl),a
;	genGoto
	jp	00112$
;	genLabel
00102$:
;	itoa.c 13
;	genAssign
;	AOP_STK for _itoa_sign_1_1
	lda	hl,6(sp)
	ld	(hl),#0x00
;	itoa.c 15
;	genLabel
00112$:
;	genAssign
	ld	b,#0x00
;	genLabel
00104$:
;	itoa.c 16
;	genAssign
	ld	c,b
;	genPlus
;	genPlusIncr
; Removed redundent load
	inc	b
;	genAssign
;	AOP_STK for _itoa_i_1_1
	lda	hl,7(sp)
	ld	(hl),b
;	genPlus
;	AOP_STK for 
;	AOP_STK for _itoa_sloc0_1_0
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,12(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	l,c
	ld	h,#0x00
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,4(sp)
	ld	(hl+),a
	ld	(hl),d
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
	ld	hl,#0x000A
	push	hl
;	genIpush
;	AOP_STK for 
	lda	hl,14(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	__modsint_rrx_s
;	AOP_STK for _itoa_sloc1_1_0
	lda	hl,9(sp)
	ld	(hl),d
	dec	hl
	ld	(hl),e
	lda	sp,4(sp)
	pop	hl
	ld	b,h
;	genPlus
;	AOP_STK for _itoa_sloc1_1_0
;	AOP_STK for _itoa_sloc2_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,2(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0030
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,0(sp)
	ld	(hl+),a
	ld	(hl),d
;	genCast
;	AOP_STK for _itoa_sloc2_1_0
	dec	hl
	ld	a,(hl)
;	genAssign (pointer)
;	AOP_STK for _itoa_sloc0_1_0
	lda	hl,4(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	(de),a
;	itoa.c 17
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
	ld	hl,#0x000A
	push	hl
;	genIpush
;	AOP_STK for 
	lda	hl,14(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	__divsint_rrx_s
;	AOP_STK for 
	lda	hl,17(sp)
	ld	(hl),d
	dec	hl
	ld	(hl),e
	lda	sp,4(sp)
	pop	hl
	ld	b,h
;	genAssign
;	(operands are equal 4)
;	genCmpGt
;	AOP_STK for 
	ld	e,#0x80
	lda	hl,11(sp)
	ld	a,(hl)
	xor	a,#0x80
	ld	d,a
	ld	a,#0x00
	dec	hl
	sub	a,(hl)
	ld	a,e
	sbc	a,d
	jp	c,00104$
;	itoa.c 18
;	genIfx
;	AOP_STK for _itoa_sign_1_1
	xor	a,a
	lda	hl,6(sp)
	or	a,(hl)
	jp	z,00108$
;	itoa.c 19
;	genPlus
;	AOP_STK for _itoa_i_1_1
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	ld	a,b
	add	a,#0x01
	inc	hl
	ld	(hl),a
;	genPlus
;	AOP_STK for 
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,12(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	l,b
	ld	h,#0x00
	add	hl,de
	ld	b,l
	ld	c,h
;	genAssign (pointer)
	ld	e,b
	ld	d,c
	ld	a,#0x2D
	ld	(de),a
;	genLabel
00108$:
;	itoa.c 20
;	genPlus
;	AOP_STK for 
;	AOP_STK for _itoa_i_1_1
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,12(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,7(sp)
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	c,l
	ld	b,h
;	genAssign (pointer)
	ld	a,#0x00
	ld	(bc),a
;	itoa.c 21
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
;	AOP_STK for 
	lda	hl,12(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	_reverse
	lda	sp,2(sp)
;	itoa.c 22
;	genRet
;	AOP_STK for 
	lda	hl,12(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
;	genLabel
00109$:
;	genEndFunction
	lda	sp,8(sp)
	ret
___itoa_end:
	.area _CODE
