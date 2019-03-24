	;; Generic crt0.s for a Z80
	.globl	_main

	.area _HEADER (ABS)
	;; Reset vector
	.org 	0
	jp	init

	.org	0x08
	reti
	.org	0x10
	reti
	.org	0x18
	reti
	.org	0x20
	reti
	.org	0x28
	reti
	.org	0x30
	reti
	.org	0x38
	reti
	
	.org	0x150
init:
	;; Stack at the top of memory.
	ld	sp,#0xffff        

	;; Use _main instead of main to bypass sdcc's intelligence
	ei
	call	_main
	jp	_exit

	;; Ordering of segments for the linker.
	.area	_CODE
	.area	_DATA

	.area	_CODE
_clock::
	ld	a,#2	
	out	(0xff),a
	ret
	
_getsp::
	ld	hl,#0
	add	hl,sp
	ret

__printTStates::	
	ld	a,#3
	out	(0xff),a
	ret
		
_exit::
	;; Exit - special code to the emulator
	ld	a,#1
	out	(0xff),a
1$:
	halt
	jr	1$
