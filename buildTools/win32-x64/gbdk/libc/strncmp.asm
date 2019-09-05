;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:20 2019

;--------------------------------------------------------
	.module strncmp
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _strncmp
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
;	strncmp.c 10
;	genLabel
;	genFunction
;	---------------------------------
; Function strncmp
; ---------------------------------
___strncmp_start:
_strncmp:
	lda	sp,-4(sp)
;	strncmp.c 12
;	genAssign
;	(operands are equal 3)
;	genAssign
;	(operands are equal 3)
;	genAssign
;	(operands are equal 3)
;	genLabel
00104$:
;	genCmpGt
;	AOP_STK for 
	ld	e,#0x80
	lda	hl,11(sp)
	ld	a,(hl)
	xor	a,#0x80
	ld	d,a
	ld	a,#0x00
	dec	hl
	sub	a,(hl)
	ld	a,e
	sbc	a,d
	jp	nc,00106$
;	genPointerGet
;	AOP_STK for 
	lda	hl,6(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	ld	c,a
;	genPointerGet
;	AOP_STK for 
	inc	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	ld	b,a
;	genPlus
;	AOP_STK for 
;	genPlusIncr
	dec	hl
	inc	(hl)
	jr	nz,00116$
	inc	hl
	inc	(hl)
00116$:
;	genAssign
;	(operands are equal 4)
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	cp	b
	jp	nz,00106$
	jr	00118$
00117$:
	jp	00106$
00118$:
;	strncmp.c 13
;	genPlus
;	AOP_STK for 
;	genPlusIncr
	lda	hl,6(sp)
	inc	(hl)
	jr	nz,00119$
	inc	hl
	inc	(hl)
00119$:
;	genAssign
;	(operands are equal 4)
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	or	a,a
	jp	nz,00102$
	jr	00121$
00120$:
	jp	00102$
00121$:
;	strncmp.c 14
;	genRet
	ld	de,#0x0000
	jp	00107$
;	genLabel
00102$:
;	strncmp.c 15
;	genMinus
;	AOP_STK for 
	lda	hl,10(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	dec	de
	dec	hl
	ld	(hl),e
	inc	hl
	ld	(hl),d
;	genAssign
;	(operands are equal 4)
;	genGoto
	jp	00104$
;	genLabel
00106$:
;	strncmp.c 17
;	genCmpEq
;	AOP_STK for 
; genCmpEq: left 2, right 2, result 0
	lda	hl,10(sp)
	ld	a,(hl+)
	or	a,(hl)
	jp	nz,00109$
	jr	00123$
00122$:
	jp	00109$
00123$:
;	genAssign
;	AOP_STK for _strncmp_sloc2_1_0
	lda	hl,0(sp)
	ld	(hl),#0x00
;	genGoto
	jp	00110$
;	genLabel
00109$:
;	genAssign
;	AOP_STK for 
;	AOP_STK for _strncmp_sloc0_1_0
	lda	hl,6(sp)
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,2(sp)
	ld	(hl+),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _strncmp_sloc0_1_0
;	AOP_STK for _strncmp_sloc1_1_0
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	dec	hl
	dec	hl
	ld	(hl),a
;	genMinus
;	AOP_STK for 
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	ld	c,a
	ld	b,e
;	genPointerGet
	ld	e,b
	ld	d,c
	ld	a,(de)
	ld	b,a
;	genMinus
;	AOP_STK for _strncmp_sloc1_1_0
;	AOP_STK for _strncmp_sloc2_1_0
	lda	hl,1(sp)
	ld	a,(hl)
	sub	a,b
	dec	hl
	ld	(hl),a
;	genLabel
00110$:
;	genCast
;	AOP_STK for _strncmp_sloc2_1_0
	lda	hl,0(sp)
	ld	c,(hl)
	ld	a,(hl)
	rla	
	sbc	a,a
	ld	b,a
;	genRet
	ld	e,c
	ld	d,b
;	genLabel
00107$:
;	genEndFunction
	lda	sp,4(sp)
	ret
___strncmp_end:
	.area _CODE
;--------------------------------------------------------
; code
;--------------------------------------------------------
	.area _CODE
	.area _CODE
