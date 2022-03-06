#ifndef __SFX_PLAYER_H_INCLUDE__
#define __SFX_PLAYER_H_INCLUDE__

#include <gbdk/platform.h>
#include <stdint.h>

#define SFX_STOP_BANK 0xffu
#define SFX_MUTE_MASK(VARNAME) ( (uint8_t) & __mute_mask_ ## VARNAME )

extern volatile uint8_t sfx_play_bank; 
extern const uint8_t * sfx_play_sample;
extern uint8_t sfx_frame_skip;

#define SFX_CH_RETRIGGER  0b11000000
#define SFX_CH_ENABLE     0b10000000

inline void sfx_sound_init() {
    NR52_REG = SFX_CH_ENABLE, NR51_REG = 0xFF, NR50_REG = 0x77;  // enable sound
}

inline void sfx_sound_cut() {
    NR12_REG = NR22_REG = NR32_REG = NR42_REG = 0;
    NR14_REG = NR24_REG = NR44_REG = SFX_CH_RETRIGGER;
    NR51_REG = 0xFF;
}

#define SFX_CH_1 1
#define SFX_CH_2 2
#define SFX_CH_3 4
#define SFX_CH_4 8

inline void sfx_sound_cut_mask(uint8_t mask) {
    if (mask & SFX_CH_1) NR12_REG = 0, NR14_REG = SFX_CH_RETRIGGER; 
    if (mask & SFX_CH_2) NR22_REG = 0, NR24_REG = SFX_CH_RETRIGGER; 
    if (mask & SFX_CH_3) NR32_REG = 0; 
    if (mask & SFX_CH_4) NR42_REG = 0, NR44_REG = SFX_CH_RETRIGGER;
    NR51_REG = 0xFF;
}

inline void sfx_reset_sample() {
    sfx_play_bank = SFX_STOP_BANK, sfx_play_sample = NULL;
}

inline void sfx_set_sample(uint8_t bank, const uint8_t * sample) {
    sfx_play_bank = SFX_STOP_BANK, sfx_frame_skip = 0, sfx_play_sample = sample, sfx_play_bank = bank;
}

uint8_t sfx_play_isr() OLDCALL;

#endif