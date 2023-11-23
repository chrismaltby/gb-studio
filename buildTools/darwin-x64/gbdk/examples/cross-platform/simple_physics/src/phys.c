
// A simple sub-pixel / fixed point example
// Position values are calculated as 16 bit numbers and their
// lower 4 bits are dropped when applying them to the sprite

#include <gbdk/platform.h>

#include <stdint.h>

const uint8_t sprite_data[] = {
    0x3C,0x3C,0x42,0x7E,0x99,0xFF,0xA9,0xFF,0x89,0xFF,0x89,0xFF,0x42,0x7E,0x3C,0x3C,
    0x3C,0x3C,0x42,0x7E,0xB9,0xFF,0x89,0xFF,0x91,0xFF,0xB9,0xFF,0x42,0x7E,0x3C,0x3C,
    0x3C,0x3C,0x42,0x7E,0x99,0xFF,0x89,0xFF,0x99,0xFF,0x89,0xFF,0x5A,0x7E,0x3C,0x3C,
    0x3C,0x3C,0x42,0x7E,0xA9,0xFF,0xA9,0xFF,0xB9,0xFF,0x89,0xFF,0x42,0x7E,0x3C,0x3C

};

// update user input macro
#define INPUT_PROCESS (old_joy=joy,joy=joypad())
// check button down
#define INPUT_KEY(key) (joy&(key))
// check button press
#define INPUT_KEYPRESS(key) ((joy & ~old_joy) & (key))

// coordinate translation macros
#define SUBPIXELS_TO_PIXELS(v) (v >> 4)
#define PIXELS_TO_SUBPIXELS(v) (v << 4)

// physics constants
#define MAX_X_SPEED_IN_SUBPIXELS 64
#define X_ACCELERATION_IN_SUBPIXELS 2
#define MAX_Y_SPEED_IN_SUBPIXELS 64
#define Y_ACCELERATION_IN_SUBPIXELS 2
#define JUMP_ACCELERATION_IN_SUBPIXELS 32

// object coords
int16_t PosX, PosY;
// object speeds
int16_t SpdX, SpdY;

// new and previous values of the joypad input
uint8_t joy  = 0, old_joy;

// main function
void main(void) {
#ifdef NINTENDO
    // init palettes
    BGP_REG = OBP0_REG = OBP1_REG = DMG_PALETTE(DMG_WHITE, DMG_LITE_GRAY, DMG_DARK_GRAY, DMG_BLACK);
#endif
    // load tile data into VRAM
    set_sprite_data(0, 4, sprite_data);

    // set sprite tile
    set_sprite_tile(0, 0);

    // show bkg and sprites
    SHOW_BKG; SHOW_SPRITES;

    PosX = PosY = PIXELS_TO_SUBPIXELS(64);
    SpdX = SpdY = PIXELS_TO_SUBPIXELS(0);

    while(TRUE) {
        // poll joypads
        INPUT_PROCESS;

        // check d-pad and change the object speed
        if (INPUT_KEY(J_UP)) {
            SpdY -= Y_ACCELERATION_IN_SUBPIXELS;
            if (SpdY < -MAX_Y_SPEED_IN_SUBPIXELS) SpdY = -MAX_Y_SPEED_IN_SUBPIXELS;
        } else if (INPUT_KEY(J_DOWN)) {
            SpdY += Y_ACCELERATION_IN_SUBPIXELS;
            if (SpdY > MAX_Y_SPEED_IN_SUBPIXELS) SpdY = MAX_Y_SPEED_IN_SUBPIXELS;
        }
        if (INPUT_KEY(J_LEFT)) {
            SpdX -= X_ACCELERATION_IN_SUBPIXELS;
            if (SpdX < -MAX_X_SPEED_IN_SUBPIXELS) SpdX = -MAX_X_SPEED_IN_SUBPIXELS;
        } else if (INPUT_KEY(J_RIGHT)) {
            SpdX += X_ACCELERATION_IN_SUBPIXELS;
            if (SpdX > MAX_X_SPEED_IN_SUBPIXELS) SpdX = MAX_X_SPEED_IN_SUBPIXELS;
        }
        // check button keypress
        if (INPUT_KEYPRESS(J_A)) {
            SpdY = -JUMP_ACCELERATION_IN_SUBPIXELS;
        }

        // change coordinates of the object
        PosX += SpdX, PosY += SpdY;

        // Translate to pixels and move sprite
        move_sprite(0, SUBPIXELS_TO_PIXELS(PosX), SUBPIXELS_TO_PIXELS(PosY));

        // decelerate Y and X
        if (SpdY < 0) SpdY++; else if (SpdY) SpdY--;
        if (SpdX < 0) SpdX++; else if (SpdX) SpdX--;

        // Done processing, yield CPU and wait for start of next frame (VBlank)
        vsync();
    }
}
