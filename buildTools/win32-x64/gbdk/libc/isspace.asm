;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:16 2019

;--------------------------------------------------------
	.module isspace
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _isspace
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
;	isspace.c 3
;	genLabel
;	genFunction
;	---------------------------------
; Function isspace
; ---------------------------------
___isspace_start:
_isspace:
	
;	isspace.c 5
;	genCmpEq
;	AOP_STK for 
; genCmpEq: left 1, right 1, result 0
	lda	hl,2(sp)
	ld	a,(hl)
	cp	a,#0x20
	jp	z,00101$
00110$:
;	genCmpEq
;	AOP_STK for 
; genCmpEq: left 1, right 1, result 0
	lda	hl,2(sp)
	ld	a,(hl)
	cp	a,#0x09
	jp	z,00101$
00111$:
;	genCmpEq
;	AOP_STK for 
; genCmpEq: left 1, right 1, result 0
	lda	hl,2(sp)
	ld	a,(hl)
	cp	a,#0x0A
	jp	nz,00102$
	jr	00113$
00112$:
	jp	00102$
00113$:
;	genLabel
00101$:
;	isspace.c 6
;	genRet
	ld	e,#0x01
	jp	00106$
;	genLabel
00102$:
;	isspace.c 8
;	genRet
	ld	e,#0x00
;	genLabel
00106$:
;	genEndFunction
	
	ret
___isspace_end:
	.area _CODE
