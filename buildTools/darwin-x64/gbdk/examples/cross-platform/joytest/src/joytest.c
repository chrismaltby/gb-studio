#include <gbdk/platform.h>

#include <stdint.h>
#include <stdbool.h>

extern const uint8_t sprite_data[64];
extern const uint8_t tiles_data[1488];

extern const uint8_t normal_buttons[8][4];
extern const uint8_t pressed_buttons[8][4];
extern const uint8_t disabled_buttons[8][4];

void draw_buttons(uint8_t state, uint8_t x, uint8_t y) {
    set_bkg_based_tiles(x,      y, 2, 2, (state & J_UP)     ? pressed_buttons[0] : normal_buttons[0], 1);
    set_bkg_based_tiles(x + 2,  y, 2, 2, (state & J_DOWN)   ? pressed_buttons[1] : normal_buttons[1], 1);
    set_bkg_based_tiles(x + 4,  y, 2, 2, (state & J_LEFT)   ? pressed_buttons[2] : normal_buttons[2], 1);
    set_bkg_based_tiles(x + 6,  y, 2, 2, (state & J_RIGHT)  ? pressed_buttons[3] : normal_buttons[3], 1);
    set_bkg_based_tiles(x + 8,  y, 2, 2, (state & J_A)      ? pressed_buttons[4] : normal_buttons[4], 1);
    set_bkg_based_tiles(x + 10, y, 2, 2, (state & J_B)      ? pressed_buttons[5] : normal_buttons[5], 1);
    set_bkg_based_tiles(x + 12, y, 2, 2, (state & J_START)  ? pressed_buttons[6] : normal_buttons[6], 1);
    set_bkg_based_tiles(x + 14, y, 2, 2, (state & J_SELECT) ? pressed_buttons[7] : normal_buttons[7], 1);
}

void draw_disabled(uint8_t x, uint8_t y) {
    set_bkg_based_tiles(x,      y, 2, 2, disabled_buttons[0], 1);
    set_bkg_based_tiles(x + 2,  y, 2, 2, disabled_buttons[1], 1);
    set_bkg_based_tiles(x + 4,  y, 2, 2, disabled_buttons[2], 1);
    set_bkg_based_tiles(x + 6,  y, 2, 2, disabled_buttons[3], 1);
    set_bkg_based_tiles(x + 8,  y, 2, 2, disabled_buttons[4], 1);
    set_bkg_based_tiles(x + 10, y, 2, 2, disabled_buttons[5], 1);
    set_bkg_based_tiles(x + 12, y, 2, 2, disabled_buttons[6], 1);
    set_bkg_based_tiles(x + 14, y, 2, 2, disabled_buttons[7], 1);
}

void reset_object_pos(void) {
    for (uint8_t i = 0; i < 4; i++) {
        set_sprite_tile(i, i);
        move_sprite(i,
                    DEVICE_SPRITE_PX_OFFSET_X + (i << 3) + ((DEVICE_SCREEN_PX_WIDTH - (4 * 8)) >> 1), 
                    (uint8_t)(DEVICE_SPRITE_PX_OFFSET_Y + 48u) + ((DEVICE_SCREEN_PX_HEIGHT - 8) >> 1)
                   );
    }
}

bool toggle = false;
bool isSGB = false;

joypads_t old_joypads, joypads;
uint8_t old_joy = 0xff, joy = 0;

void main(void) {
    // Wait 4 frames
    // For SGB on PAL SNES this delay is required on startup, otherwise borders don't show up
    for (uint8_t i = 4; i != 0; i--) vsync();

#ifdef NINTENDO
    isSGB = sgb_check();
#endif
    // init joypads
    joypad_init(4, &joypads);

    set_sprite_data(0, sizeof(sprite_data) >> 4, sprite_data);
    set_bkg_data(1, sizeof(tiles_data) >> 4, tiles_data);
    fill_bkg_rect(0, 0, DEVICE_SCREEN_WIDTH, DEVICE_SCREEN_HEIGHT, 0);

    if (isSGB) draw_disabled(0, 0); else draw_buttons(joy, 0, 0);

    for (uint8_t i = 0; i != 4; i++) {
        if (i <= (joypads.npads - 1)) {
            draw_buttons(joypads.joypads[i], 0, 4 + (i << 1)); 
        } else {
            draw_disabled(0, 4 + (i << 1));
        }
    }

    reset_object_pos();
    SHOW_SPRITES; SHOW_BKG;
    
    while(TRUE) {
        // poll joypads
        if (toggle = !toggle) {
            // poll joypad() only if SGB was not detected
            if (!isSGB) {
                old_joy = joy, joy = joypad();

                // draw button state if changed
                if (joy != old_joy) draw_buttons(joy, 0, 0);

                // start button resets position
                if (joy & J_START) reset_object_pos();
            }
        } else {
            old_joypads = joypads;
            joypad_ex(&joypads);
            // iterate joypads, move sprites
            for (uint8_t i = 0; i < joypads.npads; i++) {
                uint8_t j = joypads.joypads[i];

                // draw joypad
                if (old_joypads.joypads[i] != j) draw_buttons(j, 0, 4 + (i << 1));

                // move objects
                if (j & J_LEFT)  scroll_sprite(i, -1, 0);
                if (j & J_RIGHT) scroll_sprite(i, 1, 0);
                if (j & J_UP)    scroll_sprite(i, 0, -1);
                if (j & J_DOWN)  scroll_sprite(i, 0, 1);

                // start button resets position
                if (j & J_START) reset_object_pos();
            }
        }
        // wait for vsync
        vsync();
    }
}