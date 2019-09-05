;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:18 2019

;--------------------------------------------------------
	.module reverse
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _reverse
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
;	reverse.c 5
;	genLabel
;	genFunction
;	---------------------------------
; Function reverse
; ---------------------------------
___reverse_start:
_reverse:
	lda	sp,-5(sp)
;	reverse.c 11
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
;	AOP_STK for 
	lda	hl,7(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	_strlen
	ld	b,d
	ld	c,e
	lda	sp,2(sp)
;	genMinus
	dec	bc
;	genCast
; Removed redundent load
;	reverse.c 12
;	genAssign
;	AOP_STK for _reverse_i_1_1
	lda	hl,4(sp)
	ld	(hl),#0x00
;	genAssign
;	AOP_STK for _reverse_j_1_1
	dec	hl
	ld	(hl),c
;	genLabel
00101$:
;	genCmpLt
;	AOP_STK for _reverse_i_1_1
;	AOP_STK for _reverse_j_1_1
	lda	hl,4(sp)
	ld	a,(hl)
	dec	hl
	sub	a,(hl)
	jp	nc,00103$
;	reverse.c 13
;	genPlus
;	AOP_STK for 
;	AOP_STK for _reverse_i_1_1
;	AOP_STK for _reverse_sloc0_1_0
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,7(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,4(sp)
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,0(sp)
;	genPointerGet
;	AOP_STK for _reverse_sloc0_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	ld	c,a
;	genAssign
;	AOP_STK for _reverse_c_1_1
	inc	hl
	ld	(hl),c
;	reverse.c 14
;	genPlus
;	AOP_STK for 
;	AOP_STK for _reverse_j_1_1
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,7(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,3(sp)
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	c,l
	ld	b,h
;	genPointerGet
	ld	a,(bc)
;	genAssign (pointer)
;	AOP_STK for _reverse_sloc0_1_0
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	(de),a
;	reverse.c 15
;	genAssign (pointer)
;	AOP_STK for _reverse_c_1_1
	inc	hl
	ld	a,(hl)
	ld	(bc),a
;	reverse.c 16
;	genPlus
;	AOP_STK for _reverse_i_1_1
;	genPlusIncr
	inc	hl
	inc	hl
	inc	(hl)
;	reverse.c 17
;	genMinus
;	AOP_STK for _reverse_j_1_1
	dec	hl
	dec	(hl)
;	genGoto
	jp	00101$
;	genLabel
00103$:
;	reverse.c 19
;	genRet
;	AOP_STK for 
	lda	hl,7(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
;	genLabel
00104$:
;	genEndFunction
	lda	sp,5(sp)
	ret
___reverse_end:
	.area _CODE
