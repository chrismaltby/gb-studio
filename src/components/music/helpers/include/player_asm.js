export default `include "include/hardware.inc"\n
\n
SINGLE_INTERRUPT EQU 1\n
STACK_SIZE EQU $7A\n
SFX_STOP_BANK EQU $FF\n
\n
SECTION "Vblank interrupt", ROM0[$0040]\n
    reti\n
\n
SECTION "LCD controller status interrupt", ROM0[$0048]\n
    jp isr_lcd\n
\n
SECTION "Timer overflow interrupt", ROM0[$0050]\n
    jp isr_timer\n
\n
SECTION "Serial transfer completion interrupt", ROM0[$0058]\n
    jp isr_serial\n
\n
SECTION "P10-P13 signal low edge interrupt", ROM0[$0060]\n
    reti\n
\n
SECTION "Stack", HRAM[$FFFE - STACK_SIZE]\n
    ds STACK_SIZE\n
\n
SECTION "init", ROM0[$0100]\n
    nop\n
    jp $0150\n
\n
SECTION "Nintendo logo", ROM0[$0104]\n
    NINTENDO_LOGO\n
\n
SECTION "ROM name", ROM0[$0134]\n
; $0134 - $013E: The title, in upper-case letters, followed by zeroes.\n
    DB "HUGE"\n
    DS 7 ; padding\n
; $013F - $0142: The manufacturer code. Empty for now\n
    DS 4\n
    DS 1\n
; $0144 - $0145: "New" Licensee Code, a two character name.\n
    DB "NF"\n
\n
SECTION "pause control", WRAM0\n
is_player_paused:: db   ; paused flag\n
do_resume_player:: db   ; exit from paused state flag\n
\n
new_order::    db   ; new pattern (can be changed while paused)\n
new_row::      db   ; new position within the pattern (can be changed while paused)\n
\n
SECTION "sample playback", WRAM0\n
_sfx_play_bank::   db   ; bank of the SFX\n
_sfx_play_sample:: dw   ; pointer to SFX\n
_sfx_frame_skip:   db\n
\n
call_counter:      db\n
\n
SECTION "bank tracking", HRAM\n
__current_bank::   db\n
\n
; Initialization\n
SECTION "main", ROM0[$0150]\n
    jp _main\n
\n
; LCD ISR\n
isr_lcd:\n
    push af\n
    push hl\n
    push bc\n
    push de\n
    \n
    call _hUGE_dosound\n
    \n
    pop de\n
    pop bc\n
    pop hl\n
    pop af\n
    reti\n
\n
; Timer ISR\n
isr_timer:\n
    push af\n
    push hl\n
    push bc\n
    push de\n
    \n
    call _sfx_play\n
    \n
    if DEF(SINGLE_INTERRUPT)\n
        ld hl, call_counter\n
        inc [hl]\n
        ld a, 3\n
        and [hl]\n
        call z, _hUGE_dosound \n
    ENDC\n
    \n
    pop de\n
    pop bc\n
    pop hl\n
    pop af\n
    reti\n
\n
; Serial ISR (for pause/resume)\n
isr_serial:\n
    push af\n
    push hl\n
    push bc\n
    push de\n
    \n
    ld b, 0\n
    call sound_cut\n
    ld b, 1\n
    call sound_cut\n
    ld b, 2\n
    call sound_cut\n
    ld b, 3\n
    call sound_cut\n
    \n
    ; save current row and order\n
    ld a, [row]\n
    ld [new_row], a\n
    ld a, [current_order]\n
    ld [new_order], a\n
    \n
    xor a\n
    ld [do_resume_player], a\n
    inc a\n
    ld [is_player_paused], a\n
\n
    ; busyloop until resume\n
.loop:\n
    ld a, [do_resume_player]\n
    or a\n
    jr z, .loop\n
    \n
    ; set new position\n
    ld a, [new_row]\n
    ld [row], a\n
    \n
    ld hl, current_order\n
    ld a, [new_order]\n
    cp [hl]\n
    ld [hl], a\n
    ld c, a\n
    call nz, load_patterns\n
\n
    xor a\n
    ld [is_player_paused], a\n
    \n
    dec a\n
    ld [_hUGE_current_wave], a\n
    \n
    pop de\n
    pop bc\n
    pop hl\n
    pop af\n
    reti\n
    \n
\n
; main() function\n
_main::\n
    ld a, 0\n
    ld [rIF], a\n
    ld a, IEF_VBLANK\n
    ld [rIE], a\n
    halt\n
    nop\n
    \n
    ; Enable sound globally\n
    ld a, $80\n
    ld [rAUDENA], a\n
    ; Enable all channels in stereo\n
    ld a, $FF\n
    ld [rAUDTERM], a\n
    ; Set volume\n
    ld a, $77\n
    ld [rAUDVOL], a\n
    \n
    ; cleanup sample player\n
    ld hl, _sfx_play_bank\n
    ld [hl], SFX_STOP_BANK\n
    inc hl\n
    xor a\n
    ; _sfx_play_sample\n
    ld [hl+], a\n
    ld [hl+], a\n
    ; _sfx_frame_skip\n
    ld [hl+], a\n
    ;  call_counter\n
    ld [hl], a\n
    \n
    ld [is_player_paused], a\n
    ld [do_resume_player], a\n
    \n
    inc a\n
    ldh [__current_bank], a\n
    \n
    ; setup timer\n
    ld a, $c0\n
    ldh [rTMA], a\n
    ld a, 7\n
    ldh [rTAC], a\n
    \n
    ld hl, SONG_DESCRIPTOR\n
    call hUGE_init\n
    \n
    if !DEF(SINGLE_INTERRUPT)\n
        ;; Enable the HBlank interrupt on scanline 0\n
        ld a, [rSTAT]\n
        or a, STATF_LYC    \n
        ld [rSTAT], a\n
        xor a ; ld a, 0\n
        ld [rLYC], a\n
        ; LCD for music, TIMER for SFX, SERIAL for pausing\n
        ld a, IEF_LCDC | IEF_TIMER | IEF_SERIAL\n
    else\n
        ; TIMER for music and SFX, SERIAL for pausing\n
        ld a, IEF_TIMER | IEF_SERIAL\n
    ENDC\n
    \n
    ld [rIE], a\n
    ; enter paused state immediately\n
    and IEF_SERIAL\n
    ld [rIF], a\n
    ; enable interrupts\n
    ei\n
    ; loop forever, do nothing\n
.init01:\n
    halt\n
    nop\n
    jr .init01\n
\n
; play SFX effect, return zero in E when done\n
copy_reg: MACRO\n
    sla b\n
    jr nc, .copyreg\\@\n
    ld a, [hl+]\n
    ldh [c], a\n
.copyreg\\@:\n
    inc c\n
ENDM\n
\n
_sfx_play:\n
    ld hl, _sfx_play_sample\n
    ld a, [hl+]\n
    ld e, a\n
    or [hl]\n
    ret z\n
    ld d, [hl]\n
\n
    ld hl, _sfx_frame_skip\n
    xor a\n
    or [hl]\n
    jr z, .sfx07\n
    dec [hl]\n
.sfx08:\n
    ld e, a\n
    ret\n
.sfx07:\n
    ld h, d\n
    ld l, e             ; HL = current position inside the sample\n
\n
    ld a, [__current_bank]      ; save bank and switch\n
    ld e, a\n
    ld a, [_sfx_play_bank]\n
    inc a               ; SFX_STOP_BANK ?\n
    jr z, .sfx08\n
    dec a\n
    ld [rROMB0], a\n
\n
    ld d, $0f\n
    ld a, [hl]\n
    swap a\n
    and d\n
    ld [_sfx_frame_skip], a\n
\n
    ld a, [hl+]\n
    and d\n
    ld d, a             ; d = frame channel count\n
    jp z, .sfx06\n
.sfx02:\n
    ld a, [hl+]\n
    ld b, a             ; a = b = channel no + register mask\n
\n
    and %00000111\n
    cp 5\n
    jr c, .sfx03\n
    cp 7\n
    jr z, .sfx05        ; terminator\n
\n
    xor a\n
    ld [rNR30], a\n
\n
    ld c, LOW(_AUD3WAVERAM)\n
    REPT 16\n
        ld a, [hl+]\n
        ldh [c], a\n
        inc c\n
    ENDR\n
\n
    ld a, b\n
    cp 6\n
    jr nz, .sfx04           ; just load waveform, not play\n
\n
    ld c, LOW(rNR30)\n
    ld a, $80           ; retrigger wave channel\n
    ldh [c],a\n
    xor a\n
    ldh [c], a\n
\n
    ld a, $80         \n
    ldh [c],a\n
    ld a, $FE           ; length of wave\n
    ldh [rNR31],a\n
    ld a, $20           ; volume\n
    ldh [rNR32],a\n
    xor a               ; low freq bits are zero\n
    ldh [rNR33],a\n
    ld a, $C7           ; start; no loop; high freq bits are 111\n
    ldh [rNR34],a       \n
\n
    jr .sfx04\n
.sfx05:                 ; terminator\n
    ld hl, 0\n
    ld d, l\n
    jr .sfx00\n
.sfx03:\n
    ld  c, a\n
    add a\n
    add a\n
    add c\n
    add LOW(rNR10)\n
    ld c, a             ; c = NR10_REG + [a & 7] * 5\n
    \n
    REPT 5\n
        copy_reg\n
    ENDR\n
\n
.sfx04:\n
    dec d\n
    jp nz, .sfx02\n
.sfx06:\n
    inc d               ; return 1 if still playing\n
.sfx00:\n
    ld a, l             ; save current position\n
    ld [_sfx_play_sample], a\n
    ld a, h\n
    ld [_sfx_play_sample + 1], a\n
\n
    ld a, e             ; restore bank\n
    ld [rROMB0], a\n
\n
    ld e, d             ; result in e\n
\n
    ret\n
\n
; CUT sound on channel B\n
sound_cut:\n
    ld hl, rAUD1ENV\n
    ld a, b\n
    add a\n
    add a\n
    add b\n
    \n
    add l\n
    ld l, a\n
    adc h\n
    sub l\n
    ld h, a\n
\n
    ld [hl], 0\n
    ld a, b\n
    cp 2\n
    ret z\n
\n
    inc hl\n
    inc hl\n
    ld [hl], %11000000\n
    ret`;
