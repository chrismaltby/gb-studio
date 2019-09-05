;--------------------------------------------------------
; blink.asm - simple ASM example to toggle a port pin
;   (LED on TINI board).
;
;   On a TINI board this toggles really fast, so
;   it appears that the LED just dims slightly.
;   You may need a scope to detect it.
;
;  You can use s51(ucsim simulator) to look at the
;  blink.ihx(hex-file).  Run like this:
;  >S51 blink.ihx
;  Then dump code like this:
;  s51>dc
;--------------------------------------------------------
   .module bootasm

;--------------------------------------------------------
; Stack segment in internal ram 
;--------------------------------------------------------
	.area	SSEG	(DATA)
__start__stack:
	.ds	1

	.area	CODE (CODE)
	
;--------------------------------------------------------
; global & static initialisations
;--------------------------------------------------------
	.area GSINIT (CODE)
main:
   clr   ea    ; disable ints
   clr   p3.5  ; turn LED off
   setb  p3.5  ; turn LED on
   ljmp  main
