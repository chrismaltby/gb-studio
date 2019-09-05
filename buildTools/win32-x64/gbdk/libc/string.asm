;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:19 2019

;--------------------------------------------------------
	.module string
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _strcpy
	.globl _memcpy
	.globl _strcmp
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
;	string.c 7
;	genLabel
;	genFunction
;	---------------------------------
; Function strcpy
; ---------------------------------
___strcpy_start:
_strcpy:
	lda	sp,-4(sp)
;	string.c 9
;	genAssign
;	AOP_STK for 
;	AOP_STK for _strcpy_d_1_1
	lda	hl,6(sp)
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,2(sp)
	ld	(hl+),a
	ld	(hl),e
;	string.c 10
;	genAssign
;	AOP_STK for 
;	AOP_STK for _strcpy_s_1_1
	lda	hl,8(sp)
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,0(sp)
	ld	(hl+),a
	ld	(hl),e
;	string.c 11
;	genAssign
;	AOP_STK for _strcpy_d_1_1
;	(registers are the same)
;	genAssign
;	AOP_STK for _strcpy_s_1_1
	dec	hl
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genLabel
00101$:
;	genPointerGet
	ld	a,(bc)
;	genAssign (pointer)
;	AOP_STK for _strcpy_d_1_1
	lda	hl,2(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	(de),a
;	genIfx
	or	a,a
	jp	z,00103$
;	string.c 12
;	genPlus
;	AOP_STK for _strcpy_d_1_1
;	genPlusIncr
	dec	hl
	inc	(hl)
	jr	nz,00108$
	inc	hl
	inc	(hl)
00108$:
;	genPlus
;	genPlusIncr
	inc	bc
;	genGoto
	jp	00101$
;	genLabel
00103$:
;	string.c 13
;	genRet
;	AOP_STK for 
	lda	hl,6(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
;	genLabel
00104$:
;	genEndFunction
	lda	sp,4(sp)
	ret
___strcpy_end:
;	string.c 18
;	genLabel
;	genFunction
;	---------------------------------
; Function memcpy
; ---------------------------------
___memcpy_start:
_memcpy:
	lda	sp,-6(sp)
;	string.c 20
;	genAssign
;	(operands are equal 3)
;	string.c 21
;	genAssign
;	(operands are equal 3)
;	string.c 22
;	genAssign
;	AOP_STK for 
;	AOP_STK for _memcpy_d_1_1
	lda	hl,8(sp)
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,4(sp)
	ld	(hl+),a
	ld	(hl),e
;	genAssign
;	AOP_STK for 
;	AOP_STK for _memcpy_s_1_1
	lda	hl,10(sp)
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,2(sp)
	ld	(hl+),a
	ld	(hl),e
;	genAssign
;	AOP_STK for 
	lda	hl,12(sp)
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genLabel
00101$:
;	genAssign
;	AOP_STK for _memcpy_sloc0_1_0
	lda	hl,0(sp)
	ld	(hl),c
	inc	hl
	ld	(hl),b
;	genMinus
	dec	bc
;	genIfx
;	AOP_STK for _memcpy_sloc0_1_0
	dec	hl
	ld	a,(hl+)
	or	a,(hl)
	jp	z,00103$
;	string.c 23
;	genPointerGet
;	AOP_STK for _memcpy_s_1_1
	inc	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
;	genAssign (pointer)
;	AOP_STK for _memcpy_d_1_1
	inc	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	(de),a
;	string.c 24
;	genPlus
;	AOP_STK for _memcpy_d_1_1
;	genPlusIncr
	dec	hl
	inc	(hl)
	jr	nz,00108$
	inc	hl
	inc	(hl)
00108$:
;	string.c 25
;	genPlus
;	AOP_STK for _memcpy_s_1_1
;	genPlusIncr
	lda	hl,2(sp)
	inc	(hl)
	jr	nz,00109$
	inc	hl
	inc	(hl)
00109$:
;	genGoto
	jp	00101$
;	genLabel
00103$:
;	string.c 27
;	genRet
;	AOP_STK for 
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
;	genLabel
00104$:
;	genEndFunction
	lda	sp,6(sp)
	ret
___memcpy_end:
;	string.c 32
;	genLabel
;	genFunction
;	---------------------------------
; Function strcmp
; ---------------------------------
___strcmp_start:
_strcmp:
	lda	sp,-1(sp)
;	string.c 36
;	genAssign
;	(operands are equal 3)
;	genAssign
;	(operands are equal 3)
;	genLabel
00102$:
;	genPointerGet
;	AOP_STK for 
	lda	hl,3(sp)
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
;	genMinus
	ld	a,c
	sub	a,b
	ld	c,a
;	genAssign
;	AOP_STK for _strcmp_ret_1_1
	lda	hl,0(sp)
	ld	(hl),c
;	genIfx
;	genIfx
	xor	a,a
	or	a,c
	jp	nz,00104$
	or	a,b
	jp	z,00104$
;	string.c 37
;	genPlus
;	AOP_STK for 
;	genPlusIncr
	lda	hl,3(sp)
	inc	(hl)
	jr	nz,00117$
	inc	hl
	inc	(hl)
00117$:
;	genPlus
;	AOP_STK for 
;	genPlusIncr
	lda	hl,5(sp)
	inc	(hl)
	jr	nz,00118$
	inc	hl
	inc	(hl)
00118$:
;	genGoto
	jp	00102$
;	genLabel
00104$:
;	string.c 39
;	genCmpLt
;	AOP_STK for _strcmp_ret_1_1
	lda	hl,0(sp)
	ld	a,(hl)
	xor	a,#0x80
	cp	#0x00^0x80
	jp	nc,00108$
;	string.c 40
;	genRet
	ld	de,#0xFFFFFFFF
	jp	00110$
;	genLabel
00108$:
;	string.c 41
;	genCmpGt
;	AOP_STK for _strcmp_ret_1_1
	ld	e,#0x80
	lda	hl,0(sp)
	ld	a,(hl)
	xor	a,#0x80
	ld	d,a
	ld	a,e
	sub	a,d
	jp	nc,00109$
;	string.c 42
;	genRet
	ld	de,#0x0001
	jp	00110$
;	genLabel
00109$:
;	string.c 43
;	genRet
	ld	de,#0x0000
;	genLabel
00110$:
;	genEndFunction
	lda	sp,1(sp)
	ret
___strcmp_end:
	.area _CODE
;--------------------------------------------------------
; code
;--------------------------------------------------------
	.area _CODE
	.area _CODE
