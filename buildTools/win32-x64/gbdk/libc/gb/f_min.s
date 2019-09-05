; font_min.s
	
;	Text font
;	Michael Hope, 1998
;	michaelh@earthling.net
;	Distrubuted under the Artistic License - see www.opensource.org
;
	;; BANKED:	checked, imperfect
	.module 	font_min
	.area	_BASE
_font_min::
	.byte	1+4		; 128 character encoding
	.byte	37		; Tiles required

	.byte	00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,00		; All map to space
	.byte	00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,00		; All map to space
	.byte	00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,00		; All map to space
	.byte	01,02,03,04,05,06,07,08,09,10,00,00,00,00,00,00
	.byte	00,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25
	.byte	26,27,28,29,30,21,32,33,34,35,36,00,00,00,00,00
	.byte	00,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25
	.byte	26,27,28,29,30,21,32,33,34,35,36,00,00,00,00,00

	.db	0
        .db    0b00000000 
        .db    0b00000000 
        .db    0b00000000 
        .db    0b00000000 
        .db    0b00000000 
        .db    0b00000000 
        .db    0b00000000 
; Character: 0
        .db    0b00000000 
        .db    0b00111100 
        .db    0b01000110 
        .db    0b01001010 
        .db    0b01010010 
        .db    0b01100010 
        .db    0b00111100 
        .db    0b00000000 
; Character: 1
        .db    0b00000000 
        .db    0b00011000 
        .db    0b00101000 
        .db    0b00001000 
        .db    0b00001000 
        .db    0b00001000 
        .db    0b00111110 
        .db    0b00000000 
; Character: 2
        .db    0b00000000 
        .db    0b00111100 
        .db    0b01000010 
        .db    0b00000010 
        .db    0b00111100 
        .db    0b01000000 
        .db    0b01111110 
        .db    0b00000000 
; Character: 3
        .db    0b00000000 
        .db    0b00111100 
        .db    0b01000010 
        .db    0b00001100 
        .db    0b00000010 
        .db    0b01000010 
        .db    0b00111100 
        .db    0b00000000 
; Character: 4
        .db    0b00000000 
        .db    0b00001000 
        .db    0b00011000 
        .db    0b00101000 
        .db    0b01001000 
        .db    0b01111110 
        .db    0b00001000 
        .db    0b00000000 
; Character: 5
        .db    0b00000000 
        .db    0b01111110 
        .db    0b01000000 
        .db    0b01111100 
        .db    0b00000010 
        .db    0b01000010 
        .db    0b00111100 
        .db    0b00000000 
; Character: 6
        .db    0b00000000 
        .db    0b00111100 
        .db    0b01000000 
        .db    0b01111100 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b00111100 
        .db    0b00000000 
; Character: 7
        .db    0b00000000 
        .db    0b01111110 
        .db    0b00000010 
        .db    0b00000100 
        .db    0b00001000 
        .db    0b00010000 
        .db    0b00010000 
        .db    0b00000000 
; Character: 8
        .db    0b00000000 
        .db    0b00111100 
        .db    0b01000010 
        .db    0b00111100 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b00111100 
        .db    0b00000000 
; Character: 9
        .db    0b00000000 
        .db    0b00111100 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b00111110 
        .db    0b00000010 
        .db    0b00111100 
        .db    0b00000000 
; Character: A
        .db    0b00000000 
        .db    0b00111100 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01111110 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b00000000 
; Character: B
        .db    0b00000000 
        .db    0b01111100 
        .db    0b01000010 
        .db    0b01111100 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01111100 
        .db    0b00000000 
; Character: C
        .db    0b00000000 
        .db    0b00111100 
        .db    0b01000010 
        .db    0b01000000 
        .db    0b01000000 
        .db    0b01000010 
        .db    0b00111100 
        .db    0b00000000 
; Character: D
        .db    0b00000000 
        .db    0b01111000 
        .db    0b01000100 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01000100 
        .db    0b01111000 
        .db    0b00000000 
