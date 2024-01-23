#ifndef SAMPLE_PLAYER_H_INCLUDE
#define SAMPLE_PLAYER_H_INCLUDE

#include <gbdk/platform.h>
#include <stdint.h>

#define SFX_CH_1        (1 << (PSG_CH0 >> 5))
#define SFX_CH_2        (1 << (PSG_CH1 >> 5))
#define SFX_CH_3        (1 << (PSG_CH2 >> 5))
#define SFX_CH_4        (1 << (PSG_CH3 >> 5))

void play_sample(uint8_t * sample, uint16_t size);
void cut_sample(uint8_t mask);

#endif