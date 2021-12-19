#pragma bank 4

#include "sample_player.h"

UINT8 play_bank = 1;
const UINT8 * play_sample = 0;
UINT16 play_length = 0;

void sample_play_isr() NONBANKED NAKED {
    __asm
        ld hl, #_play_length    ; something left to play?
        ld a, (hl+)
        or (hl)
        ret z

        ld hl, #_play_sample
        ld a, (hl+)
        ld h, (hl)
        ld l, a                 ; HL = current position inside the sample

                                ; load new waveform
        ldh a, (#__current_bank) ; save bank and switch
        ld e, a
        ld a, (#_play_bank)
        ldh (#__current_bank), a
        ld (#0x2000), a

        xor a
        ldh (_NR30_REG),a       

_wave_addr = 0xFF30
        .rept 16
            ld a, (hl+)
            ldh (_wave_addr), a
_wave_addr = _wave_addr + 1
        .endm

        ld a, #0x80             ; retrigger wave channel
        ldh (_NR30_REG),a
        xor a
        ld (_NR30_REG), a

        ld a, #0x80             
        ldh (_NR30_REG),a
        ld a, #0xFE             ; length of wave
        ldh (_NR31_REG),a
        ld a, #0x20             ; volume
        ldh (_NR32_REG),a
        xor a                   ; low freq bits are zero
        ldh (_NR33_REG),a
        ld a, #0xC7             ; start; no loop; high freq bits are 111
        ldh (_NR34_REG),a       

        ld a, e                 ; restore bank
        ldh (#__current_bank), a
        ld (#0x2000), a

        ld a, l                 ; save current position
        ld (#_play_sample), a
        ld a, h
        ld (#_play_sample+1), a

        ld hl, #_play_length    ; decrement length variable
        ld a, (hl)
        sub #1
        ld (hl+), a
        ld a, (hl)
        sbc #0
        ld (hl), a
        ret
    __endasm;
}

void set_sample(UINT8 bank, const UINT8 * sample, UINT16 length) BANKED CRITICAL {
    play_bank = bank, play_sample = sample, play_length = length >> 4;
}
