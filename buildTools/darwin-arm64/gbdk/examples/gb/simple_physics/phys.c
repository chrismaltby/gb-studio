#include <gb/gb.h>
#include <gb/sgb.h>

#include <stdio.h>
#include <gbdk/console.h>

// A simple sub-pixel / fixed point example
// Postion values are calculated as 16 bit numbers and their
// lower 4 bits are dropped when applying them to the sprite

UINT8 sprite_data[] = { 
    0x3C,0x3C,0x42,0x7E,0x99,0xFF,0xA9,0xFF,0x89,0xFF,0x89,0xFF,0x42,0x7E,0x3C,0x3C,
    0x3C,0x3C,0x42,0x7E,0xB9,0xFF,0x89,0xFF,0x91,0xFF,0xB9,0xFF,0x42,0x7E,0x3C,0x3C,
    0x3C,0x3C,0x42,0x7E,0x99,0xFF,0x89,0xFF,0x99,0xFF,0x89,0xFF,0x5A,0x7E,0x3C,0x3C,
    0x3C,0x3C,0x42,0x7E,0xA9,0xFF,0xA9,0xFF,0xB9,0xFF,0x89,0xFF,0x42,0x7E,0x3C,0x3C

};

joypads_t joypads;

// sprite coords
UINT16 PosX, PosY;
INT16 SpdX, SpdY;
UINT8 Jump;

// main funxction
void main(void) {
    // init palettes
    BGP_REG = OBP0_REG = OBP1_REG = 0xE4;

    // load tile data into VRAM
    set_sprite_data(0, 4, sprite_data);
    
    // set sprite tile
    set_sprite_tile(0, 0);

    // show bkg and sprites
    SHOW_BKG; SHOW_SPRITES;

    // init 2 joypads
    joypad_init(1, &joypads);
 
    PosX = PosY = 64 << 4;
    Jump = SpdX = SpdY = 0;

    while(1) {        
        // poll joypads
        joypad_ex(&joypads);
        
        // game object
        if (joypads.joy0 & J_UP) {
            SpdY -= 2;
            if (SpdY < -64) SpdY = -64;
        } else if (joypads.joy0 & J_DOWN) {
            SpdY += 2;
            if (SpdY > 64) SpdY = 64;
        }
        if (joypads.joy0 & J_LEFT) {
            SpdX -= 2;
            if (SpdX < -64) SpdX = -64;
        } else if (joypads.joy0 & J_RIGHT) {
            SpdX += 2;
            if (SpdX > 64) SpdX = 64;
        }
        if ((joypads.joy0 & J_A) && (!Jump)) {
            Jump = 3;
        }

        // jump
        if (Jump) {
            SpdY -= 8;
            if (SpdY < -32) SpdY = -32;
            Jump--;
        }

        PosX += SpdX, PosY += SpdY; 

        // Translate to pixels and move sprite
        // Downshift by 4 bits to use the whole number values
        move_sprite(0, PosX >> 4, PosY >> 4);

        // decelerate 
        if (SpdY >= 0) {
            if (SpdY) SpdY--; 
        } else SpdY ++;
        if (SpdX >= 0) {
            if (SpdX) SpdX--; 
        } else SpdX ++;

        // Done processing, yield CPU and wait for start of next frame (VBlank)
        wait_vbl_done();
    }
}
