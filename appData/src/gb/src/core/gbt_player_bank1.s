;-------------------------------------------------------------------------------
;
; GBT Player v2.2.1 rulz
;
; SPDX-License-Identifier: MIT
;
; Copyright (c) 2009-2020, Antonio Niño Díaz <antonio_nd@outlook.com>
;
;-------------------------------------------------------------------------------

	.NR10 = 0xFF10
	.NR11 = 0xFF11
	.NR12 = 0xFF12
	.NR13 = 0xFF13
	.NR14 = 0xFF14
	.NR21 = 0xFF16
	.NR22 = 0xFF17
	.NR23 = 0xFF18
	.NR24 = 0xFF19
	.NR30 = 0xFF1A
	.NR31 = 0xFF1B
	.NR32 = 0xFF1C
	.NR33 = 0xFF1D
	.NR34 = 0xFF1E
	.NR41 = 0xFF20
	.NR42 = 0xFF21
	.NR43 = 0xFF22
	.NR44 = 0xFF23
	.NR50 = 0xFF24
	.NR51 = 0xFF25
	.NR52 = 0xFF26

;-------------------------------------------------------------------------------

	.area	_CODE_1

;-------------------------------------------------------------------------------

gbt_wave: ; 8 sounds
	.DB	0xA5,0xD7,0xC9,0xE1,0xBC,0x9A,0x76,0x31,0x0C,0xBA,0xDE,0x60,0x1B,0xCA,0x03,0x93 ; random :P
	.DB	0xF0,0xE1,0xD2,0xC3,0xB4,0xA5,0x96,0x87,0x78,0x69,0x5A,0x4B,0x3C,0x2D,0x1E,0x0F
	.DB	0xFD,0xEC,0xDB,0xCA,0xB9,0xA8,0x97,0x86,0x79,0x68,0x57,0x46,0x35,0x24,0x13,0x02 ; little up-downs
	.DB	0xDE,0xFE,0xDC,0xBA,0x9A,0xA9,0x87,0x77,0x88,0x87,0x65,0x56,0x54,0x32,0x10,0x12
	.DB	0xAB,0xCD,0xEF,0xED,0xCB,0xA0,0x12,0x3E,0xDC,0xBA,0xBC,0xDE,0xFE,0xDC,0x32,0x10 ; triangular broken
	.DB	0xFF,0xEE,0xDD,0xCC,0xBB,0xAA,0x99,0x88,0x77,0x66,0x55,0x44,0x33,0x22,0x11,0x00 ; triangular
	.DB	0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00 ; square 50%
	.DB	0x79,0xBC,0xDE,0xEF,0xFF,0xEE,0xDC,0xB9,0x75,0x43,0x21,0x10,0x00,0x11,0x23,0x45 ; sine

; gbt_noise: ; Moved to Mod2GBT for better note range & performance
	; 7 bit, can adjust with pitch C D# F# A# C
	;.DB	0x5F,0x4E,0x3E,0x2F,0x2E,0x2C,0x1F,0x0F
	; 15 bit
	;.DB	0x64,0x54,0x44,0x24,0x00
	;.DB	0x67,0x56,0x46

gbt_frequencies:
	.DW	  44,  156,  262,  363,  457,  547,  631,  710,  786,  854,  923,  986
	.DW	1046, 1102, 1155, 1205, 1253, 1297, 1339, 1379, 1417, 1452, 1486, 1517
	.DW	1546, 1575, 1602, 1627, 1650, 1673, 1694, 1714, 1732, 1750, 1767, 1783
	.DW	1798, 1812, 1825, 1837, 1849, 1860, 1871, 1881, 1890, 1899, 1907, 1915
	.DW	1923, 1930, 1936, 1943, 1949, 1954, 1959, 1964, 1969, 1974, 1978, 1982
	.DW	1985, 1988, 1992, 1995, 1998, 2001, 2004, 2006, 2009, 2011, 2013, 2015

;-------------------------------------------------------------------------------

_gbt_get_freq_from_index: ; a = index, bc = returned freq
	ld	hl,#gbt_frequencies
	ld	c,a
	ld	b,#0
	add	hl,bc
	add	hl,bc
	ld	c,(hl)
	inc	hl
	ld	b,(hl)
	ret

;-------------------------------------------------------------------------------
;---------------------------------- Channel 1 ----------------------------------
;-------------------------------------------------------------------------------

gbt_channel_1_handle:: ; de = info

	ld	a,(gbt_channels_enabled)
	and	a,#0x01
	jr	nz,channel1_enabled$

	; Channel is disabled. Increment pointer as needed

	ld	a,(de)
	inc	de
	bit	7,a
	jr	nz,ch1_more_bytes$
	bit	6,a
	jr	z,ch1_no_more_bytes_this_channel$

	jr	ch1_one_more_byte$

ch1_more_bytes$:

	ld	a,(de)
	inc	de
	bit	7,a
	jr	z,ch1_no_more_bytes_this_channel$

ch1_one_more_byte$:

	inc	de

ch1_no_more_bytes_this_channel$:

	ret

channel1_enabled$:

	; Channel 1 is enabled

	ld	a,(de)
	inc	de

	bit	7,a
	jr	nz,ch1_has_frequency$

	; Not frequency

	bit	6,a
	jr	nz,ch1_instr_effects$

	; Set volume or NOP

	bit	5,a
	jr	nz,ch1_just_set_volume$

	; NOP

	ret

ch1_just_set_volume$:

	; Set volume

	and	a,#0x0F
	swap	a
	; Preserve envelope data
	ld	b,a			; save byte
	ld	a,(gbt_vol+0)
	and	a,#0x0F		; mask envelope
	or	a,b

	ld	(gbt_vol+0),a

	jr	refresh_channel1_regs_trig$

