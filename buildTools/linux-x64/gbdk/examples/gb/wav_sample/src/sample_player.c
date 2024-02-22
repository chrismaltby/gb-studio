#include "sample_player.h"

UINT8 play_bank = 1;
const UINT8 * play_sample = 0;
UINT16 play_length = 0;

void play_isr(void) __nonbanked __naked {
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
        ld a, (#__current_bank) ; save bank and switch
        ld e, a
        ld a, (#_play_bank)
        ld (_rROMB0), a

        ldh a, (_NR51_REG)
        ld c, a
        and #0b10111011
        ldh (_NR51_REG), a

        xor a
        ldh (_NR30_REG), a       

        .irp ofs,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15
            ld a, (hl+)
            ldh (__AUD3WAVERAM+ofs), a
        .endm

        ld a, #0x80             
        ldh (_NR30_REG), a
        ld a, #0xFE             ; length of wave
        ldh (_NR31_REG), a
        ld a, #0x20             ; volume
        ldh (_NR32_REG), a
        xor a                   ; low freq bits are zero
        ldh (_NR33_REG), a
        ld a, #0xC7             ; start; no loop; high freq bits are 111
        ldh (_NR34_REG), a       

        ld a, c
        ldh (_NR51_REG), a

        ld a, e                 ; restore bank
        ld (_rROMB0), a

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

void set_sample(UINT8 bank, const UINT8 * sample, UINT16 length) __critical {
    play_bank = bank, play_sample = sample, play_length = length >> 4;
}
