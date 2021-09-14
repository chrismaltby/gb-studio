// https://raw.githubusercontent.com/untoxa/hUGEBuild/master/hUGEDriver.asm\n

export default `include "HARDWARE.INC"\n
include "hUGE.inc"\n
\n
add_a_to_r16: MACRO\n
    add \\2\n
    ld \\2, a\n
    adc \\1\n
    sub \\2\n
    ld \\1, a\n
ENDM\n
\n
;; Thanks PinoBatch!\n
sub_from_r16: MACRO ;; (high, low, value)\n
    ld a, \\2\n
    sub \\3\n
    ld \\2, a\n
    sbc a  ; A = -1 if borrow or 0 if not\n
    add \\1\n
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
    ld a, 6 ; How many bytes until the next channel's code\n
    add_a_to_hl\n
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
loadShort: MACRO\n
    ld a, [\\1]\n
    ld \\3, a\n
    ld a, [\\1 + 1]\n
    ld \\2, a\n
ENDM\n
\n
;; Maximum pattern length\n
PATTERN_LENGTH EQU 64\n
;; Amount to be shifted in order to skip a channel.\n
CHANNEL_SIZE_EXPONENT EQU 3\n
\n
SECTION "Playback variables", WRAM0\n
_start_vars:\n
\n
;; active song descriptor\n
order_cnt: db\n
_start_song_descriptor_pointers:\n
order1: dw\n
order2: dw\n
order3: dw\n
order4: dw\n
\n
duty_instruments: dw\n
wave_instruments: dw\n
noise_instruments: dw\n
\n
routines: dw\n
waves: dw\n
_end_song_descriptor_pointers:\n
\n
;; variables\n
mute_channels: db\n
\n
pattern1: dw\n
pattern2: dw\n
pattern3: dw\n
pattern4: dw\n
\n
ticks_per_row: db\n
current_order: db\n
next_order: db\n
row_break: db\n
\n
temp_note_value: dw\n
row: db\n
tick: db\n
counter: db\n
__current_ch3_wave::\n
_hUGE_current_wave::\n
current_wave: db\n
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
_end_vars:\n
\n
SECTION "Sound Driver", ROMX\n
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
hUGE_mute_channel::\n
    ;; B: channel\n
    ;; C: enable flag\n
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
    call nz, note_cut\n
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
hUGE_init::\n
    push hl\n
    if !DEF(PREVIEW_MODE)\n
    ;; Zero some ram\n
    ld c, _end_vars - _start_vars\n
    ld hl, _start_vars\n
    xor a\n
.fill_loop:\n
    ld [hl+], a\n
    dec c\n
    jr nz, .fill_loop\n
    ENDC\n
\n
    ld a, %11110000\n
    ld [envelope1], a\n
    ld [envelope2], a\n
\n
    ld a, 100\n
    ld [current_wave], a\n
\n
    pop hl\n
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
    ld a, [current_order]\n
    ld c, a ;; Current order index\n
\n
    ;; Fall through into _refresh_patterns\n
\n
_refresh_patterns:\n
    ;; Loads pattern registers with pointers to correct pattern based on\n
    ;; an order index\n
\n
    ;; Call with c set to what order to load\n
\n
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
\n
.load_pattern:\n
    ld a, [hl+]\n
    ld h, [hl]\n
    ld l, a\n
    ld a, c\n
    add_a_to_hl\n
\n
    ld a, [hl+]\n
    ld [de], a\n
    inc de\n
    ld a, [hl]\n
    ld [de], a\n
    inc de\n
    ret\n
\n
_load_note_data:\n
    ;; Call with:\n
    ;; Pattern pointer in BC\n
\n
    ;; Stores instrument/effect code in B\n
    ;; Stores effect params in C\n
    ;; Stores note number in A\n
    ld a, [row]\n
    ld h, a\n
    ;; Multiply by 3 for the note value\n
    add h\n
    add h\n
\n
    add 2\n
    ld h, 0\n
    ld l, a\n
    add hl, bc ; HL now points at the 3rd byte of the note\n
    ld a, [hl-]\n
    ld c, a\n
    ld a, [hl-]\n
    ld b, a\n
\n
    ld a, [hl]\n
\n
    ret\n
\n
_lookup_note:\n
    ;; Call with:\n
    ;; Pattern pointer in BC\n
    ;; channel_noteX pointer in DE\n
\n
    ;; Stores note period value in HL\n
    ;; Stores instrument/effect code in B\n
    ;; Stores effect params in C\n
    ;; Stores note number in the memory pointed to by DE\n
    call _load_note_data\n
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
_convert_note:\n
    ;; Call with:\n
    ;; Note number in A\n
    ;; Stores note period value in HL\n
\n
    add a ;; double it to get index into hi/lo table\n
\n
    ld hl, note_table\n
    add_a_to_hl\n
    ld     a, [hl+]\n
    ld     h, [hl]\n
    ld     l, a\n
\n
    scf\n
    ret\n
\n
_convert_ch4_note:\n
    ;; Call with:\n
    ;; Note number in A\n
    ;; Stores polynomial counter in A\n
    ;; Free: HL\n
\n
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
_update_channel:\n
    ;; Call with:\n
    ;; Highmask in A\n
    ;; Channel in B\n
    ;; Note tone in DE\n
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
    ld [rAUD1LOW], a\n
    ld a, d\n
    or c\n
    ld [rAUD1HIGH], a\n
    ret\n
.update_channel2:\n
    retMute 1\n
\n
    ld a, e\n
    ld [rAUD2LOW], a\n
    ld a, d\n
    or c\n
    ld [rAUD2HIGH], a\n
    ret\n
.update_channel3:\n
    retMute 2\n
\n
    ld a, e\n
    ld [rAUD3LOW], a\n
    ld a, d\n
    or c\n
    ld [rAUD3HIGH], a\n
    ret\n
.update_channel4:\n
    retMute 3\n
\n
    ld a, e\n
    call _convert_ch4_note\n
    ld [rAUD4POLY], a\n
    xor a\n
    ld [rAUD4GO], a\n
    ret\n
\n
_play_note_routines:\n
    jr _playnote1\n
    jr _playnote2\n
    jr _playnote3\n
    jr _playnote4\n
\n
_playnote1:\n
    ld a, [mute_channels]\n
    retMute 0\n
\n
    ;; Play a note on channel 1 (square wave)\n
    ld a, [temp_note_value+1]\n
    ld [channel_period1], a\n
    ld [rAUD1LOW], a\n
\n
    ld a, [temp_note_value]\n
    ld [channel_period1+1], a\n
\n
    ;; Get the highmask and apply it.\n
    ld hl, highmask1\n
    or [hl]\n
    ld [rAUD1HIGH], a\n
\n
    ret\n
\n
_playnote2:\n
    ld a, [mute_channels]\n
    retMute 1\n
\n
    ;; Play a note on channel 2 (square wave)\n
    ld a, [temp_note_value+1]\n
    ld [channel_period2], a\n
    ld [rAUD2LOW], a\n
\n
    ld a, [temp_note_value]\n
    ld [channel_period2+1], a\n
\n
    ;; Get the highmask and apply it.\n
    ld hl, highmask2\n
    or [hl]\n
    ld [rAUD2HIGH], a\n
\n
    ret\n
\n
_playnote3:\n
    ld a, [mute_channels]\n
    retMute 2\n
\n
    ;; This fixes a gameboy hardware quirk, apparently.\n
    ;; The problem is emulated accurately in BGB.\n
    ;; https://gbdev.gg8.se/wiki/articles/Gameboy_sound_hardware\n
    xor a\n
    ld [rAUD3ENA], a\n
    cpl\n
    ld [rAUD3ENA], a\n
\n
    ;; Play a note on channel 3 (waveform)\n
    ld a, [temp_note_value+1]\n
    ld [channel_period3], a\n
    ld [rAUD3LOW], a\n
\n
    ld a, [temp_note_value]\n
    ld [channel_period3+1], a\n
\n
    ;; Get the highmask and apply it.\n
    ld hl, highmask3\n
    or [hl]\n
    ld [rAUD3HIGH], a\n
\n
    ret\n
\n
_playnote4:\n
    ld a, [mute_channels]\n
    retMute 3\n
\n
    ;; Play a "note" on channel 4 (noise)\n
    ld a, [temp_note_value]\n
    ld [channel_period4+1], a\n
    ld [rAUD4POLY], a\n
\n
    ;; Get the highmask and apply it.\n
    ld a, [highmask4]\n
    ld [rAUD4GO], a\n
\n
    ret\n
\n
_doeffect:\n
    ;; Call with:\n
    ;; B: instrument nibble + effect type nibble\n
    ;; C: effect parameters\n
    ;; E: channel\n
\n
    ;; free: A, D, H, L\n
\n
    ;; Strip the instrument bits off leaving only effect code\n
    ld a, b\n
    and %00001111\n
    ;; Multiply by 2 to get offset into table\n
    add a, a\n
\n
    ld hl, .jump\n
    add_a_to_hl\n
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
    dw fx_set_pan                      ;8xy\n
    dw fx_set_duty                     ;9xy\n
    dw fx_vol_slide                    ;Axy\n
    dw fx_pos_jump                     ;Bxy ; global\n
    dw fx_set_volume                   ;Cxy\n
    dw fx_pattern_break                ;Dxy ; global\n
    dw fx_note_cut                     ;Exy\n
    dw fx_set_speed                    ;Fxy ; global\n
\n
setup_channel_pointer:\n
    ;; Call with:\n
    ;; Channel value in B\n
    ;; Offset in D\n
    ;; Returns value in HL\n
\n
    ld a, b\n
    REPT CHANNEL_SIZE_EXPONENT\n
        add a\n
    ENDR\n
    add d\n
    ld hl, channels\n
    add_a_to_hl\n
    ret\n
\n
fx_set_master_volume:\n
    ret nz\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
\n
    ;; Upper 4 bits contain volume for left, lower 4 bits for right\n
    ;; Format is ?LLL ?RRR where ? is just a random bit, since we don't use\n
    ;; the Vin\n
\n
    ;; This can be used as a more fine grained control over channel 3's output,\n
    ;; if you pan it completely.\n
\n
    ld a, c\n
    ld [rAUDVOL], a\n
    ret\n
\n
fx_call_routine:\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
\n
    ;; Routines are 16 bytes. Shift left to multiply by 16, then\n
    ;; jump to that location.\n
    load_hl_ind routines\n
    ld a, h\n
    or l\n
    ret z\n
\n
    ld a, c\n
    and $0f\n
    add a\n
    add_a_to_hl\n
    ld a, [hl+]\n
    ld h, [hl]\n
    ld l, a\n
\n
    ld a, [tick]\n
    push af\n
    inc sp\n
    push bc\n
    or a ; set zero flag if tick 0 for compatibility\n
    call .call_hl\n
    add sp, 3\n
    ret\n
\n
.call_hl:\n
    jp hl\n
\n
fx_set_pan:\n
    ret nz\n
\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
\n
    ;; Pretty simple. The editor can create the correct value here without a bunch\n
    ;; of bit shifting manually.\n
\n
    ld a, c\n
    ld [rAUDTERM], a\n
    ret\n
\n
fx_set_duty:\n
    ret nz\n
\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
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
    ld [rAUD2LEN], a\n
    ret\n
.chan1:\n
    retMute 0\n
    ld a, c\n
    ld [rAUD1LEN], a\n
    ret\n
\n
fx_vol_slide:\n
    ret nz\n
\n
    ;; This is really more of a "retrigger note with lower volume" effect and thus\n
    ;; isn't really that useful. Instrument envelopes should be used instead.\n
    ;; Might replace this effect with something different if a new effect is\n
    ;; ever needed.\n
\n
\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
\n
    ;; Todo\n
    ;; check channel mute\n
    ld d, 1\n
    ld a, b\n
    or a\n
    jr z, .cont\n
.loop:\n
    sla d\n
    dec a\n
    jr nz, .loop\n
.cont:\n
    ld a, [mute_channels]\n
    and d\n
    ret nz\n
\n
    ld d, 0\n
    call setup_channel_pointer\n
    ld a, [hl+]\n
    ld [temp_note_value+1], a\n
    ld a, [hl]\n
    ld [temp_note_value], a\n
\n
    ld a, b\n
    add a\n
    ld hl, _envelope_registers\n
    add_a_to_hl\n
    ld a, [hl+]\n
    ld h, [hl]\n
    ld l, a\n
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
    ld a, [hl]\n
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
    ld [hl+], a\n
\n
    inc hl\n
    ld a, [hl]\n
    or %10000000\n
    ld [hl], a\n
\n
    ld hl, _play_note_routines\n
    ld a, b\n
    add a\n
    add_a_to_hl\n
    jp hl\n
\n
_envelope_registers:\n
    dw rAUD1ENV\n
    dw rAUD2ENV\n
    dw rAUD3LEVEL\n
    dw rAUD4ENV\n
\n
fx_note_delay:\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
\n
    jr nz, .play_note\n
\n
    ;; Just store the note into the channel period, and don't play a note.\n
    ld d, 0\n
    call setup_channel_pointer\n
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
    ld a, [tick]\n
    cp c\n
    ret nz ; wait until the correct tick to play the note\n
\n
    ld d, 0\n
    call setup_channel_pointer\n
\n
    ;; TODO: Change this to accept HL instead?\n
    ld a, [hl+]\n
    ld [temp_note_value], a\n
    ld a, [hl]\n
    ld [temp_note_value+1], a\n
\n
    ;; TODO: Generalize this somehow?\n
\n
    ld hl, _play_note_routines\n
    ld a, b\n
    add a\n
    add_a_to_hl\n
    jp hl\n
\n
fx_set_speed:\n
    ret nz\n
\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
    ld a, c\n
    ld [ticks_per_row], a\n
    ret\n
\n
hUGE_set_position::\n
fx_pos_jump:\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
\n
    ld a, 1\n
    ld [row_break], a\n
    ld a, c\n
    ld [next_order], a\n
\n
    ret\n
\n
fx_pattern_break:\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
\n
    ld a, c\n
    ld [row_break], a\n
\n
    ret\n
\n
fx_note_cut:\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
    cp c\n
    ret nz\n
\n
    ;; check channel mute\n
    ld d, 1\n
    ld a, b\n
    or a\n
    jr z, .cont\n
.loop:\n
    sla d\n
    dec a\n
    jr nz, .loop\n
.cont:\n
    ld a, [mute_channels]\n
    and d\n
    ret nz\n
\n
note_cut:\n
    ld hl, rAUD1ENV\n
    ld a, b\n
    add a\n
    add a\n
    add b ; multiply by 5\n
    add_a_to_hl\n
    ld [hl], 0\n
    ld a, b\n
    cp 2\n
    ret z ; return early if CH3-- no need to retrigger note\n
\n
    ;; Retrigger note\n
    inc hl\n
    inc hl\n
    ld [hl], %11111111\n
    ret\n
\n
fx_set_volume:\n
    ret nz ;; Return if we're not on tick zero.\n
\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
\n
    ;; Arguments to this effect will be massaged to correct form for the channel\n
    ;; in the editor so we don't have to AND and SWAP and stuff.\n
\n
set_channel_volume:\n
    ;; Call with:\n
    ;; Correct volume value in C\n
    ;; Channel number in B\n
\n
    ld a, [mute_channels]\n
    dec b\n
    jr z, .set_chn_2_vol\n
    dec b \n
    jr z, .set_chn_3_vol\n
    dec b\n
    jr z, .set_chn_4_vol\n
\n
.set_chn_1_vol:\n
    retMute 0\n
\n
    ld a, [rAUD1ENV]\n
    and %00001111\n
    swap c\n
    or c\n
    ld [rAUD1ENV], a\n
    ret\n
.set_chn_2_vol:\n
    retMute 1\n
\n
    ld a, [rAUD2ENV]\n
    and %00001111\n
    swap c\n
    or c\n
    ld [rAUD2ENV], a\n
    ret\n
.set_chn_3_vol:\n
    retMute 2\n
\n
    ;; "Quantize" the more finely grained volume control down to one of 4 values.\n
    ld a, c\n
    cp 10\n
    jr nc, .one\n
    cp 5\n
    jr nc, .two\n
    or a\n
    jr z, .zero\n
.three:\n
    ld a, %01100000\n
    jr .done\n
.two:\n
    ld a, %01000000\n
    jr .done\n
.one:\n
    ld a, %00100000\n
    jr .done\n
.zero:\n
    xor a\n
.done:\n
    ld [rAUD3LEVEL], a\n
    ret\n
.set_chn_4_vol:\n
    retMute 3\n
\n
    swap c\n
    ld a, c\n
    ld [rAUD4ENV], a\n
    ret\n
\n
fx_vibrato:\n
    ret z\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
\n
    ;; Extremely poor man's vibrato.\n
    ;; Speed values:\n
    ;; (0x0  = 1.0)\n
    ;; (0x1  = 0.5)\n
    ;; (0x3  = 0.25)\n
    ;; (0x7  = 0.125)\n
    ;; (0xf  = 0.0625)\n
    ld d, 4\n
    call setup_channel_pointer\n
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
    call _convert_note\n
    jr .finish_vibrato\n
.go_up:\n
    call _convert_note\n
    ld a, c\n
    and %00001111\n
    add_a_to_hl\n
.finish_vibrato:\n
    ld d, h\n
    ld e, l\n
    xor a\n
    jp _update_channel\n
\n
fx_arpeggio:\n
    ret z\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
\n
    ld d, 4\n
    call setup_channel_pointer\n
\n
    ld a, [tick]\n
    dec a\n
\n
    ;; A crappy modulo, because it's not a multiple of four :(\n
\n
    jr .test_greater_than_two\n
.greater_than_two:\n
    sub a, 3\n
.test_greater_than_two:\n
    cp 3\n
    jr nc, .greater_than_two\n
\n
    ;; Multiply by 2 to get offset into table\n
    add a\n
\n
    ld d, [hl]\n
\n
    ld hl, .arp_options\n
    add_a_to_hl\n
    jp hl\n
\n
.arp_options:\n
    jr .set_arp1\n
    jr .set_arp2\n
    jr .reset_arp\n
.reset_arp:\n
    ld a, d\n
    jr .finish_skip_add\n
.set_arp2:\n
    ld a, c\n
    swap a\n
    jr .finish_arp\n
.set_arp1:\n
    ld a, c\n
.finish_arp:\n
    and %00001111\n
    add d\n
.finish_skip_add:\n
    call _convert_note\n
    ld d, h\n
    ld e, l\n
    xor a\n
    jp _update_channel\n
\n
fx_porta_up:\n
    ret z\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
\n
    ld d, 0\n
    call setup_channel_pointer\n
\n
    ld a, [hl+]\n
    ld e, a\n
    ld d, [hl]\n
\n
    ld a, c\n
    add_a_to_de\n
\n
.finish:\n
    ld a, d\n
    ld [hl-], a\n
    ld [hl], e\n
\n
    xor a\n
    jp _update_channel\n
\n
fx_porta_down:\n
    ret z\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
\n
    ld d, 0\n
    call setup_channel_pointer\n
\n
    ld a, [hl+]\n
    ld e, a\n
    ld d, [hl]\n
\n
    ld a, c\n
    sub_from_r16 d, e, c\n
\n
    jr fx_porta_up.finish\n
\n
fx_toneporta:\n
    jr nz, .do_toneporta\n
\n
    ;; We're on tick zero, so just move the temp note value into the toneporta target.\n
    ld d, 2\n
    call setup_channel_pointer\n
\n
    ;; If the note is nonexistent, then just return\n
    ld a, [temp_note_value+1]\n
    or a\n
    jr z, .return_skip\n
\n
    ld [hl+], a\n
    ld a, [temp_note_value]\n
    ld [hl], a\n
\n
    ;; Don't call _playnote. This is done by grabbing the return\n
    ;; address and manually skipping the next call instruction.\n
.return_skip:\n
    ret_dont_call_playnote\n
\n
.do_toneporta:\n
    ;; A: tick\n
    ;; ZF: (tick == 0)\n
    ;; B: channel\n
    ;; C: effect parameters\n
\n
    ;; free registers: A, D, E, H, L\n
\n
    ld d, 0\n
    call setup_channel_pointer\n
    push hl\n
\n
    ld a, [hl+]\n
    ld e, a\n
    ld a, [hl+]\n
    ld d, a\n
\n
    ld a, [hl+]\n
    ld h, [hl]\n
    ld l, a\n
\n
    ;; Comparing which direction to move the current value\n
    ;; TODO: Optimize this!!!!\n
\n
    ;; Compare high byte\n
    ld a, h\n
\n
    cp d\n
    jr c, .subtract ; target is less than the current period\n
    jr z, .high_byte_same\n
    jr .add\n
.high_byte_same:\n
    ld a, l\n
    cp e\n
    jr c, .subtract ; the target is less than the current period\n
    jr z, .done ; both nibbles are the same so no portamento\n
.add:\n
    ld a, c\n
    add_a_to_de\n
\n
    ld a, h\n
    cp d\n
    jr c, .set_exact\n
    jr nz, .done\n
    ld a, l\n
    cp e\n
    jr c, .set_exact\n
\n
    jr .done\n
\n
.subtract:\n
    sub_from_r16 d, e, c\n
\n
    bit 7, d ; check for overflow\n
    jr nz, .set_exact\n
\n
    ld a, d\n
    cp h\n
    jr c, .set_exact\n
    jr nz, .done\n
    ld a, e\n
    cp l\n
    jr c, .set_exact\n
\n
    jr .done\n
.set_exact:\n
    ld d, h\n
    ld e, l\n
.done:\n
    pop hl\n
    ld [hl], e\n
    inc hl\n
    ld [hl], d\n
\n
    ld a, 6\n
    add_a_to_hl\n
    ld a, [hl]\n
    ld c, a\n
    res 7, c\n
    ld [hl], c\n
    jp _update_channel\n
\n
;; TODO: Find some way to de-duplicate this code!\n
_setup_instrument_pointer_ch4:\n
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
    jr _setup_instrument_pointer.finish\n
_setup_instrument_pointer:\n
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
_hUGE_dosound_banked::\n
_hUGE_dosound::\n
    ld a, [tick]\n
    or a\n
    jp nz, .process_effects\n
\n
    ;; Note playback\n
    loadShort pattern1, b, c\n
    ld de, channel_note1\n
    call _lookup_note\n
    push af\n
    jr nc, .do_setvol1\n
\n
    load_de_ind duty_instruments\n
    call _setup_instrument_pointer\n
    ld a, [highmask1]\n
    res 7, a ; Turn off the "initial" flag\n
    jr z, .write_mask1\n
\n
    checkMute 0, .do_setvol1\n
\n
    ld a, [de]\n
    inc de\n
    ld [rAUD1SWEEP], a\n
    ld a, [de]\n
    inc de\n
    ld [rAUD1LEN], a\n
    ld a, [de]\n
    ld [rAUD1ENV], a\n
    inc de\n
    ld a, [de]\n
\n
.write_mask1:\n
    ld [highmask1], a\n
\n
.do_setvol1:\n
    ld a, h\n
    ld [temp_note_value], a\n
    ld a, l\n
    ld [temp_note_value+1], a\n
\n
    ld e, 0\n
    call _doeffect\n
\n
    pop af              ; 1 byte\n
    jr nc, .after_note1 ; 2 bytes\n
    call _playnote1     ; 3 bytes\n
\n
.after_note1:\n
    ;; Note playback\n
    loadShort pattern2, b, c\n
    ld de, channel_note2\n
    call _lookup_note\n
    push af\n
    jr nc, .do_setvol2\n
\n
    load_de_ind duty_instruments\n
    call _setup_instrument_pointer\n
    ld a, [highmask2]\n
    res 7, a ; Turn off the "initial" flag\n
    jr z, .write_mask2\n
\n
    checkMute 1, .do_setvol2\n
\n
    inc de\n
    ld a, [de]\n
    inc de\n
    ld [rAUD2LEN], a\n
    ld a, [de]\n
    ld [rAUD2ENV], a\n
    inc de\n
    ld a, [de]\n
\n
.write_mask2:\n
    ld [highmask2], a\n
\n
.do_setvol2:\n
    ld a, h\n
    ld [temp_note_value], a\n
    ld a, l\n
    ld [temp_note_value+1], a\n
\n
    ld e, 1\n
    call _doeffect\n
\n
    pop af              ; 1 byte\n
    jr nc, .after_note2 ; 2 bytes\n
    call _playnote2     ; 3 bytes\n
\n
.after_note2:\n
    loadShort pattern3, b, c\n
    ld de, channel_note3\n
    call _lookup_note\n
\n
    ld a, h\n
    ld [temp_note_value], a\n
    ld a, l\n
    ld [temp_note_value+1], a\n
\n
    push af\n
\n
    jr nc, .do_setvol3\n
\n
    load_de_ind wave_instruments\n
    call _setup_instrument_pointer\n
    ld a, [highmask3]\n
    res 7, a ; Turn off the "initial" flag\n
    jr z, .write_mask3\n
\n
    checkMute 2, .do_setvol3\n
\n
    ld a, [de]\n
    inc de\n
    ld [rAUD3LEN], a\n
    ld a, [de]\n
    inc de\n
    ld [rAUD3LEVEL], a\n
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
    ld [rAUD3ENA], a\n
\n
_addr = _AUD3WAVERAM\n
    REPT 16\n
        ld a, [hl+]\n
        ldh [_addr], a\n
_addr = _addr + 1\n
    ENDR\n
\n
    ld a, %10000000\n
    ld [rAUD3ENA], a\n
\n
.no_wave_copy:\n
    ld a, [de]\n
\n
.write_mask3:\n
    ld [highmask3], a\n
\n
.do_setvol3:\n
    ld e, 2\n
    call _doeffect\n
\n
    pop af              ; 1 byte\n
    jr nc, .after_note3 ; 2 bytes\n
    call _playnote3     ; 3 bytes\n
\n
.after_note3:\n
    loadShort pattern4, b, c\n
    call _load_note_data\n
    ld [channel_note4], a\n
    cp LAST_NOTE\n
    push af\n
    jr nc, .do_setvol4\n
\n
    call _convert_ch4_note\n
    ld [temp_note_value], a\n
\n
    ld de, 0\n
    call _setup_instrument_pointer\n
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
    ld [rAUD4ENV], a\n
\n
    ld a, [hl]\n
    and %00111111\n
    ld [rAUD4LEN], a\n
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
    call _doeffect\n
\n
    pop af              ; 1 byte\n
    jr nc, .after_note4 ; 2 bytes\n
    call _playnote4     ; 3 bytes\n
\n
.after_note4:\n
    ;; finally just update the tick/order/row values\n
    jp process_tick\n
\n
.process_effects:\n
    ;; Only do effects if not on tick zero\n
    checkMute 0, .after_effect1\n
\n
    loadShort pattern1, b, c\n
    call _load_note_data\n
\n
    ld a, c\n
    or a\n
    jr z, .after_effect1\n
\n
    ld e, 0\n
    call _doeffect      ; make sure we never return with ret_dont_call_playnote macro\n
\n
.after_effect1:\n
    checkMute 1, .after_effect2\n
\n
    loadShort pattern2, b, c\n
    call _load_note_data\n
\n
    ld a, c\n
    or a\n
    jr z, .after_effect2\n
\n
    ld e, 1\n
    call _doeffect      ; make sure we never return with ret_dont_call_playnote macro\n
\n
.after_effect2:\n
    checkMute 2, .after_effect3\n
\n
    loadShort pattern3, b, c\n
    call _load_note_data\n
\n
    ld a, c\n
    or a\n
    jr z, .after_effect3\n
\n
    ld e, 2\n
    call _doeffect      ; make sure we never return with ret_dont_call_playnote macro\n
\n
.after_effect3:\n
    checkMute 3, .after_effect4\n
\n
    loadShort pattern4, b, c\n
    call _load_note_data\n
    cp LAST_NOTE\n
    jr nc, .done_macro\n
    ld h, a\n
\n
    load_de_ind noise_instruments\n
    call _setup_instrument_pointer_ch4\n
    jr z, .done_macro ; No instrument, thus no macro\n
\n
    ld a, [tick]\n
    cp 7\n
    jr nc, .done_macro\n
\n
    inc de\n
    push de\n
    push de\n
\n
    add_a_to_de\n
    ld a, [de]\n
    add h\n
    call _convert_ch4_note\n
    ld d, a\n
    pop hl\n
    ld a, [hl]\n
    and %10000000\n
    swap a\n
    or d\n
    ld [rAUD4POLY], a\n
\n
    pop de\n
    ld a, [de]\n
    and %01000000\n
    ld [rAUD4GO], a\n
\n
.done_macro:\n
    ld a, c\n
    or a\n
    jr z, .after_effect4\n
\n
    ld e, 3\n
    call _doeffect      ; make sure we never return with ret_dont_call_playnote macro\n
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
    jr z, _newrow\n
\n
    ld [hl], a\n
    ret\n
\n
_newrow:\n
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
    jr z, _neworder\n
\n
    dec a\n
    add a ; multiply order by 2 (they are words)\n
\n
    jr _update_current_order\n
\n
.no_break:\n
    ;; Increment row.\n
    ld a, [row]\n
    inc a\n
    ld b, a\n
    cp PATTERN_LENGTH\n
    jr nz, _noreset\n
\n
    ld b, 0\n
_neworder:\n
    ;; Increment order and change loaded patterns\n
    ld a, [order_cnt]\n
    ld c, a\n
    ld a, [current_order]\n
    add a, 2\n
    cp c\n
    jr nz, _update_current_order\n
    xor a\n
_update_current_order:\n
    ;; Call with:\n
    ;; A: The order to load\n
    ;; B: The row for the order to start on\n
    ld [current_order], a\n
    ld c, a\n
    call _refresh_patterns\n
\n
_noreset:\n
    ld a, b\n
    ld [row], a\n
\n
IF DEF(PREVIEW_MODE)\n
    db $fd ; signal row update to tracker\n
ENDC\n
    ret\n
\n
note_table:\n
include "hUGE_note_table.inc"`;