ch1_instr_effects$:

	; Set instrument and effect

	ld	b,a ; save byte

	and	a,#0x30
	sla	a
	sla	a
	ld	(gbt_instr+0),a ; Instrument

	ld	a,b ; restore byte

	and	a,#0x0F ; a = effect

	call	gbt_channel_1_set_effect

	and a,a
	;ret	z ; if 0, don't refresh registers, Disabled to set instrument
	jr	refresh_channel1_regs_notrig$

ch1_has_frequency$:

	; Has frequency

	and	a,#0x7F
	ld	(gbt_arpeggio_freq_index+0*3),a
	; This destroys hl and a. Returns freq in bc
	call	_gbt_get_freq_from_index

	ld	a,c
	ld	(gbt_freq+0*2+0),a
	ld	a,b
	ld	(gbt_freq+0*2+1),a ; Get frequency

	ld	a,(de)
	inc	de

	bit	7,a
	jr	nz,ch1_freq_instr_and_effect$

	; Freq + Instr + Volume

	ld	b,a ; save byte

	and	a,#0x30
	sla	a
	sla	a
	ld	(gbt_instr+0),a ; Instrument

	ld	a,b ; restore byte

	and	a,#0x0F ; a = volume

	swap	a
	; Preserve envelope data
	ld	b,a			; save byte
	ld	a,(gbt_vol+0)
	and	a,#0x0F		; mask envelope
	or	a,b

	ld	(gbt_vol+0),a

	jr	refresh_channel1_regs_trig$

ch1_freq_instr_and_effect$:

	; Freq + Instr + Effect

	ld	b,a ; save byte

	and	a,#0x30
	sla	a
	sla	a
	ld	(gbt_instr+0),a ; Instrument

	ld	a,b ; restore byte

	and	a,#0x0F ; a = effect

	call	gbt_channel_1_set_effect

	;jr	refresh_channel1_regs_trig$


	; fall through!

; -----------------

refresh_channel1_regs_trig$:

