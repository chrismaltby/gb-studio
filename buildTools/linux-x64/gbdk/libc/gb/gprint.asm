;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Sun Nov  4 12:04:07 2001

;--------------------------------------------------------
	.module gprint
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _gprint
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
;	gprint.c 3
;	genLabel
;	genFunction
;	---------------------------------
; Function gprint
; ---------------------------------
___gprint_start:
_gprint:
	lda	sp,-1(sp)
;	gprint.c 5
;	genAssign
;	AOP_STK for 
	lda	hl,3(sp)
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genLabel
00101$:
;	genPointerGet
;	AOP_STK for _gprint_sloc0_1_0
	ld	a,(bc)
	lda	hl,0(sp)
	ld	(hl),a
;	genIfx
;	AOP_STK for _gprint_sloc0_1_0
	xor	a,a
	or	a,(hl)
	jp	z,00104$
;	gprint.c 6
;	genPlus
;	genPlusIncr
	inc	bc
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for _gprint_sloc0_1_0
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	_wrtchr
	lda	sp,1(sp)
	pop	bc
;	genGoto
	jp	00101$
;	genLabel
00104$:
;	genEndFunction
	lda	sp,1(sp)
	ret
___gprint_end:
	.area _CODE
;--------------------------------------------------------
; code
;--------------------------------------------------------
	.area _CODE
	.area _CODE
