;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:15 2019

;--------------------------------------------------------
	.module atoi
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _atoi
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
;	atoi.c 5
;	genLabel
;	genFunction
;	---------------------------------
; Function atoi
; ---------------------------------
___atoi_start:
_atoi:
	lda	sp,-6(sp)
;	atoi.c 7
;	genAssign
;	AOP_STK for _atoi_sign_1_1
	lda	hl,4(sp)
	ld	(hl),#0x00
;	atoi.c 10
;	genAssign
;	AOP_STK for _atoi_i_1_1
	inc	hl
	ld	(hl),#0x00
;	genLabel
00106$:
;	genPlus
;	AOP_STK for 
;	AOP_STK for _atoi_i_1_1
;	AOP_STK for _atoi_sloc0_1_0
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,5(sp)
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,1(sp)
;	genPointerGet
;	AOP_STK for _atoi_sloc0_1_0
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
;	AOP_STK for _atoi_i_1_1
;	(registers are the same)
;	genIfx
	xor	a,a
	or	a,b
	jp	z,00109$
;	genLabel
00108$:
;	genPlus
;	AOP_STK for _atoi_i_1_1
;	genPlusIncr
	lda	hl,5(sp)
	inc	(hl)
;	genGoto
	jp	00106$
;	genLabel
00109$:
;	atoi.c 12
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
;	atoi.c 15
;	genAssign
;	AOP_STK for _atoi_sign_1_1
	lda	hl,4(sp)
	ld	(hl),#0x01
;	atoi.c 18
;	genLabel
00102$:
;	genPlus
;	AOP_STK for _atoi_i_1_1
;	genPlusIncr
	lda	hl,5(sp)
	inc	(hl)
;	atoi.c 20
;	genLabel
00103$:
;	atoi.c 21
;	genAssign
;	AOP_STK for _atoi_n_1_1
	lda	hl,3(sp)
	ld	(hl),#0x00
;	genAssign
;	AOP_STK for _atoi_i_1_1
;	(registers are the same)
;	genLabel
00110$:
;	genPlus
;	AOP_STK for 
;	AOP_STK for _atoi_i_1_1
;	AOP_STK for _atoi_sloc0_1_0
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,5(sp)
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,1(sp)
;	genPointerGet
;	AOP_STK for _atoi_sloc0_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	c,a
	push	af
	inc	sp
;	genCall
	call	_isdigit
	ld	c,e
	lda	sp,1(sp)
;	genIfx
	xor	a,a
	or	a,c
	jp	z,00113$
;	atoi.c 22
;	genMult
;	AOP_STK for _atoi_n_1_1
	lda	hl,3(sp)
	ld	e,(hl)
	ld	a,e
	rlc	a
	sbc	a,a
	ld	d,a
	ld	l,e
	ld	h,d
	add	hl,hl
	add	hl,hl
	add	hl,de
	add	hl,hl
	ld	c,l
	ld	b,h
;	genPointerGet
;	AOP_STK for _atoi_sloc0_1_0
;	AOP_STK for _atoi_sloc1_1_0
	lda	hl,1(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	dec	hl
	dec	hl
	ld	(hl),a
;	genCast
;	AOP_STK for _atoi_sloc1_1_0
;	AOP_STK for _atoi_sloc0_1_0
	ld	a,(hl+)
	ld      (hl-),a
	ld	a,(hl)
	rla	
	sbc	a,a
	inc	hl
	inc	hl
;	genPlus
;	AOP_STK for _atoi_sloc0_1_0
;	Can't optimise plus by inc, falling back to the normal way
	ld      (hl-),a
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	add	hl,bc
	ld	c,l
	ld	b,h
;	genMinus
	ld	a,c
	add	a,#0xD0
	ld	c,a
	ld	a,b
	adc	a,#0xFF
	ld	b,a
;	genCast
;	AOP_STK for _atoi_n_1_1
	lda	hl,3(sp)
	ld	(hl),c
;	atoi.c 21
;	genPlus
;	AOP_STK for _atoi_i_1_1
;	genPlusIncr
	inc	hl
	inc	hl
	inc	(hl)
;	genGoto
	jp	00110$
;	genLabel
00113$:
;	atoi.c 23
;	genCmpEq
;	AOP_STK for _atoi_sign_1_1
; genCmpEq: left 1, right 1, result 0
	lda	hl,4(sp)
	ld	a,(hl)
	or	a,a
	jp	nz,00116$
	jr	00134$
00133$:
	jp	00116$
00134$:
;	genAssign
;	AOP_STK for _atoi_n_1_1
	lda	hl,3(sp)
	ld	c,(hl)
;	genGoto
	jp	00117$
;	genLabel
00116$:
;	genUminus
;	AOP_STK for _atoi_n_1_1
	xor	a,a
	lda	hl,3(sp)
	ld	a,#0x00
	sbc	a,(hl)
	ld	c,a
;	genLabel
00117$:
;	genCast
; Removed redundent load
	ld	a,c
	rla	
	sbc	a,a
	ld	b,a
;	genRet
	ld	e,c
	ld	d,b
;	genLabel
00114$:
;	genEndFunction
	lda	sp,6(sp)
	ret
___atoi_end:
	.area _CODE
;--------------------------------------------------------
; code
;--------------------------------------------------------
	.area _CODE
	.area _CODE
