#include <gbdk/platform.h>

#include <stdint.h>

const uint8_t sprite_data[] = {
    0x3C,0x3C,0x42,0x7E,0x99,0xFF,0xA9,0xFF,0x89,0xFF,0x89,0xFF,0x42,0x7E,0x3C,0x3C,
    0x3C,0x3C,0x42,0x7E,0xB9,0xFF,0x89,0xFF,0x91,0xFF,0xB9,0xFF,0x42,0x7E,0x3C,0x3C,
    0x3C,0x3C,0x42,0x7E,0x99,0xFF,0x89,0xFF,0x99,0xFF,0x89,0xFF,0x5A,0x7E,0x3C,0x3C,
    0x3C,0x3C,0x42,0x7E,0xA9,0xFF,0xA9,0xFF,0xB9,0xFF,0x89,0xFF,0x42,0x7E,0x3C,0x3C 
};

joypads_t joypads;

void main(void) {
    set_sprite_data(0, 4, sprite_data);
    for (uint8_t i = 0; i < 4; i++) {
        set_sprite_tile(i, i);
        move_sprite(i,
                    DEVICE_SPRITE_PX_OFFSET_X + (i << 3) + ((DEVICE_SCREEN_PX_WIDTH - (4 * 8)) / 2), 
                    DEVICE_SPRITE_PX_OFFSET_Y + ((DEVICE_SCREEN_PX_HEIGHT - 8) / 2));
    }
    SHOW_SPRITES;

    // Wait 4 frames
    // For SGB on PAL SNES this delay is required on startup, otherwise borders don't show up
    for (uint8_t i = 4; i != 0; i--) vsync();

    // init joypads
    joypad_init(4, &joypads);
    
    while(1) {
        // poll joypads
        joypad_ex(&joypads);
        // iterate joypads, move sprites
        for (uint8_t i = 0; i < joypads.npads; i++) {
            uint8_t joy = joypads.joypads[i];
            if (joy & J_LEFT) scroll_sprite(i, -1, 0);
            if (joy & J_RIGHT) scroll_sprite(i, 1, 0);
            if (joy & J_UP) scroll_sprite(i, 0, -1);
            if (joy & J_DOWN) scroll_sprite(i, 0, 1);
        }
        // start on joypad 1 resets position
        if (joypads.joy0 & J_START) {
            for (uint8_t i = 0; i < 4; i++) move_sprite(i, (i << 3) + 64, 64);
        }
        vsync();
    }
}