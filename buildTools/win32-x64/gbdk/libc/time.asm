;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:20 2019

;--------------------------------------------------------
	.module time
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _time
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
;	time.c 9
;	genLabel
;	genFunction
;	---------------------------------
; Function time
; ---------------------------------
___time_start:
_time:
	lda	sp,-2(sp)
;	time.c 14
;	genCall
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	call	_clock
	ld	b,d
	ld	c,e
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	hl,#0x0064
	push	hl
;	genIpush
	push	bc
;	genCall
	call	__divuint_rrx_s
	ld	b,d
	ld	c,e
	lda	sp,4(sp)
;	genAssign
;	AOP_STK for _time_ret_1_1
	lda	hl,0(sp)
	ld	(hl),c
	inc	hl
	ld	(hl),b
;	time.c 16
;	genIfx
;	AOP_STK for 
	lda	hl,4(sp)
	ld	a,(hl+)
	or	a,(hl)
	jp	z,00102$
;	time.c 17
;	genAssign
;	AOP_STK for 
	dec	hl
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genAssign (pointer)
;	AOP_STK for _time_ret_1_1
	ld	e,c
	ld	d,b
	lda	hl,0(sp)
	ld	a,(hl)
	ld	(de),a
	inc	de
	inc	hl
	ld	a,(hl)
	ld	(de),a
;	genLabel
00102$:
;	time.c 19
;	genRet
;	AOP_STK for _time_ret_1_1
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
;	genLabel
00103$:
;	genEndFunction
	lda	sp,2(sp)
	ret
___time_end:
	.area _CODE