; Character: E
        .db    0b00000000 
        .db    0b01111110 
        .db    0b01000000 
        .db    0b01111100 
        .db    0b01000000 
        .db    0b01000000 
        .db    0b01111110 
        .db    0b00000000 
; Character: F
        .db    0b00000000 
        .db    0b01111110 
        .db    0b01000000 
        .db    0b01111100 
        .db    0b01000000 
        .db    0b01000000 
        .db    0b01000000 
        .db    0b00000000 
; Character: G
        .db    0b00000000 
        .db    0b00111100 
        .db    0b01000010 
        .db    0b01000000 
        .db    0b01001110 
        .db    0b01000010 
        .db    0b00111100 
        .db    0b00000000 
; Character: H
        .db    0b00000000 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01111110 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b00000000 
; Character: I
        .db    0b00000000 
        .db    0b00111110 
        .db    0b00001000 
        .db    0b00001000 
        .db    0b00001000 
        .db    0b00001000 
        .db    0b00111110 
        .db    0b00000000 
; Character: J
        .db    0b00000000 
        .db    0b00000010 
        .db    0b00000010 
        .db    0b00000010 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b00111100 
        .db    0b00000000 
; Character: K
        .db    0b00000000 
        .db    0b01000100 
        .db    0b01001000 
        .db    0b01110000 
        .db    0b01001000 
        .db    0b01000100 
        .db    0b01000010 
        .db    0b00000000 
; Character: L
        .db    0b00000000 
        .db    0b01000000 
        .db    0b01000000 
        .db    0b01000000 
        .db    0b01000000 
        .db    0b01000000 
        .db    0b01111110 
        .db    0b00000000 
; Character: M
        .db    0b00000000 
        .db    0b01000010 
        .db    0b01100110 
        .db    0b01011010 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b00000000 
; Character: N
        .db    0b00000000 
        .db    0b01000010 
        .db    0b01100010 
        .db    0b01010010 
        .db    0b01001010 
        .db    0b01000110 
        .db    0b01000010 
        .db    0b00000000 
; Character: O
        .db    0b00000000 
        .db    0b00111100 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b00111100 
        .db    0b00000000 
; Character: P
        .db    0b00000000 
        .db    0b01111100 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01111100 
        .db    0b01000000 
        .db    0b01000000 
        .db    0b00000000 
; Character: Q
        .db    0b00000000 
        .db    0b00111100 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01010010 
        .db    0b01001010 
        .db    0b00111100 
        .db    0b00000000 
; Character: R
        .db    0b00000000 
        .db    0b01111100 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01111100 
        .db    0b01000100 
        .db    0b01000010 
        .db    0b00000000 
; Character: S
        .db    0b00000000 
        .db    0b00111100 
        .db    0b01000000 
        .db    0b00111100 
        .db    0b00000010 
        .db    0b01000010 
        .db    0b00111100 
        .db    0b00000000 
; Character: T
        .db    0b00000000 
        .db    0b11111110 
        .db    0b00010000 
        .db    0b00010000 
        .db    0b00010000 
        .db    0b00010000 
        .db    0b00010000 
        .db    0b00000000 
; Character: U
        .db    0b00000000 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b00111100 
        .db    0b00000000 
; Character: V
        .db    0b00000000 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b00100100 
        .db    0b00011000 
        .db    0b00000000 
; Character: W
        .db    0b00000000 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01000010 
        .db    0b01011010 
        .db    0b00100100 
        .db    0b00000000 
; Character: X
        .db    0b00000000 
        .db    0b01000010 
        .db    0b00100100 
        .db    0b00011000 
        .db    0b00011000 
        .db    0b00100100 
        .db    0b01000010 
        .db    0b00000000 
; Character: Y
        .db    0b00000000 
        .db    0b10000010 
        .db    0b01000100 
        .db    0b00101000 
        .db    0b00010000 
        .db    0b00010000 
        .db    0b00010000 
        .db    0b00000000 
; Character: Z
        .db    0b00000000 
        .db    0b01111110 
        .db    0b00000100 
        .db    0b00001000 
        .db    0b00010000 
        .db    0b00100000 
        .db    0b01111110 
        .db    0b00000000 
