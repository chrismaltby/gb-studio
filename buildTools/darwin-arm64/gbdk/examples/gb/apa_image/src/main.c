#include <gbdk/platform.h>
#include <gb/drawing.h>
#include <stdint.h>

#include <res/scenery.h>


#define CGB_BKG_PAL_0 0u
#define CGB_ONE_PAL   1u
const palette_color_t cgb_pal_black[] = {RGB_BLACK, RGB_BLACK, RGB_BLACK, RGB_BLACK};


void main(void)
{
    // Set the screen to black via the palettes to hide the image draw
    if (_cpu == CGB_TYPE) {
        set_bkg_palette(BKGF_CGB_PAL0, CGB_ONE_PAL, cgb_pal_black);
    } else {
        BGP_REG = DMG_PALETTE(DMG_BLACK, DMG_BLACK, DMG_BLACK, DMG_BLACK);
    }

    // Display the image
    // This will automatically switch to APA graphics mode
    // and install it's start and mid-frame ISRs.
    draw_image(scenery_tiles);
    SHOW_BKG;

    // Then load the palettes at the start of a new frame
    vsync();
    if (_cpu == CGB_TYPE) {
        set_bkg_palette(BKGF_CGB_PAL0, CGB_ONE_PAL, scenery_palettes);
    } else {
        BGP_REG = DMG_PALETTE(DMG_WHITE, DMG_LITE_GRAY, DMG_DARK_GRAY, DMG_BLACK);
    }


    // Loop forever
    while(1) {
        // Main processing goes here
        // Done processing, yield CPU and wait for start of next frame
        vsync();
    }
}
