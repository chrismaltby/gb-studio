;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:21 2019

;--------------------------------------------------------
	.module _modslong
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl __modslong
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
;	_modslong.c 257
;	genLabel
;	genFunction
;	---------------------------------
; Function _modslong
; ---------------------------------
____modslong_start:
__modslong:
	lda	sp,-18(sp)
;	_modslong.c 262
;	genCmpLt
;	AOP_STK for 
;	AOP_STK for __modslong_sloc4_1_0
	lda	hl,27(sp)
	ld	a,(hl)
	rlc	a
	ld	a,#0x00
	rla
	lda	hl,0(sp)
	ld	(hl),a
;	genIfx
;	AOP_STK for __modslong_sloc4_1_0
	xor	a,a
	or	a,(hl)
	jp	z,00106$
;	genUminus
;	AOP_STK for 
;	AOP_STK for __modslong_sloc0_1_0
	ld      de,#0x0000
	ld	a,e
	lda	hl,24(sp)
	sub	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	sbc	a,(hl)
	push	af
	lda	hl,13(sp)
	ld      (hl-),a
	ld	(hl),e
	ld      de,#0x0000
	lda	hl,28(sp)
	pop	af
	ld	a,e
	sbc	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	sbc	a,(hl)
	lda	hl,13(sp)
	ld      (hl-),a
	ld	(hl),e
;	genGoto
	jp	00107$
;	genLabel
00106$:
;	genAssign
;	AOP_STK for 
;	AOP_STK for __modslong_sloc0_1_0
	lda	hl,24(sp)
	ld	d,h
	ld	e,l
	lda	hl,10(sp)
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
;	genLabel
00107$:
;	genAssign
;	AOP_STK for __modslong_sloc0_1_0
;	AOP_STK for __modslong_sloc1_1_0
	lda	hl,10(sp)
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
;	_modslong.c 261
;	genCmpLt
;	AOP_STK for 
;	AOP_STK for __modslong_sloc3_1_0
	lda	hl,23(sp)
	ld	a,(hl)
	rlc	a
	ld	a,#0x00
	rla
	lda	hl,1(sp)
	ld	(hl),a
;	genIfx
;	AOP_STK for __modslong_sloc3_1_0
	xor	a,a
	or	a,(hl)
	jp	z,00108$
;	genUminus
;	AOP_STK for 
;	AOP_STK for __modslong_sloc0_1_0
	ld      de,#0x0000
	ld	a,e
	lda	hl,20(sp)
	sub	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	sbc	a,(hl)
	push	af
	lda	hl,13(sp)
	ld      (hl-),a
	ld	(hl),e
	ld      de,#0x0000
	lda	hl,24(sp)
	pop	af
	ld	a,e
	sbc	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	sbc	a,(hl)
	lda	hl,13(sp)
	ld      (hl-),a
	ld	(hl),e
;	genGoto
	jp	00109$
;	genLabel
00108$:
;	genAssign
;	AOP_STK for 
;	AOP_STK for __modslong_sloc0_1_0
	lda	hl,20(sp)
	ld	d,h
	ld	e,l
	lda	hl,10(sp)
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
;	genLabel
00109$:
;	genAssign
;	AOP_STK for __modslong_sloc0_1_0
;	AOP_STK for __modslong_sloc2_1_0
	lda	hl,10(sp)
	ld	d,h
	ld	e,l
	lda	hl,2(sp)
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
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
;	AOP_STK for __modslong_sloc1_1_0
	lda	hl,8(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
	lda	hl,8(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genIpush
;	AOP_STK for __modslong_sloc2_1_0
	lda	hl,8(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
	lda	hl,8(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	__modulong
;	AOP_STK for __modslong_r_1_1
	push	hl
	lda	hl,24(sp)
	ld	(hl),e
	inc	hl
	ld	(hl),d
	pop	de
	inc	hl
	ld	(hl),e
	inc	hl
	ld	(hl),d
	lda	sp,8(sp)
;	genAssign
;	AOP_STK for __modslong_r_1_1
;	(registers are the same)
;	_modslong.c 263
;	genXor
;	AOP_STK for __modslong_sloc3_1_0
;	AOP_STK for __modslong_sloc4_1_0
	lda	hl,0(sp)
	ld	a,(hl+)
	xor	a,(hl)
;	genIfx
	or	a,a
	jp	z,00102$
;	_modslong.c 264
;	genUminus
;	AOP_STK for __modslong_r_1_1
;	AOP_STK for __modslong_sloc2_1_0
	ld      de,#0x0000
	ld	a,e
	lda	hl,14(sp)
	sub	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	sbc	a,(hl)
	push	af
	lda	hl,5(sp)
	ld      (hl-),a
	ld	(hl),e
	ld      de,#0x0000
	lda	hl,18(sp)
	pop	af
	ld	a,e
	sbc	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	sbc	a,(hl)
	lda	hl,5(sp)
	ld      (hl-),a
	ld	(hl),e
;	genRet
;	AOP_STK for __modslong_sloc2_1_0
	dec	hl
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	jp	00104$
;	genLabel
00102$:
;	_modslong.c 266
;	genRet
;	AOP_STK for __modslong_r_1_1
	lda	hl,14(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
;	genLabel
00104$:
;	genEndFunction
	lda	sp,18(sp)
	ret
____modslong_end:
	.area _CODE
