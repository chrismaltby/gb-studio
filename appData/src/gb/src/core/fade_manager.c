#pragma bank 1

#ifdef CGB
    #include <gb/gb.h>
    #include <gb/cgb.h>
    #include <string.h>
#endif

#include "fade_manager.h"
#ifdef CGB
    #include "palette.h"
#endif
#include "data/data_bootstrap.h"

#define FADED_OUT_FRAME 0
#define FADED_IN_FRAME 5

UBYTE fade_running;
UBYTE fade_frames_per_step;
UBYTE fade_black = 0;
UBYTE fade_timer = 0;

const UBYTE fade_speeds[] = {0x0, 0x1, 0x3, 0x7, 0xF, 0x1F, 0x3F};

static UBYTE fade_frame;
static FADE_DIRECTION fade_direction;

static const UBYTE obj0_fade_vals[] = {0x00, 0x00, 0x40, 0x80, 0x90, 0xD0, 0xD0};
static const UBYTE obj1_fade_vals[] = {0x00, 0x00, 0x40, 0x90, 0xA4, 0xE4, 0xE4};
static const UBYTE bgp_fade_vals[] =  {0x00, 0x00, 0x40, 0x90, 0xA4, 0xE4, 0xE4};

static const UBYTE obj0_fade_black_vals[] = {0xFF, 0xFF, 0xF8, 0xE4, 0xD4, 0xD0, 0xD0};
static const UBYTE obj1_fade_black_vals[] = {0xFF, 0xFF, 0xFE, 0xE9, 0xE5, 0xE4, 0xE4};
static const UBYTE bgp_fade_black_vals[] = {0xFF, 0xFF, 0xFE, 0xE9, 0xE5, 0xE4, 0xE4};

#ifdef CGB
static UWORD UpdateColorBlack(UINT8 i, UWORD col) {
    return RGB2((PAL_RED(col) >> 5 - i),  (PAL_GREEN(col) >> 5 - i), (PAL_BLUE(col) >> 5 - i));
}

static void ApplyPaletteChangeColor(UBYTE index) {
    UINT8 c;
    UWORD paletteWhite;
    UWORD* col = BkgPalette;

    if (index == 5) {
        set_bkg_palette(0, 8, BkgPalette);
        set_sprite_palette(0, 8, SprPalette);
        return;
    }

    if (fade_style) {
        for (c = 0; c != 32; ++c, ++col) {
            BkgPaletteBuffer[c] = UpdateColorBlack(index, *col);
        }
        col = SprPalette;
        for (c = 0; c != 32; c++, ++col) {
            SprPaletteBuffer[c] = UpdateColorBlack(index, *col);
        }
    } else { 
        paletteWhite = RGB2((0x1F >> index), (0x1F >> index), (0x1F >> index));
        for (c = 0; c != 32; ++c, ++col) {
            BkgPaletteBuffer[c] = (UWORD)*col | paletteWhite;
        }
        col = SprPalette;
        for (c = 0; c != 32; ++c, ++col) {
            SprPaletteBuffer[c] = (UWORD)*col | paletteWhite;
        }
    }

    set_bkg_palette(0, 8, BkgPaletteBuffer);
    set_sprite_palette(0, 8, SprPaletteBuffer);
}
#endif

static void ApplyPaletteChangeDMG(UBYTE index) {
    if (!fade_style) {
        OBP0_REG = obj0_fade_vals[index];
        OBP1_REG = obj1_fade_vals[index];
        BGP_REG = bgp_fade_vals[index];
    }
    else {
        OBP0_REG = obj0_fade_black_vals[index];
        OBP1_REG = obj1_fade_black_vals[index];
        BGP_REG = bgp_fade_black_vals[index];
    }
}

void fade_init() __banked {
    fade_frames_per_step = fade_speeds[2];
    fade_timer = FADED_OUT_FRAME;
    fade_running = FALSE;
#ifdef CGB
    if (_cpu == CGB_TYPE) {
        ApplyPaletteChangeColor(fade_timer);
    } else
#endif
        ApplyPaletteChangeDMG(fade_timer);    
}

void fade_in() __banked {
    if (fade_timer == FADED_IN_FRAME) {
        return;
    }
    fade_frame = 0;
    fade_direction = FADE_IN;
    fade_running = TRUE;
    fade_timer = FADED_OUT_FRAME;
#ifdef CGB
    if (_cpu == CGB_TYPE) {
        ApplyPaletteChangeColor(fade_timer);
    } else
#endif
        ApplyPaletteChangeDMG(fade_timer);
}

void fade_out() __banked {
    if (fade_timer == FADED_OUT_FRAME) {
        return;
    }    
    fade_frame = 0;
    fade_direction = FADE_OUT;
    fade_running = TRUE;
    fade_timer = FADED_IN_FRAME;
#ifdef CGB
    if (_cpu == CGB_TYPE) {
        ApplyPaletteChangeColor(fade_timer);
    } else
#endif
        ApplyPaletteChangeDMG(fade_timer);
}

void fade_update() __banked {
    if (fade_running) {
        if ((fade_frame & fade_frames_per_step) == 0) {
            if (fade_direction == FADE_IN) {
                fade_timer++;
                if (fade_timer == FADED_IN_FRAME) {
                    fade_running = FALSE;
                }
            } else {
                fade_timer--;
                if (fade_timer == FADED_OUT_FRAME) {
                    fade_running = FALSE;
                }
            }
#ifdef CGB
            if (_cpu == CGB_TYPE) {
                ApplyPaletteChangeColor(fade_timer);
            } else
#endif
                ApplyPaletteChangeDMG(fade_timer);
        }
        fade_frame++;
    }
}

void fade_applypalettechange() __banked {
#ifdef CGB
    if (_cpu == CGB_TYPE) {
        ApplyPaletteChangeColor(fade_timer);
    } else
#endif
        ApplyPaletteChangeDMG(fade_timer);
}

void fade_setspeed(UBYTE speed) __banked {
    fade_frames_per_step = fade_speeds[speed];
}

void fade_in_modal() __banked {
    DISPLAY_ON;
    fade_in();
    while (fade_isfading()) {
        wait_vbl_done();
        fade_update();
    }
}

void fade_out_modal() __banked {
    fade_out();
    while (fade_isfading()) {
        wait_vbl_done();
        fade_update();
    }
    if (!fade_style) DISPLAY_OFF;
}