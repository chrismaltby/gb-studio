;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:19 2019

;--------------------------------------------------------
	.module strncat
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _strncat
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
;	strncat.c 9
;	genLabel
;	genFunction
;	---------------------------------
; Function strncat
; ---------------------------------
___strncat_start:
_strncat:
	lda	sp,-3(sp)
;	strncat.c 13
;	genAssign
;	AOP_STK for 
;	AOP_STK for _strncat_os1_1_1
	lda	hl,5(sp)
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,1(sp)
	ld	(hl+),a
	ld	(hl),e
;	strncat.c 14
;	genLabel
00101$:
;	genAssign
;	AOP_STK for 
	lda	hl,5(sp)
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genPointerGet
;	AOP_STK for _strncat_sloc0_1_0
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
;	AOP_STK for _strncat_sloc0_1_0
	xor	a,a
	lda	hl,0(sp)
	or	a,(hl)
	jp	nz,00101$
;	strncat.c 16
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
;	strncat.c 17
;	genAssign
;	(operands are equal 3)
;	genAssign
;	(operands are equal 3)
;	genLabel
00106$:
;	genAssign
;	AOP_STK for 
	lda	hl,5(sp)
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genPointerGet
;	AOP_STK for 
;	AOP_STK for _strncat_sloc0_1_0
	inc	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,0(sp)
	ld	(hl),a
;	genPlus
;	AOP_STK for 
;	genPlusIncr
	lda	hl,7(sp)
	inc	(hl)
	jr	nz,00116$
	inc	hl
	inc	(hl)
00116$:
;	genAssign (pointer)
;	AOP_STK for _strncat_sloc0_1_0
	lda	hl,0(sp)
	ld	a,(hl)
	ld	(bc),a
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
;	AOP_STK for _strncat_sloc0_1_0
	xor	a,a
	lda	hl,0(sp)
	or	a,(hl)
	jp	z,00108$
;	strncat.c 18
;	genCmpEq
;	AOP_STK for 
; genCmpEq: left 2, right 2, result 0
	lda	hl,9(sp)
	ld	a,(hl+)
	or	a,(hl)
	jp	nz,00105$
	jr	00118$
00117$:
	jp	00105$
00118$:
;	strncat.c 19
;	genMinus
	dec	bc
;	genAssign (pointer)
	ld	a,#0x00
	ld	(bc),a
;	strncat.c 20
;	genGoto
	jp	00108$
;	genLabel
00105$:
;	strncat.c 22
;	genMinus
;	AOP_STK for 
	lda	hl,9(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	dec	de
	dec	hl
	ld	(hl),e
	inc	hl
	ld	(hl),d
;	genGoto
	jp	00106$
;	genLabel
00108$:
;	strncat.c 24
;	genRet
;	AOP_STK for _strncat_os1_1_1
	lda	hl,1(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
;	genLabel
00109$:
;	genEndFunction
	lda	sp,3(sp)
	ret
___strncat_end:
	.area _CODE
;--------------------------------------------------------
; code
;--------------------------------------------------------
	.area _CODE
	.area _CODE
