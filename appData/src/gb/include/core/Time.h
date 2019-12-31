#ifndef TIME_H
#define TIME_H

#include <gb/gb.h>

#define IS_FRAME_8 ((time & 0x7) == 0)
#define IS_FRAME_4 ((time & 0x3) == 0)
#define IS_FRAME_2 ((time & 0x1) == 0)

extern UBYTE time;

#endif
