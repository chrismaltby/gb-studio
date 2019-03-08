;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Sun Nov  4 12:04:07 2001

;--------------------------------------------------------
	.module gprintln
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _gprintln
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
;	gprintln.c 7
;	genLabel
;	genFunction
;	---------------------------------
; Function gprintln
; ---------------------------------
___gprintln_start:
_gprintln:
	lda	sp,-4(sp)
;	gprintln.c 11
;	genCmpLt
;	AOP_STK for 
	lda	hl,7(sp)
	ld	a,(hl)
	bit	7,a
	jp	z,00102$
;	genIfx
;	AOP_STK for 
	xor	a,a
	inc	hl
	inc	hl
	or	a,(hl)
	jp	z,00102$
;	gprintln.c 12
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	a,#0x2D
	push	af
	inc	sp
;	genCall
	call	_wrtchr
	lda	sp,1(sp)
;	gprintln.c 13
;	genUminus
;	AOP_STK for 
	xor	a,a
	lda	hl,6(sp)
	ld	a,#0x00
	sbc	a,(hl)
	ld	(hl+),a
	ld	a,#0x00
	sbc	a,(hl)
	ld	(hl),a
;	genLabel
00102$:
;	gprintln.c 15
;	genAssign
;	(operands are equal 3)
;	genCast
;	AOP_STK for 
;	AOP_STK for _gprintln_sloc0_1_0
	lda	hl,8(sp)
	ld	a,(hl)
	lda	hl,0(sp)
	ld	(hl+),a
	ld	(hl),#0x00
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
;	AOP_STK for _gprintln_sloc0_1_0
	dec	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genIpush
;	AOP_STK for 
	lda	hl,8(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	__divuint_rrx_s
	ld	b,d
	ld	c,e
	lda	sp,4(sp)
;	genAssign
;	AOP_STK for _gprintln_l_1_1
	lda	hl,2(sp)
	ld	(hl),c
	inc	hl
	ld	(hl),b
;	genCmpEq
; genCmpEq: left 2, right 2, result 0
	ld	a,c
	or	a,b
	jp	z,00105$
00111$:
;	gprintln.c 16
;	genAssign
;	AOP_STK for _gprintln_l_1_1
	lda	hl,2(sp)
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	a,#0x00
	push	af
	inc	sp
;	genIpush
;	AOP_STK for 
	lda	hl,9(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
	push	bc
;	genCall
	call	_gprintln
	lda	sp,4(sp)
;	genLabel
00105$:
;	gprintln.c 17
;	genAssign
;	AOP_STK for 
	lda	hl,6(sp)
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
;	AOP_STK for _gprintln_sloc0_1_0
	lda	hl,0(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genIpush
	push	bc
;	genCall
	call	__moduint_rrx_s
	ld	b,d
	ld	c,e
	lda	sp,4(sp)
;	genPlus
;	AOP_HL for _digits
;	Can't optimise plus by inc, falling back to the normal way
	ld	hl,#_digits
	ld	a,(hl)
	add	a,c
	ld	c,a
	inc	hl
	ld	a,(hl)
	adc	a,b
	ld	b,a
;	genPointerGet
	ld	a,(bc)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	c,a
	push	af
	inc	sp
;	genCall
	call	_wrtchr
	lda	sp,1(sp)
;	genLabel
00106$:
;	genEndFunction
	lda	sp,4(sp)
	ret
___gprintln_end:
	.area _CODE
