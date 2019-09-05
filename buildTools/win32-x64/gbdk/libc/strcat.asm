;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:19 2019

;--------------------------------------------------------
	.module strcat
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _strcat
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
;	strcat.c 8
;	genLabel
;	genFunction
;	---------------------------------
; Function strcat
; ---------------------------------
___strcat_start:
_strcat:
	lda	sp,-3(sp)
;	strcat.c 12
;	genAssign
;	AOP_STK for 
;	AOP_STK for _strcat_os1_1_1
	lda	hl,5(sp)
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,1(sp)
	ld	(hl+),a
	ld	(hl),e
;	strcat.c 13
;	genLabel
00101$:
;	genAssign
;	AOP_STK for 
	lda	hl,5(sp)
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genPointerGet
;	AOP_STK for _strcat_sloc0_1_0
	ld	a,(bc)
	lda	hl,0(sp)
	ld	(hl),a
;	genPlus
;	genPlusIncr
	inc	bc
;	genAssign
;	AOP_STK for 
	lda	hl,5(sp)
	ld	(hl),c
	inc	hl
	ld	(hl),b
;	genIfx
;	AOP_STK for _strcat_sloc0_1_0
	xor	a,a
	lda	hl,0(sp)
	or	a,(hl)
	jp	nz,00101$
;	strcat.c 15
;	genMinus
;	AOP_STK for 
; Removed redundent load
; Removed redundent load
	ld	de,#0x0001
	ld	a,c
	sub	a,e
	ld	e,a
	ld	a,b
	sbc	a,d
	lda	hl,6(sp)
	ld      (hl-),a
	ld	(hl),e
;	strcat.c 16
;	genAssign
;	(operands are equal 3)
;	genAssign
;	AOP_STK for 
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genLabel
00104$:
;	genPointerGet
;	AOP_STK for 
	lda	hl,7(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
;	genPlus
;	AOP_STK for 
;	genPlusIncr
	dec	hl
	inc	(hl)
	jr	nz,00113$
	inc	hl
	inc	(hl)
00113$:
;	genAssign (pointer)
	ld	(bc),a
;	genPlus
;	genPlusIncr
	inc	bc
;	genIfx
	or	a,a
	jp	nz,00104$
;	strcat.c 18
;	genRet
;	AOP_STK for _strcat_os1_1_1
	lda	hl,1(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
;	genLabel
00107$:
;	genEndFunction
	lda	sp,3(sp)
	ret
___strcat_end:
	.area _CODE
;--------------------------------------------------------
; code
;--------------------------------------------------------
	.area _CODE
	.area _CODE
