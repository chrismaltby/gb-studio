;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Sun Nov  4 12:04:07 2001

;--------------------------------------------------------
	.module gprintf
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _gprintf
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
;	gprintf.c 4
;	genLabel
;	genFunction
;	---------------------------------
; Function gprintf
; ---------------------------------
___gprintf_start:
_gprintf:
	lda	sp,-10(sp)
;	gprintf.c 7
;	genAssign
;	AOP_STK for _gprintf_nb_1_1
	lda	hl,7(sp)
	ld	(hl),#0x00
;	gprintf.c 9
;	genAddrOf
	lda	hl,12(sp)
	ld	b,l
	ld	c,h
;	genPlus
;	AOP_STK for _gprintf_ap_1_1
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	ld	e,b
	ld	d,c
	ld	hl,#0x0002
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,8(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _gprintf_nb_1_1
	dec	hl
	dec	hl
	ld	(hl),#0x00
;	genLabel
00113$:
;	gprintf.c 10
;	genAssign
;	AOP_STK for 
	lda	hl,12(sp)
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genPointerGet
;	AOP_STK for _gprintf_sloc0_1_0
	ld	a,(bc)
	lda	hl,4(sp)
	ld	(hl),a
;	genIfx
;	AOP_STK for _gprintf_sloc0_1_0
	xor	a,a
	or	a,(hl)
	jp	z,00116$
;	gprintf.c 11
;	genCmpEq
;	AOP_STK for _gprintf_sloc0_1_0
; genCmpEq: left 1, right 1, result 0
	ld	a,(hl)
	cp	a,#0x25
	jp	nz,00111$
	jr	00130$
00129$:
	jp	00111$
00130$:
;	gprintf.c 12
;	genPlus
;	genPlusIncr
	inc	bc
;	genAssign
;	AOP_STK for 
	lda	hl,12(sp)
	ld	(hl),c
	inc	hl
	ld	(hl),b
;	genPointerGet
	ld	a,(bc)
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	c,a
	cp	a,#0x25
	jp	z,00107$
00131$:
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	cp	a,#0x63
	jp	z,00101$
00132$:
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	cp	a,#0x64
	jp	z,00102$
00133$:
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	cp	a,#0x6F
	jp	z,00104$
00134$:
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	cp	a,#0x73
	jp	z,00106$
00135$:
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	cp	a,#0x75
	jp	z,00103$
00136$:
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	cp	a,#0x78
	jp	z,00105$
00137$:
;	genGoto
	jp	00108$
;	gprintf.c 18
;	genLabel
00101$:
;	gprintf.c 15
;	genPlus
;	AOP_STK for _gprintf_ap_1_1
;	AOP_STK for _gprintf_sloc1_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,2(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _gprintf_sloc1_1_0
;	AOP_STK for _gprintf_ap_1_1
	dec	hl
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,8(sp)
	ld	(hl+),a
	ld	(hl),e
;	genMinus
;	AOP_STK for _gprintf_sloc1_1_0
;	AOP_STK for _gprintf_sloc2_1_0
	lda	hl,2(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	lda	hl,1(sp)
	ld      (hl-),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _gprintf_sloc2_1_0
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	ld	b,a
;	genAssign
;	(registers are the same)
;	gprintf.c 16
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
	ld	a,b
	push	af
	inc	sp
;	genCall
	call	_wrtchr
	lda	sp,1(sp)
	pop	hl
	ld	c,l
;	gprintf.c 17
;	genGoto
	jp	00109$
;	gprintf.c 24
;	genLabel
00102$:
;	gprintf.c 21
;	genPlus
;	AOP_STK for _gprintf_ap_1_1
;	AOP_STK for _gprintf_sloc2_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,0(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _gprintf_sloc2_1_0
;	AOP_STK for _gprintf_ap_1_1
	dec	hl
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,8(sp)
	ld	(hl+),a
	ld	(hl),e
;	genMinus
;	AOP_STK for _gprintf_sloc2_1_0
;	AOP_STK for _gprintf_sloc1_1_0
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	lda	hl,3(sp)
	ld      (hl-),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _gprintf_sloc1_1_0
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	ld	b,a
;	genAssign
;	(registers are the same)
;	gprintf.c 22
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
	ld	hl,#0x010A
	push	hl
;	genIpush
	ld	a,b
	push	af
	inc	sp
;	genCall
	call	_gprintn
	lda	sp,3(sp)
	pop	hl
	ld	c,l
;	gprintf.c 23
;	genGoto
	jp	00109$
;	gprintf.c 30
;	genLabel
00103$:
;	gprintf.c 27
;	genPlus
;	AOP_STK for _gprintf_ap_1_1
;	AOP_STK for _gprintf_sloc2_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,0(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _gprintf_sloc2_1_0
;	AOP_STK for _gprintf_ap_1_1
	dec	hl
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,8(sp)
	ld	(hl+),a
	ld	(hl),e
;	genMinus
;	AOP_STK for _gprintf_sloc2_1_0
;	AOP_STK for _gprintf_sloc1_1_0
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	lda	hl,3(sp)
	ld      (hl-),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _gprintf_sloc1_1_0
;	AOP_STK for _gprintf_sloc2_1_0
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	lda	hl,0(sp)
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
;	genCast
;	AOP_STK for _gprintf_sloc2_1_0
	ld      (hl-),a
	ld	b,(hl)
;	gprintf.c 28
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
	ld	hl,#0x000A
	push	hl
;	genIpush
	ld	a,b
	push	af
	inc	sp
;	genCall
	call	_gprintn
	lda	sp,3(sp)
	pop	hl
	ld	c,l
;	gprintf.c 29
;	genGoto
	jp	00109$
;	gprintf.c 36
;	genLabel
00104$:
;	gprintf.c 33
;	genPlus
;	AOP_STK for _gprintf_ap_1_1
;	AOP_STK for _gprintf_sloc2_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,0(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _gprintf_sloc2_1_0
;	AOP_STK for _gprintf_ap_1_1
	dec	hl
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,8(sp)
	ld	(hl+),a
	ld	(hl),e
;	genMinus
;	AOP_STK for _gprintf_sloc2_1_0
;	AOP_STK for _gprintf_sloc1_1_0
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	lda	hl,3(sp)
	ld      (hl-),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _gprintf_sloc1_1_0
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	ld	b,a
;	genAssign
;	(registers are the same)
;	gprintf.c 34
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
	ld	hl,#0x0008
	push	hl
;	genIpush
	ld	a,b
	push	af
	inc	sp
;	genCall
	call	_gprintn
	lda	sp,3(sp)
	pop	hl
	ld	c,l
;	gprintf.c 35
;	genGoto
	jp	00109$
;	gprintf.c 42
;	genLabel
00105$:
;	gprintf.c 39
;	genPlus
;	AOP_STK for _gprintf_ap_1_1
;	AOP_STK for _gprintf_sloc2_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,0(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _gprintf_sloc2_1_0
;	AOP_STK for _gprintf_ap_1_1
	dec	hl
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,8(sp)
	ld	(hl+),a
	ld	(hl),e
;	genMinus
;	AOP_STK for _gprintf_sloc2_1_0
;	AOP_STK for _gprintf_sloc1_1_0
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0001
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	lda	hl,3(sp)
	ld      (hl-),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _gprintf_sloc1_1_0
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	ld	b,a
;	genAssign
;	(registers are the same)
;	gprintf.c 40
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
	ld	hl,#0x0010
	push	hl
;	genIpush
	ld	a,b
	push	af
	inc	sp
;	genCall
	call	_gprintn
	lda	sp,3(sp)
	pop	hl
	ld	c,l
;	gprintf.c 41
;	genGoto
	jp	00109$
;	gprintf.c 48
;	genLabel
00106$:
;	gprintf.c 45
;	genPlus
;	AOP_STK for _gprintf_ap_1_1
;	AOP_STK for _gprintf_sloc2_1_0
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	lda	hl,8(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	add	hl,de
	ld	a,l
	ld	d,h
	lda	hl,0(sp)
	ld	(hl+),a
	ld	(hl),d
;	genAssign
;	AOP_STK for _gprintf_sloc2_1_0
;	AOP_STK for _gprintf_ap_1_1
	dec	hl
	ld	a,(hl+)
	ld	e,(hl)
	lda	hl,8(sp)
	ld	(hl+),a
	ld	(hl),e
;	genMinus
;	AOP_STK for _gprintf_sloc2_1_0
;	AOP_STK for _gprintf_sloc1_1_0
	lda	hl,0(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	hl,#0x0002
	ld	a,e
	sub	a,l
	ld	e,a
	ld	a,d
	sbc	a,h
	lda	hl,3(sp)
	ld      (hl-),a
	ld	(hl),e
;	genPointerGet
;	AOP_STK for _gprintf_sloc1_1_0
;	AOP_STK for _gprintf_s_4_9
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	ld	a,(de)
	inc	hl
	inc	hl
	ld	(hl),a
	inc	de
	ld	a,(de)
	inc	hl
	ld	(hl),a
;	genAssign
;	AOP_STK for _gprintf_s_4_9
;	(registers are the same)
;	gprintf.c 46
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 1 deSending: 0
	push	bc
;	AOP_STK for _gprintf_s_4_9
	dec	hl
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	push	hl
;	genCall
	call	_gprint
	lda	sp,2(sp)
	pop	hl
	ld	c,l
;	gprintf.c 47
;	genGoto
	jp	00109$
;	gprintf.c 74
;	genLabel
00107$:
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	a,c
	push	af
	inc	sp
;	genCall
	call	_wrtchr
	lda	sp,1(sp)
;	gprintf.c 75
;	genGoto
	jp	00109$
;	gprintf.c 77
;	genLabel
00108$:
;	genRet
	ld	e,#0xFF
	jp	00117$
;	gprintf.c 78
;	genLabel
00109$:
;	gprintf.c 79
;	genPlus
;	AOP_STK for _gprintf_nb_1_1
;	genPlusIncr
	lda	hl,7(sp)
	inc	(hl)
;	genAssign
;	AOP_STK for _gprintf_nb_1_1
;	(registers are the same)
;	genGoto
	jp	00115$
;	genLabel
00111$:
;	gprintf.c 81
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
;	AOP_STK for _gprintf_sloc0_1_0
	lda	hl,4(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genCall
	call	_wrtchr
	lda	sp,1(sp)
;	genLabel
00115$:
;	gprintf.c 10
;	genAssign
;	AOP_STK for 
	lda	hl,12(sp)
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
;	genPlus
;	AOP_STK for 
;	genPlusIncr
;	Can't optimise plus by inc, falling back to the normal way
	ld	hl,#0x0001
	add	hl,bc
	ld	a,l
	ld	d,h
	lda	hl,12(sp)
	ld	(hl+),a
	ld	(hl),d
;	genGoto
	jp	00113$
;	genLabel
00116$:
;	gprintf.c 84
;	genRet
;	AOP_STK for _gprintf_nb_1_1
	lda	hl,7(sp)
	ld	e,(hl)
;	genLabel
00117$:
;	genEndFunction
	lda	sp,10(sp)
	ret
___gprintf_end:
	.area _CODE
;--------------------------------------------------------
; code
;--------------------------------------------------------
	.area _CODE
	.area _CODE
