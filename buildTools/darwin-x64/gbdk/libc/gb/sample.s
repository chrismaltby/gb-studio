	.include "global.s"

	;; BANKED:	checked
	.title "Sound sample player"
	.module Sample

	.area	_BASE
	.AUD3WAVERAM = 0xff30

_play_sample::
  push bc
  lda hl,4(sp)
  ld a,(hl+)
  ld d,(hl)
  ld e,a

  lda hl,6(sp)
  ld a,(hl+)
  ld b,(hl)
  ld c,a

  ld h,d
  ld l,e

  call .play_sample
  pop bc
  ret

; Playback raw sound sample with length BC from HL at 8192Hz rate.
; BC defines the length of the sample in samples/32 or bytes/16.
; The format of the data is unsigned 4-bit samples,
; 2 samples per byte, upper 4-bits played before lower 4 bits.
;
; Adaption for GBDK by Lars Malmborg.
; Original code by Jeff Frohwein.

.play_sample::
  ld  a,#0x84
  ldh (.NR52),a       ;enable sound 3

  ld a,#0
  ldh (.NR30),a
  ldh (.NR51),a

  ld a,#0x77
  ldh (.NR50),a       ;select speakers
  ld a,#0xff
  ldh (.NR51),a       ;enable sound 3

  ld a,#0x80
  ldh (.NR31),a       ;sound length
  ld a,#0x20
  ldh (.NR32),a       ;sound level high

  ld a,#0x00
  ldh (.NR33),a       ;sound freq low

.samp2:
  ld de,#.AUD3WAVERAM ;12
  push bc             ;16
  ld b,#16            ;16

  xor a
  ldh (.NR30),a
.samp3:
  ld a,(hl+)          ;8
  ld (de),a           ;8
  inc de              ;8
  dec b               ;4
  jr nz,.samp3        ;12

  ld a,#0x80
  ldh (.NR30),a

  ld a,#0x87          ; (256hz)
  ldh (.NR34),a

  ld bc,#558          ;delay routine
.samp4:
  dec bc              ;8
  ld a,b              ;4
  or c                ;4
  jr nz,.samp4        ;12

  ld a,#0             ;more delay
  ld a,#0
  ld a,#0

  pop bc              ;12
  dec bc              ;8
  ld a,b              ;4
  or c                ;4
  jr nz,.samp2        ;12

  ld a,#0xbb
  ldh (.NR51),a       ;disable sound 3
  ret
