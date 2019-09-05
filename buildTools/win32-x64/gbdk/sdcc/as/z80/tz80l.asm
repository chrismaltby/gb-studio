	.sbttl	Assembler Link Tests

	.module	tz80l

	; This file and TCONST.ASM should be assembled and linked.
	;
	; ASZ80 -XGOL TZ80L
	; ASZ80 -XGOL TCONST
	;
	; ASLINK -C
	; -XMS
	; TZ80L
	; TCONST
	; -E
	;
	; The following tests verify the correct processing of
	; external references for the branches.
	;
	; *L signifies an error will be reported at link time.

	; branch test must be first

	.area	TEST	(ABS,OVR)

	.blkb	0x7E		;bra1:
	jr	C,bra1		;   38 00  [38 80]
	.blkb	0x7F		;bra2:
	jr	C,bra2		;*L 38 00  [38 7F]
	jr	C,bra3		;   38 00  [38 7F]
	.blkb	0x7F
	.blkb	0x00		;bra3:
	jr	C,bra4		;*L 38 00  [38 [80]
	.blkb	0x80
	.blkb	0x00		;bra4:

	.blkb	0x7E		;bra5:
	jr	C,bra5		;   38 00  [38 80]
	.blkb	0x7F		;bra6:
	jr	C,bra6		;*L 38 00  [38 7F]
	jr	C,bra7		;   38 00  [38 7F]
	.blkb	0x7F
	.blkb	0x00		;bra7:
	jr	C,bra8		;*L 38 00  [38 [80]
	.blkb	0x80
	.blkb	0x00		;bra8:


