#include <gbdk/platform.h>
#include <gb/sgb.h>
#include <stdio.h>

// In the Makefile the "-Wm-ys" flag is added to LCC when compiling
// to enable optional Super Game Boy support in the ROM Cartridge header

void main(void)
{
    // Wait 4 frames
    // For PAL SNES(SGB) this delay is required on startup
    for (uint8_t i = 4; i != 0; i--)
        vsync();

    DISPLAY_ON;

    // sgb_check() is slow, so it's better to call it once and save the result to test with
    uint8_t is_SGB = sgb_check();

    if (is_SGB) {
        // Super Game Boys
        if      (_cpu == DMG_TYPE) printf("This is a SGB 1!");
        else if (_cpu == MGB_TYPE) printf("This is a SGB 2!");
    }
    else if (_cpu == DMG_TYPE) printf("This is a DMG! (OG Game Boy)");
    else if (_cpu == MGB_TYPE) printf("This is a MGB! (Game Boy Pocket / Light)");
    else if (_cpu == CGB_TYPE) {
        // For Game Boy Color also check if it is a GBA in CGB mode
        if (_is_GBA == GBA_DETECTED) printf("This is a GBA in CGB mode!");
        else         printf("This is a CGB! (Game Boy Color)");
    }

    while(1)
    {
        vsync();
    }
}

