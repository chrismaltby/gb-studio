// https://raw.githubusercontent.com/untoxa/hUGEBuild/master/player-rgbds/rgbds_player.asm

export default `;; hUGETracker playback routine\n
;; Written by SuperDisk 2019\n
\n
include "HARDWARE.INC"\n
\n
; Constants\n
STACK_SIZE EQU $7A\n
;; Stack starts at $FFFE\n
\n
; $0000 - $003F: RST handlers.\n
\n
SECTION "restarts", ROM0[$0000]\n
ret\n
REPT 7\n
    nop\n
ENDR\n
; $0008\n
ret\n
REPT 7\n
    nop\n
ENDR\n
; $0010\n
ret\n
REPT 7\n
    nop\n
ENDR\n
; $0018\n
ret\n
REPT 7\n
    nop\n
ENDR\n
; $0020\n
ret\n
REPT 7\n
    nop\n
ENDR\n
; $0028\n
ret\n
REPT 7\n
    nop\n
ENDR\n
; $0030\n
ret\n
REPT 7\n
    nop\n
ENDR\n
; $0038\n
ret\n
REPT 7\n
    nop\n
ENDR\n
\n
; Interrupt addresses\n
SECTION "Vblank interrupt", ROM0[$0040]\n
    reti\n
\n
SECTION "LCD controller status interrupt", ROM0[$0048]\n
    jp isr_wrapper\n
\n
SECTION "Timer overflow interrupt", ROM0[$0050]\n
    reti\n
\n
SECTION "Serial transfer completion interrupt", ROM0[$0058]\n
    reti\n
\n
SECTION "P10-P13 signal low edge interrupt", ROM0[$0060]\n
    reti\n
\n
; Reserved stack space\n
SECTION "Stack", HRAM[$FFFE - STACK_SIZE]\n
    ds STACK_SIZE\n
\n
; Control starts here, but there's more ROM header several bytes later, so the\n
; only thing we can really do is immediately jump to after the header\n
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
; Initialization\n
SECTION "main", ROM0[$0150]\n
    jp _init\n
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
_paint_tile:\n
    ld a, b\n
    ld [hl+], a\n
    ld a, c\n
    ld [hl+], a\n
    ret\n
\n
_init:\n
    ld a, 0\n
    ld [rIF], a\n
    inc a\n
    ld [rIE], a\n
    halt\n
    nop\n
\n
    ; Set LCD palette for grayscale mode; yes, it has a palette\n
    ld a, %11100100\n
    ld [$FF00+$47], a\n
\n
    ;; Fill with pattern\n
    ld hl, $8000\n
    ld bc, \`10000000\n
    call _paint_tile\n
    ld bc, \`01000000\n
    call _paint_tile\n
    ld bc, \`00100000\n
    call _paint_tile\n
    ld bc, \`00010000\n
    call _paint_tile\n
    ld bc, \`00001000\n
    call _paint_tile\n
    ld bc, \`00000100\n
    call _paint_tile\n
    ld bc, \`00000010\n
    call _paint_tile\n
    ld bc, \`00000001\n
    call _paint_tile\n
\n
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
    ld hl, _song_descriptor\n
    call hUGE_init\n
\n
    ;; Enable the timer\n
    ; ld a, TACF_START | TACF_4KHZ\n
    ; ld [rTAC], a\n
\n
    ;; Enable the HBlank interrupt on scanline 0\n
    ld a, [rSTAT]\n
    or a, STATF_LYC\n
    ld [rSTAT], a\n
    xor a ; ld a, 0\n
    ld [rLYC], a\n
\n
    ld a, IEF_LCDC ; IEF_VBLANK;  | IEF_LCDC ; IEF_HILO | IEF_TIMER\n
    ld [rIE], a\n
    ei\n
\n
_halt:\n
    ; Do nothing, forever\n
    halt\n
    nop\n
    jr _halt\n`;
