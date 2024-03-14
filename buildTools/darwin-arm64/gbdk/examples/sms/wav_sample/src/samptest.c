#include <gbdk/platform.h>

#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

#include "sample_player.h"

#include "cowbell_8bit_pcm_unsigned.h"
#include "risset_drum_8bit_pcm_unsigned.h"

uint8_t joy = 0, old_joy;
inline void PROCESS_INPUT(void) {
    old_joy = joy, joy = joypad();
}
inline uint8_t KEY_PRESSED(uint8_t key) {
    return ((joy & ~old_joy) & key);
}

void main(void) {
    puts("PRESS A/B TO PLAY\n");
    uint8_t bank_save;
    while (true) {
        PROCESS_INPUT();

        if (KEY_PRESSED(J_A)) {
            bank_save = CURRENT_BANK;
            SWITCH_ROM(BANK(cowbell_8bit_pcm_unsigned));
            play_sample(cowbell_8bit_pcm_unsigned, sizeof(cowbell_8bit_pcm_unsigned));
            cut_sample(SFX_CH_1 | SFX_CH_2 | SFX_CH_3);
            SWITCH_ROM(bank_save);

        } else if (KEY_PRESSED(J_B)) {
            bank_save = CURRENT_BANK;
            SWITCH_ROM(BANK(risset_drum_8bit_pcm_unsigned));
            play_sample(risset_drum_8bit_pcm_unsigned, sizeof(risset_drum_8bit_pcm_unsigned));
            cut_sample(SFX_CH_1 | SFX_CH_2 | SFX_CH_3);
            SWITCH_ROM(bank_save);
        }
        vsync();
    }
}