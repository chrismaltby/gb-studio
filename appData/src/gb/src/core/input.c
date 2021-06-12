#pragma bank 4

#include <string.h>
#include "input.h"

joypads_t joypads;
UBYTE last_joy;
UBYTE recent_joy;

void input_init() __banked {
    memset(&joypads, 0, sizeof(joypads));
    last_joy = 0;
    recent_joy = 0;
#ifdef SGB
    joypad_init(MAX_JOYPADS, &joypads);
#endif
}

void input_update() __nonbanked {
    last_joy = joy;
#ifdef SGB
    joypad_ex(&joypads);
#else 
    joy = joypad();
#endif
    if ((joy & INPUT_DPAD) != (last_joy & INPUT_DPAD))
        recent_joy = joy & ~last_joy;
}
