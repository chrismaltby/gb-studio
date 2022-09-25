#pragma bank 255

#include <string.h>
#include "input.h"

joypads_t joypads;
UBYTE frame_joy;
UBYTE last_joy;
UBYTE recent_joy;

void input_init() BANKED {
    memset(&joypads, 0, sizeof(joypads));
    last_joy = 0;
    frame_joy = 0;
    recent_joy = 0;
#ifdef SGB
    joypad_init(MAX_JOYPADS, &joypads);
#else
    joypads.npads = 1;
#endif
}

void input_update() NONBANKED {
    last_joy = joypads.joy0;
#ifdef SGB
    joypad_ex(&joypads);
    joy = joypads.joy0;
#else 
    joypads.joy0 = joy = joypad();
#endif
    if ((joy & INPUT_DPAD) != (last_joy & INPUT_DPAD))
        recent_joy = joy & ~last_joy;
}
