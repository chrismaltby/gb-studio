#ifndef SAMPLE_PLAYER_H_INCLUDE
#define SAMPLE_PLAYER_H_INCLUDE

#include <gb/gb.h>

#include "compat.h"

extern UINT8 play_bank;
extern const UINT8 * play_sample;
extern UINT16 play_length;

void set_sample(UINT8 bank, const UINT8 * sample, UINT16 length) BANKED; 
void sample_play_isr() NONBANKED;

#endif