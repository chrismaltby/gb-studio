		.include	"incld1.asm"		;1
							;2
							;3
							;4
							;5
							;6
							;7
							;8
							;9
							;10
		xxx					;11
;
;	This is a simple test of the error reporting
;	for source and include files.
;
;	assemble inctst:
;		asxxxx itsta itstb
;
;	?ASxxxx-E-<o> in line 1 of incld1.asm
;	?ASxxxx-E-<o> in line 2 of incld2.asm
;	?ASxxxx-E-<o> in line 3 of incld3.asm
;	?ASxxxx-E-<o> in line 4 of incld4.asm
;	?ASxxxx-E-<o> in line 5 of incld5.asm
;	?ASxxxx-E-<i> in line 6 of incld5.asm
;	?ASxxxx-E-<o> in line 10 of incld5.asm
;	?ASxxxx-E-<o> in line 9 of incld4.asm
;	?ASxxxx-E-<o> in line 8 of incld3.asm
;	?ASxxxx-E-<o> in line 7 of incld2.asm
;	?ASxxxx-E-<o> in line 6 of incld1.asm
;	?ASxxxx-E-<o> in line 11 of itsta.asm
;	?ASxxxx-E-<o> in line 1 of incld1.asm
;	?ASxxxx-E-<o> in line 2 of incld2.asm
;	?ASxxxx-E-<o> in line 3 of incld3.asm
;	?ASxxxx-E-<o> in line 4 of incld4.asm
;	?ASxxxx-E-<o> in line 5 of incld5.asm
;	?ASxxxx-E-<i> in line 6 of incld5.asm
;	?ASxxxx-E-<o> in line 10 of incld5.asm
;	?ASxxxx-E-<o> in line 9 of incld4.asm
;	?ASxxxx-E-<o> in line 8 of incld3.asm
;	?ASxxxx-E-<o> in line 7 of incld2.asm
;	?ASxxxx-E-<o> in line 6 of incld1.asm
;	?ASxxxx-E-<o> in line 11 of itstb.asm
