	nop
	ldi	r16,$ff
	out	$3d,r16
	ldi	r16,$01
	out	$3e,r16
	nop
	call	sub1
	nop

sub1:	nop
	ret
	
copyright:
	.db	"(c) 2000 talker Bt."
