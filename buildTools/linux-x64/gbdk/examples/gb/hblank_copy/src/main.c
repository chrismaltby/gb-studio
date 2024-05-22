#include <gbdk/platform.h>
#include <gb/hblankcpy.h>

#include <stdint.h>
#include <stdbool.h>

#include "data.h"

// X and Y posisions are centered
#define POSITION_X ((DEVICE_SCREEN_WIDTH - MAP_WIDTH) >> 1)
#define POSITION_Y ((DEVICE_SCREEN_HEIGHT - MAP_HEIGHT) >> 1)

const frame_desc_t * current_frame = frames;        // pointer to the current animation frame

void LCD_ISR(void) {
    static bool odd_even_frame = false;
    uint8_t _save = CURRENT_BANK;
    SWITCH_ROM(current_frame->bank);

    if (odd_even_frame = !odd_even_frame) {
        LCDC_REG &= ~LCDCF_BG8000;
        hblank_copy_destination = _VRAM8000;
        hblank_copy_vram(current_frame->tiles, MAP_WIDTH * MAP_HEIGHT);
    } else {
        LCDC_REG |= LCDCF_BG8000;
        hblank_copy_destination = _VRAM9000;
        hblank_copy_vram(current_frame->tiles, MAP_WIDTH * MAP_HEIGHT);
    }
    SWITCH_ROM(_save);
}

uint8_t joy = 0, old_joy;
inline void PROCESS_INPUT(void) {
    old_joy = joy, joy = joypad();
}
inline uint8_t KEY_PRESSED(uint8_t key) {
    return ((joy & ~old_joy) & key);
}

bool animation = true;                              // animation enabled
bool animation_direction = true;                    // animate forward or back
uint8_t animation_speed = 1, animation_counter = 0; // animation speed and counter

void main(void) {
    DISPLAY_OFF;

    CRITICAL {
        LYC_REG = 0, STAT_REG |= STATF_LYC;
        add_LCD(LCD_ISR);
    }
    set_interrupts(IE_REG | LCD_IFLAG);

    // set up palette
    BGP_REG = DMG_PALETTE(DMG_WHITE, DMG_LITE_GRAY, DMG_DARK_GRAY, DMG_BLACK);

    // clear screen and set tile map
    fill_bkg_rect(0, 0, 32, 32, 0);
    uint8_t v = 0;
    for (uint8_t y = POSITION_Y; y != POSITION_Y + MAP_HEIGHT; y++) {
        uint8_t * addr = set_bkg_tile_xy(POSITION_X, y, v++);
        for (uint8_t x = 0; x != MAP_WIDTH - 1; x++) set_vram_byte(++addr, v++);
    }

    SHOW_BKG;
    DISPLAY_ON;

    bool step_animation = false;

    while (true) {
        vsync();
        PROCESS_INPUT();
        // stepping through animation frames with LEFT/RIGHT
        if (joy & J_LEFT) {
            animation = false;
            animation_direction = false;
            step_animation = true;
        } else if (joy & J_RIGHT) {
            animation = false;
            animation_direction = true;
            step_animation = true;
        }
        // change the animation speed with UP/DOWN
        if (KEY_PRESSED(J_UP)) {
            if (animation_speed) animation_speed--;
        } else if (KEY_PRESSED(J_DOWN)) {
            if (++animation_speed > 10) animation_speed = 10;
        }
        // start/stop animation with START
        if (KEY_PRESSED(J_START)) animation  = !animation;

        // process animation
        if ((step_animation) || ((animation) && (++animation_counter > animation_speed))) {
            animation_counter = 0;
            if (animation_direction) CRITICAL {
                if (++current_frame == (frames + ANIMATION_FRAME_COUNT)) current_frame = frames;
            } else CRITICAL {
                if (--current_frame < frames) current_frame = frames + (ANIMATION_FRAME_COUNT - 1);
            }
            step_animation = false;
        }
    }
}