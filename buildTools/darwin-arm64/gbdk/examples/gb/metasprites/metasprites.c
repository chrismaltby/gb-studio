#include <stdint.h>

#include <gbdk/platform.h>
#include <gbdk/metasprites.h>

#include "sprite.h"

const unsigned char pattern[] = {0x80,0x80,0x40,0x40,0x20,0x20,0x10,0x10,0x08,0x08,0x04,0x04,0x02,0x02,0x01,0x01};

joypads_t joypads;

#define ACC_X 1
#define ACC_Y 2

// The metasprite will be built starting with hardware sprite zero (the first)
#define SPR_NUM_START 0

// Metasprite tiles are loaded into VRAM starting at tile number 0 
#define TILE_NUM_START 0

// sprite coords
uint16_t PosX, PosY;
int16_t SpdX, SpdY;
uint8_t PosF;
uint8_t hide, jitter;
uint8_t idx, rot;

// main funxction
void main(void) {
    // init palettes
    BGP_REG = OBP0_REG = 0xE4;
    OBP1_REG = 0xE0;

	// Fill the screen background with a single tile pattern
    fill_bkg_rect(0, 0, 20, 18, 0);
    set_bkg_data(0, 1, pattern);

    // Load metasprite tile data into VRAM
    set_sprite_data(TILE_NUM_START, sizeof(sprite_tiles) >> 4, sprite_tiles);

    // show bkg and sprites
    SHOW_BKG; SHOW_SPRITES;

	// Check what size hardware sprite the metasprite is using (from sprite.h)
	#if sprite_TILE_H == 16
		SPRITES_8x16;
	#else
		SPRITES_8x8;
	#endif

    // init 1 joypad
    joypad_init(1, &joypads);
 
    // Set initial position, zero out speed
    PosX = PosY = 64 << 4;
    SpdX = SpdY = 0;

    hide = 0; jitter = 0; idx = 0; rot = 0;

    while(1) {        
        // poll joypads
        joypad_ex(&joypads);
        
        PosF = 0;
        // game object
        if (joypads.joy0 & J_UP) {
            SpdY -= 2;
            if (SpdY < -32) SpdY = -32;
            PosF |= ACC_Y;
        } else if (joypads.joy0 & J_DOWN) {
            SpdY += 2;
            if (SpdY > 32) SpdY = 32;
            PosF |= ACC_Y;
        }

        if (joypads.joy0 & J_LEFT) {
            SpdX -= 2;
            if (SpdX < -32) SpdX = -32;
            PosF |= ACC_X;
        } else if (joypads.joy0 & J_RIGHT) {
            SpdX += 2;
            if (SpdX > 32) SpdX = 32;
            PosF |= ACC_X;
        }


        // Press A button to show/hide metasprite
        if ((joypads.joy0 & J_A) && (!jitter)) {
            hide = (!hide);
            jitter = 20;
        }

        // Press B button to cycle through metasprite animations
        if ((joypads.joy0 & J_B) && (!jitter) && (!hide)) {
            idx++; if (idx >= (sizeof(sprite_metasprites) >> 1)) idx = 0;
            jitter = 10;
        }

        // Press SELECT button to cycle metasprite through Normal/Flip-Y/Flip-XY/Flip-X
        if ((joypads.joy0 & J_SELECT) && (!jitter) && (!hide)) {
            rot++; rot &= 3;
            jitter = 20;
        }

        // Hide/Animate/Flip input throttling
        if (jitter) jitter--;

        PosX += SpdX, PosY += SpdY; 

        uint8_t hiwater = 0;
	
		// NOTE: In a real game it would be better to only call the move_metasprite..()
        //       functions if something changed (such as movement or rotation). That
		//	     reduces CPU usage on frames that don't need updates.
		//
		// In this example they are called every frame to simplify the example code

        // Hide the metasprite or move it & apply any rotation settings
        if (hide)
            hide_metasprite(sprite_metasprites[idx], SPR_NUM_START);
        else
            switch (rot) {
                case 0: hiwater = move_metasprite       (sprite_metasprites[idx], TILE_NUM_START, SPR_NUM_START, (PosX >> 4), (PosY >> 4)); break;
                case 1: hiwater = move_metasprite_hflip (sprite_metasprites[idx], TILE_NUM_START, SPR_NUM_START, (PosX >> 4), (PosY >> 4)); break;
                case 2: hiwater = move_metasprite_hvflip(sprite_metasprites[idx], TILE_NUM_START, SPR_NUM_START, (PosX >> 4), (PosY >> 4)); break;
                case 3: hiwater = move_metasprite_vflip (sprite_metasprites[idx], TILE_NUM_START, SPR_NUM_START, (PosX >> 4), (PosY >> 4)); break;
            };

        // Hide rest of the hardware sprites, because amount of sprites differ between animation frames.
	hide_sprites_range(hiwater, 40);        

        // Y Axis: update velocity (reduce speed) if no U/D button pressed
        if (!(PosF & ACC_Y)) {
            if (SpdY != 0) {
                if (SpdY > 0) SpdY--;
                else SpdY ++;
            }
        }

        // X Axis: update velocity (reduce speed) if no L/R button pressed
        if (!(PosF & ACC_X)) {
            if (SpdX != 0) {
                if (SpdX > 0) SpdX--;
                else SpdX ++;
            }
        }


        // wait for VBlank to slow down everything and reduce cpu use when idle
        wait_vbl_done();
    }
}

