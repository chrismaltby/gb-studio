	.area	_CODE
1$:
_main::
	load16	.label,0x1234
	ret


	INCBIN "test-1.S"		; Include a binary file
; Comment

load16	MACRO	address,val
	ld	a,#<val
	ld	(address),a
	ld	a,#>val
	ld	(address+1),a
	ENDM

comment MACRO	comm
	.ascii	comm
	ENDM
	
writeato	MACRO address
	ld	(address),a
	ENDM

writenumto	MACRO addr,val
	ld	a,#val
	writeato	addr
	ENDM

	.area	_BSS
.label:
	.ds	2
