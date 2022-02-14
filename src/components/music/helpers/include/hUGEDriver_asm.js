// https://github.com/chrismaltby/gbvm/blob/master/third-party/HUGE_TRACKER/hUGEDriver.asm

export default `include "include/hardware.inc"\n
include "include/hUGE.inc"\n
\n
add_a_to_r16: MACRO\n
    add \\2\n
    ld \\2, a\n
    adc \\1\n
    sub \\2\n
    ld \\1, a\n
ENDM\n
\n
add_a_to_hl: MACRO\n
    add_a_to_r16 h, l\n
ENDM\n
\n
add_a_to_de: MACRO\n
    add_a_to_r16 d, e\n
ENDM\n
\n
ret_dont_call_playnote: MACRO\n
    pop hl\n
    pop af\n
    and a ; Clear carry to avoid calling 'play_chX_note'\n
    push af\n
    jp hl\n
ENDM\n
\n
add_a_ind_ret_hl: MACRO\n
    ld hl, \\1\n
    add [hl]\n
    inc hl\n
    ld h, [hl]\n
    ld l, a\n
    adc h\n
    sub l\n
    ld h, a\n
ENDM\n
\n
load_hl_ind: MACRO\n
    ld hl, \\1\n
    ld a, [hl+]\n
    ld h, [hl]\n
    ld l, a\n
ENDM\n
\n
load_de_ind: MACRO\n
    ld a, [\\1]\n
    ld e, a\n
    ld a, [\\1+1]\n
    ld d, a\n
ENDM\n
\n
retMute: MACRO\n
    bit \\1, a\n
    ret nz\n
ENDM\n
\n
checkMute: MACRO\n
    ld a, [mute_channels]\n
    bit \\1, a\n
    jr nz, \\2\n
ENDM\n
\n
;; Maximum pattern length\n
PATTERN_LENGTH EQU 64\n
;; Amount to be shifted in order to skip a channel.\n
CHANNEL_SIZE_EXPONENT EQU 3\n
\n
SECTION "Playback variables", WRAM0\n
;; Active song descriptor\n
order_cnt: db\n
_start_song_descriptor_pointers:\n
;; Pointers to the song's current four orders (one per channel)\n
order1: dw\n
order2: dw\n
order3: dw\n
order4: dw\n
\n
;; Pointers to the instrument tables\n
duty_instruments: dw\n
wave_instruments: dw\n
noise_instruments: dw\n
\n
;; Misc. pointers\n
routines: dw\n
waves: dw\n
_end_song_descriptor_pointers:\n
\n
;; Pointers to the current patterns (sort of a cache)\n
pattern1: dw\n
pattern2: dw\n
pattern3: dw\n
pattern4: dw\n
\n
;; How long a row lasts in ticks (1 = one row per call to 'hUGE_dosound', etc. 0 translates to 256)\n
ticks_per_row: db\n
\n
_hUGE_current_wave::\n
hUGE_current_wave::\n
;; ID of the wave currently loaded into wave RAM\n
current_wave: db\n
hUGE_NO_WAVE equ 100\n
    EXPORT hUGE_NO_WAVE\n
\n
;; Everything between this and 'end_zero' is zero-initialized by 'hUGE_init'\n
start_zero:\n
\n
_hUGE_mute_mask::\n
mute_channels: db\n
current_order: db\n
next_order: db\n
row_break: db\n
\n
temp_note_value: dw\n
row: db\n
tick: db\n
counter: db\n
\n
channels:\n
;;;;;;;;;;;\n
;;Channel 1\n
;;;;;;;;;;;\n
channel1:\n
channel_period1: dw\n
toneporta_target1: dw\n
channel_note1: db\n
vibrato_tremolo_phase1: db\n
envelope1: db\n
highmask1: db\n
\n
;;;;;;;;;;;\n
;;Channel 2\n
;;;;;;;;;;;\n
channel2:\n
channel_period2: dw\n
toneporta_target2: dw\n
channel_note2: db\n
vibrato_tremolo_phase2: db\n
envelope2: db\n
highmask2: db\n
\n
;;;;;;;;;;;\n
;;Channel 3\n
;;;;;;;;;;;\n
channel3:\n
channel_period3: dw\n
toneporta_target3: dw\n
channel_note3: db\n
vibrato_tremolo_phase3: db\n
envelope3: db\n
highmask3: db\n
\n
;;;;;;;;;;;\n
;;Channel 4\n
;;;;;;;;;;;\n
channel4:\n
channel_period4: dw\n
toneporta_target4: dw\n
channel_note4: db\n
vibrato_tremolo_phase4: db\n
envelope4: db\n
highmask4: db\n
\n
end_zero:\n
\n
SECTION "Sound Driver", ROM0\n
\n
;;; Sets up hUGEDriver to play a song.\n
;;; !!! BE SURE THAT 'hUGE_dosound' WILL NOT BE CALLED WHILE THIS RUNS !!!\n
;;; Param: HL = Pointer to the "song descriptor" you wish to load (typically exported by hUGETracker).\n
;;; Destroys: AF C DE HL\n
hUGE_init::\n
    ld a, [hl+] ; tempo\n
    ld [ticks_per_row], a\n
\n
    ld a, [hl+]\n
    ld e, a\n
    ld a, [hl+]\n
    ld d, a\n
    ld a, [de]\n
    ld [order_cnt], a\n
\n
    ld c, _end_song_descriptor_pointers - (_start_song_descriptor_pointers)\n
    ld de, order1\n
\n
.copy_song_descriptor_loop:\n
    ld a, [hl+]\n
    ld [de], a\n
    inc de\n
    dec c\n
    jr nz, .copy_song_descriptor_loop\n
\n
IF !DEF(PREVIEW_MODE)\n
    ;; Zero some ram\n
    ld c, end_zero - start_zero\n
    ld hl, start_zero\n
    xor a\n
.fill_loop:\n
    ld [hl+], a\n
    dec c\n
    jr nz, .fill_loop\n
ENDC\n
\n
    ;; These two are zero-initialized by the loop above, so these two writes must come after\n
    ld a, %11110000\n
    ld [envelope1], a\n
    ld [envelope2], a\n
\n
    ;; Force loading the next wave\n
    ld a, hUGE_NO_WAVE\n
    ld [current_wave], a\n
\n
;; Preview mode needs to load the order ID from memory\n
IF !DEF(PREVIEW_MODE)\n
    ld c, 0\n
ELSE\n
    ld a, [current_order]\n
    ld c, a\n
ENDC\n
    ;; fallthrough (load the pattern pointers)\n
\n
;;; Sets all 4 pattern pointers from a certain index in the respective 4 orders.\n
;;; Param: C = The index (in increments of 2)\n
;;; Destroy: AF DE HL\n
load_patterns:\n
IF DEF(PREVIEW_MODE)\n
    db $fc ; signal order update to tracker\n
ENDC\n
\n
    ld hl, order1\n
    ld de, pattern1\n
    call .load_pattern\n
\n
    ld hl, order2\n
    call .load_pattern\n
\n
    ld hl, order3\n
    call .load_pattern\n
\n
    ld hl, order4\n
    ;; fallthrough\n
\n
.load_pattern:\n
    ld a, [hl+]\n
    add c\n
    ld h, [hl]\n
    ld l, a\n
    adc h\n
    sub l\n
    ld h, a\n
\n
    ld a, [hl+]\n
    ld [de], a\n
    inc de\n
    ld a, [hl]\n
    ld [de], a\n
    inc de\n
    ret\n
\n
\n
;;; Sets a channel's muting status.\n
;;; Muted channels are left entirely alone by the driver, so that you can repurpose them,\n
;;; for example for sound effects, CH3 sample playback, etc.\n
;;; If muting the channel, the note being played will be cut.\n
;;; Param: B = Which channel to enable; 0 for CH1, 1 for CH2, etc.\n
;;; Param: C = 0 to unmute the channel, 1 to mute it\n
;;; Destroy: A C E HL\n
hUGE_mute_channel::\n
    ld e, $fe\n
    ld a, b\n
    or a\n
    jr z, .enable_cut\n
.enable_loop:\n
    sla c\n
    rlc e\n
    dec a\n
    jr nz, .enable_loop\n
.enable_cut:\n
    ld a, [mute_channels]\n
    and e\n
    or  c\n
    ld [mute_channels], a\n
    and c\n
    jp nz, note_cut\n
    ret\n
\n
\n
;;; Reads a pattern's current row.\n
;;; Param: BC = Pointer to the pattern\n
;;; Param: [row] = Index of the current row\n
;;; Return: A = Note ID\n
;;; Return: B = Instrument (upper nibble) & effect code (lower nibble)\n
;;; Return: C = Effect parameter\n
;;; Destroy: HL\n
get_current_row:\n
    ld a, [row]\n
    ld h, a\n
    ;; Multiply by 3 for the note value\n
    add h\n
    add h\n
\n
    ld h, 0\n
    ld l, a\n
    add hl, bc ; HL now points at the 3rd byte of the note\n
    ld a, [hl+]\n
    ld b, [hl]\n
    inc hl\n
    ld c, [hl]\n
    ret\n
\n
;;; Gets the "period" of a pattern's current note.\n
;;; Param: HL = Pointer to the pattern pointer\n
;;; Param: [row] = Index of the current row\n
;;; Param: DE = Location to write the note's index to, if applicable\n
;;; Return: HL = Note's period\n
;;; Return: CF = Set if and only if a "valid" note (i.e. not a "rest")\n
;;; Return: [DE] = Note's ID, not updated if a "rest"\n
;;; Return: B = Instrument (upper nibble) & effect code (lower nibble)\n
;;; Return: C = Effect parameter\n
;;; Destroy: AF\n
get_current_note:\n
    ld a, [hl+]\n
    ld c, a\n
    ld b, [hl]\n
\n
    call get_current_row\n
    ld hl, 0\n
\n
    ;; If the note we found is greater than LAST_NOTE, then it's not a valid note\n
    ;; and nothing needs to be updated.\n
    cp LAST_NOTE\n
    ret nc\n
\n
    ;; Store the loaded note value in channel_noteX\n
    ld [de], a\n
\n
;;; Gets a note's "period", i.e. what should be written to NRx3 and NRx4.\n
;;; Param: A = Note ID\n
;;; Return: HL = Note's period\n
;;; Return: CF = 1\n
;;; Destroy: AF\n
get_note_period:\n
    add a ;; double it to get index into hi/lo table\n
    add LOW(note_table)\n
    ld l, a\n
    adc HIGH(note_table)\n
    sub l\n
    ld h, a\n
    ld a, [hl+]\n
    ld h, [hl]\n
    ld l, a\n
\n
    scf\n
    ret\n
\n
;;; Gets a note's "polynomial counter", i.e. what should be written to NR44.\n
;;; Param: A = Note ID\n
;;; Return: A = Note's poly\n
;;; Destroy: F HL\n
get_note_poly:\n
    ;; Invert the order of the numbers\n
    add 192 ; (255 - 63)\n
    cpl\n
\n
    ;; Thanks to RichardULZ for this formula\n
    ;; https://docs.google.com/spreadsheets/d/1O9OTAHgLk1SUt972w88uVHp44w7HKEbS/edit#gid=75028951\n
    ; if A > 7 then begin\n
    ;   B := (A-4) div 4;\n
    ;   C := (A mod 4)+4;\n
    ;   A := (C or (B shl 4))\n
    ; end;\n
\n
    ; if A < 7 then return\n
    cp 7\n
    ret c\n
\n
    ld h, a\n
\n
    ; B := (A-4) div 4;\n
    sub 4\n
    srl a\n
    srl a\n
    ld l, a\n
\n
    ; C := (A mod 4)+4;\n
    ld a, h\n
    and 3 ; mod 4\n
    add 4\n
\n
    ; A := (C or (B shl 4))\n
    swap l\n
    or l\n
    ret\n
\n
\n
;;; Computes the pointer to a member of a channel.\n
;;; Param: B = Which channel (0 = CH1, 1 = CH2, etc.)\n
;;; Param: D = Offset within the channel struct\n
;;; Return: HL = Pointer to the channel's member\n
;;; Destroy: AF\n
ptr_to_channel_member:\n
    ld a, b\n
REPT CHANNEL_SIZE_EXPONENT\n
    add a\n
ENDR\n
    add d\n
    add LOW(channels)\n
    ld l, a\n
    adc HIGH(channels)\n
    sub l\n
    ld h, a\n
    ret\n
\n
\n
;;; Updates a channel's frequency, and possibly restarts it.\n
;;; Note that CH4 is *never* restarted by this!\n
;;; Param: B = Which channel to update (0 = CH1, 1 = CH2, etc.)\n
;;; Param: (ignored for CH4) A = ORed to the value written to NRx4\n
;;; Param: (for CH4) E = Note ID\n
;;; Param: (otherwise) DE = Note period\n
;;; Destroy: AF B\n
;;; Destroy: (for CH4) HL\n
update_channel_freq:\n
    ld c, a\n
    ld a, [mute_channels]\n
    dec b\n
    jr z, .update_channel2\n
    dec b\n
    jr z, .update_channel3\n
    dec b\n
    jr z, .update_channel4\n
\n
.update_channel1:\n
    retMute 0\n
\n
    ld a, e\n
    ldh [rAUD1LOW], a\n
    ld a, d\n
    or c\n
    ldh [rAUD1HIGH], a\n
    ret\n
\n
.update_channel2:\n
    retMute 1\n
\n
    ld a, e\n
    ldh [rAUD2LOW], a\n
    ld a, d\n
    or c\n
    ldh [rAUD2HIGH], a\n
    ret\n
\n
.update_channel3:\n
    retMute 2\n
\n
    ld a, e\n
    ldh [rAUD3LOW], a\n
    ld a, d\n
    or c\n
    ldh [rAUD3HIGH], a\n
    ret\n
\n
.update_channel4:\n
    retMute 3\n
\n
    ld a, e\n
    call get_note_poly\n
    ldh [rAUD4POLY], a\n
    xor a\n
    ldh [rAUD4GO], a\n
    ret\n
\n
\n
play_note_routines:\n
    jr play_ch1_note\n
    jr play_ch2_note\n
    jr play_ch3_note\n
    jr play_ch4_note\n
\n
play_ch1_note:\n
    ld a, [mute_channels]\n
    retMute 0\n
\n
    ;; Play a note on channel 1 (square wave)\n
    ld a, [temp_note_value]\n
    ld [channel_period1], a\n
    ldh [rAUD1LOW], a\n
\n
    ld a, [temp_note_value+1]\n
    ld [channel_period1+1], a\n
\n
    ;; Get the highmask and apply it.\n
    ld hl, highmask1\n
    or [hl]\n
    ldh [rAUD1HIGH], a\n
\n
    ret\n
\n
play_ch2_note:\n
    ld a, [mute_channels]\n
    retMute 1\n
\n
    ;; Play a note on channel 2 (square wave)\n
    ld a, [temp_note_value]\n
    ld [channel_period2], a\n
    ldh [rAUD2LOW], a\n
\n
    ld a, [temp_note_value+1]\n
    ld [channel_period2+1], a\n
\n
    ;; Get the highmask and apply it.\n
    ld hl, highmask2\n
    or [hl]\n
    ldh [rAUD2HIGH], a\n
\n
    ret\n
\n
play_ch3_note:\n
    ld a, [mute_channels]\n
    retMute 2\n
\n
    ;; Triggering CH3 while it's reading a byte corrupts wave RAM.\n
    ;; To avoid this, we kill the wave channel (0 → NR30), then re-enable it.\n
    ;; This way, CH3 will be paused when we trigger it by writing to NR34.\n
    ;; TODO: what if 'highmask3' bit 7 is not set, though?\n
    xor a\n
    ldh [rAUD3ENA], a\n
    cpl\n
    ldh [rAUD3ENA], a\n
\n
    ;; Play a note on channel 3 (waveform)\n
    ld a, [temp_note_value]\n
    ld [channel_period3], a\n
    ldh [rAUD3LOW], a\n
\n
    ld a, [temp_note_value+1]\n
    ld [channel_period3+1], a\n
\n
    ;; Get the highmask and apply it.\n
    ld hl, highmask3\n
    or [hl]\n
    ldh [rAUD3HIGH], a\n
\n
    ret\n
\n
play_ch4_note:\n
    ld a, [mute_channels]\n
    retMute 3\n
\n
    ;; Play a "note" on channel 4 (noise)\n
    ld a, [temp_note_value]\n
    ld [channel_period4+1], a\n
    ldh [rAUD4POLY], a\n
\n
    ;; Get the highmask and apply it.\n
    ld a, [highmask4]\n
    ldh [rAUD4GO], a\n
\n
    ret\n
\n
\n
;;; Performs an effect on a given channel.\n
;;; Param: E = Channel ID (0 = CH1, 1 = CH2, etc.)\n
;;; Param: B = Effect type (upper 4 bits ignored)\n
;;; Param: C = Effect parameters (depend on FX type)\n
;;; Destroy: AF BC DE HL\n
do_effect:\n
    ;; Strip the instrument bits off leaving only effect code\n
    ld a, b\n
    and %00001111\n
    ;; Multiply by 2 to get offset into table\n
    add a\n
\n
    add LOW(.jump)\n
    ld l, a\n
    adc HIGH(.jump)\n
    sub l\n
    ld h, a\n
\n
    ld a, [hl+]\n
    ld h, [hl]\n
    ld l, a\n
\n
    ld b, e\n
    ld a, [tick]\n
    or a ; We can return right off the bat if it's tick zero\n
    jp hl\n
\n
.jump:\n
    ;; Jump table for effect\n
    dw fx_arpeggio                     ;0xy\n
    dw fx_porta_up                     ;1xy\n
    dw fx_porta_down                   ;2xy\n
    dw fx_toneporta                    ;3xy\n
    dw fx_vibrato                      ;4xy\n
    dw fx_set_master_volume            ;5xy ; global\n
    dw fx_call_routine                 ;6xy\n
    dw fx_note_delay                   ;7xy\n
    dw fx_set_pan                      ;8xy ; global\n
    dw fx_set_duty                     ;9xy\n
    dw fx_vol_slide                    ;Axy\n
    dw fx_pos_jump                     ;Bxy ; global\n
    dw fx_set_volume                   ;Cxy\n
    dw fx_pattern_break                ;Dxy ; global\n
    dw fx_note_cut                     ;Exy\n
    dw fx_set_speed                    ;Fxy ; global\n
\n
\n
;;; Processes (global) effect 5, "set master volume".\n
;;; Param: C = Value to write to NR50\n
;;; Param: ZF = Set if and only if on tick 0\n
;;; Destroy: A\n
fx_set_master_volume:\n
    ret nz\n
\n
    ld a, c\n
    ldh [rAUDVOL], a\n
    ret\n
\n
\n
;;; Processes effect 6, "call routine".\n
;;; Param: B = Current channel ID (0 = CH1, 1 = CH2, etc.)\n
;;; Param: C = Routine ID\n
;;; Param: A = Current tick\n
;;; Param: ZF = Set if and only if on tick 0\n
;;; Destroy: Anything the routine does\n
fx_call_routine:\n
    ld hl, routines\n
    ld a, $0f\n
    and c\n
    add a\n
    add [hl]\n
    ld e, a\n
    inc hl\n
    ld a, $0\n
    adc [hl]\n
    ld h, a\n
    ld l, e\n
\n
    ld a, [hl+]\n
    ld h, [hl]\n
    ld l, a\n
\n
    ld a, [tick]\n
    or a ; set zero flag if tick 0 for compatibility\n
IF DEF(GBDK) ; Pass the tick counter as a SDCC call parameter\n
    push af\n
    inc sp\n
    push bc\n
    call .call_hl\n
    add sp, 3\n
    ret\n
\n
.call_hl:\n
ENDC\n
    jp hl\n
\n
\n
;;; Processes (global) effect 8, "set pan".\n
;;; Param: B = Current channel ID (0 = CH1, 1 = CH2, etc.)\n
;;; Param: C = Value to write to NR51\n
;;; Param: ZF = Set if and only if on tick 0\n
;;; Destroy: A\n
fx_set_pan:\n
    ret nz\n
\n
    ;; Pretty simple. The editor can create the correct value here without a bunch\n
    ;; of bit shifting manually.\n
    ld a, c\n
    ldh [rAUDTERM], a\n
    ret\n
\n
\n
;;; Processes effect 9, "set duty cycle".\n
;;; Param: B = Current channel ID (0 = CH1, anything else = CH2)\n
;;; Param: C = Value to write to NRx1\n
;;; Param: ZF = Set if and only if on tick 0\n
;;; Destroy: AF\n
fx_set_duty:\n
    ret nz\n
\n
    ;; $900 = 12.5%\n
    ;; $940 = 25%\n
    ;; $980 = 50%\n
    ;; $9C0 = 75%\n
\n
    ld a, b\n
    or a\n
    ld a, [mute_channels]\n
    jr z, .chan1\n
.chan2:\n
    retMute 1\n
    ld a, c\n
    ldh [rAUD2LEN], a\n
    ret\n
.chan1:\n
    retMute 0\n
    ld a, c\n
    ldh [rAUD1LEN], a\n
    ret\n
\n
\n
;;; Processes effect A, "volume slide".\n
;;; Param: B = Current channel ID (0 = CH1, 1 = CH2, etc.)\n
;;; Param: C = FX param; either nibble should be 0, otherwise weird (unspecified) behavior may arise\n
;;; Param: ZF = Set if and only if on tick 0\n
;;; Destroy: AF C DE HL\n
fx_vol_slide:\n
    ret nz\n
\n
    ;; This is really more of a "retrigger note with lower volume" effect and thus\n
    ;; isn't really that useful. Instrument envelopes should be used instead.\n
    ;; Might replace this effect with something different if a new effect is\n
    ;; ever needed.\n
\n
    ;; check channel mute\n
\n
    ;; 0 → $01, 1 → $02, 2 → $04, 3 → $05\n
    ;; Overall, these two instructions add 1 to the number.\n
    ;; However, the first instruction will generate a carry for inputs of $02 and $03;\n
    ;; the 'adc' will pick the carry up, and "separate" 0 / 1 from 2 / 3 by an extra 1.\n
    ;; Luckily, this yields correct results for 0 ($01), 1 ($02), and 2 ($03 + 1 = $04).\n
    ;; We'll see about fixing 3 afterwards.\n
    add -2\n
    adc 3\n
    ;; After being shifted left, the inputs are $02, $04, $08 and $0A; all are valid BCD,\n
    ;; except for $0A. Since we just performed 'add a', DAA will correct the latter to $10.\n
    ;; (This should be correctly emulated everywhere, since the inputs are identical to\n
    ;; "regular" BCD.)\n
    ;; When shifting the results back, we'll thus get $01, $02, $04 and $08!\n
    add a\n
    daa\n
    rra\n
    ld d, a\n
    ld a, [mute_channels]\n
    and d\n
    ret nz\n
\n
    ;; setup the up and down params\n
    ld a, c\n
    and %00001111\n
    ld d, a\n
\n
    ld a, c\n
    and %11110000\n
    ld e, a\n
    swap e\n
\n
    ; There are 5 bytes between each envelope register\n
    ld a, b\n
    add a\n
    add a\n
    add b\n
    add LOW(rAUD1ENV)\n
    ld c, a\n
\n
    ldh a, [c]\n
    and %11110000\n
    swap a\n
    sub d\n
    jr nc, .cont1\n
    xor a\n
.cont1:\n
    add e\n
    cp $10\n
    jr c, .cont2\n
    ld a, $F\n
.cont2:\n
    swap a\n
    ldh [c], a\n
\n
    ; Go to rAUDxGO, which is 2 bytes after\n
    inc c\n
    inc c\n
    ldh a, [c]\n
    or %10000000\n
    ldh [c], a\n
\n
    jr play_note\n
\n
\n
;;; Processes effect 7, "note delay".\n
;;; Param: B = Current channel ID (0 = CH1, 1 = CH2, etc.)\n
;;; Param: C = Amount of ticks by which to delay the note\n
;;;            Caveats: 0 never plays the note, and a delay longer than a row's duration skips the note entirely\n
;;; Param: ZF = Set if and only if on tick 0\n
;;; Destroy: AF D HL\n
fx_note_delay:\n
    jr nz, .play_note\n
\n
    ;; Just store the note into the channel period, and don't play a note.\n
    ld d, 0\n
    call ptr_to_channel_member\n
\n
    ld a, [temp_note_value]\n
    ld [hl+], a\n
    ld a, [temp_note_value+1]\n
    ld [hl], a\n
\n
    ;; Don't call _playnote. This is done by grabbing the return\n
    ;; address and manually skipping the next call instruction.\n
    ret_dont_call_playnote\n
\n
.play_note:\n
    cp c\n
    ret nz ; wait until the correct tick to play the note\n
\n
    ;; fallthrough\n
\n
\n
;;; Plays a channel's current note.\n
;;; Param: B = Which channel (0 = CH1, 1 = CH2, etc.)\n
;;; Destroy: AF D HL\n
play_note:\n
    ld d, 0\n
    call ptr_to_channel_member\n
\n
    ;; TODO: Change this to accept HL instead?\n
    ld a, [hl+]\n
    ld [temp_note_value], a\n
    ld a, [hl]\n
    ld [temp_note_value+1], a\n
\n
    ld a, b\n
    add a\n
    add LOW(play_note_routines)\n
    ld l, a\n
    adc HIGH(play_note_routines)\n
    sub l\n
    ld h, a\n
    jp hl\n
\n
\n
;;; Processes (global) effect F, "set speed".\n
;;; Param: C = New amount of ticks per row\n
;;; Param: ZF = Set if and only if on tick 0\n
;;; Destroy: A\n
fx_set_speed:\n
    ret nz\n
\n
    ld a, c\n
    ld [ticks_per_row], a\n
    ret\n
\n
\n
hUGE_set_position::\n
;;; Processes (global) effect B, "position jump".\n
;;; Param: C = ID of the order to jump to\n
;;; Destroy: A\n
fx_pos_jump:\n
    ld a, 1\n
    ld [row_break], a\n
    ld a, c\n
    ld [next_order], a\n
    ret\n
\n
\n
;;; Processes (global) effect D, "pattern break".\n
;;; Param: C = ID of the next order's row to start on\n
;;; Destroy: A\n
fx_pattern_break:\n
    ld a, c\n
    ld [row_break], a\n
    ret\n
\n
\n
;;; Processes effect E, "note cut".\n
;;; Param: B = Current channel ID (0 = CH1, 1 = CH2, etc.)\n
;;; Param: C = Tick to cut the note on (TODO: what does cutting on tick 0 do?)\n
;;; Param: A = Current tick\n
;;; Destroy: A\n
fx_note_cut:\n
    cp c\n
    ret nz\n
\n
    ;; check channel mute\n
\n
    ;; 0 → $01, 1 → $02, 2 → $04, 3 → $05\n
    ;; Overall, these two instructions add 1 to the number.\n
    ;; However, the first instruction will generate a carry for inputs of $02 and $03;\n
    ;; the 'adc' will pick the carry up, and "separate" 0 / 1 from 2 / 3 by an extra 1.\n
    ;; Luckily, this yields correct results for 0 ($01), 1 ($02), and 2 ($03 + 1 = $04).\n
    ;; We'll see about fixing 3 afterwards.\n
    add -2\n
    adc 3\n
    ;; After being shifted left, the inputs are $02, $04, $08 and $0A; all are valid BCD,\n
    ;; except for $0A. Since we just performed 'add a', DAA will correct the latter to $10.\n
    ;; (This should be correctly emulated everywhere, since the inputs are identical to\n
    ;; "regular" BCD.)\n
    ;; When shifting the results back, we'll thus get $01, $02, $04 and $08!\n
    add a\n
    daa\n
    rra\n
    ld d, a\n
    ld a, [mute_channels]\n
    and d\n
    ret nz\n
\n
    ;; fallthrough\n
\n
\n
;;; Cuts note on a channel.\n
;;; Param: B = Current channel ID (0 = CH1, 1 = CH2, etc.)\n
;;; Destroy: AF HL\n
note_cut:\n
    ld a, b\n
    add a\n
    add a\n
    add b ; multiply by 5\n
    add LOW(rAUD1ENV)\n
    ld l, a\n
    ld h, HIGH(rAUD1ENV)\n
    xor a\n
    ld [hl+], a\n
    ld a, b\n
    cp 2\n
    ret z ; return early if CH3-- no need to retrigger note\n
\n
    ;; Retrigger note\n
    inc l ; Not 'inc hl' because H stays constant (= $FF)\n
    ld [hl], $FF\n
    ret\n
\n
\n
;;; Processes effect C, "set volume".\n
;;; Param: B = Current channel ID (0 = CH1, 1 = CH2, etc.)\n
;;; Param: C = Volume to set the channel to\n
;;; Param: ZF = Set if and only if on tick 0\n
;;; Destroy: AF BC\n
fx_set_volume:\n
    ret nz ; Return if we're not on tick zero.\n
\n
    swap c\n
    ld a, [mute_channels]\n
    dec b\n
    jr z, .set_chn_2_vol\n
    dec b\n
    jr z, .set_chn_3_vol\n
    dec b\n
    jr z, .set_chn_4_vol\n
\n
.set_chn_1_vol:\n
    retMute 0\n
\n
    ldh a, [rAUD1ENV]\n
    and %00001111\n
    or c\n
    ldh [rAUD1ENV], a\n
    ret\n
\n
.set_chn_2_vol:\n
    retMute 1\n
\n
    ldh a, [rAUD2ENV]\n
    and %00001111\n
    or c\n
    ldh [rAUD2ENV], a\n
    ret\n
\n
.set_chn_3_vol:\n
    retMute 2\n
\n
    ;; "Quantize" the more finely grained volume control down to one of 4 values.\n
    ld a, c\n
    cp 10 << 4\n
    jr nc, .one\n
    cp 5 << 4\n
    jr nc, .two\n
    or a\n
    jr z, .done ; Zero maps to zero\n
.three:\n
    ld a, %01100000\n
    jr .done\n
.two:\n
    ld a, %01000000\n
    jr .done\n
.one:\n
    ld a, %00100000\n
.done:\n
    ldh [rAUD3LEVEL], a\n
    ret\n
\n
.set_chn_4_vol:\n
    retMute 3\n
\n
    ld a, c\n
    ldh [rAUD4ENV], a\n
    ret\n
\n
\n
;;; Processes effect 4, "vibrato".\n
;;; Param: B = Current channel ID (0 = CH1, 1 = CH2, etc.)\n
;;; Param: C = FX param\n
;;; Param: ZF = Set if and only if on tick 0\n
;;; Destroy: AF B DE HL\n
fx_vibrato:\n
    ret z\n
\n
    ;; Extremely poor man's vibrato.\n
    ;; Speed values:\n
    ;; (0x0  = 1.0)\n
    ;; (0x1  = 0.5)\n
    ;; (0x3  = 0.25)\n
    ;; (0x7  = 0.125)\n
    ;; (0xf  = 0.0625)\n
    ld d, 4\n
    call ptr_to_channel_member\n
\n
    ld a, c\n
    and %11110000\n
    swap a\n
    ld e, a\n
\n
    ld a, [counter]\n
    and e\n
    ld a, [hl]\n
    jr z, .go_up\n
.restore:\n
    call get_note_period\n
    jr .finish_vibrato\n
.go_up:\n
    call get_note_period\n
    ld a, c\n
    and %00001111\n
    add_a_to_hl\n
.finish_vibrato:\n
    ld d, h\n
    ld e, l\n
    xor a\n
    jp update_channel_freq\n
\n
\n
;;; Processes effect 8, "arpeggio".\n
;;; Param: B = Current channel ID (0 = CH1, 1 = CH2, etc.)\n
;;; Param: C = Offsets in semitones (each nibble)\n
;;; Param: ZF = Set if and only if on tick 0\n
;;; Destroy: AF B DE HL\n
fx_arpeggio:\n
    ret z\n
\n
    ld d, 4\n
    call ptr_to_channel_member\n
    ld d, [hl]\n
\n
    ld a, [tick]\n
    dec a\n
\n
    ;; TODO: A crappy modulo, because it's not a multiple of four :(\n
\n
    jr .test_greater_than_two\n
.greater_than_two:\n
    sub 3\n
.test_greater_than_two:\n
    cp 3\n
    jr nc, .greater_than_two\n
\n
    ;; Multiply by 2 to get offset into table\n
    add a\n
\n
    add LOW(.arp_options)\n
    ld l, a\n
    adc HIGH(.arp_options)\n
    sub l\n
    ld h, a\n
    jp hl\n
\n
.arp_options:\n
    jr .set_arp1\n
    jr .set_arp2\n
    ;; No 'jr .reset_arp'\n
\n
.reset_arp:\n
    ld a, d\n
    jr .finish_skip_add\n
\n
.set_arp2:\n
    ld a, c\n
    swap a\n
    db $FE ; cp <imm8> gobbles next byte\n
\n
.set_arp1:\n
    ld a, c\n
.finish_arp:\n
    and %00001111\n
    add d\n
.finish_skip_add:\n
    call get_note_period\n
    ld d, h\n
    ld e, l\n
    xor a\n
    jp update_channel_freq\n
\n
\n
;;; Processes effect 1, "portamento up".\n
;;; Param: B = Current channel ID (0 = CH1, 1 = CH2, etc.)\n
;;; Param: C = How many units to slide the pitch by per tick\n
;;; Param: ZF = Set if and only if on tick 0\n
;;; Destroy: A B DE HL\n
fx_porta_up:\n
    ret z\n
\n
    ld d, 0\n
    call ptr_to_channel_member\n
\n
    ;; Add C to 16-bit value at HL\n
    ld a, [hl+]\n
    add c\n
    ld e, a\n
    adc [hl]\n
    sub e\n
\n
    ;; Write back\n
.finish:\n
    ld d, a ; Store A for call to 'update_channel_freq'\n
    ld [hl-], a\n
    ld [hl], e\n
\n
    xor a\n
    jp update_channel_freq\n
\n
\n
;;; Processes (global) effect 2, "portamento down".\n
;;; Param: B = Current channel ID (0 = CH1, 1 = CH2, etc.)\n
;;; Param: C = How many units to slide the pitch down by per tick\n
;;; Param: ZF = Set if and only if on tick 0\n
;;; Destroy: A B DE HL\n
fx_porta_down:\n
    ret z\n
\n
    ld d, 0\n
    call ptr_to_channel_member\n
\n
    ;; Subtract C from 16-bit value at [HL]\n
    ld a, [hl+]\n
    sub c\n
    ld e, a\n
    sbc a\n
    add [hl]\n
\n
    ;; Write back\n
    jr fx_porta_up.finish\n
\n
\n
;;; Processes effect 2, "tone portamento".\n
;;; Param: B = Current channel ID (0 = CH1, 1 = CH2, etc.)\n
;;; Param: C = Target note\n
;;; Param: ZF = Set if and only if on tick 0\n
;;; Destroy: A B DE HL\n
fx_toneporta:\n
    jr nz, .do_toneporta\n
\n
    ;; We're on tick zero, so just move the temp note value into the toneporta target.\n
    ld d, 2\n
    call ptr_to_channel_member\n
\n
    ;; If the note is nonexistent, then just return\n
    ld a, [temp_note_value]\n
    or a\n
    jr z, .return_skip\n
\n
    ld [hl+], a\n
    ld a, [temp_note_value+1]\n
    ld [hl], a\n
\n
    ;; Don't call _playnote. This is done by grabbing the return\n
    ;; address and manually skipping the next call instruction.\n
.return_skip:\n
    ret_dont_call_playnote\n
\n
.do_toneporta:\n
    ld d, 0\n
    call ptr_to_channel_member\n
    push hl\n
\n
    ;; Read current period\n
    ld a, [hl+]\n
    ld e, a\n
    ld a, [hl+]\n
    ld d, a\n
\n
    ;; Read target period\n
    ld a, [hl+]\n
    ld h, [hl]\n
    ld l, a\n
\n
    ;; Do we need to porta up, or down? Compute (current - target) and check carry to know\n
    sub e\n
    ld a, h\n
    sbc d\n
    jr c, .porta_down ; Current period (DE) is higher than target one (HL), so down we go!\n
\n
    ;; Add offset to current freq\n
    ld a, e\n
    add c\n
    ld e, a\n
    adc d\n
    sub e\n
    ld d, a\n
    ;; We don't need to worry about overflow given the relatively low values we work with\n
\n
    ld c, 0 ; The overshoot comparison should yield no carry, like the above one\n
    jr .check_overshoot\n
\n
.porta_down:\n
    ;; Subtract offset from current freq\n
    ld a, e\n
    sub c\n
    ld e, a\n
    sbc a\n
    add d\n
    ld d, a\n
    jr c, .overshot ; There will be no underflows under my watch!\n
\n
    ld c, $FF ; The overshoot comparison should yield carry, like the above one\n
\n
.check_overshoot:\n
    ld a, l\n
    sub e\n
    ld a, h\n
    sbc d\n
    rra ; Shift carry into bit 7\n
    xor c ; XOR it with provided value\n
    rla ; Shift maybe-toggled carry back\n
    jr nc, .no_overshoot\n
.overshot:\n
    ;; Override computed new period with target\n
    ld d, h\n
    ld e, l\n
.no_overshoot:\n
\n
    pop hl\n
    ld a, e\n
    ld [hl+], a\n
    ld [hl], d\n
\n
    ;; Do not retrigger channel\n
    ld a, 6\n
    add_a_to_hl\n
    ld a, [hl]\n
    res 7, [hl]\n
    ;; B must be preserved for this\n
    jp update_channel_freq\n
\n
\n
;; TODO: Find some way to de-duplicate this code!\n
;;; Computes the pointer to a CH4 instrument.\n
;;; Param: B = The instrument's ID\n
;;; Param: DE = Instrument pointer table\n
;;; Return: DE = Pointer to the instrument\n
;;; Return: ZF = Set if and only if there was no instrument (ID == 0)\n
;;; Destroy: AF\n
setup_instrument_pointer_ch4:\n
    ;; Call with:\n
    ;; Instrument/High nibble of effect in B\n
    ;; Stores whether the instrument was real in the Z flag\n
    ;; Stores the instrument pointer in DE\n
    ld a, b\n
    and %11110000\n
    swap a\n
    ret z ; If there's no instrument, then return early.\n
\n
    dec a ; Instrument 0 is "no instrument"\n
    add a\n
    jr setup_instrument_pointer.finish\n
\n
;;; Computes the pointer to an instrument.\n
;;; Param: B = The instrument's ID\n
;;; Param: DE = Instrument pointer table\n
;;; Return: DE = Pointer to the instrument\n
;;; Return: ZF = Set if and only if there was no instrument (ID == 0)\n
;;; Destroy: AF\n
setup_instrument_pointer:\n
    ;; Call with:\n
    ;; Instrument/High nibble of effect in B\n
    ;; Stores whether the instrument was real in the Z flag\n
    ;; Stores the instrument pointer in DE\n
    ld a, b\n
    and %11110000\n
    swap a\n
    ret z ; If there's no instrument, then return early.\n
\n
    dec a ; Instrument 0 is "no instrument"\n
.finish:\n
    ;; Shift left twice to multiply by 4\n
    add a\n
    add a\n
\n
    add_a_to_de\n
\n
    rla ; reset the Z flag\n
    ret\n
\n
\n
_hUGE_dosound_banked::\n
_hUGE_dosound::\n
;;; Ticks the sound engine once.\n
;;; Destroy: AF BC DE HL\n
hUGE_dosound::\n
    ld a, [tick]\n
    or a\n
    jp nz, process_effects\n
\n
    ;; Note playback\n
    ld hl, pattern1\n
    ld de, channel_note1\n
    call get_current_note\n
    push af\n
    jr nc, .do_setvol1\n
\n
    load_de_ind duty_instruments\n
    call setup_instrument_pointer\n
    ld a, [highmask1]\n
    res 7, a ; Turn off the "initial" flag\n
    jr z, .write_mask1\n
\n
    checkMute 0, .do_setvol1\n
\n
    ld a, [de]\n
    inc de\n
    ldh [rAUD1SWEEP], a\n
    ld a, [de]\n
    inc de\n
    ldh [rAUD1LEN], a\n
    ld a, [de]\n
    ldh [rAUD1ENV], a\n
    inc de\n
    ld a, [de]\n
\n
.write_mask1:\n
    ld [highmask1], a\n
\n
.do_setvol1:\n
    ld a, l\n
    ld [temp_note_value], a\n
    ld a, h\n
    ld [temp_note_value+1], a\n
\n
    ld e, 0\n
    call do_effect\n
\n
    pop af\n
    call c, play_ch1_note\n
\n
process_ch2:\n
    ;; Note playback\n
    ld hl, pattern2\n
    ld de, channel_note2\n
    call get_current_note\n
    push af\n
    jr nc, .do_setvol2\n
\n
    load_de_ind duty_instruments\n
    call setup_instrument_pointer\n
    ld a, [highmask2]\n
    res 7, a ; Turn off the "initial" flag\n
    jr z, .write_mask2\n
\n
    checkMute 1, .do_setvol2\n
\n
    inc de\n
    ld a, [de]\n
    inc de\n
    ldh [rAUD2LEN], a\n
    ld a, [de]\n
    ldh [rAUD2ENV], a\n
    inc de\n
    ld a, [de]\n
\n
.write_mask2:\n
    ld [highmask2], a\n
\n
.do_setvol2:\n
    ld a, l\n
    ld [temp_note_value], a\n
    ld a, h\n
    ld [temp_note_value+1], a\n
\n
    ld e, 1\n
    call do_effect\n
\n
    pop af\n
    call c, play_ch2_note\n
\n
process_ch3:\n
    ld hl, pattern3\n
    ld de, channel_note3\n
    call get_current_note\n
\n
    ld a, l\n
    ld [temp_note_value], a\n
    ld a, h\n
    ld [temp_note_value+1], a\n
\n
    push af\n
\n
    jr nc, .do_setvol3\n
\n
    load_de_ind wave_instruments\n
    call setup_instrument_pointer\n
    ld a, [highmask3]\n
    res 7, a ; Turn off the "initial" flag\n
    jr z, .write_mask3\n
\n
    checkMute 2, .do_setvol3\n
\n
    ld a, [de]\n
    inc de\n
    ldh [rAUD3LEN], a\n
    ld a, [de]\n
    inc de\n
    ldh [rAUD3LEVEL], a\n
    ld a, [de]\n
    inc de\n
\n
    ;; Check to see if we need to copy a wave and then do so\n
    ld hl, current_wave\n
    cp [hl]\n
    jr z, .no_wave_copy\n
    ld [hl], a\n
    swap a\n
    add_a_ind_ret_hl waves\n
\n
    xor a\n
    ldh [rAUD3ENA], a\n
\n
FOR OFS, 16\n
    ld a, [hl+]\n
    ldh [_AUD3WAVERAM + OFS], a\n
ENDR\n
\n
    ld a, %10000000\n
    ldh [rAUD3ENA], a\n
\n
.no_wave_copy:\n
    ld a, [de]\n
\n
.write_mask3:\n
    ld [highmask3], a\n
\n
.do_setvol3:\n
    ld e, 2\n
    call do_effect\n
\n
    pop af\n
    call c, play_ch3_note\n
\n
process_ch4:\n
    ld hl, pattern4\n
    ld a, [hl+]\n
    ld c, a\n
    ld b, [hl]\n
    call get_current_row\n
    ld [channel_note4], a\n
    cp LAST_NOTE\n
    push af\n
    jr nc, .do_setvol4\n
\n
    call get_note_poly\n
    ld [temp_note_value], a\n
\n
    ld de, 0\n
    call setup_instrument_pointer\n
\n
    ld a, [highmask4]\n
    res 7, a ; Turn off the "initial" flag\n
    jr z, .write_mask4\n
\n
    checkMute 3, .do_setvol4\n
\n
    load_hl_ind noise_instruments\n
    sla e\n
    add hl, de\n
\n
    ld a, [hl+]\n
    ldh [rAUD4ENV], a\n
\n
    ld a, [hl]\n
    and %00111111\n
    ldh [rAUD4LEN], a\n
\n
    ld a, [temp_note_value]\n
    ld d, a\n
    ld a, [hl]\n
    and %10000000\n
    swap a\n
    or d\n
    ld [temp_note_value], a\n
\n
    ld a, [hl]\n
    and %01000000\n
    or  %10000000\n
.write_mask4:\n
    ld [highmask4], a\n
\n
.do_setvol4:\n
    ld e, 3\n
    call do_effect\n
\n
    pop af\n
    call c, play_ch4_note\n
\n
    ;; finally just update the tick/order/row values\n
    jp process_tick\n
\n
process_effects:\n
    ;; Only do effects if not on tick zero\n
    checkMute 0, .after_effect1\n
\n
    ld hl, pattern1\n
    ld a, [hl+]\n
    ld c, a\n
    ld b, [hl]\n
    call get_current_row\n
\n
    ld a, c\n
    or a\n
    jr z, .after_effect1\n
\n
    ld e, 0\n
    call do_effect      ; make sure we never return with ret_dont_call_playnote macro\n
\n
.after_effect1:\n
    checkMute 1, .after_effect2\n
\n
    ld hl, pattern2\n
    ld a, [hl+]\n
    ld c, a\n
    ld b, [hl]\n
    call get_current_row\n
\n
    ld a, c\n
    or a\n
    jr z, .after_effect2\n
\n
    ld e, 1\n
    call do_effect      ; make sure we never return with ret_dont_call_playnote macro\n
\n
.after_effect2:\n
    checkMute 2, .after_effect3\n
\n
    ld hl, pattern3\n
    ld a, [hl+]\n
    ld c, a\n
    ld b, [hl]\n
    call get_current_row\n
\n
    ld a, c\n
    or a\n
    jr z, .after_effect3\n
\n
    ld e, 2\n
    call do_effect      ; make sure we never return with ret_dont_call_playnote macro\n
\n
.after_effect3:\n
    checkMute 3, .after_effect4\n
\n
    ld hl, pattern4\n
    ld a, [hl+]\n
    ld c, a\n
    ld b, [hl]\n
    call get_current_row\n
    cp LAST_NOTE\n
    jr nc, .done_macro\n
    ld h, a\n
\n
    load_de_ind noise_instruments\n
    call setup_instrument_pointer_ch4\n
    jr z, .done_macro ; No instrument, thus no macro\n
\n
    ld a, [tick]\n
    cp 7\n
    jr nc, .done_macro\n
\n
    inc de\n
\n
    ld l, a\n
    ld a, h\n
    ld h, 0\n
    add hl, de\n
    add [hl]\n
    call get_note_poly\n
    ld l, a\n
    ld a, [de]\n
    ld e, a\n
    and %10000000\n
    swap a\n
    or l\n
    ldh [rAUD4POLY], a\n
\n
    ld a, e\n
    and %01000000\n
    ldh [rAUD4GO], a\n
\n
.done_macro:\n
    ld a, c\n
    or a\n
    jr z, .after_effect4\n
\n
    ld e, 3\n
    call do_effect      ; make sure we never return with ret_dont_call_playnote macro\n
\n
.after_effect4:\n
\n
process_tick:\n
    ld hl, counter\n
    inc [hl]\n
\n
    ld a, [ticks_per_row]\n
    ld b, a\n
\n
    ld hl, tick\n
    ld a, [hl]\n
    inc a\n
\n
    cp b\n
    jr z, .newrow\n
\n
    ld [hl], a\n
    ret\n
\n
.newrow:\n
    ;; Reset tick to 0\n
    ld [hl], 0\n
\n
    ;; Check if we need to perform a row break or pattern break\n
    ld a, [row_break]\n
    or a\n
    jr z, .no_break\n
\n
    ;; These are offset by one so we can check to see if they've\n
    ;; been modified\n
    dec a\n
    ld b, a\n
\n
    ld hl, row_break\n
    xor a\n
    ld [hl-], a\n
    or [hl]     ; a = [next_order], zf = ([next_order] == 0)\n
    ld [hl], 0\n
\n
    jr z, .neworder\n
\n
    dec a\n
    add a ; multiply order by 2 (they are words)\n
\n
    jr .update_current_order\n
\n
.no_break:\n
    ;; Increment row.\n
    ld a, [row]\n
    inc a\n
    ld b, a\n
    cp PATTERN_LENGTH\n
    jr nz, .noreset\n
\n
    ld b, 0\n
.neworder:\n
    ;; Increment order and change loaded patterns\n
    ld a, [order_cnt]\n
    ld c, a\n
    ld a, [current_order]\n
    add 2\n
    cp c\n
    jr nz, .update_current_order\n
    xor a\n
.update_current_order:\n
    ;; Call with:\n
    ;; A: The order to load\n
    ;; B: The row for the order to start on\n
    ld [current_order], a\n
    ld c, a\n
    call load_patterns\n
\n
.noreset:\n
    ld a, b\n
    ld [row], a\n
\n
IF DEF(PREVIEW_MODE)\n
    db $fd ; signal row update to tracker\n
ENDC\n
    ret\n
\n
note_table:\n
include "include/hUGE_note_table.inc"\n
\n
\n
IF DEF(GBDK)\n
\n
SECTION "hUGEDriver GBDK wrappers", ROM0\n
\n
_hUGE_init_banked::\n
    ld hl, sp+2+4\n
    jr continue_init\n
_hUGE_init::\n
    ld hl, sp+2\n
continue_init:\n
    push bc\n
    ld a, [hl+]\n
    ld h, [hl]\n
    ld l, a\n
    call hUGE_init\n
    pop bc\n
    ret\n
\n
_hUGE_mute_channel_banked::\n
    ld hl, sp+3+4\n
    jr continue_mute\n
_hUGE_mute_channel::\n
    ld hl, sp+3\n
continue_mute:\n
    push bc\n
    ld a, [hl-]\n
    and 1\n
    ld c, a\n
    ld b, [hl]\n
    call hUGE_mute_channel\n
    pop  bc\n
    ret\n
\n
_hUGE_set_position_banked::\n
    ld hl, sp+2+4\n
    jr continue_set_position\n
_hUGE_set_position::\n
    ld hl, sp+2\n
continue_set_position:\n
    push bc\n
    ld c, [hl]\n
    call hUGE_set_position\n
    pop  bc\n
    ret\n
\n
ENDC`;
