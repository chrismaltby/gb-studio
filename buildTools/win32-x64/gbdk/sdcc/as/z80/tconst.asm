	.title	Assembler Link Test Constants

	.module	tconst

	.area	TEST	(ABS,OVR)

	bra1	==	0	; branching constants
	bra2	==	0x80
	bra3	==	0x182
	bra4	==	0x204

	.blkb	0x7E		;bra1:
	.blkb	0x02
	.blkb	0x7F		;bra2:
	.blkb	0x02
	.blkb	0x02
	.blkb	0x7F
	.blkb	0x00		;bra3:
	.blkb	0x02
	.blkb	0x80
	.blkb	0x00		;bra4:

	.globl	bra5,bra6,bra7,bra8

				; branching labels
bra5:	.blkb	0x7E		;bra5:
	.blkb	0x02
bra6:	.blkb	0x7F		;bra6:
	.blkb	0x02
	.blkb	0x02
	.blkb	0x7F
bra7:	.blkb	0x00		;bra7:
	.blkb	0x02
	.blkb	0x80
bra8:	.blkb	0x00		;bra8:


	; 12-Bit numbers are considered valid if:
	;   1) the most significant 4 bits of the 16-bit number are zero
	;   2) the most significant 4 bits of the 16-bit number are all ones

	n0FFF	==	0x0FFF	;largest positive
	n1000	==	0x1000	;+1

	nF000	==	0xF000	;largest negative
	nEFFF	==	0xEFFF	;-1


	.area	DIRECT	(ABS,OVR)
	.setdp

	boundary	==	0x101

	minus1	==	-1	; paging / indexing constants
	zero	==	0
	two55	==	0d255
	two56	==	0d256
	five11	==	0d511
	five12	==	0d512


	.globl	lzero,ltwo55,ltwo56,lminus1

lzero:	.blkb	0x00FF		; paging labels
ltwo55:	.blkb	0x0001
ltwo56:	.blkb	0xFEFF
lminus1:.blkb	0d0000

