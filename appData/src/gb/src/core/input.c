#pragma bank 2

#include "input.h"

UBYTE joy;
UBYTE last_joy;
UBYTE recent_joy;

void input_init() __banked {
    joy = 0;
    last_joy = 0;
    recent_joy = 0;
}

void input_update() __nonbanked {
    last_joy = joy;
    joy = joypad();

    if ((joy & INPUT_DPAD) != (last_joy & INPUT_DPAD))
        recent_joy = joy & ~last_joy;
}
