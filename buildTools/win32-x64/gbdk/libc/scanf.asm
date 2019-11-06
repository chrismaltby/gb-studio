;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Wed Sep 04 21:56:18 2019

;--------------------------------------------------------
	.module scanf
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _scanf
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
;	scanf.c 5
;	genLabel
;	genFunction
;	---------------------------------
; Function scan_skip
; ---------------------------------
___scan_skip_start:
_scan_skip:
	lda	sp,-1(sp)
;	scanf.c 8
;	genLabel
00102$:
;	genPlus
;	AOP_STK for 
;	AOP_STK for 
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,3(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	c,l
	ld	b,h
;	genPointerGet
;	AOP_STK for _scan_skip_sloc0_1_0
	ld	a,(bc)
	lda	hl,0(sp)
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for _scan_skip_sloc0_1_0
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	_isspace
;	AOP_STK for _scan_skip_sloc0_1_0
	lda	hl,3(sp)
	ld	(hl),e
	lda	sp,1(sp)
	pop	bc
;	genIfx
;	AOP_STK for _scan_skip_sloc0_1_0
	xor	a,a
	lda	hl,0(sp)
	or	a,(hl)
	jp	z,00104$
;	scanf.c 9
;	genAssign
;	AOP_STK for 
;	AOP_STK for _scan_skip_sloc0_1_0
	lda	hl,5(sp)
	ld	a,(hl)
	lda	hl,0(sp)
;	genPlus
;	AOP_STK for _scan_skip_sloc0_1_0
;	AOP_STK for 
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	ld      (hl),a
; Removed redundent load
	add	a,#0x01
	lda	hl,5(sp)
	ld	(hl),a
;	genGoto
	jp	00102$
;	genLabel
00104$:
;	scanf.c 10
;	genPointerGet
	ld	a,(bc)
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	c,a
	or	a,a
	jp	nz,00106$
	jr	00113$
00112$:
	jp	00106$
00113$:
;	scanf.c 11
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
;	AOP_STK for 
	lda	hl,3(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	_gets
	lda	sp,2(sp)
;	scanf.c 12
;	genAssign
;	AOP_STK for 
	lda	hl,5(sp)
	ld	(hl),#0x00
;	scanf.c 13
;	genGoto
	jp	00102$
;	genLabel
00106$:
;	scanf.c 15
;	genRet
;	AOP_STK for 
	lda	hl,5(sp)
	ld	e,(hl)
;	genLabel
00107$:
;	genEndFunction
	lda	sp,1(sp)
	ret
___scan_skip_end:
;	scanf.c 18
;	genLabel
;	genFunction
;	---------------------------------
; Function scan_int
; ---------------------------------
___scan_int_start:
_scan_int:
	lda	sp,-5(sp)
;	scanf.c 20
;	genAssign
;	AOP_STK for _scan_int_n_1_1
	lda	hl,4(sp)
	ld	(hl),#0x00
;	scanf.c 21
;	genAssign
;	AOP_STK for _scan_int_sign_1_1
	dec	hl
	dec	hl
	ld	(hl),#0x00
;	scanf.c 23
;	genPlus
;	AOP_STK for 
;	AOP_STK for 
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,7(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	b,l
	ld	c,h
;	genPointerGet
	ld	e,b
	ld	d,c
	ld	a,(de)
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	c,a
	cp	a,#0x2B
	jp	z,00102$
00126$:
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	cp	a,#0x2D
	jp	nz,00124$
	jr	00128$
00127$:
	jp	00124$
00128$:
;	scanf.c 26
;	genAssign
;	AOP_STK for _scan_int_sign_1_1
	lda	hl,2(sp)
	ld	(hl),#0x01
;	scanf.c 29
;	genLabel
00102$:
;	genPlus
;	AOP_STK for 
;	genPlusIncr
	lda	hl,9(sp)
	inc	(hl)
;	scanf.c 32
;	genLabel
00124$:
;	genAssign
;	(operands are equal 3)
;	genLabel
00113$:
;	scanf.c 33
;	genPlus
;	AOP_STK for 
;	AOP_STK for 
;	AOP_STK for _scan_int_sloc0_1_0
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,7(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,0(sp)
;	genPointerGet
;	AOP_STK for _scan_int_sloc0_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	b,a
	push	af
	inc	sp
;	genCall
	call	_isdigit
	ld	b,e
	lda	sp,1(sp)
;	genIfx
	xor	a,a
	or	a,b
	jp	z,00108$
;	scanf.c 34
;	genPointerGet
;	AOP_STK for _scan_int_sloc0_1_0
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
;	genMinus
;	AOP_STK for _scan_int_j_1_1
	ld	b,a
	add	a,#0xD0
	inc	hl
	inc	hl
	ld	(hl),a
;	genGoto
	jp	00109$
;	genLabel
00108$:
;	scanf.c 35
;	genPointerGet
;	AOP_STK for _scan_int_sloc0_1_0
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	b,a
	push	af
	inc	sp
;	genCall
	call	_isalpha
	ld	b,e
	lda	sp,1(sp)
;	genIfx
	xor	a,a
	or	a,b
	jp	z,00114$
;	scanf.c 36
;	genPointerGet
;	AOP_STK for _scan_int_sloc0_1_0
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	b,a
	push	af
	inc	sp
;	genCall
	call	_toupper
	ld	b,e
	lda	sp,1(sp)
;	genMinus
	ld	a,b
	add	a,#0xBF
;	genPlus
;	AOP_STK for _scan_int_j_1_1
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	ld	b,a
	add	a,#0x0A
	lda	hl,3(sp)
	ld	(hl),a
;	scanf.c 38
;	genLabel
00109$:
;	scanf.c 39
;	genCmpLt
;	AOP_STK for _scan_int_j_1_1
;	AOP_STK for 
	lda	hl,3(sp)
	ld	a,(hl)
	lda	hl,10(sp)
	sub	a,(hl)
	jp	nc,00114$
;	scanf.c 41
;	genAssign
;	AOP_STK for _scan_int_n_1_1
	lda	hl,4(sp)
	ld	b,(hl)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	a,b
	push	af
	inc	sp
;	genIpush
;	AOP_STK for 
	lda	hl,11(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	__muluchar_rrx_s
	ld	c,d
	ld	b,e
	lda	sp,2(sp)
;	genCast
;	AOP_STK for _scan_int_j_1_1
;	AOP_STK for _scan_int_sloc0_1_0
	lda	hl,3(sp)
	ld	a,(hl)
	lda	hl,0(sp)
	ld	(hl+),a
	ld	(hl),#0x00
;	genPlus
;	AOP_STK for _scan_int_sloc0_1_0
;	Can't optimise plus by inc, falling back to the normal way
	ld	e,b
	ld	d,c
	dec	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	add	hl,de
	ld	b,l
	ld	c,h
;	genCast
;	AOP_STK for _scan_int_n_1_1
	lda	hl,4(sp)
	ld	(hl),b
;	scanf.c 42
;	genPlus
;	AOP_STK for 
;	genPlusIncr
	lda	hl,9(sp)
	inc	(hl)
;	genGoto
	jp	00113$
;	genLabel
00114$:
;	scanf.c 44
;	genAssign
;	AOP_STK for 
	lda	hl,11(sp)
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genCmpEq
;	AOP_STK for _scan_int_sign_1_1
; genCmpEq: left 1, right 1, result 0
	lda	hl,2(sp)
	ld	a,(hl)
	or	a,a
	jp	nz,00117$
	jr	00130$
00129$:
	jp	00117$
00130$:
;	genAssign
;	AOP_STK for _scan_int_n_1_1
;	AOP_STK for _scan_int_sloc0_1_0
	lda	hl,4(sp)
	ld	a,(hl)
	lda	hl,0(sp)
	ld	(hl),a
;	genGoto
	jp	00118$
;	genLabel
00117$:
;	genUminus
;	AOP_STK for _scan_int_n_1_1
;	AOP_STK for _scan_int_sloc0_1_0
	xor	a,a
	lda	hl,4(sp)
	ld	a,#0x00
	sbc	a,(hl)
	lda	hl,0(sp)
	ld	(hl),a
;	genLabel
00118$:
;	genAssign (pointer)
;	AOP_STK for _scan_int_sloc0_1_0
	lda	hl,0(sp)
	ld	a,(hl)
	ld	(bc),a
;	scanf.c 45
;	genRet
;	AOP_STK for 
	lda	hl,9(sp)
	ld	e,(hl)
;	genLabel
00115$:
;	genEndFunction
	lda	sp,5(sp)
	ret
___scan_int_end:
;	scanf.c 48
;	genLabel
;	genFunction
;	---------------------------------
; Function scan_long
; ---------------------------------
___scan_long_start:
_scan_long:
	lda	sp,-6(sp)
;	scanf.c 50
;	genAssign
;	AOP_STK for _scan_long_n_1_1
	lda	hl,4(sp)
	ld	(hl),#0x00
	inc	hl
	ld	(hl),#0x00
;	scanf.c 51
;	genAssign
;	AOP_STK for _scan_long_sign_1_1
	lda	hl,2(sp)
	ld	(hl),#0x00
;	scanf.c 53
;	genPlus
;	AOP_STK for 
;	AOP_STK for 
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	c,l
	ld	b,h
;	genPointerGet
	ld	a,(bc)
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	c,a
	cp	a,#0x2B
	jp	z,00102$
00126$:
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	cp	a,#0x2D
	jp	nz,00124$
	jr	00128$
00127$:
	jp	00124$
00128$:
;	scanf.c 56
;	genAssign
;	AOP_STK for _scan_long_sign_1_1
	lda	hl,2(sp)
	ld	(hl),#0x01
;	scanf.c 59
;	genLabel
00102$:
;	genPlus
;	AOP_STK for 
;	genPlusIncr
	lda	hl,10(sp)
	inc	(hl)
;	scanf.c 62
;	genLabel
00124$:
;	genAssign
;	(operands are equal 3)
;	genLabel
00113$:
;	scanf.c 63
;	genPlus
;	AOP_STK for 
;	AOP_STK for 
;	AOP_STK for _scan_long_sloc0_1_0
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,0(sp)
;	genPointerGet
;	AOP_STK for _scan_long_sloc0_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	b,a
	push	af
	inc	sp
;	genCall
	call	_isdigit
	ld	b,e
	lda	sp,1(sp)
;	genIfx
	xor	a,a
	or	a,b
	jp	z,00108$
;	scanf.c 64
;	genPointerGet
;	AOP_STK for _scan_long_sloc0_1_0
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
;	genMinus
;	AOP_STK for _scan_long_j_1_1
	ld	b,a
	add	a,#0xD0
	inc	hl
	inc	hl
	ld	(hl),a
;	genGoto
	jp	00109$
;	genLabel
00108$:
;	scanf.c 65
;	genPointerGet
;	AOP_STK for _scan_long_sloc0_1_0
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	b,a
	push	af
	inc	sp
;	genCall
	call	_isalpha
	ld	b,e
	lda	sp,1(sp)
;	genIfx
	xor	a,a
	or	a,b
	jp	z,00114$
;	scanf.c 66
;	genPointerGet
;	AOP_STK for _scan_long_sloc0_1_0
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	b,a
	push	af
	inc	sp
;	genCall
	call	_toupper
	ld	b,e
	lda	sp,1(sp)
;	genMinus
	ld	a,b
	add	a,#0xBF
;	genPlus
;	AOP_STK for _scan_long_j_1_1
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	ld	b,a
	add	a,#0x0A
	lda	hl,3(sp)
	ld	(hl),a
;	scanf.c 68
;	genLabel
00109$:
;	scanf.c 69
;	genCmpLt
;	AOP_STK for _scan_long_j_1_1
;	AOP_STK for 
	lda	hl,3(sp)
	ld	a,(hl)
	lda	hl,11(sp)
	sub	a,(hl)
	jp	nc,00114$
;	scanf.c 71
;	genCast
;	AOP_STK for 
;	AOP_STK for _scan_long_sloc0_1_0
	ld	a,(hl)
	lda	hl,0(sp)
	ld	(hl+),a
	ld	(hl),#0x00
;	genAssign
;	AOP_STK for _scan_long_n_1_1
	lda	hl,4(sp)
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	push	bc
;	genIpush
;	AOP_STK for _scan_long_sloc0_1_0
	lda	hl,2(sp)
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	__muluint_rrx_s
	ld	b,d
	ld	c,e
	lda	sp,4(sp)
;	genCast
;	AOP_STK for _scan_long_j_1_1
;	AOP_STK for _scan_long_sloc0_1_0
	lda	hl,3(sp)
	ld	a,(hl)
	lda	hl,0(sp)
	ld	(hl+),a
	ld	(hl),#0x00
;	genPlus
;	AOP_STK for _scan_long_sloc0_1_0
;	Can't optimise plus by inc, falling back to the normal way
	dec	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	add	hl,bc
	ld	c,l
	ld	b,h
;	genAssign
;	AOP_STK for _scan_long_n_1_1
	lda	hl,4(sp)
	ld	(hl),c
	inc	hl
	ld	(hl),b
;	scanf.c 72
;	genPlus
;	AOP_STK for 
;	genPlusIncr
	lda	hl,10(sp)
	inc	(hl)
;	genGoto
	jp	00113$
;	genLabel
00114$:
;	scanf.c 74
;	genAssign
;	AOP_STK for 
	lda	hl,12(sp)
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genCmpEq
;	AOP_STK for _scan_long_sign_1_1
; genCmpEq: left 1, right 1, result 0
	lda	hl,2(sp)
	ld	a,(hl)
	or	a,a
	jp	nz,00117$
	jr	00130$
00129$:
	jp	00117$
00130$:
;	genAssign
;	AOP_STK for _scan_long_n_1_1
;	AOP_STK for _scan_long_sloc0_1_0
	lda	hl,4(sp)
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,0(sp)
	ld	(hl+),a
	ld	(hl),e
;	genGoto
	jp	00118$
;	genLabel
00117$:
;	genUminus
;	AOP_STK for _scan_long_n_1_1
;	AOP_STK for _scan_long_sloc0_1_0
	xor	a,a
	lda	hl,4(sp)
	ld	a,#0x00
	sbc	a,(hl)
	lda	hl,0(sp)
	ld	(hl),a
	lda	hl,5(sp)
	ld	a,#0x00
	sbc	a,(hl)
	lda	hl,1(sp)
	ld	(hl),a
;	genLabel
00118$:
;	genAssign (pointer)
;	AOP_STK for _scan_long_sloc0_1_0
	ld	e,c
	ld	d,b
	lda	hl,0(sp)
	ld	a,(hl)
	ld	(de),a
	inc	de
	inc	hl
	ld	a,(hl)
	ld	(de),a
;	scanf.c 75
;	genRet
;	AOP_STK for 
	lda	hl,10(sp)
	ld	e,(hl)
;	genLabel
00115$:
;	genEndFunction
	lda	sp,6(sp)
	ret
___scan_long_end:
;	scanf.c 78
;	genLabel
;	genFunction
;	---------------------------------
; Function scanf
; ---------------------------------
___scanf_start:
_scanf:
	lda	sp,-83(sp)
;	scanf.c 82
;	genAssign
;	AOP_STK for _scanf_i_1_1
	lda	hl,16(sp)
	ld	(hl),#0x00
;	scanf.c 83
;	genAssign
;	AOP_STK for _scanf_nb_1_1
	dec	hl
	ld	(hl),#0x00
;	scanf.c 85
;	genAddrOf
	lda	hl,17(sp)
	ld	b,l
	ld	c,h
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
	ld	l,b
	ld	h,c
	push	hl
;	genCall
	call	_gets
	lda	sp,2(sp)
	pop	bc
;	scanf.c 86
;	genAddrOf
;	AOP_STK for _scanf_sloc0_1_0
	lda	hl,85(sp)
	ld	a,l
	ld	d,h
	lda	hl,10(sp)
	ld	(hl+),a
	ld	(hl),d
;	genPlus
;	AOP_STK for _scanf_sloc0_1_0
;	AOP_STK for _scanf_ap_1_1
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,81(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _scanf_nb_1_1
	lda	hl,15(sp)
	ld	(hl),#0x00
;	genLabel
00127$:
;	scanf.c 87
;	genAssign
;	AOP_STK for 
;	AOP_STK for _scanf_sloc0_1_0
	lda	hl,85(sp)
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,10(sp)
	ld	(hl+),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _scanf_sloc0_1_0
;	AOP_STK for _scanf_sloc1_1_0
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	dec	hl
	dec	hl
	ld	(hl),a
;	genIfx
;	AOP_STK for _scanf_sloc1_1_0
	xor	a,a
	or	a,(hl)
	jp	z,00130$
;	scanf.c 88
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for _scanf_sloc1_1_0
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	_isspace
;	AOP_STK for _scanf_sloc1_1_0
	lda	hl,12(sp)
	ld	(hl),e
	lda	sp,1(sp)
	pop	bc
;	genIfx
;	AOP_STK for _scanf_sloc1_1_0
	xor	a,a
	lda	hl,9(sp)
	or	a,(hl)
	jp	nz,00129$
;	scanf.c 90
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for _scanf_i_1_1
	lda	hl,18(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
	ld	l,b
	ld	h,c
	push	hl
;	genCall
	call	_scan_skip
;	AOP_STK for _scanf_i_1_1
	lda	hl,21(sp)
	ld	(hl),e
	lda	sp,3(sp)
	pop	bc
;	genAssign
;	AOP_STK for _scanf_i_1_1
;	(registers are the same)
;	scanf.c 91
;	genPointerGet
;	AOP_STK for _scanf_sloc0_1_0
;	AOP_STK for _scanf_sloc1_1_0
	lda	hl,10(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	dec	hl
	dec	hl
;	genCmpEq
;	AOP_STK for _scanf_sloc1_1_0
; genCmpEq: left 1, right 1, result 0
	ld      (hl),a
; Removed redundent load
	cp	a,#0x25
	jp	nz,00125$
	jr	00153$
00152$:
	jp	00125$
00153$:
;	scanf.c 92
;	genPlus
;	AOP_STK for _scanf_sloc0_1_0
;	AOP_STK for 
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,10(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,85(sp)
;	genAssign
;	(operands are equal 4)
;	genPointerGet
;	AOP_STK for 
;	AOP_STK for _scanf_sloc0_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	lda	hl,10(sp)
;	genCmpEq
;	AOP_STK for _scanf_sloc0_1_0
; genCmpEq: left 1, right 1, result 0
	ld      (hl),a
; Removed redundent load
	cp	a,#0x63
	jp	z,00103$
00154$:
;	genCmpEq
;	AOP_STK for _scanf_sloc0_1_0
; genCmpEq: left 1, right 1, result 0
	lda	hl,10(sp)
	ld	a,(hl)
	cp	a,#0x64
	jp	z,00104$
00155$:
;	genCmpEq
;	AOP_STK for _scanf_sloc0_1_0
; genCmpEq: left 1, right 1, result 0
	lda	hl,10(sp)
	ld	a,(hl)
	cp	a,#0x6C
	jp	z,00117$
00156$:
;	genCmpEq
;	AOP_STK for _scanf_sloc0_1_0
; genCmpEq: left 1, right 1, result 0
	lda	hl,10(sp)
	ld	a,(hl)
	cp	a,#0x6F
	jp	z,00106$
00157$:
;	genCmpEq
;	AOP_STK for _scanf_sloc0_1_0
; genCmpEq: left 1, right 1, result 0
	lda	hl,10(sp)
	ld	a,(hl)
	cp	a,#0x73
	jp	z,00111$
00158$:
;	genCmpEq
;	AOP_STK for _scanf_sloc0_1_0
; genCmpEq: left 1, right 1, result 0
	lda	hl,10(sp)
	ld	a,(hl)
	cp	a,#0x75
	jp	z,00104$
00159$:
;	genCmpEq
;	AOP_STK for _scanf_sloc0_1_0
; genCmpEq: left 1, right 1, result 0
	lda	hl,10(sp)
	ld	a,(hl)
	cp	a,#0x78
	jp	z,00107$
00160$:
;	genGoto
	jp	00120$
;	scanf.c 95
;	genLabel
00103$:
;	genPlus
;	AOP_STK for _scanf_ap_1_1
;	AOP_STK for _scanf_sloc2_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,81(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,7(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _scanf_sloc2_1_0
;	AOP_STK for _scanf_ap_1_1
	dec	hl
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,81(sp)
	ld	(hl+),a
	ld	(hl),e
;	genMinus
;	AOP_STK for _scanf_sloc2_1_0
;	AOP_STK for _scanf_sloc3_1_0
	lda	hl,7(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	lda	hl,6(sp)
	ld      (hl-),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _scanf_sloc3_1_0
;	AOP_STK for _scanf_sloc2_1_0
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	inc	hl
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	genAssign
;	AOP_STK for _scanf_i_1_1
;	AOP_STK for _scanf_sloc3_1_0
	lda	hl,16(sp)
	ld	a,(hl)
	lda	hl,5(sp)
	ld	(hl),a
;	genPlus
;	AOP_STK for _scanf_i_1_1
;	genPlusIncr
	lda	hl,16(sp)
	inc	(hl)
;	genPlus
;	AOP_STK for _scanf_sloc3_1_0
;	AOP_STK for _scanf_sloc4_1_0
;	Can't optimise plus by inc, falling back to the normal way
	ld	e,b
	ld	d,c
	lda	hl,5(sp)
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,3(sp)
;	genPointerGet
;	AOP_STK for _scanf_sloc4_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
;	genAssign (pointer)
;	AOP_STK for _scanf_sloc2_1_0
	lda	hl,7(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	(de),a
;	scanf.c 96
;	genGoto
	jp	00121$
;	scanf.c 101
;	genLabel
00104$:
;	genPlus
;	AOP_STK for _scanf_ap_1_1
;	AOP_STK for _scanf_sloc4_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,81(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,3(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _scanf_sloc4_1_0
;	AOP_STK for _scanf_ap_1_1
	dec	hl
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,81(sp)
	ld	(hl+),a
	ld	(hl),e
;	genMinus
;	AOP_STK for _scanf_sloc4_1_0
;	AOP_STK for _scanf_sloc3_1_0
	lda	hl,3(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	lda	hl,6(sp)
	ld      (hl-),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _scanf_sloc3_1_0
;	AOP_STK for _scanf_sloc4_1_0
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,3(sp)
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for _scanf_sloc4_1_0
	dec	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genIpush
	ld	a,#0x0A
	push	af
	inc	sp
;	genIpush
;	AOP_STK for _scanf_i_1_1
	lda	hl,21(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
	ld	l,b
	ld	h,c
	push	hl
;	genCall
	call	_scan_int
;	AOP_STK for _scanf_i_1_1
	lda	hl,24(sp)
	ld	(hl),e
	lda	sp,6(sp)
	pop	bc
;	genAssign
;	AOP_STK for _scanf_i_1_1
;	(registers are the same)
;	scanf.c 102
;	genGoto
	jp	00121$
;	scanf.c 105
;	genLabel
00106$:
;	genPlus
;	AOP_STK for _scanf_ap_1_1
;	AOP_STK for _scanf_sloc4_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,81(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,3(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _scanf_sloc4_1_0
;	AOP_STK for _scanf_ap_1_1
	dec	hl
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,81(sp)
	ld	(hl+),a
	ld	(hl),e
;	genMinus
;	AOP_STK for _scanf_sloc4_1_0
;	AOP_STK for _scanf_sloc3_1_0
	lda	hl,3(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	lda	hl,6(sp)
	ld      (hl-),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _scanf_sloc3_1_0
;	AOP_STK for _scanf_sloc4_1_0
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,3(sp)
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for _scanf_sloc4_1_0
	dec	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genIpush
	ld	a,#0x08
	push	af
	inc	sp
;	genIpush
;	AOP_STK for _scanf_i_1_1
	lda	hl,21(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
	ld	l,b
	ld	h,c
	push	hl
;	genCall
	call	_scan_int
;	AOP_STK for _scanf_i_1_1
	lda	hl,24(sp)
	ld	(hl),e
	lda	sp,6(sp)
	pop	bc
;	genAssign
;	AOP_STK for _scanf_i_1_1
;	(registers are the same)
;	scanf.c 106
;	genGoto
	jp	00121$
;	scanf.c 109
;	genLabel
00107$:
;	genPlus
;	AOP_STK for _scanf_ap_1_1
;	AOP_STK for _scanf_sloc4_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,81(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,3(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _scanf_sloc4_1_0
;	AOP_STK for _scanf_ap_1_1
	dec	hl
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,81(sp)
	ld	(hl+),a
	ld	(hl),e
;	genMinus
;	AOP_STK for _scanf_sloc4_1_0
;	AOP_STK for _scanf_sloc3_1_0
	lda	hl,3(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	lda	hl,6(sp)
	ld      (hl-),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _scanf_sloc3_1_0
;	AOP_STK for _scanf_sloc4_1_0
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,3(sp)
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for _scanf_sloc4_1_0
	dec	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genIpush
	ld	a,#0x10
	push	af
	inc	sp
;	genIpush
;	AOP_STK for _scanf_i_1_1
	lda	hl,21(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
	ld	l,b
	ld	h,c
	push	hl
;	genCall
	call	_scan_int
;	AOP_STK for _scanf_i_1_1
	lda	hl,24(sp)
	ld	(hl),e
	lda	sp,6(sp)
	pop	bc
;	genAssign
;	AOP_STK for _scanf_i_1_1
;	(registers are the same)
;	scanf.c 110
;	genGoto
	jp	00121$
;	scanf.c 118
;	genLabel
00111$:
;	scanf.c 115
;	genPlus
;	AOP_STK for _scanf_ap_1_1
;	AOP_STK for _scanf_sloc4_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,81(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,3(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _scanf_sloc4_1_0
;	AOP_STK for _scanf_ap_1_1
	dec	hl
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,81(sp)
	ld	(hl+),a
	ld	(hl),e
;	genMinus
;	AOP_STK for _scanf_sloc4_1_0
;	AOP_STK for _scanf_sloc3_1_0
	lda	hl,3(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	lda	hl,6(sp)
	ld      (hl-),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _scanf_sloc3_1_0
;	AOP_STK for _scanf_d_5_5
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,12(sp)
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
;	genAssign
;	AOP_STK for _scanf_d_5_5
;	(registers are the same)
;	scanf.c 116
;	genAssign
;	AOP_STK for _scanf_j_5_5
	ld	(hl+),a
	ld	(hl),#0x00
;	genAssign
;	AOP_STK for _scanf_i_1_1
;	(registers are the same)
;	genLabel
00108$:
;	genAssign
;	AOP_STK for _scanf_j_5_5
;	AOP_STK for _scanf_sloc4_1_0
	lda	hl,14(sp)
	ld	a,(hl)
	lda	hl,3(sp)
	ld	(hl),a
;	genPlus
;	AOP_STK for _scanf_j_5_5
;	genPlusIncr
	lda	hl,14(sp)
	inc	(hl)
;	genPlus
;	AOP_STK for _scanf_d_5_5
;	AOP_STK for _scanf_sloc4_1_0
;	AOP_STK for _scanf_sloc3_1_0
;	Can't optimise plus by inc, falling back to the normal way
	dec	hl
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,3(sp)
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,5(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _scanf_i_1_1
;	AOP_STK for _scanf_sloc2_1_0
	lda	hl,16(sp)
	ld	a,(hl)
	lda	hl,7(sp)
	ld	(hl),a
;	genPlus
;	AOP_STK for _scanf_i_1_1
;	genPlusIncr
	lda	hl,16(sp)
	inc	(hl)
;	genAssign
;	AOP_STK for _scanf_i_1_1
;	(registers are the same)
;	genPlus
;	AOP_STK for _scanf_sloc2_1_0
;	AOP_STK for _scanf_sloc5_1_0
;	Can't optimise plus by inc, falling back to the normal way
	ld	e,b
	ld	d,c
	lda	hl,7(sp)
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,1(sp)
;	genPointerGet
;	AOP_STK for _scanf_sloc5_1_0
;	AOP_STK for _scanf_sloc6_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	dec	hl
	dec	hl
	ld	(hl),a
;	genAssign (pointer)
;	AOP_STK for _scanf_sloc3_1_0
;	AOP_STK for _scanf_sloc6_1_0
	lda	hl,5(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	lda	hl,0(sp)
	ld	a,(hl)
	ld	(de),a
;	genCmpEq
;	AOP_STK for _scanf_sloc6_1_0
; genCmpEq: left 1, right 1, result 1
	ld	a,(hl)
	or	a,a
	jp	nz,00161$
	ld	a,#0x01
	jr	00162$
00161$:
	xor	a,a
00162$:
;	genIfx
	or	a,a
	jp	nz,00121$
;	genGoto
	jp	00108$
;	scanf.c 137
;	genLabel
00117$:
;	scanf.c 122
;	genPlus
;	AOP_STK for 
;	genPlusIncr
	lda	hl,85(sp)
	inc	(hl)
	jr	nz,00163$
	inc	hl
	inc	(hl)
00163$:
;	genAssign
;	(operands are equal 4)
;	genPointerGet
;	AOP_STK for 
;	AOP_STK for _scanf_sloc6_1_0
	lda	hl,85(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,0(sp)
;	genCmpEq
;	AOP_STK for _scanf_sloc6_1_0
; genCmpEq: left 1, right 1, result 0
	ld      (hl),a
; Removed redundent load
	cp	a,#0x64
	jp	z,00112$
00164$:
;	genCmpEq
;	AOP_STK for _scanf_sloc6_1_0
; genCmpEq: left 1, right 1, result 0
	lda	hl,0(sp)
	ld	a,(hl)
	cp	a,#0x6F
	jp	z,00114$
00165$:
;	genCmpEq
;	AOP_STK for _scanf_sloc6_1_0
; genCmpEq: left 1, right 1, result 0
	lda	hl,0(sp)
	ld	a,(hl)
	cp	a,#0x75
	jp	z,00112$
00166$:
;	genCmpEq
;	AOP_STK for _scanf_sloc6_1_0
; genCmpEq: left 1, right 1, result 0
	lda	hl,0(sp)
	ld	a,(hl)
	cp	a,#0x78
	jp	z,00115$
00167$:
;	genGoto
	jp	00121$
;	scanf.c 127
;	genLabel
00112$:
;	genPlus
;	AOP_STK for _scanf_ap_1_1
;	AOP_STK for _scanf_sloc5_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,81(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,1(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _scanf_sloc5_1_0
;	AOP_STK for _scanf_ap_1_1
	dec	hl
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,81(sp)
	ld	(hl+),a
	ld	(hl),e
;	genMinus
;	AOP_STK for _scanf_sloc5_1_0
;	AOP_STK for _scanf_sloc4_1_0
	lda	hl,1(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	lda	hl,4(sp)
	ld      (hl-),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _scanf_sloc4_1_0
;	AOP_STK for _scanf_sloc5_1_0
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,1(sp)
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for _scanf_sloc5_1_0
	dec	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genIpush
	ld	a,#0x0A
	push	af
	inc	sp
;	genIpush
;	AOP_STK for _scanf_i_1_1
	lda	hl,21(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
	ld	l,b
	ld	h,c
	push	hl
;	genCall
	call	_scan_long
;	AOP_STK for _scanf_i_1_1
	lda	hl,24(sp)
	ld	(hl),e
	lda	sp,6(sp)
	pop	bc
;	genAssign
;	AOP_STK for _scanf_i_1_1
;	(registers are the same)
;	scanf.c 128
;	genGoto
	jp	00121$
;	scanf.c 131
;	genLabel
00114$:
;	genPlus
;	AOP_STK for _scanf_ap_1_1
;	AOP_STK for _scanf_sloc5_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,81(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,1(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _scanf_sloc5_1_0
;	AOP_STK for _scanf_ap_1_1
	dec	hl
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,81(sp)
	ld	(hl+),a
	ld	(hl),e
;	genMinus
;	AOP_STK for _scanf_sloc5_1_0
;	AOP_STK for _scanf_sloc4_1_0
	lda	hl,1(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	lda	hl,4(sp)
	ld      (hl-),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _scanf_sloc4_1_0
;	AOP_STK for _scanf_sloc5_1_0
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,1(sp)
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for _scanf_sloc5_1_0
	dec	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genIpush
	ld	a,#0x08
	push	af
	inc	sp
;	genIpush
;	AOP_STK for _scanf_i_1_1
	lda	hl,21(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
	ld	l,b
	ld	h,c
	push	hl
;	genCall
	call	_scan_long
;	AOP_STK for _scanf_i_1_1
	lda	hl,24(sp)
	ld	(hl),e
	lda	sp,6(sp)
	pop	bc
;	genAssign
;	AOP_STK for _scanf_i_1_1
;	(registers are the same)
;	scanf.c 132
;	genGoto
	jp	00121$
;	scanf.c 135
;	genLabel
00115$:
;	genPlus
;	AOP_STK for _scanf_ap_1_1
;	AOP_STK for _scanf_sloc5_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,81(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,1(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _scanf_sloc5_1_0
;	AOP_STK for _scanf_ap_1_1
	dec	hl
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,81(sp)
	ld	(hl+),a
	ld	(hl),e
;	genMinus
;	AOP_STK for _scanf_sloc5_1_0
;	AOP_STK for _scanf_sloc4_1_0
	lda	hl,1(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	lda	hl,4(sp)
	ld      (hl-),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _scanf_sloc4_1_0
;	AOP_STK for _scanf_sloc5_1_0
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,1(sp)
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for _scanf_sloc5_1_0
	dec	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genIpush
	ld	a,#0x10
	push	af
	inc	sp
;	genIpush
;	AOP_STK for _scanf_i_1_1
	lda	hl,21(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
	ld	l,b
	ld	h,c
	push	hl
;	genCall
	call	_scan_long
;	AOP_STK for _scanf_i_1_1
	lda	hl,24(sp)
	ld	(hl),e
	lda	sp,6(sp)
	pop	bc
;	genAssign
;	AOP_STK for _scanf_i_1_1
;	(registers are the same)
;	scanf.c 138
;	genGoto
	jp	00121$
;	scanf.c 142
;	genLabel
00120$:
;	scanf.c 140
;	genPlus
;	AOP_STK for _scanf_i_1_1
;	AOP_STK for _scanf_sloc5_1_0
;	Can't optimise plus by inc, falling back to the normal way
	ld	e,b
	ld	d,c
	lda	hl,16(sp)
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,1(sp)
;	genPointerGet
;	AOP_STK for _scanf_sloc5_1_0
;	AOP_STK for _scanf_sloc6_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	dec	hl
	dec	hl
	ld	(hl),a
;	genCmpEq
;	AOP_STK for _scanf_sloc6_1_0
;	AOP_STK for _scanf_sloc0_1_0
; genCmpEq: left 1, right 1, result 0
	lda	hl,10(sp)
	ld	a,(hl)
	lda	hl,0(sp)
	cp	(hl)
	jr	nz,00168$
	jp	00121$
00168$:
;	scanf.c 141
;	genRet
	ld	e,#0xFF
	jp	00131$
;	scanf.c 143
;	genLabel
00121$:
;	scanf.c 144
;	genPlus
;	AOP_STK for _scanf_nb_1_1
;	genPlusIncr
	lda	hl,15(sp)
	inc	(hl)
;	genAssign
;	AOP_STK for _scanf_nb_1_1
;	(registers are the same)
;	genGoto
	jp	00129$
;	genLabel
00125$:
;	scanf.c 146
;	genPlus
;	AOP_STK for _scanf_i_1_1
;	AOP_STK for _scanf_sloc5_1_0
;	Can't optimise plus by inc, falling back to the normal way
	ld	e,b
	ld	d,c
	lda	hl,16(sp)
	ld	l,(hl)
	ld	h,#0x00
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,1(sp)
;	genPointerGet
;	AOP_STK for _scanf_sloc5_1_0
;	AOP_STK for _scanf_sloc6_1_0
	ld	(hl+),a
	ld	(hl),d
	ld	e,a
	ld	a,(de)
	dec	hl
	dec	hl
	ld	(hl),a
;	genCmpEq
;	AOP_STK for _scanf_sloc6_1_0
;	AOP_STK for _scanf_sloc1_1_0
; genCmpEq: left 1, right 1, result 0
	lda	hl,9(sp)
	ld	a,(hl)
	lda	hl,0(sp)
	cp	(hl)
	jr	nz,00169$
	jp	00129$
00169$:
;	scanf.c 147
;	genRet
	ld	e,#0xFF
	jp	00131$
;	genLabel
00129$:
;	scanf.c 87
;	genAssign
;	AOP_STK for 
;	AOP_STK for _scanf_sloc5_1_0
	lda	hl,85(sp)
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,1(sp)
	ld	(hl+),a
	ld	(hl),e
;	genPlus
;	AOP_STK for _scanf_sloc5_1_0
;	AOP_STK for 
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	dec	hl
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,85(sp)
	ld	(hl+),a
	ld	(hl),d
;	genGoto
	jp	00127$
;	genLabel
00130$:
;	scanf.c 151
;	genRet
;	AOP_STK for _scanf_nb_1_1
	lda	hl,15(sp)
	ld	e,(hl)
;	genLabel
00131$:
;	genEndFunction
	lda	sp,83(sp)
	ret
___scanf_end:
	.area _CODE
