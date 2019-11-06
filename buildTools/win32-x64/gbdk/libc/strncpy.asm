;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:20 2019

;--------------------------------------------------------
	.module strncpy
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _strncpy
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
;	strncpy.c 8
;	genLabel
;	genFunction
;	---------------------------------
; Function strncpy
; ---------------------------------
___strncpy_start:
_strncpy:
	lda	sp,-4(sp)
;	strncpy.c 13
;	genAssign
;	AOP_STK for 
;	AOP_STK for _strncpy_os1_1_1
	lda	hl,6(sp)
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,0(sp)
	ld	(hl+),a
	ld	(hl),e
;	strncpy.c 14
;	genAssign
;	AOP_STK for _strncpy_i_1_1
	inc	hl
	ld	(hl),#0x00
	inc	hl
	ld	(hl),#0x00
;	genAssign
;	(operands are equal 3)
;	genAssign
;	AOP_STK for _strncpy_os1_1_1
;	AOP_STK for 
	lda	hl,0(sp)
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,6(sp)
	ld	(hl+),a
	ld	(hl),e
;	genAssign
;	AOP_STK for _strncpy_i_1_1
	lda	hl,2(sp)
	ld	(hl),#0x00
	inc	hl
	ld	(hl),#0x00
;	genLabel
00106$:
;	genCmpLt
;	AOP_STK for _strncpy_i_1_1
;	AOP_STK for 
	lda	hl,3(sp)
	ld	a,(hl)
	xor	a,#0x80
	ld	e,a
	lda	hl,11(sp)
	ld	a,(hl)
	xor	a,#0x80
	ld	d,a
	lda	hl,2(sp)
	ld	a,(hl)
	lda	hl,10(sp)
	sub	a,(hl)
	ld	a,e
	sbc	a,d
	jp	nc,00109$
;	strncpy.c 15
;	genPointerGet
;	AOP_STK for 
	dec	hl
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	ld	c,a
;	genPlus
;	AOP_STK for 
;	genPlusIncr
	dec	hl
	inc	(hl)
	jr	nz,00116$
	inc	hl
	inc	(hl)
00116$:
;	genAssign (pointer)
;	AOP_STK for 
	lda	hl,6(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,c
	ld	(de),a
;	genPlus
;	AOP_STK for 
;	genPlusIncr
	dec	hl
	inc	(hl)
	jr	nz,00117$
	inc	hl
	inc	(hl)
00117$:
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	or	a,a
	jp	nz,00108$
	jr	00119$
00118$:
	jp	00108$
00119$:
;	strncpy.c 16
;	genAssign
;	AOP_STK for 
;	(registers are the same)
;	genAssign
;	AOP_STK for _strncpy_i_1_1
	lda	hl,2(sp)
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genLabel
00101$:
;	genPlus
;	genPlusIncr
	inc	bc
;	genCmpLt
;	AOP_STK for 
	ld	a,b
	xor	a,#0x80
	ld	e,a
	lda	hl,11(sp)
	ld	a,(hl)
	xor	a,#0x80
	ld	d,a
	ld	a,c
	dec	hl
	sub	a,(hl)
	ld	a,e
	sbc	a,d
	jp	nc,00103$
;	strncpy.c 17
;	genAssign (pointer)
;	AOP_STK for 
	lda	hl,6(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,#0x00
	ld	(de),a
;	genPlus
;	AOP_STK for 
;	genPlusIncr
	dec	hl
	inc	(hl)
	jr	nz,00120$
	inc	hl
	inc	(hl)
00120$:
;	genGoto
	jp	00101$
;	genLabel
00103$:
;	strncpy.c 18
;	genRet
;	AOP_STK for _strncpy_os1_1_1
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	jp	00110$
;	genLabel
00108$:
;	strncpy.c 14
;	genPlus
;	AOP_STK for _strncpy_i_1_1
;	genPlusIncr
	lda	hl,2(sp)
	inc	(hl)
	jr	nz,00121$
	inc	hl
	inc	(hl)
00121$:
;	genAssign
;	AOP_STK for _strncpy_i_1_1
;	(registers are the same)
;	genGoto
	jp	00106$
;	genLabel
00109$:
;	strncpy.c 20
;	genRet
;	AOP_STK for _strncpy_os1_1_1
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
;	genLabel
00110$:
;	genEndFunction
	lda	sp,4(sp)
	ret
___strncpy_end:
	.area _CODE
;--------------------------------------------------------
; code
;--------------------------------------------------------
	.area _CODE
	.area _CODE
