	;; Generic crt0.s for a GBZ80
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

	.org	0x100
	jp	0x150
		
	.org	0x150
init:
	di
	;; Stack at the top of memory.
	ld	sp,#0xdfff        

        ;; Setup global data
        call    gsinit
        
	;; Use _main instead of main to bypass sdcc's intelligence
	call	_main
	jp	_exit

	;; Ordering of segments for the linker.
	.area	_CODE
        .area   _GSINIT
        .area   _GSFINAL
        
	.area	_DATA
        .area   _BSS

        .area   _CODE
__clock::
	ld	a,#2
	rst	0x08
	ret
	
_exit::
	;; Exit - special code to the emulator
	ld	a,#0
	rst	0x08
1$:
	halt
	jr	1$

        .area   _GSINIT
gsinit::	

        .area   _GSFINAL
        ret
