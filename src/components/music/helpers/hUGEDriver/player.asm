include "include/hardware.inc"

SINGLE_INTERRUPT EQU 1
STACK_SIZE EQU $7A
SFX_STOP_BANK EQU $FF

SECTION "Vblank interrupt", ROM0[$0040]
        reti

SECTION "LCD controller status interrupt", ROM0[$0048]
        jp isr_lcd

SECTION "Timer overflow interrupt", ROM0[$0050]
        jp isr_timer

SECTION "Serial transfer completion interrupt", ROM0[$0058]
        jp isr_serial

SECTION "P10-P13 signal low edge interrupt", ROM0[$0060]
        reti

SECTION "Stack", HRAM[$FFFE - STACK_SIZE]
        ds STACK_SIZE

SECTION "init", ROM0[$0100]
        nop
        jp $0150

SECTION "Nintendo logo", ROM0[$0104]
        NINTENDO_LOGO

SECTION "ROM name", ROM0[$0134]
; $0134 - $013E: The title, in upper-case letters, followed by zeroes.
        DB "HUGE"
        DS 7 ; padding
; $013F - $0142: The manufacturer code. Empty for now
        DS 4
        DS 1
; $0144 - $0145: "New" Licensee Code, a two character name.
        DB "NF"

SECTION "pause control", WRAM0
is_player_paused:: db   ; paused flag
do_resume_player:: db   ; exit from paused state flag

new_order::        db   ; new pattern (can be changed while paused)
new_row::          db   ; new position within the pattern (can be changed while paused)

SECTION "sample playback", WRAM0
_sfx_play_bank::   db   ; bank of the SFX
_sfx_play_sample:: dw   ; pointer to SFX
_sfx_frame_skip:   db

call_counter:      db

SECTION "bank tracking", HRAM
__current_bank::   db

; Initialization
SECTION "main", ROM0[$0150]
        jp _main

; LCD ISR
isr_lcd:
        push af
        push hl
        push bc
        push de
        
        call _hUGE_dosound
        
        pop de
        pop bc
        pop hl
        pop af
        reti

; Timer ISR
isr_timer:
        push af
        push hl
        push bc
        push de
        
        call _sfx_play
        
        if DEF(SINGLE_INTERRUPT)
            ld hl, call_counter
            inc [hl]
            ld a, 3
            and [hl]
            call z, _hUGE_dosound 
        ENDC
        
        pop de
        pop bc
        pop hl
        pop af
        reti

; Serial ISR (for pause/resume)
isr_serial:
        push af
        push hl
        push bc
        push de
        
        ld b, 0
        call sound_cut
        ld b, 1
        call sound_cut
        ld b, 2
        call sound_cut
        ld b, 3
        call sound_cut
        
        ; save current row and order
        ld a, [row]
        ld [new_row], a
        ld a, [current_order]
        ld [new_order], a
        
        xor a
        ld [do_resume_player], a
        inc a
        ld [is_player_paused], a

        ; busyloop until resume
.loop:
        ld a, [do_resume_player]
        or a
        jr z, .loop
        
        ; set new position
        ld a, [new_row]
        ld [row], a
        
        ld hl, current_order
        ld a, [new_order]
        cp [hl]
        ld [hl], a
        ld c, a
        call nz, load_patterns

        xor a
        ld [is_player_paused], a
        
        dec a
        ld [_hUGE_current_wave], a
        
        pop de
        pop bc
        pop hl
        pop af
        reti
        

