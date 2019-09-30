;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:22 2019

;--------------------------------------------------------
	.module _divulong
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl __divulong
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
;	_divulong.c 321
;	genLabel
;	genFunction
;	---------------------------------
; Function _divulong
; ---------------------------------
____divulong_start:
__divulong:
	lda	sp,-10(sp)
;	_divulong.c 323
;	genAssign
;	AOP_STK for __divulong_reste_1_1
	xor	a,a
	lda	hl,6(sp)
	ld	(hl+),a
	ld	(hl+),a
	ld	(hl+),a
	ld	(hl),a
;	_divulong.c 331
;	genAssign
;	AOP_STK for __divulong_count_1_1
	lda	hl,5(sp)
	ld	(hl),#0x20
;	genLabel
00105$:
;	_divulong.c 334
;	genGetHBIT
;	AOP_STK for 
	lda	hl,15(sp)
	ld	a,(hl)
	rlc	a
	and	a,#1
	ld	b,a
;	genAssign
;	AOP_STK for __divulong_c_1_1
	lda	hl,4(sp)
	ld	(hl),b
;	_divulong.c 335
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	a,#0x01
	push	af
	inc	sp
;	genIpush
;	AOP_STK for 
	lda	hl,15(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
	lda	hl,15(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	__rlulong_rrx_s
;	AOP_STK for 
	push	hl
	lda	hl,19(sp)
	ld	(hl),e
	inc	hl
	ld	(hl),d
	pop	de
	inc	hl
	ld	(hl),e
	inc	hl
	ld	(hl),d
	lda	sp,5(sp)
;	genAssign
;	(operands are equal 4)
;	_divulong.c 336
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	a,#0x01
	push	af
	inc	sp
;	genIpush
;	AOP_STK for __divulong_reste_1_1
	lda	hl,9(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
	lda	hl,9(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	__rlulong_rrx_s
;	AOP_STK for __divulong_sloc0_1_0
	push	hl
	lda	hl,7(sp)
	ld	(hl),e
	inc	hl
	ld	(hl),d
	pop	de
	inc	hl
	ld	(hl),e
	inc	hl
	ld	(hl),d
	lda	sp,5(sp)
;	genAssign
;	AOP_STK for __divulong_sloc0_1_0
;	AOP_STK for __divulong_reste_1_1
	lda	hl,0(sp)
	ld	d,h
	ld	e,l
	lda	hl,6(sp)
	ld	a,(de)
	ld	(hl+),a
	inc	de
	ld	a,(de)
	ld	(hl+),a
	inc	de
	ld	a,(de)
	ld	(hl+),a
	inc	de
	ld	a,(de)
	ld	(hl),a
;	_divulong.c 337
;	genIfx
;	AOP_STK for __divulong_c_1_1
	xor	a,a
	lda	hl,4(sp)
	or	a,(hl)
	jp	z,00102$
;	_divulong.c 338
;	genOr
;	AOP_STK for __divulong_reste_1_1
	inc	hl
	inc	hl
	ld	a,(hl)
	or	a,#0x01
	ld	(hl),a
;	genLabel
00102$:
;	_divulong.c 340
;	genCmpLt
;	AOP_STK for __divulong_reste_1_1
;	AOP_STK for 
	lda	hl,6(sp)
	ld	d,h
	ld	e,l
	lda	hl,16(sp)
	ld	a,(de)
	sub	a,(hl)
	inc	hl
	inc	de
	ld	a,(de)
	sbc	a,(hl)
	inc	hl
	inc	de
	ld	a,(de)
	sbc	a,(hl)
	inc	hl
	inc	de
	ld	a,(de)
	sbc	a,(hl)
	jp	c,00106$
;	_divulong.c 342
;	genMinus
;	AOP_STK for __divulong_reste_1_1
;	AOP_STK for 
	lda	hl,6(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,e
	lda	hl,16(sp)
	sub	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	sbc	a,(hl)
	push	af
	lda	hl,9(sp)
	ld      (hl-),a
	ld	(hl),e
	inc	hl
	inc	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,20(sp)
	pop	af
	ld	a,e
	sbc	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	sbc	a,(hl)
	lda	hl,9(sp)
	ld      (hl-),a
	ld	(hl),e
;	_divulong.c 344
;	genOr
;	AOP_STK for 
	lda	hl,12(sp)
	ld	a,(hl)
	or	a,#0x01
	ld	(hl),a
;	genLabel
00106$:
;	_divulong.c 347
;	genMinus
;	AOP_STK for __divulong_count_1_1
	lda	hl,5(sp)
	dec	(hl)
;	genIfx
;	AOP_STK for __divulong_count_1_1
	xor	a,a
	or	a,(hl)
	jp	nz,00105$
;	_divulong.c 348
;	genRet
;	AOP_STK for 
	lda	hl,12(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
;	genLabel
00108$:
;	genEndFunction
	lda	sp,10(sp)
	ret
____divulong_end:
	.area _CODE
