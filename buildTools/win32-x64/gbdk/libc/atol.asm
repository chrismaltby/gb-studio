;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:15 2019

;--------------------------------------------------------
	.module atol
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _atol
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
;	atol.c 4
;	genLabel
;	genFunction
;	---------------------------------
; Function atol
; ---------------------------------
___atol_start:
_atol:
	lda	sp,-20(sp)
;	atol.c 6
;	genAssign
;	AOP_STK for _atol_sign_1_1
	lda	hl,18(sp)
	ld	(hl),#0x00
;	atol.c 9
;	genAssign
;	AOP_STK for _atol_i_1_1
	inc	hl
	ld	(hl),#0x00
;	genLabel
00106$:
;	genPlus
;	AOP_STK for 
;	AOP_STK for _atol_i_1_1
;	AOP_STK for _atol_sloc0_1_0
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,22(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,19(sp)
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,12(sp)
;	genPointerGet
;	AOP_STK for _atol_sloc0_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	c,a
	cp	a,#0x20
	jp	z,00108$
00126$:
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	cp	a,#0x0A
	jp	z,00108$
00127$:
;	genCmpEq
; genCmpEq: left 1, right 1, result 1
	ld	a,c
	cp	a,#0x09
	jp	nz,00128$
	ld	a,#0x01
	jr	00129$
00128$:
	xor	a,a
00129$:
	ld	b,a
;	genAssign
;	AOP_STK for _atol_i_1_1
;	(registers are the same)
;	genIfx
	xor	a,a
	or	a,b
	jp	z,00109$
;	genLabel
00108$:
;	genPlus
;	AOP_STK for _atol_i_1_1
;	genPlusIncr
	lda	hl,19(sp)
	inc	(hl)
;	genGoto
	jp	00106$
;	genLabel
00109$:
;	atol.c 11
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	cp	a,#0x2B
	jp	z,00102$
00130$:
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	cp	a,#0x2D
	jp	nz,00103$
	jr	00132$
00131$:
	jp	00103$
00132$:
;	atol.c 14
;	genAssign
;	AOP_STK for _atol_sign_1_1
	lda	hl,18(sp)
	ld	(hl),#0x01
;	atol.c 17
;	genLabel
00102$:
;	genPlus
;	AOP_STK for _atol_i_1_1
;	genPlusIncr
	lda	hl,19(sp)
	inc	(hl)
;	atol.c 19
;	genLabel
00103$:
;	atol.c 20
;	genAssign
;	AOP_STK for _atol_n_1_1
	xor	a,a
	lda	hl,14(sp)
	ld	(hl+),a
	ld	(hl+),a
	ld	(hl+),a
	ld	(hl),a
;	genAssign
;	AOP_STK for _atol_i_1_1
;	(registers are the same)
;	genLabel
00110$:
;	genPlus
;	AOP_STK for 
;	AOP_STK for _atol_i_1_1
;	AOP_STK for _atol_sloc0_1_0
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,22(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,19(sp)
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,12(sp)
;	genPointerGet
;	AOP_STK for _atol_sloc0_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	b,a
	push	af
	inc	sp
;	genCall
	call	_isdigit
	ld	b,e
	lda	sp,1(sp)
;	genIfx
	xor	a,a
	or	a,b
	jp	z,00113$
;	atol.c 21
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	hl,#0x0000
	push	hl
	ld	hl,#0x000A
	push	hl
;	genIpush
;	AOP_STK for _atol_n_1_1
	lda	hl,20(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
	lda	hl,20(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	__mulslong_rrx_s
;	AOP_STK for _atol_sloc1_1_0
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
	lda	sp,8(sp)
;	genPointerGet
;	AOP_STK for _atol_sloc0_1_0
	lda	hl,12(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	ld	c,a
;	genCast
;	AOP_STK for _atol_sloc2_1_0
	lda	hl,4(sp)
	ld	(hl),c
	ld	a,c
	rla	
	sbc	a,a
	inc	hl
	ld	(hl+),a
	ld	(hl+),a
;	genPlus
;	AOP_STK for _atol_sloc1_1_0
;	AOP_STK for _atol_sloc2_1_0
;	AOP_STK for _atol_sloc3_1_0
;	Can't optimise plus by inc, falling back to the normal way
	ld	(hl+),a
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,e
	lda	hl,4(sp)
	add	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	adc	a,(hl)
	push	af
	lda	hl,3(sp)
	ld      (hl-),a
	ld	(hl),e
	lda	hl,12(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,8(sp)
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
;	genMinus
;	AOP_STK for _atol_sloc3_1_0
;	AOP_STK for _atol_n_1_1
	dec	hl
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,e
	sub	a,#0x30
	ld	e,a
	ld	a,d
	sbc	a,#0x00
	push	af
	lda	hl,17(sp)
	ld      (hl-),a
	ld	(hl),e
	lda	hl,4(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	pop	af
	ld	a,e
	sbc	a,#0x00
	ld	e,a
	ld	a,d
	sbc	a,#0x00
	lda	hl,17(sp)
	ld      (hl-),a
	ld	(hl),e
;	atol.c 20
;	genPlus
;	AOP_STK for _atol_i_1_1
;	genPlusIncr
	lda	hl,19(sp)
	inc	(hl)
;	genGoto
	jp	00110$
;	genLabel
00113$:
;	atol.c 22
;	genCmpEq
;	AOP_STK for _atol_sign_1_1
; genCmpEq: left 1, right 1, result 0
	lda	hl,18(sp)
	ld	a,(hl)
	or	a,a
	jp	nz,00116$
	jr	00134$
00133$:
	jp	00116$
00134$:
;	genAssign
;	AOP_STK for _atol_n_1_1
;	AOP_STK for _atol_sloc3_1_0
	lda	hl,14(sp)
	ld	d,h
	ld	e,l
	lda	hl,0(sp)
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
;	genGoto
	jp	00117$
;	genLabel
00116$:
;	genUminus
;	AOP_STK for _atol_n_1_1
;	AOP_STK for _atol_sloc3_1_0
	ld      de,#0x0000
	ld	a,e
	lda	hl,14(sp)
	sub	a,(hl)
	ld	e,a
	ld	a,d
	inc	hl
	sbc	a,(hl)
	push	af
	lda	hl,3(sp)
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
	lda	hl,3(sp)
	ld      (hl-),a
	ld	(hl),e
;	genLabel
00117$:
;	genRet
;	AOP_STK for _atol_sloc3_1_0
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
;	genLabel
00114$:
;	genEndFunction
	lda	sp,20(sp)
	ret
___atol_end:
	.area _CODE
;--------------------------------------------------------
; code
;--------------------------------------------------------
	.area _CODE
	.area _CODE
