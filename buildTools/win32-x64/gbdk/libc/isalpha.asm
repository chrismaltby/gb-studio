;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:16 2019

;--------------------------------------------------------
	.module isalpha
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _isalpha
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
;	isalpha.c 3
;	genLabel
;	genFunction
;	---------------------------------
; Function isalpha
; ---------------------------------
___isalpha_start:
_isalpha:
	
;	isalpha.c 5
;	genCmpLt
;	AOP_STK for 
	lda	hl,2(sp)
	ld	a,(hl)
	xor	a,#0x80
	cp	#0x61^0x80
	jp	c,00106$
;	genCmpGt
;	AOP_STK for 
	ld	e,#0xFA
	ld	a,(hl)
	xor	a,#0x80
	ld	d,a
	ld	a,e
	sub	a,d
	jp	nc,00101$
;	genLabel
00106$:
;	genCmpLt
;	AOP_STK for 
	lda	hl,2(sp)
	ld	a,(hl)
	xor	a,#0x80
	cp	#0x41^0x80
	jp	c,00102$
;	genCmpGt
;	AOP_STK for 
	ld	e,#0xDA
	ld	a,(hl)
	xor	a,#0x80
	ld	d,a
	ld	a,e
	sub	a,d
	jp	c,00102$
;	genLabel
00101$:
;	isalpha.c 6
;	genRet
	ld	e,#0x01
	jp	00107$
;	genLabel
00102$:
;	isalpha.c 8
;	genRet
	ld	e,#0x00
;	genLabel
00107$:
;	genEndFunction
	
	ret
___isalpha_end:
	.area _CODE
