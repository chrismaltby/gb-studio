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

	.area	_DATA

;-------------------------------------------------------------------------------
.start_gbt_vars:

gbt_playing::
	.ds	1

gbt_song:: ; pointer to the pointer array
	.ds	2
gbt_bank:: ; bank with the data
	.ds 1
gbt_speed:: ; playing speed
	.ds 1

; Up to 12 bytes per step are copied here to be handled in bank 1
gbt_temp_play_data::
	.ds 12

gbt_loop_enabled::
	.ds 1
gbt_ticks_elapsed::
	.ds	1
gbt_current_step::
	.ds	1
gbt_current_pattern::
	.ds	1
gbt_current_step_data_ptr:: ; pointer to next step data
	.ds 2

gbt_channels_enabled::
	.ds	1

gbt_pan:: ; Ch 1-4
	.ds	4*1
gbt_vol:: ; Ch 1-4
	.ds	4*1
gbt_instr:: ; Ch 1-4
	.ds	4*1
gbt_freq:: ; Ch 1-3
	.ds	3*2

gbt_channel3_loaded_instrument:: ; current loaded instrument ($FF if none)
	.ds	1

; Arpeggio -> Ch 1-3
gbt_arpeggio_freq_index::
	.ds 3*3 ; { base index, base index + x, base index + y } * 3
gbt_arpeggio_enabled::
	.ds 3*1 ; if 0, disabled, if 1, arp, if 2, sweep
gbt_arpeggio_tick::
	.ds	3*1

; Porta Pitch Sweep -> Ch 1-3
gbt_sweep::
	.ds 3*1 ; bit 7 is subtract mode, bit 0-6 is how much.

; Cut note
gbt_cut_note_tick::
	.ds	4*1 ; If tick == gbt_cut_note_tick, stop note.

; Last step of last pattern this is set to 1
gbt_have_to_stop_next_step::
	.ds 1

gbt_update_pattern_pointers::
	.ds 1 ; set to 1 by jump effects

.end_gbt_vars:

;-------------------------------------------------------------------------------

	.area _GSINIT	

;-------------------------------------------------------------------------------

	ld	HL, #.start_gbt_vars
	ld	C, #(.end_gbt_vars - .start_gbt_vars)
	rst	0x28
	
;-------------------------------------------------------------------------------

	.area	_CODE

;-------------------------------------------------------------------------------