; main() function
_main::
        ld a, 0
        ld [rIF], a
        ld a, IEF_VBLANK
        ld [rIE], a
        halt
        nop
        
        ; Enable sound globally
        ld a, $80
        ld [rAUDENA], a
        ; Enable all channels in stereo
        ld a, $FF
        ld [rAUDTERM], a
        ; Set volume
        ld a, $77
        ld [rAUDVOL], a
        
        ; cleanup sample player
        ld hl, _sfx_play_bank
        ld [hl], SFX_STOP_BANK
        inc hl
        xor a
        ; _sfx_play_sample
        ld [hl+], a
        ld [hl+], a
        ; _sfx_frame_skip
        ld [hl+], a
        ;  call_counter
        ld [hl], a
        
        ld [is_player_paused], a
        ld [do_resume_player], a
        
        inc a
        ldh [__current_bank], a
        
        ; setup timer
        ld a, $c0
        ldh [rTMA], a
        ld a, 7
        ldh [rTAC], a
        
        ld hl, SONG_DESCRIPTOR
        call hUGE_init
        
        if !DEF(SINGLE_INTERRUPT)
            ;; Enable the HBlank interrupt on scanline 0
            ld a, [rSTAT]
            or a, STATF_LYC    
            ld [rSTAT], a
            xor a ; ld a, 0
            ld [rLYC], a
            ; LCD for music, TIMER for SFX, SERIAL for pausing
            ld a, IEF_LCDC | IEF_TIMER | IEF_SERIAL
        else
            ; TIMER for music and SFX, SERIAL for pausing
            ld a, IEF_TIMER | IEF_SERIAL
        ENDC
        
        ld [rIE], a
        ; enter paused state immediately
        and IEF_SERIAL
        ld [rIF], a
        ; enable interrupts
        ei
        ; loop forever, do nothing
.init01:
        halt
        nop
        jr .init01

; play SFX effect, return zero in E when done
copy_reg: MACRO
        sla b
        jr nc, .copyreg\@
        ld a, [hl+]
        ldh [c], a
.copyreg\@:
        inc c
ENDM

_sfx_play:
        ld hl, _sfx_play_sample
        ld a, [hl+]
        ld e, a
        or [hl]
        ret z
        ld d, [hl]

        ld hl, _sfx_frame_skip
        xor a
        or [hl]
        jr z, .sfx07
        dec [hl]
.sfx08:
        ld e, a
        ret
.sfx07:
        ld h, d
        ld l, e                     ; HL = current position inside the sample

        ld a, [__current_bank]      ; save bank and switch
        ld e, a
        ld a, [_sfx_play_bank]
        inc a                       ; SFX_STOP_BANK ?
        jr z, .sfx08
        dec a
        ld [rROMB0], a

        ld d, $0f
        ld a, [hl]
        swap a
        and d
        ld [_sfx_frame_skip], a

        ld a, [hl+]
        and d
        ld d, a                     ; d = frame channel count
        jp z, .sfx06
.sfx02:
        ld a, [hl+]
        ld b, a                     ; a = b = channel no + register mask

        and %00000111
        cp 5
        jr c, .sfx03
        cp 7
        jr z, .sfx05                ; terminator

        xor a
        ld [rNR30], a

        ld c, LOW(_AUD3WAVERAM)
        REPT 16
            ld a, [hl+]
            ldh [c], a
            inc c
        ENDR

        ld a, b
        cp 6
        jr nz, .sfx04               ; just load waveform, not play

        ld c, LOW(rNR30)
        ld a, $80                   ; retrigger wave channel
        ldh [c],a
        xor a
        ldh [c], a

        ld a, $80             
        ldh [c],a
        ld a, $FE                   ; length of wave
        ldh [rNR31],a
        ld a, $20                   ; volume
        ldh [rNR32],a
        xor a                       ; low freq bits are zero
        ldh [rNR33],a
        ld a, $C7                   ; start; no loop; high freq bits are 111
        ldh [rNR34],a       

        jr .sfx04
.sfx05:                             ; terminator
        ld hl, 0
        ld d, l
        jr .sfx00
.sfx03:
        ld  c, a
        add a
        add a
        add c
        add LOW(rNR10)
        ld c, a                     ; c = NR10_REG + [a & 7] * 5
        
        REPT 5
            copy_reg
        ENDR

.sfx04:
        dec d
        jp nz, .sfx02
.sfx06:
        inc d                       ; return 1 if still playing
.sfx00:
        ld a, l                     ; save current position
        ld [_sfx_play_sample], a
        ld a, h
        ld [_sfx_play_sample + 1], a

        ld a, e                     ; restore bank
        ld [rROMB0], a

        ld e, d                     ; result in e

        ret

; CUT sound on channel B
sound_cut:
        ld hl, rAUD1ENV
        ld a, b
        add a
        add a
        add b
        
        add l
        ld l, a
        adc h
        sub l
        ld h, a

        ld [hl], 0
        ld a, b
        cp 2
        ret z

        inc hl
        inc hl
        ld [hl], %11000000
        ret
