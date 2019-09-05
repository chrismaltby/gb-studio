;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:21 2019

;--------------------------------------------------------
	.module _modulong
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl __modulong
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
;	_modulong.c 335
;	genLabel
;	genFunction
;	---------------------------------
; Function _modulong
; ---------------------------------
____modulong_start:
__modulong:
	lda	sp,-3(sp)
;	_modulong.c 337
;	genAssign
;	AOP_STK for __modulong_count_1_1
	lda	hl,2(sp)
	ld	(hl),#0x00
;	_modulong.c 339
;	genAssign
;	AOP_STK for __modulong_sloc1_1_0
	dec	hl
	dec	hl
	ld	(hl),#0x00
;	genLabel
00103$:
;	genGetHBIT
;	AOP_STK for 
;	AOP_STK for __modulong_sloc0_1_0
	lda	hl,12(sp)
	ld	a,(hl)
	rlc	a
	and	a,#1
	lda	hl,1(sp)
	ld	(hl),a
;	genIfx
;	AOP_STK for __modulong_sloc0_1_0
	xor	a,a
	or	a,(hl)
	jp	nz,00117$
;	_modulong.c 341
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	a,#0x01
	push	af
	inc	sp
;	genIpush
;	AOP_STK for 
	lda	hl,12(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
	lda	hl,12(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	__rlulong_rrx_s
;	AOP_STK for 
	push	hl
	lda	hl,16(sp)
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
;	_modulong.c 342
;	genCmpGt
;	AOP_STK for 
;	AOP_STK for 
	lda	hl,5(sp)
	ld	d,h
	ld	e,l
	lda	hl,9(sp)
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
	jp	nc,00102$
;	_modulong.c 344
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	a,#0x01
	push	af
	inc	sp
;	genIpush
;	AOP_STK for 
	lda	hl,12(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
	lda	hl,12(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	__rrulong_rrx_s
;	AOP_STK for 
	push	hl
	lda	hl,16(sp)
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
;	_modulong.c 345
;	genGoto
	jp	00117$
;	genLabel
00102$:
;	_modulong.c 347
;	genPlus
;	AOP_STK for __modulong_sloc1_1_0
;	genPlusIncr
	lda	hl,0(sp)
	inc	(hl)
;	genAssign
;	AOP_STK for __modulong_sloc1_1_0
;	AOP_STK for __modulong_count_1_1
	ld	a,(hl+)
	inc	hl
	ld	(hl),a
;	genGoto
	jp	00103$
;	_modulong.c 349
;	genLabel
00117$:
;	genAssign
;	AOP_STK for __modulong_count_1_1
	lda	hl,2(sp)
	ld	c,(hl)
;	genLabel
00108$:
;	_modulong.c 351
;	genCmpLt
;	AOP_STK for 
;	AOP_STK for 
	lda	hl,5(sp)
	ld	d,h
	ld	e,l
	lda	hl,9(sp)
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
	jp	c,00107$
;	_modulong.c 352
;	genMinus
;	AOP_STK for 
;	AOP_STK for 
	lda	hl,5(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,e
	lda	hl,9(sp)
	sub	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	sbc	a,(hl)
	push	af
	lda	hl,8(sp)
	ld      (hl-),a
	ld	(hl),e
	inc	hl
	inc	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,13(sp)
	pop	af
	ld	a,e
	sbc	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	sbc	a,(hl)
	lda	hl,8(sp)
	ld      (hl-),a
	ld	(hl),e
;	genLabel
00107$:
;	_modulong.c 353
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
	ld	a,#0x01
	push	af
	inc	sp
;	genIpush
;	AOP_STK for 
	lda	hl,14(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
	lda	hl,14(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	__rrulong_rrx_s
;	AOP_STK for 
	push	hl
	lda	hl,18(sp)
	ld	(hl),e
	inc	hl
	ld	(hl),d
	pop	de
	inc	hl
	ld	(hl),e
	inc	hl
	ld	(hl),d
	lda	sp,5(sp)
	pop	hl
	ld	c,l
;	genAssign
;	(operands are equal 4)
;	_modulong.c 355
;	genAssign
	ld	b,c
;	genMinus
	dec	c
;	genIfx
	xor	a,a
	or	a,b
	jp	nz,00108$
;	_modulong.c 357
;	genRet
;	AOP_STK for 
	lda	hl,5(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
;	genLabel
00111$:
;	genEndFunction
	lda	sp,3(sp)
	ret
____modulong_end:
	.area _CODE
