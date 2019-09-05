;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:22 2019

;--------------------------------------------------------
	.module _mullong
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl __mulslong
	.globl __mululong
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
;	_mullong.c 505
;	genLabel
;	genFunction
;	---------------------------------
; Function _mululong
; ---------------------------------
____mululong_start:
__mululong:
	lda	sp,-39(sp)
;	_mullong.c 509
;	genAddrOf
	lda	hl,35(sp)
	ld	c,l
	ld	b,h
;	genPlus
;	AOP_STK for __mululong_sloc0_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	ld	hl,#0x0002
	add	hl,bc
	ld	a,l
	ld	d,h
	lda	hl,33(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAddrOf
;	AOP_STK for __mululong_sloc1_1_0
	lda	hl,41(sp)
	ld	a,l
	ld	d,h
	lda	hl,31(sp)
;	genPointerGet
;	AOP_STK for __mululong_sloc1_1_0
;	AOP_STK for __mululong_sloc2_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	dec	hl
	dec	hl
	ld	(hl),a
;	genAddrOf
;	AOP_STK for __mululong_sloc3_1_0
	lda	hl,45(sp)
	ld	a,l
	ld	d,h
	lda	hl,28(sp)
	ld	(hl+),a
	ld	(hl),d
;	genPlus
;	AOP_STK for __mululong_sloc3_1_0
;	AOP_STK for __mululong_sloc4_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,26(sp)
;	genPointerGet
;	AOP_STK for __mululong_sloc4_1_0
;	AOP_STK for __mululong_sloc5_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	dec	hl
	dec	hl
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for __mululong_sloc5_1_0
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
;	AOP_STK for __mululong_sloc2_1_0
	lda	hl,33(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	__muluchar_rrx_s
;	AOP_STK for __mululong_sloc6_1_0
	lda	hl,28(sp)
	ld	(hl),d
	dec	hl
	ld	(hl),e
	lda	sp,2(sp)
	pop	bc
;	genAssign (pointer)
;	AOP_STK for __mululong_sloc0_1_0
;	AOP_STK for __mululong_sloc6_1_0
	lda	hl,33(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,23(sp)
	ld	a,(hl)
	ld	(de),a
	inc	de
	inc	hl
	ld	a,(hl)
	ld	(de),a
;	_mullong.c 510
;	genPointerGet
;	AOP_STK for __mululong_sloc3_1_0
;	AOP_STK for __mululong_sloc6_1_0
	lda	hl,28(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,23(sp)
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for __mululong_sloc6_1_0
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
;	AOP_STK for __mululong_sloc2_1_0
	lda	hl,33(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	__muluchar_rrx_s
;	AOP_STK for __mululong_sloc7_1_0
	lda	hl,26(sp)
	ld	(hl),d
	dec	hl
	ld	(hl),e
	lda	sp,2(sp)
	pop	bc
;	genAssign (pointer)
;	AOP_STK for __mululong_sloc7_1_0
	ld	e,c
	ld	d,b
	lda	hl,21(sp)
	ld	a,(hl)
	ld	(de),a
	inc	de
	inc	hl
	ld	a,(hl)
	ld	(de),a
;	_mullong.c 511
;	genInline
		;johan 
;	_mullong.c 512
;	genPlus
;	AOP_STK for __mululong_sloc7_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	ld	hl,#0x0003
	add	hl,bc
	ld	a,l
	ld	d,h
	lda	hl,21(sp)
;	genPointerGet
;	AOP_STK for __mululong_sloc7_1_0
;	AOP_STK for __mululong_sloc5_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	lda	hl,25(sp)
	ld	(hl),a
;	genPlus
;	AOP_STK for __mululong_sloc1_1_0
;	AOP_STK for __mululong_sloc8_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,31(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0003
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,19(sp)
;	genPointerGet
;	AOP_STK for __mululong_sloc8_1_0
;	AOP_STK for __mululong_sloc9_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	dec	hl
	dec	hl
	ld	(hl),a
;	_mullong.c 513
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for __mululong_sloc6_1_0
	lda	hl,25(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
;	AOP_STK for __mululong_sloc9_1_0
	lda	hl,21(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	__muluchar_rrx_s
;	AOP_STK for __mululong_sloc10_1_0
	lda	hl,21(sp)
	ld	(hl),d
	dec	hl
	ld	(hl),e
	lda	sp,2(sp)
	pop	bc
;	genCast
;	AOP_STK for __mululong_sloc5_1_0
;	AOP_STK for __mululong_sloc11_1_0
	lda	hl,25(sp)
	ld	a,(hl)
	lda	hl,14(sp)
	ld	(hl+),a
	ld	(hl),#0x00
;	genPlus
;	AOP_STK for __mululong_sloc11_1_0
;	AOP_STK for __mululong_sloc10_1_0
;	AOP_STK for __mululong_sloc12_1_0
;	Can't optimise plus by inc, falling back to the normal way
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,12(sp)
	ld	(hl+),a
	ld	(hl),d
;	genCast
;	AOP_STK for __mululong_sloc12_1_0
	dec	hl
	ld	a,(hl)
;	genAssign (pointer)
;	AOP_STK for __mululong_sloc7_1_0
	lda	hl,21(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	(de),a
;	_mullong.c 514
;	genPointerGet
;	AOP_STK for __mululong_sloc7_1_0
;	AOP_STK for __mululong_sloc12_1_0
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,12(sp)
	ld	(hl),a
;	genPlus
;	AOP_STK for __mululong_sloc1_1_0
;	AOP_STK for __mululong_sloc11_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,31(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,14(sp)
;	genPointerGet
;	AOP_STK for __mululong_sloc11_1_0
;	AOP_STK for __mululong_sloc10_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	_mullong.c 515
;	genPlus
;	AOP_STK for __mululong_sloc3_1_0
;	AOP_STK for __mululong_sloc13_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,28(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,10(sp)
;	genPointerGet
;	AOP_STK for __mululong_sloc13_1_0
;	AOP_STK for __mululong_sloc9_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	lda	hl,18(sp)
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for __mululong_sloc9_1_0
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
;	AOP_STK for __mululong_sloc10_1_0
	dec	hl
	dec	hl
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	__muluchar_rrx_s
;	AOP_STK for __mululong_sloc10_1_0
	lda	hl,21(sp)
	ld	(hl),d
	dec	hl
	ld	(hl),e
	lda	sp,2(sp)
	pop	bc
;	genCast
;	AOP_STK for __mululong_sloc12_1_0
;	AOP_STK for __mululong_sloc14_1_0
	lda	hl,12(sp)
	ld	a,(hl)
	lda	hl,8(sp)
	ld	(hl+),a
	ld	(hl),#0x00
;	genPlus
;	AOP_STK for __mululong_sloc14_1_0
;	AOP_STK for __mululong_sloc10_1_0
;	AOP_STK for __mululong_sloc12_1_0
;	Can't optimise plus by inc, falling back to the normal way
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,16(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,12(sp)
	ld	(hl+),a
	ld	(hl),d
;	genCast
;	AOP_STK for __mululong_sloc12_1_0
	dec	hl
	ld	a,(hl)
;	genAssign (pointer)
;	AOP_STK for __mululong_sloc7_1_0
	lda	hl,21(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	(de),a
;	_mullong.c 516
;	genPointerGet
;	AOP_STK for __mululong_sloc0_1_0
;	AOP_STK for __mululong_sloc14_1_0
	lda	hl,33(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,8(sp)
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	genPointerGet
;	AOP_STK for __mululong_sloc11_1_0
;	AOP_STK for __mululong_sloc12_1_0
	lda	hl,14(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,12(sp)
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for __mululong_sloc6_1_0
	lda	hl,25(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
;	AOP_STK for __mululong_sloc12_1_0
	lda	hl,15(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	__muluchar_rrx_s
;	AOP_STK for __mululong_sloc12_1_0
	lda	hl,17(sp)
	ld	(hl),d
	dec	hl
	ld	(hl),e
	lda	sp,2(sp)
	pop	bc
;	genPlus
;	AOP_STK for __mululong_sloc14_1_0
;	AOP_STK for __mululong_sloc12_1_0
;	AOP_STK for __mululong_sloc11_1_0
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,12(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,14(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign (pointer)
;	AOP_STK for __mululong_sloc0_1_0
;	AOP_STK for __mululong_sloc11_1_0
	lda	hl,33(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,14(sp)
	ld	a,(hl)
	ld	(de),a
	inc	de
	inc	hl
	ld	a,(hl)
	ld	(de),a
;	_mullong.c 518
;	genPointerGet
;	AOP_STK for __mululong_sloc0_1_0
;	AOP_STK for __mululong_sloc14_1_0
	lda	hl,33(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,8(sp)
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	genPlus
;	AOP_STK for __mululong_sloc1_1_0
;	AOP_STK for __mululong_sloc12_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,31(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,12(sp)
;	genPointerGet
;	AOP_STK for __mululong_sloc12_1_0
;	AOP_STK for __mululong_sloc11_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	genPointerGet
;	AOP_STK for __mululong_sloc13_1_0
;	AOP_STK for __mululong_sloc10_1_0
	lda	hl,10(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,16(sp)
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for __mululong_sloc10_1_0
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
;	AOP_STK for __mululong_sloc11_1_0
	dec	hl
	dec	hl
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	__muluchar_rrx_s
;	AOP_STK for __mululong_sloc13_1_0
	lda	hl,15(sp)
	ld	(hl),d
	dec	hl
	ld	(hl),e
	lda	sp,2(sp)
	pop	bc
;	genPlus
;	AOP_STK for __mululong_sloc14_1_0
;	AOP_STK for __mululong_sloc13_1_0
;	AOP_STK for __mululong_sloc11_1_0
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,14(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign (pointer)
;	AOP_STK for __mululong_sloc0_1_0
;	AOP_STK for __mululong_sloc11_1_0
	lda	hl,33(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,14(sp)
	ld	a,(hl)
	ld	(de),a
	inc	de
	inc	hl
	ld	a,(hl)
	ld	(de),a
;	_mullong.c 520
;	genPointerGet
;	AOP_STK for __mululong_sloc12_1_0
;	AOP_STK for __mululong_sloc14_1_0
	lda	hl,12(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,8(sp)
	ld	(hl),a
;	_mullong.c 521
;	genPointerGet
;	AOP_STK for __mululong_sloc4_1_0
;	AOP_STK for __mululong_sloc13_1_0
	lda	hl,26(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,10(sp)
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for __mululong_sloc13_1_0
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
;	AOP_STK for __mululong_sloc14_1_0
	dec	hl
	dec	hl
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	__muluchar_rrx_s
;	AOP_STK for __mululong_sloc14_1_0
	lda	hl,13(sp)
	ld	(hl),d
	dec	hl
	ld	(hl),e
	lda	sp,2(sp)
	pop	bc
;	genCast
;	AOP_STK for __mululong_sloc14_1_0
	lda	hl,8(sp)
	ld	a,(hl)
;	genAssign (pointer)
;	AOP_STK for __mululong_sloc8_1_0
	lda	hl,19(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	(de),a
;	_mullong.c 522
;	genPlus
;	AOP_STK for __mululong_sloc1_1_0
;	AOP_STK for __mululong_sloc14_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,31(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,8(sp)
	ld	(hl+),a
	ld	(hl),d
;	genPlus
;	AOP_STK for __mululong_sloc1_1_0
;	AOP_STK for __mululong_sloc13_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,31(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,10(sp)
;	genPointerGet
;	AOP_STK for __mululong_sloc13_1_0
;	AOP_STK for __mululong_sloc12_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	_mullong.c 523
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for __mululong_sloc6_1_0
	lda	hl,25(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
;	AOP_STK for __mululong_sloc12_1_0
	lda	hl,15(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	__muluchar_rrx_s
;	AOP_STK for __mululong_sloc13_1_0
	lda	hl,15(sp)
	ld	(hl),d
	dec	hl
	ld	(hl),e
	lda	sp,2(sp)
	pop	bc
;	genAssign (pointer)
;	AOP_STK for __mululong_sloc14_1_0
;	AOP_STK for __mululong_sloc13_1_0
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl)
	ld	(de),a
	inc	de
	inc	hl
	ld	a,(hl)
	ld	(de),a
;	_mullong.c 525
;	genPlus
;	AOP_STK for __mululong_sloc3_1_0
;	AOP_STK for __mululong_sloc14_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,28(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0003
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,8(sp)
;	_mullong.c 526
;	genPointerGet
;	AOP_STK for __mululong_sloc14_1_0
;	AOP_STK for __mululong_sloc13_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for __mululong_sloc13_1_0
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
;	AOP_STK for __mululong_sloc2_1_0
	lda	hl,33(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	__muluchar_rrx_s
;	AOP_STK for __mululong_sloc13_1_0
	lda	hl,15(sp)
	ld	(hl),d
	dec	hl
	ld	(hl),e
	lda	sp,2(sp)
	pop	bc
;	genCast
;	AOP_STK for __mululong_sloc13_1_0
	lda	hl,10(sp)
	ld	a,(hl)
;	genAssign (pointer)
;	AOP_STK for __mululong_sloc14_1_0
	dec	hl
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	(de),a
;	_mullong.c 527
;	genPlus
;	AOP_STK for __mululong_sloc3_1_0
;	AOP_STK for __mululong_sloc14_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,28(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,8(sp)
	ld	(hl+),a
	ld	(hl),d
;	_mullong.c 528
;	genPlus
;	AOP_STK for __mululong_sloc3_1_0
;	AOP_STK for __mululong_sloc13_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,28(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,10(sp)
;	genPointerGet
;	AOP_STK for __mululong_sloc13_1_0
;	AOP_STK for __mululong_sloc12_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for __mululong_sloc12_1_0
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
;	AOP_STK for __mululong_sloc2_1_0
	lda	hl,33(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	__muluchar_rrx_s
;	AOP_STK for __mululong_sloc13_1_0
	lda	hl,15(sp)
	ld	(hl),d
	dec	hl
	ld	(hl),e
	lda	sp,2(sp)
	pop	bc
;	genAssign (pointer)
;	AOP_STK for __mululong_sloc14_1_0
;	AOP_STK for __mululong_sloc13_1_0
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl)
	ld	(de),a
	inc	de
	inc	hl
	ld	a,(hl)
	ld	(de),a
;	_mullong.c 529
;	genAssign (pointer)
;	AOP_STK for __mululong_sloc3_1_0
	lda	hl,28(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,#0x00
	ld	(de),a
;	_mullong.c 530
;	genAssign (pointer)
;	AOP_STK for __mululong_sloc1_1_0
	inc	hl
	inc	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,#0x00
	ld	(de),a
;	_mullong.c 531
;	genPointerGet
;	AOP_STK for __mululong_sloc15_1_0
	ld	e,c
	ld	d,b
	ld	a,(de)
	lda	hl,4(sp)
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	genPlus
;	AOP_STK for __mululong_sloc15_1_0
;	AOP_STK for 
;	AOP_STK for __mululong_sloc16_1_0
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,4(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,e
	lda	hl,41(sp)
	add	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	adc	a,(hl)
	push	af
	lda	hl,3(sp)
	ld      (hl-),a
	ld	(hl),e
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,45(sp)
	pop	af
	ld	a,e
	adc	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	adc	a,(hl)
	lda	hl,3(sp)
	ld      (hl-),a
	ld	(hl),e
;	genAssign (pointer)
;	AOP_STK for __mululong_sloc16_1_0
	ld	e,c
	ld	d,b
	dec	hl
	dec	hl
	ld	a,(hl)
	ld	(de),a
	inc	de
	inc	hl
	ld	a,(hl)
	ld	(de),a
	inc	de
	inc	hl
	ld	a,(hl)
	ld	(de),a
	inc	de
	inc	hl
	ld	a,(hl)
	ld	(de),a
;	_mullong.c 533
;	genPlus
;	AOP_STK for __mululong_sloc16_1_0
;	AOP_STK for 
;	AOP_STK for __mululong_sloc15_1_0
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,e
	lda	hl,45(sp)
	add	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	adc	a,(hl)
	push	af
	lda	hl,7(sp)
	ld      (hl-),a
	ld	(hl),e
	dec	hl
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,49(sp)
	pop	af
	ld	a,e
	adc	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	adc	a,(hl)
	lda	hl,7(sp)
	ld      (hl-),a
	ld	(hl),e
;	genRet
;	AOP_STK for __mululong_sloc15_1_0
	dec	hl
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
;	genLabel
00101$:
;	genEndFunction
	lda	sp,39(sp)
	ret
____mululong_end:
;	_mullong.c 537
;	genLabel
;	genFunction
;	---------------------------------
; Function _mulslong
; ---------------------------------
____mulslong_start:
__mulslong:
	lda	sp,-4(sp)
;	_mullong.c 539
;	genAssign
;	(operands are equal 3)
;	genAssign
;	(operands are equal 3)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
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
	call	__mululong
;	AOP_STK for __mulslong_sloc0_1_0
	push	hl
	lda	hl,10(sp)
	ld	(hl),e
	inc	hl
	ld	(hl),d
	pop	de
	inc	hl
	ld	(hl),e
	inc	hl
	ld	(hl),d
	lda	sp,8(sp)
;	genRet
;	AOP_STK for __mulslong_sloc0_1_0
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
;	genLabel
00101$:
;	genEndFunction
	lda	sp,4(sp)
	ret
____mulslong_end:
	.area _CODE
