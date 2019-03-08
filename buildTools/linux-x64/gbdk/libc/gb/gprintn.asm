;--------------------------------------------------------
; File Created by SDCC : FreeWare ANSI-C Compiler
; Version 2.3.1 Sun Nov  4 12:04:07 2001

;--------------------------------------------------------
	.module gprintn
	
;--------------------------------------------------------
; Public variables in this module
;--------------------------------------------------------
	.globl _gprintn
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
;	gprintn.c 7
;	genLabel
;	genFunction
;	---------------------------------
; Function gprintn
; ---------------------------------
___gprintn_start:
_gprintn:
	
;	gprintn.c 11
;	genCmpLt
;	AOP_STK for 
	lda	hl,2(sp)
	ld	a,(hl)
	xor	a,#0x80
	cp	#0x00^0x80
	jp	nc,00102$
;	genIfx
;	AOP_STK for 
	xor	a,a
	inc	hl
	inc	hl
	or	a,(hl)
	jp	z,00102$
;	gprintn.c 12
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	a,#0x2D
	push	af
	inc	sp
;	genCall
	call	_wrtchr
	lda	sp,1(sp)
;	gprintn.c 13
;	genUminus
;	AOP_STK for 
	xor	a,a
	lda	hl,2(sp)
	ld	a,#0x00
	sbc	a,(hl)
	ld	(hl),a
;	genLabel
00102$:
;	gprintn.c 15
;	genAssign
;	AOP_STK for 
	lda	hl,2(sp)
	ld	c,(hl)
;	genAssign
;	AOP_STK for 
	inc	hl
	ld	b,(hl)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	a,b
	push	af
	inc	sp
;	genIpush
	ld	a,c
	push	af
	inc	sp
;	genCall
	call	__divuchar_rrx_s
	ld	c,e
	lda	sp,2(sp)
;	genAssign
	ld	b,c
;	genCmpEq
; genCmpEq: left 1, right 1, result 0
	ld	a,c
	or	a,a
	jp	z,00105$
00111$:
;	gprintn.c 16
;	genAssign
;	(registers are the same)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	a,#0x00
	push	af
	inc	sp
;	genIpush
;	AOP_STK for 
	lda	hl,4(sp)
	ld	a,(hl)
	push	af
	inc	sp
;	genIpush
	ld	a,b
	push	af
	inc	sp
;	genCall
	call	_gprintn
	lda	sp,3(sp)
;	genLabel
00105$:
;	gprintn.c 17
;	genAssign
;	AOP_STK for 
	lda	hl,2(sp)
	ld	c,(hl)
;	genAssign
;	AOP_STK for 
	inc	hl
	ld	b,(hl)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	a,b
	push	af
	inc	sp
;	genIpush
	ld	a,c
	push	af
	inc	sp
;	genCall
	call	__moduchar_rrx_s
	ld	c,e
	lda	sp,2(sp)
;	genPlus
;	AOP_HL for _digits
;	Can't optimise plus by inc, falling back to the normal way
	ld	hl,#_digits
	ld	a,(hl)
	add	a,c
	ld	c,a
	inc	hl
	ld	a,(hl)
	adc	a,#0x00
	ld	b,a
;	genPointerGet
	ld	a,(bc)
;	genIpush
; _saveRegsForCall: sendSetSize: 0 deInUse: 0 bcInUse: 0 deSending: 0
	ld	c,a
	push	af
	inc	sp
;	genCall
	call	_wrtchr
	lda	sp,1(sp)
;	genLabel
00106$:
;	genEndFunction
	
	ret
___gprintn_end:
	.area _CODE
