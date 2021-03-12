#ifndef STATE_TOP_DOWN_H
#define STATE_TOP_DOWN_H

#include <gb/gb.h>

void topdown_init() __banked;
void topdown_update() __banked;

extern UBYTE topdown_grid;

#endif
