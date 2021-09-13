export default `include "HARDWARE.INC"\n
\n
SINGLE_INTERRUPT EQU 1\n
STACK_SIZE EQU $7A\n
\n
SECTION "Vblank interrupt", ROM0[$0040]\n
    reti\n
\n
SECTION "LCD controller status interrupt", ROM0[$0048]\n
    jp isr_wrapper\n
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
SECTION "nintendo_logo", ROM0[$0104]\n
    NINTENDO_LOGO\n
\n
SECTION "romname", ROM0[$0134]\n
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
is_player_paused:: db\n
do_resume_player:: db\n
\n
SECTION "sample playback", WRAM0\n
_play_sample:: dw\n
_play_length:: dw\n
\n
call_counter: db\n
\n
; Initialization\n
SECTION "main", ROM0[$0150]\n
    jp _init\n
\n
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
    ld [hl], %11111111\n
    ret\n
\n
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
    xor a\n
    ld [do_resume_player], a\n
    inc a\n
    ld [is_player_paused], a\n
\n
.loop:\n
    ld a, [do_resume_player]\n
    or a\n
    jr z, .loop\n
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
isr_wrapper:\n
    push af\n
    push hl\n
    push bc\n
    push de\n
    call _hUGE_dosound\n
    pop de\n
    pop bc\n
    pop hl\n
    pop af\n
    reti\n
\n
_init:\n
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
    ld hl, _play_sample\n
    xor a\n
    ld [hl+], a\n
    ld [hl+], a\n
    ; _play_length\n
    ld [hl+], a\n
    ld [hl+], a\n
    ;  call_counter\n
    ld [hl], a\n
    \n
    ld [is_player_paused], a\n
    ld [do_resume_player], a\n
\n
    ; setup timer\n
    ld a, $c0\n
    ldh [rTMA], a\n
    ld a, 7\n
    ldh [rTAC], a\n
\n
    ld hl, _song_descriptor\n
    call hUGE_init\n
\n
    if !DEF(SINGLE_INTERRUPT)\n
        ;; Enable the HBlank interrupt on scanline 0\n
        ld a, [rSTAT]\n
        or a, STATF_LYC    \n
        ld [rSTAT], a\n
        xor a ; ld a, 0\n
        ld [rLYC], a\n
        ld a, IEF_LCDC | IEF_SERIAL\n
    else \n
        ld a, IEF_TIMER | IEF_SERIAL\n
    ENDC\n
\n
    ld [rIE], a\n
    ei\n
\n
_halt:\n
    ; Do nothing, forever\n
    halt\n
    nop\n
    jr _halt\n
\n
isr_timer:\n
    push af\n
    push hl\n
    push bc\n
    push de\n
\n
    ld hl, _play_length     ;; something left to play?\n
    ld a, [hl+]\n
    or [hl]\n
    jr z, .timer02\n
\n
    ld hl, _play_sample\n
    ld a, [hl+]\n
    ld h, [hl]\n
    ld l, a                 ;; HL = current position inside the sample\n
\n
    xor a\n
    ldh [rAUD3ENA],a       \n
\n
_addr = _AUD3WAVERAM\n
    REPT 16\n
        ld a, [hl+]\n
        ldh [_addr], a\n
_addr = _addr + 1\n
    ENDR\n
\n
    ld a, $80               ; retrigger wave channel\n
    ldh [rAUD3ENA],a\n
    xor a\n
    ld [rAUD3ENA], a\n
\n
    ld a, $80             \n
    ldh [rAUD3ENA],a\n
    ld a, $FE               ; length of wave\n
    ldh [rAUD3LEN],a\n
    ld a, $20               ; volume\n
    ldh [rAUD3LEVEL],a\n
    xor a                   ; low freq bits are zero\n
    ldh [rAUD3LOW],a\n
    ld a, $C7               ; start; no loop; high freq bits are 111\n
    ldh [rAUD3HIGH],a       \n
\n
    ld a, l                 ; save current position\n
    ld [_play_sample], a\n
    ld a, h\n
    ld [_play_sample+1], a\n
\n
    ld hl, _play_length     ; decrement length variable\n
    ld a, [hl]\n
    sub 1\n
    ld [hl+], a\n
    ld a, [hl]\n
    sbc 0\n
    ld [hl-], a\n
    or [hl]\n
    jr nz, .timer02\n
    \n
    ld a, 100\n
    ld [_hUGE_current_wave], a\n
    \n
.timer02:   \n
    if DEF(SINGLE_INTERRUPT)\n
        ld a, [call_counter]\n
        inc a\n
        and 3\n
        ld [call_counter], a\n
        call z, _hUGE_dosound \n
    ENDC\n
    \n
    pop de\n
    pop bc\n
    pop hl\n
    pop af\n
    reti`;
