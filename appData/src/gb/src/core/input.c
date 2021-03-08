#pragma bank 2

#include "input.h"

UBYTE joy = 0;
UBYTE last_joy = 0;
UBYTE recent_joy = 0;

void input_update() __nonbanked {
    last_joy = joy;
    joy = joypad();

    if ((joy & INPUT_DPAD) != (last_joy & INPUT_DPAD))
        recent_joy = joy & ~last_joy;
}