gbt_get_pattern_ptr: ; a = pattern number

	; loads a pointer to pattern a into gbt_current_step_data_ptr

	ld	e,a
	ld	d,#0

	ld	a,(gbt_bank)
	ld	(#0x2000),a ; MBC1, MBC3, MBC5 - Set bank

	ld	hl,#gbt_song
	ld	a,(hl+)
	ld	l,(hl)
	ld	h,a

	; hl = pointer to list of pointers
	; de = pattern number

	add	hl,de
	add	hl,de

	; hl = pointer to pattern a pointer

	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a

	; hl = pointer to pattern a data

	ld	a,l
	ld	(gbt_current_step_data_ptr),a
	ld	a,h
	ld	(gbt_current_step_data_ptr+1),a

	ret

;-------------------------------------------------------------------------------

gbt_get_pattern_ptr_banked:: ; a = pattern number

	; loads a pointer to pattern a into gbt_current_step_data_ptr

	ld	c,a
	ld	b,#0

	ld	a,(gbt_bank)
	ld	(#0x2000),a ; MBC1, MBC3, MBC5 - Set bank

	ld	hl,#gbt_song
	ld	a,(hl+)
	ld	l,(hl)
	ld	h,a

	; hl = pointer to list of pointers
	; de = pattern number

	add	hl,bc
	add	hl,bc

	; hl = pointer to pattern a pointer

	ld	a,(hl+)
	ld	b,(hl)
	or	a,b
	jr	nz,dont_loop$
	ld	(gbt_current_pattern), a ; a = 0
dont_loop$:
	ld	a,#0x01
	ld	(#0x2000),a ; MBC1, MBC3, MBC5 - Set bank

	ret

;-------------------------------------------------------------------------------

_gbt_play::

	push	bc

	lda	hl,4(sp)
	ld	e,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	c,(hl)
	inc hl
	ld	b,(hl)

	; de = data
	; b = speed , c = bank

	ld	hl,#gbt_song
	ld	(hl),d
	inc	hl
	ld	(hl),e

	ld	a,c
	ld	(gbt_bank),a
	ld	a,b
	ld	(gbt_speed),a

	ld	a,#0
	call	gbt_get_pattern_ptr

	xor	a,a
	ld	(gbt_current_step),a
	ld	(gbt_current_pattern),a
	ld	(gbt_ticks_elapsed),a
	ld	(gbt_loop_enabled),a
	ld	(gbt_have_to_stop_next_step),a
	ld	(gbt_update_pattern_pointers),a

	ld	a,#0xFF
	ld	(gbt_channel3_loaded_instrument),a

	ld	a,#0x0F
	ld	(gbt_channels_enabled),a

	ld	hl,#gbt_pan
	ld	a,#0x11 ; L and R
	ld	(hl+),a
	sla	a
	ld	(hl+),a
	sla	a
	ld	(hl+),a
	sla	a
	ld	(hl),a

	ld	hl,#gbt_vol
	ld	a,#0xF0 ; 100%
	ld	(hl+),a
	ld	(hl+),a
	ld	a,#0x20 ; 100%
	ld	(hl+),a
	ld	a,#0xF0 ; 100%
	ld	(hl+),a

	ld	a,#0

	ld	hl,#gbt_instr
	ld	(hl+),a
	ld	(hl+),a
	ld	(hl+),a
	ld	(hl+),a

	ld	hl,#gbt_freq
	ld	(hl+),a
	ld	(hl+),a
	ld	(hl+),a
	ld	(hl+),a
	ld	(hl+),a
	ld	(hl+),a

	ld	(gbt_arpeggio_enabled+0),a
	ld	(gbt_arpeggio_enabled+1),a
	ld	(gbt_arpeggio_enabled+2),a

	ld	a,#0xFF
	ld	(gbt_cut_note_tick+0),a
	ld	(gbt_cut_note_tick+1),a
	ld	(gbt_cut_note_tick+2),a
	ld	(gbt_cut_note_tick+3),a

	ld	a,#0x80
	ldh	(#.NR52),a
	ld	a,#0x00
	ldh	(#.NR51),a
	ld	a,#0x00 ; 0%
	ldh	(#.NR50),a

	xor	a,a
	ldh	(#.NR10),a
	ldh	(#.NR11),a
	ldh	(#.NR12),a
	ldh	(#.NR13),a
	ldh	(#.NR14),a
	ldh	(#.NR21),a
	ldh	(#.NR22),a
	ldh	(#.NR23),a
	ldh	(#.NR24),a
	ldh	(#.NR30),a
	ldh	(#.NR31),a
	ldh	(#.NR32),a
	ldh	(#.NR33),a
	ldh	(#.NR34),a
	ldh	(#.NR41),a
	ldh	(#.NR42),a
	ldh	(#.NR43),a
	ldh	(#.NR44),a

	ld	a,#0x77 ; 100%
	ldh	(#.NR50),a

	ld	a,#0x01
	ld	(gbt_playing),a

	pop	bc
	ret

;-------------------------------------------------------------------------------

_gbt_pause::
	lda	hl,2(sp)
	ld	a,(hl)
	ld	(gbt_playing),a
	or	a
	jr	nz,.gbt_pause_unmute
	ldh	(#.NR50),a ; Mute sound: set L & R sound levels to Off
	ret

.gbt_pause_unmute: ; Unmute sound if playback is resumed
	ld	a,#0x77
	ldh	(#.NR50),a ; Restore L & R sound levels to 100%
	ret

;-------------------------------------------------------------------------------

_gbt_loop::
	lda	hl,2(sp)
	ld	a,(hl)
	ld	(gbt_loop_enabled),a
	ret

;-------------------------------------------------------------------------------

_gbt_stop::
	xor	a
	ld	(gbt_playing),a
	ldh	(#.NR50),a
	ldh	(#.NR51),a
	ldh	(#.NR52),a
	ret

;-------------------------------------------------------------------------------

_gbt_enable_channels::
	lda	hl,2(sp)
	ld	a,(hl)
	ld	(gbt_channels_enabled),a
	ret

;-------------------------------------------------------------------------------

_gbt_update::

	push	bc

	; gbt_update has some "ret z" and things like that
	; We call it from here to make it easier to mantain both
	; RGBDS and GBDK versions.
	call	gbt_update

	pop	bc

	ret

;-------------------------------------------------------------------------------

gbt_update:

	ld	a,(gbt_playing)
	or	a,a
	ret	z ; If not playing, return

	; Handle tick counter

	ld	hl,#gbt_ticks_elapsed
	ld	a,(gbt_speed) ; a = total ticks
	ld	b,(hl) ; b = ticks elapsed
	inc	b
	ld	(hl),b
	cp	a,b
	jr	z,.dontexit

	; Tick != Speed, update effects and exit
	ld	a,#0x01
	ld	(#0x2000),a ; MBC1, MBC3, MBC5 - Set bank 1
	call	gbt_update_effects_bank1 ; Call update function in bank 1

	ret

.dontexit:
	ld	(hl),#0x00 ; reset tick counter

	; Clear tick-based effects
	; ------------------------

	xor	a,a
	ld	hl,#gbt_arpeggio_enabled ; Disable arpeggio
	ld	(hl+),a
	ld	(hl+),a
	ld	(hl),a
	dec	a ; a = 0xFF
	ld	hl,#gbt_cut_note_tick ; Disable cut note
	ld	(hl+),a
	ld	(hl+),a
	ld	(hl+),a
	ld	(hl),a

	; Update effects
	; --------------

	ld	a,#0x01
	ld	(#0x2000),a ; MBC1, MBC3, MBC5 - Set bank 1
	call	gbt_update_effects_bank1 ; Call update function in bank 1

	; Check if last step
	; ------------------

	ld	a,(gbt_have_to_stop_next_step)
	or	a,a
	jr	z,.dont_stop

	call	_gbt_stop
	ld	a,#0
	ld	(gbt_have_to_stop_next_step),a
	ret

.dont_stop:

	; Get this step data
	; ------------------

	; Change to bank with song data

	ld	a,(gbt_bank)
	ld	(#0x2000),a ; MBC1, MBC3, MBC5

	; Get step data

	ld	a,(gbt_current_step_data_ptr)
	ld	l,a
	ld	a,(gbt_current_step_data_ptr+1)
	ld	h,a ; hl = pointer to data

	ld	de,#gbt_temp_play_data

	ld	b,#4
.copy_loop:	; copy as bytes as needed for this step

	ld	a,(hl+)
	ld	(de),a
	inc	de
	bit	7,a
	jr	nz,.more_bytes
	bit	6,a
	jr	z,.no_more_bytes_this_channel

	jr	.one_more_byte

.more_bytes:

	ld	a,(hl+)
	ld	(de),a
	inc	de
	bit	7,a
	jr	z,.no_more_bytes_this_channel

.one_more_byte:

	ld	a,(hl+)
	ld	(de),a
	inc	de

.no_more_bytes_this_channel:
	dec	b
	jr	nz,.copy_loop

	ld	a,l
	ld	(gbt_current_step_data_ptr),a
	ld	a,h
	ld	(gbt_current_step_data_ptr+1),a ; save pointer to data

	; Increment step/pattern
	; ----------------------

	; Increment step

	ld	a,(gbt_current_step)
	inc	a
	ld	(gbt_current_step),a
	cp	a,#64
	jr	nz,.dont_increment_pattern

	; Increment pattern

	ld	a,#0
	ld	(gbt_current_step),a ; Step 0

	ld	a,(gbt_current_pattern)
	inc	a
	ld	(gbt_current_pattern),a

	call	gbt_get_pattern_ptr

	ld	a,(gbt_current_step_data_ptr)
	ld	b,a
	ld	a,(gbt_current_step_data_ptr+1)
	or	a,b
	jr	nz,.not_ended ; if pointer is 0, song has ended

	ld	a,(gbt_loop_enabled)
	and	a,a

	jr	z,.loop_disabled

	; If loop is enabled, jump to pattern 0

	ld	a,#0
	ld	(gbt_current_pattern),a

	call	gbt_get_pattern_ptr

	jr	.end_handling_steps_pattern

.loop_disabled:

	; If loop is disabled, stop song
	; Stop it next step, if not this step won't be played

	ld	a,#1
	ld	(gbt_have_to_stop_next_step),a

.not_ended:

.dont_increment_pattern:

.end_handling_steps_pattern:

	ld	a,#0x01
	ld	(#0x2000),a ; MBC1, MBC3, MBC5 - Set bank 1
	call	gbt_update_bank1 ; Call update function in bank 1

	; Check if any effect has changed the pattern or step

	ld	a,(gbt_update_pattern_pointers)
	and	a,a
	ret	z
	; if any effect has changed the pattern or step, update

	xor	a,a
	ld	(gbt_update_pattern_pointers),a ; clear update flag

	ld	(gbt_have_to_stop_next_step),a ; clear stop flag

	ld	a,(gbt_current_pattern)
	call	gbt_get_pattern_ptr ; set ptr to start of the pattern

	; Search the step

	; Change to bank with song data

	ld	a,(gbt_bank)
	ld	(#0x2000),a ; MBC1, MBC3, MBC5

	ld	a,(gbt_current_step_data_ptr)
	ld	l,a
	ld	a,(gbt_current_step_data_ptr+1)
	ld	h,a ; hl = pointer to data

	ld	a,(gbt_current_step)
	and	a,a
	ret	z ; if changing to step 0, exit

	sla	a
	sla	a
	ld	b,a ; b = iterations = step * 4 (number of channels)
.next_channel:

	ld	a,(hl+)
	bit	7,a
	jr	nz,.next_channel_more_bytes
	bit	6,a
	jr	z,.next_channel_no_more_bytes_this_channel

	jr	.next_channel_one_more_byte

.next_channel_more_bytes:

	ld	a,(hl+)
	bit	7,a
	jr	z,.next_channel_no_more_bytes_this_channel

.next_channel_one_more_byte:

	ld	a,(hl+)

.next_channel_no_more_bytes_this_channel:
	dec	b
	jr	nz,.next_channel

	ld	a,l
	ld	(gbt_current_step_data_ptr),a
	ld	a,h
	ld	(gbt_current_step_data_ptr+1),a ; save pointer to data

	ret

;-------------------------------------------------------------------------------
