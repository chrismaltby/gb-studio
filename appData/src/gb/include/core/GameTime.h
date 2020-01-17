#ifndef GAMETIME_H
#define GAMETIME_H

#include <gb/gb.h>

#define IS_FRAME_8 ((game_time & 0x7) == 0)
#define IS_FRAME_4 ((game_time & 0x3) == 0)
#define IS_FRAME_2 ((game_time & 0x1) == 0)

extern UBYTE game_time;

#endif