channel1_refresh_registers_trig:

	xor	a,a
	ld	(#.NR10),a
	ld	a,(gbt_instr+0)
	ld	(#.NR11),a
	ld	a,(gbt_vol+0)
	ld	(#.NR12),a
	ld	a,(gbt_freq+0*2+0)
	ld	(#.NR13),a
	ld	a,(gbt_freq+0*2+1)
	or	a,#0x80 ; start
	ld	(#.NR14),a

	ret

refresh_channel1_regs_notrig$:

channel1_refresh_registers_notrig:

	xor	a,a
	ld	(#.NR10),a
	ld	a,(gbt_instr+0)
	ld	(#.NR11),a
	ld	a,(gbt_freq+0*2+0)
	ld	(#.NR13),a
	ld	a,(gbt_freq+0*2+1)
	ld	(#.NR14),a

	ret

; ------------------

channel1_update_effects: ; returns 1 in a if it is needed to update sound registers

	; Cut note
	; --------

	ld	a,(gbt_cut_note_tick+0)
	ld	hl,#gbt_ticks_elapsed
	cp	a,(hl)
	jp	nz,ch1_dont_cut$

	dec	a ; a = 0xFF
	ld	(gbt_cut_note_tick+0),a ; disable cut note

	xor	a,a ; vol = 0
	ld	(#.NR12),a
	ld	a,#0x80 ; start
	ld	(#.NR14),a

ch1_dont_cut$:

	; Arpeggio or Sweep
	; --------

	ld	a,(gbt_arpeggio_enabled+0)
	and	a,a
	ret	z ; a is 0, return 0

	; Check if Sweep or Arpeggio (4-5 cycles)
	and a,#1
	jr z,gbt_ch1_sweep_run$

	; If enabled arpeggio, handle it

	ld	a,(gbt_arpeggio_tick+0)
	and	a,a
	jr	nz,ch1_not_tick_0$

	; Tick 0 - Set original frequency

	ld	a,(gbt_arpeggio_freq_index+0*3+0)

	call	_gbt_get_freq_from_index

	ld	a,c
	ld	(gbt_freq+0*2+0),a
	ld	a,b
	ld	(gbt_freq+0*2+1),a ; Set frequency

	ld	a,#1
	ld	(gbt_arpeggio_tick+0),a

	ret ; ret 1

ch1_not_tick_0$:

	cp	a,#1
	jr	nz,ch1_not_tick_1$

	; Tick 1

	ld	a,(gbt_arpeggio_freq_index+0*3+1)

	call	_gbt_get_freq_from_index

	ld	a,c
	ld	(gbt_freq+0*2+0),a
	ld	a,b
	ld	(gbt_freq+0*2+1),a ; Set frequency

	ld	a,#2
	ld	(gbt_arpeggio_tick+0),a

	dec	a
	ret ; ret 1

ch1_not_tick_1$:

	; Tick 2

	ld	a,(gbt_arpeggio_freq_index+0*3+2)

	call	_gbt_get_freq_from_index

	ld	a,c
	ld	(gbt_freq+0*2+0),a
	ld	a,b
	ld	(gbt_freq+0*2+1),a ; Set frequency

	xor	a,a
	ld	(gbt_arpeggio_tick+0),a

	inc	a
	ret ; ret 1

gbt_ch1_sweep_run$:

	; PortA Pitch Sweep
	; -----------
	ld	hl,#(gbt_freq+0*2+0)
	ld	a,(gbt_sweep+0)
	bit 7,a ; bit 7, if nz, sweep up.
	jr  z,gbt_ch1_sweep_up$

	; Sweep down -
	sub	a,#0x80
	ld	b,a
	ld	a,(hl)		; Get frequency small (gbt_freq+0*2+0)
	sub	a,b			; subtract b from a
	ld	(hl+),a		; Set frequency small (gbt_freq+0*2+0)
	ld	a,#1
	jr	c,gbt_ch1_sweep_dec$
	ret				; ret 1, update without trigger
	; Sweep down --
gbt_ch1_sweep_dec$:
	dec	(hl)		; DEC frequency large (gbt_freq+0*2+1) 3cy
	ld	a,(hl)
	inc a			; find if decremented past 0 to exactly 255
	ret	nz			; ret/update unless 0
	ld	(hl-),a		; fix frequency large 0x0
	ld	(hl),a		; fix frequency small 0x0
	ld	(gbt_arpeggio_enabled+0),a	; disable sweep
	ret				; ret 0, no update

	; Sweep up +
gbt_ch1_sweep_up$:
	add	a,(hl)		; add frequency small (gbt_freq+0*2+0)
	ld	(hl+),a		; Set frequency small (gbt_freq+0*2+0)
	jr	c,gbt_ch1_sweep_inc$
	ld	a,#1
	ret				; ret 1, update without trigger
	; Sweep up ++
gbt_ch1_sweep_inc$:
	inc	(hl)		; inc frequency large (gbt_freq+0*2+1) 2cy
	ld	a,(hl-)
	and	a,#0x07		; check if wrapped to 0x08 00001000
	ret	nz			; ret/update unless 0
	ld	(gbt_arpeggio_enabled+0),a	; disable sweep
	ld	(#.NR12),a ; vol = 0
	ld	a,#0x80 ; start
	ld	(#.NR14),a
	ret 			; ret 0x80, update without trigger

; -----------------

; returns a = 1 if needed to update registers, 0 if not
gbt_channel_1_set_effect: ; a = effect, de = pointer to data.

	ld	hl,#gbt_ch1_jump_table$
	ld	c,a
	ld	b,#0
	add	hl,bc
	add	hl,bc

	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a

	ld	a,(de) ; load args
	inc	de

	jp	(hl)

gbt_ch1_jump_table$:
	.DW	gbt_ch1_pan$
	.DW	gbt_ch1_arpeggio$
	.DW	gbt_ch1_cut_note$
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1_sweep$
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_jump_pattern
	.DW	gbt_ch1234_jump_position
	.DW	gbt_ch1234_speed
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1_NRx2_VolEnv$

gbt_ch1_pan$:
	and	a,#0x11
	ld	(gbt_pan+0),a
	xor	a,a
	ret ; ret 0 do not update registers, only NR51 at end.

gbt_ch1_arpeggio$:
	ld	b,a ; b = params

	ld	hl,#gbt_arpeggio_freq_index+0*3
	ld	c,(hl) ; c = base index
	inc	hl

	ld	a,b
	swap	a
	and	a,#0x0F
	add	a,c

	ld	(hl+),a ; save first increment

	ld	a,b
	and	a,#0x0F
	add	a,c

	ld	(hl),a ; save second increment

	ld	a,#1
	ld	(gbt_arpeggio_enabled+0),a
	ld	(gbt_arpeggio_tick+0),a

	ret ; ret 1

gbt_ch1_cut_note$:
	ld	(gbt_cut_note_tick+0),a
	or	a,a
	jr nz, gbt_ch1_cut_note_nz$
	xor	a,a  ; vol = 0
	ld	(#.NR12),a
	ld	a,#0x80 ; start
	ld	(#.NR14),a
gbt_ch1_cut_note_nz$:
	xor	a,a ; ret 0
	ret

gbt_ch1_NRx2_VolEnv$:	; Raw data into volume, VVVV APPP, bits 4-7 vol
	ld	(gbt_vol+0),a	; bit 3 true = add, bits 0-2 wait period 
	xor	a,a	; ret 0		; 0xF1 = max volume, sub 1 every 1 tick.
	ret					; 0x0A = min volume, add 1 every 2 ticks.

gbt_ch1_sweep$:
	ld 	(gbt_sweep+0),a
	ld	a,#2
	ld	(gbt_arpeggio_enabled+0),a
	xor	a,a	; ret 0
	ret

;-------------------------------------------------------------------------------
;---------------------------------- Channel 2 ----------------------------------
;-------------------------------------------------------------------------------

gbt_channel_2_handle:: ; de = info

	ld	a,(gbt_channels_enabled)
	and	a,#0x02
	jr	nz,channel2_enabled$

	; Channel is disabled. Increment pointer as needed

	ld	a,(de)
	inc	de
	bit	7,a
	jr	nz,ch2_more_bytes$
	bit	6,a
	jr	z,ch2_no_more_bytes_this_channel$

	jr	ch2_one_more_byte$

ch2_more_bytes$:

	ld	a,(de)
	inc	de
	bit	7,a
	jr	z,ch2_no_more_bytes_this_channel$

ch2_one_more_byte$:

	inc	de

ch2_no_more_bytes_this_channel$:

	ret

channel2_enabled$:

	; Channel 2 is enabled

	ld	a,(de)
	inc	de

	bit	7,a
	jr	nz,ch2_has_frequency$

	; Not frequency

	bit	6,a
	jr	nz,ch2_instr_effects$

	; Set volume or NOP

	bit	5,a
	jr	nz,ch2_just_set_volume$

	; NOP

	ret

ch2_just_set_volume$:

	; Set volume

	and	a,#0x0F
	swap	a
	; Preserve envelope data
	ld	b,a			; save byte
	ld	a,(gbt_vol+1)
	and	a,#0x0F		; mask envelope
	or	a,b

	ld	(gbt_vol+1),a

	jr	refresh_channel2_regs_trig$

ch2_instr_effects$:

	; Set instrument and effect

	ld	b,a ; save byte

	and	a,#0x30
	sla	a
	sla	a
	ld	(gbt_instr+1),a ; Instrument

	ld	a,b ; restore byte

	and	a,#0x0F ; a = effect

	call	gbt_channel_2_set_effect

	and a,a
	;ret	z ; if 0, don't refresh registers, Disabled to set instrument
	jr	refresh_channel2_regs_notrig$

ch2_has_frequency$:

	; Has frequency

	and	a,#0x7F
	ld	(gbt_arpeggio_freq_index+1*3),a
	; This destroys hl and a. Returns freq in bc
	call	_gbt_get_freq_from_index

	ld	a,c
	ld	(gbt_freq+1*2+0),a
	ld	a,b
	ld	(gbt_freq+1*2+1),a ; Get frequency

	ld	a,(de)
	inc	de

	bit	7,a
	jr	nz,ch2_freq_instr_and_effect$

	; Freq + Instr + Volume

	ld	b,a ; save byte

	and	a,#0x30
	sla	a
	sla	a
	ld	(gbt_instr+1),a ; Instrument

	ld	a,b ; restore byte

	and	a,#0x0F ; a = volume

	swap	a
	; Preserve envelope data
	ld	b,a			; save byte
	ld	a,(gbt_vol+1)
	and	a,#0x0F		; mask envelope
	or	a,b

	ld	(gbt_vol+1),a

	jr	refresh_channel2_regs_trig$

ch2_freq_instr_and_effect$:

	; Freq + Instr + Effect

	ld	b,a ; save byte

	and	a,#0x30
	sla	a
	sla	a
	ld	(gbt_instr+1),a ; Instrument

	ld	a,b ; restore byte

	and	a,#0x0F ; a = effect

	call	gbt_channel_2_set_effect

	;jr	.refresh_channel2_regs_trig

	; fall through!

; -----------------

refresh_channel2_regs_trig$:

channel2_refresh_registers_trig:

	ld	a,(gbt_instr+1)
	ld	(#.NR21),a
	ld	a,(gbt_vol+1)
	ld	(#.NR22),a
	ld	a,(gbt_freq+1*2+0)
	ld	(#.NR23),a
	ld	a,(gbt_freq+1*2+1)
	or	a,#0x80 ; start
	ld	(#.NR24),a

	ret

refresh_channel2_regs_notrig$:

channel2_refresh_registers_notrig:

	ld	a,(gbt_instr+1)
	ld	(#.NR21),a
	ld	a,(gbt_freq+1*2+0)
	ld	(#.NR23),a
	ld	a,(gbt_freq+1*2+1)
	ld	(#.NR24),a

	ret

; ------------------

channel2_update_effects: ; returns 1 in a if it is needed to update sound regs

	; Cut note
	; --------

	ld	a,(gbt_cut_note_tick+1)
	ld	hl,#gbt_ticks_elapsed
	cp	a,(hl)
	jp	nz,ch2_dont_cut$

	dec	a ; a = 0xFF
	ld	(gbt_cut_note_tick+1),a ; disable cut note

	xor	a,a ; vol = 0
	ld	(#.NR22),a
	ld	a,#0x80 ; start
	ld	(#.NR24),a

ch2_dont_cut$:

	; Arpeggio or Sweep
	; --------

	ld	a,(gbt_arpeggio_enabled+1)
	and	a,a
	ret	z ; a is 0, return 0

	; Check if Sweep or Arpeggio (5-6 cycles)
	and a,#1
	jr z,gbt_ch2_sweep_run$
	; If enabled arpeggio, handle it

	ld	a,(gbt_arpeggio_tick+1)
	and	a,a
	jr	nz,ch2_not_tick_0$

	; Tick 0 - Set original frequency

	ld	a,(gbt_arpeggio_freq_index+1*3+0)

	call	_gbt_get_freq_from_index

	ld	a,c
	ld	(gbt_freq+1*2+0),a
	ld	a,b
	ld	(gbt_freq+1*2+1),a ; Set frequency

	ld	a,#1
	ld	(gbt_arpeggio_tick+1),a

	ret ; ret 1

ch2_not_tick_0$:

	cp	a,#1
	jr	nz,ch2_not_tick_1$

	; Tick 1

	ld	a,(gbt_arpeggio_freq_index+1*3+1)

	call	_gbt_get_freq_from_index

	ld	a,c
	ld	(gbt_freq+1*2+0),a
	ld	a,b
	ld	(gbt_freq+1*2+1),a ; Set frequency

	ld	a,#2
	ld	(gbt_arpeggio_tick+1),a

	dec	a
	ret ; ret 1

ch2_not_tick_1$:

	; Tick 2

	ld	a,(gbt_arpeggio_freq_index+1*3+2)

	call	_gbt_get_freq_from_index

	ld	a,c
	ld	(gbt_freq+1*2+0),a
	ld	a,b
	ld	(gbt_freq+1*2+1),a ; Set frequency

	xor	a,a
	ld	(gbt_arpeggio_tick+1),a

	inc	a
	ret ; ret 1

gbt_ch2_sweep_run$:

	; PortA Pitch Sweep
	; -----------
	ld	hl,#(gbt_freq+1*2+0)
	ld	a,(gbt_sweep+1)
	bit 7,a ; bit 7, if nz, sweep up.
	jr  z,gbt_ch2_sweep_up$

	; Sweep down -
	sub	a,#0x80
	ld	b,a
	ld	a,(hl)		; Get frequency small (gbt_freq+0*2+0)
	sub	a,b			; subtract b from a
	ld	(hl+),a		; Set frequency small (gbt_freq+0*2+0)
	ld	a,#1
	jr	c,gbt_ch2_sweep_dec$
	ret				; ret 1, update without trigger
	; Sweep down --
gbt_ch2_sweep_dec$:
	dec	(hl)		; DEC frequency large (gbt_freq+0*2+1) 3cy
	ld	a,(hl)
	inc a			; find if decremented past 0 to exactly 255
	ret	nz			; ret/update unless 0
	ld	(hl-),a		; fix frequency large 0x0
	ld	(hl),a		; fix frequency small 0x0
	ld	(gbt_arpeggio_enabled+1),a	; disable sweep
	ret				; ret 0, no update

	; Sweep up +
gbt_ch2_sweep_up$:
	add	a,(hl)		; add frequency small (gbt_freq+0*2+0)
	ld	(hl+),a		; Set frequency small (gbt_freq+0*2+0)
	jr	c,gbt_ch2_sweep_inc$
	ld	a,#1
	ret				; ret 1, update without trigger
	; Sweep up ++
gbt_ch2_sweep_inc$:
	inc	(hl)		; inc frequency large (gbt_freq+0*2+1) 2cy
	ld	a,(hl-)
	and	a,#0x07		; check if wrapped to 0x08 00001000
	ret nz			; ret/update unless 0
	ld	(gbt_arpeggio_enabled+1),a	; disable sweep
	ld	(#.NR22),a ; vol = 0
	ld	a,#0x80 ; start
	ld	(#.NR24),a
	ret 			; ret 0x80, update without trigger

; -----------------

; returns a = 1 if needed to update registers, 0 if not
gbt_channel_2_set_effect: ; a = effect, de = pointer to data

	ld	hl,#gbt_ch2_jump_table$
	ld	c,a
	ld	b,#0
	add	hl,bc
	add	hl,bc

	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a

	ld	a,(de) ; load args
	inc	de

	jp	(hl)

gbt_ch2_jump_table$:
	.DW	gbt_ch2_pan$
	.DW	gbt_ch2_arpeggio$
	.DW	gbt_ch2_cut_note$
	.DW	gbt_ch1234_nop
	.DW	gbt_ch2_sweep$
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_jump_pattern
	.DW	gbt_ch1234_jump_position
	.DW	gbt_ch1234_speed
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch2_NRx2_VolEnv$

gbt_ch2_pan$:
	and	a,#0x22
	ld	(gbt_pan+1),a
	xor	a,a ; ret 0
	ret ; Should not update registers, only NR51 at end.

gbt_ch2_arpeggio$:
	ld	b,a ; b = params

	ld	hl,#gbt_arpeggio_freq_index+1*3
	ld	c,(hl) ; c = base index
	inc	hl

	ld	a,b
	swap	a
	and	a,#0x0F
	add	a,c

	ld	(hl+),a ; save first increment

	ld	a,b
	and	a,#0x0F
	add	a,c

	ld	(hl),a ; save second increment

	ld	a,#1
	ld	(gbt_arpeggio_enabled+1),a
	ld	(gbt_arpeggio_tick+1),a

	ret ; ret 1

gbt_ch2_cut_note$:
	ld	(gbt_cut_note_tick+1),a
	or	a,a
	jr nz, gbt_ch2_cut_note_nz$
	xor	a,a  ; vol = 0
	ld	(#.NR22),a
	ld	a,#0x80 ; start
	ld	(#.NR24),a
gbt_ch2_cut_note_nz$:
	xor	a,a ; ret 0
	ret

gbt_ch2_NRx2_VolEnv$:	; raw volumeEnv, VVVV APPP, bits 7-4 vol
	ld	(gbt_vol+1),a	; bit 3 true = add, bits 2-0 wait period 
	xor	a,a	; ret 0		; 0xF1 = max volume, sub 1 every 1 tick.
	ret					; 0x0A = min volume, add 1 every 2 ticks.

gbt_ch2_sweep$:
	ld 	(gbt_sweep+1),a
	ld	a,#2
	ld	(gbt_arpeggio_enabled+1),a
	xor	a,a	; ret 0
	ret

;-------------------------------------------------------------------------------
;---------------------------------- Channel 3 ----------------------------------
;-------------------------------------------------------------------------------

gbt_channel_3_handle:: ; de = info

	ld	a,(gbt_channels_enabled)
	and	a,#0x04
	jr	nz,channel3_enabled$

	; Channel is disabled. Increment pointer as needed

	ld	a,(de)
	inc	de
	bit	7,a
	jr	nz,ch3_more_bytes$
	bit	6,a
	jr	z,ch3_no_more_bytes_this_channel$

	jr	ch3_one_more_byte$

ch3_more_bytes$:

	ld	a,(de)
	inc	de
	bit	7,a
	jr	z,ch3_no_more_bytes_this_channel$

ch3_one_more_byte$:

	inc	de

ch3_no_more_bytes_this_channel$:

	ret

channel3_enabled$:

	; Channel 3 is enabled

	ld	a,(de)
	inc	de

	bit	7,a
	jr	nz,ch3_has_frequency$

	; Not frequency

	bit	6,a
	jr	nz,ch3_effects$

	; Set volume or NOP

	bit	5,a
	jr	nz,ch3_just_set_volume$

	; NOP

	ret

ch3_just_set_volume$:

	; Set volume

	swap	a
	ld	(gbt_vol+2),a

	jr	refresh_channel3_regs_trig$

ch3_effects$:

	; Set effect

	and	a,#0x0F ; a = effect

	call	gbt_channel_3_set_effect
	and	a,a
	ret	z ; if 0, don't refresh registers

	jr	refresh_channel3_regs_notrig$

ch3_has_frequency$:

	; Has frequency

	and	a,#0x7F
	ld	(gbt_arpeggio_freq_index+2*3),a
	; This destroys hl and a. Returns freq in bc
	call	_gbt_get_freq_from_index

	ld	a,c
	ld	(gbt_freq+2*2+0),a
	ld	a,b
	ld	(gbt_freq+2*2+1),a ; Get frequency

	ld	a,(de)
	inc	de

	bit	7,a
	jr	nz,ch3_freq_instr_and_effect$

	; Freq + Instr + Volume

	ld	b,a ; save byte

	and	a,#0x0F
	ld	(gbt_instr+2),a ; Instrument

	ld	a,b ; restore byte

	and	a,#0x30 ; a = volume
	sla	a
	ld	(gbt_vol+2),a

	jr	refresh_channel3_regs_trig$

ch3_freq_instr_and_effect$:

	; Freq + Instr + Effect

	ld	b,a ; save byte

	and	a,#0x0F
	ld	(gbt_instr+2),a ; Instrument

	ld	a,b ; restore byte

	and	a,#0x70
	swap	a	; a = effect (only 0-7 allowed here)

	call	gbt_channel_3_set_effect

	;jr	.refresh_channel3_regs

	; fall through!

; -----------------
refresh_channel3_regs_trig$:

channel3_refresh_registers_trig:

	xor	a,a
	ld	(#.NR30),a ; disable

	ld	a,(gbt_channel3_loaded_instrument)
	ld	b,a
	ld	a,(gbt_instr+2)
	cp	a,b
	call	nz,gbt_channel3_load_instrument ; a = instrument

	ld	a,#0x80
	ld	(#.NR30),a ; enable

	xor	a,a
	ld	(#.NR31),a
	ld	a,(gbt_vol+2)
	ld	(#.NR32),a
	ld	a,(gbt_freq+2*2+0)
	ld	(#.NR33),a
	ld	a,(gbt_freq+2*2+1)
	or	a,#0x80 ; start
	ld	(#.NR34),a

	ret

refresh_channel3_regs_notrig$:
	; Don't Restart Waveform!
channel3_refresh_registers_notrig:

	ld	a,(gbt_freq+2*2+0)
	ld	(#.NR33),a
	ld	a,(gbt_freq+2*2+1)
	ld	(#.NR34),a

	ret
; ------------------

gbt_channel3_load_instrument:

	ld	(gbt_channel3_loaded_instrument),a

	swap	a ; a = a * 16
	ld	c,a
	ld	b,#0
	ld	hl,#gbt_wave
	add	hl,bc

	ld	c,#0x30
	ld	b,#16
ch3_loop$:
	ld	a,(hl+)
	ldh	(c),a
	inc	c
	dec	b
	jr	nz,ch3_loop$

	ret

; ------------------

channel3_update_effects: ; returns 1 in a if it is needed to update sound regs

	; Cut note
	; --------

	ld	a,(gbt_cut_note_tick+2)
	ld	hl,#gbt_ticks_elapsed
	cp	a,(hl)
	jp	nz,ch3_dont_cut$

	dec	a ; a = 0xFF
	ld	(gbt_cut_note_tick+2),a ; disable cut note

	xor	a,a ; vol = 0
	ld	(#.NR30),a ; disable
	ld	(#.NR32),a
	ld	a,#0x80 ; start
	ld	(#.NR34),a

ch3_dont_cut$:

	; Arpeggio or Sweep
	; --------

	ld	a,(gbt_arpeggio_enabled+2)
	and	a,a
	ret	z ; a is 0, return 0

	; Check if Sweep or Arpeggio (5-6 cycles)
	and a,#1
	jp z,gbt_ch3_sweep_run$

	; If enabled arpeggio, handle it

	ld	a,(gbt_arpeggio_tick+2)
	and	a,a
	jr	nz,ch3_not_tick_0$

	; Tick 0 - Set original frequency

	ld	a,(gbt_arpeggio_freq_index+2*3+0)

	call	_gbt_get_freq_from_index

	ld	a,c
	ld	(gbt_freq+2*2+0),a
	ld	a,b
	ld	(gbt_freq+2*2+1),a ; Set frequency

	ld	a,#1
	ld	(gbt_arpeggio_tick+2),a

	ret ; ret 1

ch3_not_tick_0$:

	cp	a,#1
	jr	nz,ch3_not_tick_1$

	; Tick 1

	ld	a,(gbt_arpeggio_freq_index+2*3+1)

	call	_gbt_get_freq_from_index

	ld	a,c
	ld	(gbt_freq+2*2+0),a
	ld	a,b
	ld	(gbt_freq+2*2+1),a ; Set frequency

	ld	a,#2
	ld	(gbt_arpeggio_tick+2),a

	dec	a
	ret ; ret 1

ch3_not_tick_1$:

	; Tick 2

	ld	a,(gbt_arpeggio_freq_index+2*3+2)

	call	_gbt_get_freq_from_index

	ld	a,c
	ld	(gbt_freq+2*2+0),a
	ld	a,b
	ld	(gbt_freq+2*2+1),a ; Set frequency

	xor	a,a
	ld	(gbt_arpeggio_tick+2),a

	inc	a
	ret ; ret 1

gbt_ch3_sweep_run$:

	; PortA Pitch Sweep
	; -----------
	ld	hl,#(gbt_freq+2*2+0)
	ld	a,(gbt_sweep+2)
	bit 7,a ; bit 7, if nz, sweep up.
	jr  z,gbt_ch3_sweep_up$

	; Sweep down -
	sub	a,#0x80
	ld	b,a
	ld	a,(hl)		; Get frequency small (gbt_freq+0*2+0)
	sub	a,b			; subtract b from a
	ld	(hl+),a		; Set frequency small (gbt_freq+0*2+0)
	ld	a,#1
	jr	c,gbt_ch3_sweep_dec$
	ret				; ret 1, update without trigger
	; Sweep down --
gbt_ch3_sweep_dec$:
	dec	(hl)		; DEC frequency large (gbt_freq+0*2+1) 3cy
	ld	a,(hl)
	inc a			; find if decremented past 0 to exactly 255
	ret	nz			; ret/update unless 0
	ld	(hl-),a		; fix frequency large 0x0
	ld	(hl),a		; fix frequency small 0x0
	ld	(gbt_arpeggio_enabled+2),a	; disable sweep
	ret				; ret 0, no update

	; Sweep up +
gbt_ch3_sweep_up$:
	add	a,(hl)		; add frequency small (gbt_freq+0*2+0)
	ld	(hl+),a		; Set frequency small (gbt_freq+0*2+0)
	jr	c,gbt_ch3_sweep_inc$
	ld	a,#1
	ret				; ret 1, update without trigger
	; Sweep up ++
gbt_ch3_sweep_inc$:
	inc	(hl)		; inc frequency large (gbt_freq+0*2+1) 2cy
	ld	a,(hl-)
	and	a,#0x07		; check if wrapped to 0x08 00001000
	ret	nz			; ret/update unless 0
	ld	(gbt_arpeggio_enabled+2),a	; disable sweep
	ld	(#.NR32),a ; vol = 0
	ld	a,#0x80 ; start
	ld	(#.NR34),a
	ret 			; ret 1, update without trigger

; -----------------

; returns a = 1 if needed to update registers, 0 if not
gbt_channel_3_set_effect: ; a = effect, de = pointer to data

	ld	hl,#gbt_ch3_jump_table$
	ld	c,a
	ld	b,#0
	add	hl,bc
	add	hl,bc

	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a

	ld	a,(de) ; load args
	inc	de

	jp	(hl)

gbt_ch3_jump_table$:
	.DW	gbt_ch3_pan$
	.DW	gbt_ch3_arpeggio$
	.DW	gbt_ch3_cut_note$
	.DW	gbt_ch1234_nop
	.DW	gbt_ch3_sweep$
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_jump_pattern
	.DW	gbt_ch1234_jump_position
	.DW	gbt_ch1234_speed
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop

gbt_ch3_pan$:
	and	a,#0x44
	ld	(gbt_pan+2),a
	xor	a,a ; ret 0
	ret ; do not update registers, only NR51 at end.

gbt_ch3_arpeggio$:
	ld	b,a ; b = params

	ld	hl,#gbt_arpeggio_freq_index+2*3
	ld	c,(hl) ; c = base index
	inc	hl

	ld	a,b
	swap	a
	and	a,#0x0F
	add	a,c

	ld	(hl+),a ; save first increment

	ld	a,b
	and	a,#0x0F
	add	a,c

	ld	(hl),a ; save second increment

	ld	a,#1
	ld	(gbt_arpeggio_enabled+2),a
	ld	(gbt_arpeggio_tick+2),a

	ret ; ret 1

gbt_ch3_cut_note$:
	ld	(gbt_cut_note_tick+2),a
	or	a,a
	jr nz, gbt_ch3_cut_note_nz$
	xor	a,a ; vol = 0
	ld	(#.NR30),a ; disable
	ld	(#.NR32),a
	ld	a,#0x80 ; start
	ld	(#.NR34),a
gbt_ch3_cut_note_nz$:
	xor	a,a ; ret 0
	ret

gbt_ch3_sweep$:
	ld 	(gbt_sweep+2),a
	ld	a,#2
	ld	(gbt_arpeggio_enabled+2),a
	xor	a,a	; ret 0
	ret

;-------------------------------------------------------------------------------
;---------------------------------- Channel 4 ----------------------------------
;-------------------------------------------------------------------------------

gbt_channel_4_handle:: ; de = info

	ld	a,(gbt_channels_enabled)
	and	a,#0x08
	jr	nz,channel4_enabled$

	; Channel is disabled. Increment pointer as needed

	ld	a,(de)
	inc	de
	bit	7,a
	jr	nz,ch4_more_bytes$
	bit	6,a
	jr	z,ch4_no_more_bytes_this_channel$

	jr	ch4_one_more_byte$

ch4_more_bytes$:

	ld	a,(de)
	inc	de
	bit	7,a
	jr	z,ch4_no_more_bytes_this_channel$

ch4_one_more_byte$:

	inc	de

ch4_no_more_bytes_this_channel$:

	ret

channel4_enabled$:

	; Channel 4 is enabled

	ld	a,(de)
	inc	de

	bit	7,a
	jr	nz,ch4_has_instrument$

	; Not instrument

	bit	6,a
	jr	nz,ch4_effects$

	; Set volume or NOP

	bit	5,a
	jr	nz,ch4_just_set_volume$

	; NOP

	ret

ch4_just_set_volume$:

	; Set volume

	and	a,#0x0F
	swap	a
	; Preserve envelope data
	ld	b,a			; save byte
	ld	a,(gbt_vol+3)
	and	a,#0x0F		; mask envelope
	or	a,b

	ld	(gbt_vol+3),a

	jr	refresh_channel4_regs$

ch4_effects$:

	; Set effect

	and	a,#0x0F ; a = effect

	call	gbt_channel_4_set_effect
	and	a,a
	ret	z ; if 0, don't refresh registers

	jr	refresh_channel4_regs$

ch4_has_instrument$:

	; Has instrument raw frequency data

	and	a,#0x7F ; mask out bit 7
	ld	b,a

	ld	a,(de)	; load next byte
	inc	de
	ld	c,a
	rla
	and a,#0x80	; Mask only bit 7
	or	a,b		; Append noise bit
	ld	(gbt_instr+3),a
	ld	a,c		; restore byte2
	bit	7,a
	jr	nz,ch4_instr_and_effect$

	; Instr + Volume

	and	a,#0x0F ; a = volume

	swap	a
	; Preserve envelope data
	ld	b,a			; save byte
	ld	a,(gbt_vol+3)
	and	a,#0x0F		; mask envelope
	or	a,b

	ld	(gbt_vol+3),a

	jr	refresh_channel4_regs$

ch4_instr_and_effect$:

	; Instr + Effect

	and	a,#0x0F ; a = effect

	call	gbt_channel_4_set_effect

	;jr	ch4_refresh_channel4_regs$

refresh_channel4_regs$:

	; fall through!

; -----------------

channel4_refresh_registers:

	xor	a,a
	ld	(#.NR41),a
	ld	a,(gbt_vol+3)
	ld	(#.NR42),a
	ld	a,(gbt_instr+3)
	ld	(#.NR43),a
	ld	a,#0x80 ; start
	ld	(#.NR44),a

	ret

; ------------------

channel4_update_effects: ; returns 1 in a if it is needed to update sound regs

	; Cut note
	; --------

	ld	a,(gbt_cut_note_tick+3)
	ld	hl,#gbt_ticks_elapsed
	cp	a,(hl)
	jp	nz,ch4_dont_cut$

	dec	a ; a = 0xFF
	ld	(gbt_cut_note_tick+3),a ; disable cut note

	xor	a,a ; vol = 0
	ld	(#.NR42),a
	ld	a,#0x80 ; start
	ld	(#.NR44),a

ch4_dont_cut$:

	xor	a,a
	ret ; a is 0, return

; -----------------

; returns a = 1 if needed to update registers, 0 if not
gbt_channel_4_set_effect: ; a = effect, de = pointer to data

	ld	hl,#gbt_ch4_jump_table$
	ld	c,a
	ld	b,#0
	add	hl,bc
	add	hl,bc

	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a

	ld	a,(de) ; load args
	inc	de

	jp	(hl)

gbt_ch4_jump_table$:
	.DW	gbt_ch4_pan$
	.DW	gbt_ch1234_nop ; gbt_ch4_arpeggio
	.DW	gbt_ch4_cut_note$
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_jump_pattern
	.DW	gbt_ch1234_jump_position
	.DW	gbt_ch1234_speed
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch1234_nop
	.DW	gbt_ch4_NRx2_VolEnv$

gbt_ch4_pan$:
	and	a,#0x88
	ld	(gbt_pan+3),a
	xor	a,a ; ret 0
	ret ; do not update registers, only NR51 at end.

gbt_ch4_cut_note$:
	ld	(gbt_cut_note_tick+3),a
	or	a,a
	jr nz, gbt_ch4_cut_note_nz$
	xor	a,a  ; vol = 0
	ld	(#.NR42),a
	ld	a,#0x80 ; start
	ld	(#.NR44),a
gbt_ch4_cut_note_nz$:
	xor	a,a ; ret 0
	ret

gbt_ch4_NRx2_VolEnv$:	; Raw data into volume, VVVV APPP, bits 4-7 vol
	ld	(gbt_vol+3),a	; bit 3 true = add, bits 0-2 wait period 
	xor	a,a	; ret 0		; 0xF1 = max volume, sub 1 every 1 tick.
	ret					; 0x0A = min volume, add 1 every 2 ticks.

;-------------------------------------------------------------------------------

; Common effects go here:

gbt_ch1234_nop:
	xor	a,a ;ret 0
	ret

gbt_ch1234_jump_pattern:
	ld	(gbt_current_pattern),a
	xor	a,a
	ld	(gbt_current_step),a
	ld	(gbt_have_to_stop_next_step),a ; clear stop flag
	ld	a,#1
	ld	(gbt_update_pattern_pointers),a
	xor	a,a ;ret 0
	ret

gbt_ch1234_jump_position:
	ld	(gbt_current_step),a
	ld	hl,#gbt_current_pattern
	inc	(hl)

	; Check to see if jump puts us past end of song
	ld	a,(hl)
	call	gbt_get_pattern_ptr_banked
	ld	a,#1 ; tell gbt_player.s to do this next cycle
	ld	(gbt_update_pattern_pointers),a
	xor	a,a ;ret 0
	ret

gbt_ch1234_speed:
	ld	(gbt_speed),a
	xor	a,a
	ld	(gbt_ticks_elapsed),a
	ret ;ret 0

;-------------------------------------------------------------------------------

gbt_update_bank1::

	ld	de,#gbt_temp_play_data

	; each function will return in de the pointer to next byte

	call	gbt_channel_1_handle

	call	gbt_channel_2_handle

	call	gbt_channel_3_handle

	call	gbt_channel_4_handle

	; end of channel handling

	ld	hl,#gbt_pan
	ld	a,(hl+)
	or	a,(hl)
	inc	hl
	or	a,(hl)
	inc hl
	or	a,(hl)
	ld	(#.NR51),a ; handle panning...

	ret

;-------------------------------------------------------------------------------

gbt_update_effects_bank1::

	call	channel1_update_effects
	and	a,a
	call	nz,channel1_refresh_registers_notrig

	call	channel2_update_effects
	and	a,a
	call	nz,channel2_refresh_registers_notrig

	call	channel3_update_effects
	and	a,a
	call	nz,channel3_refresh_registers_notrig

	call	channel4_update_effects
	and	a,a
	call	nz,channel4_refresh_registers

	ret

;-------------------------------------------------------------------------------
