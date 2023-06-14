#include <gbdk/platform.h>

#include "GBDK_2020_logo.h"

void main() {
    DISPLAY_OFF;
    fill_bkg_rect(0, 0, DEVICE_SCREEN_WIDTH, DEVICE_SCREEN_HEIGHT, 0);
#if defined(SYSTEM_SEGA)
    set_palette(0, GBDK_2020_logo_PALETTE_COUNT, GBDK_2020_logo_palettes);
#elif defined(SYSTEM_CGB)
    if (_cpu == CGB_TYPE) {
        set_bkg_palette(BKGF_CGB_PAL0, GBDK_2020_logo_PALETTE_COUNT, GBDK_2020_logo_palettes);
    }
#elif defined(SYSTEM_NES)
    set_bkg_palette(0, GBDK_2020_logo_PALETTE_COUNT, GBDK_2020_logo_palettes);
#endif 
    set_native_tile_data(0, GBDK_2020_logo_TILE_COUNT, GBDK_2020_logo_tiles);
#if defined(SYSTEM_CGB)
    if (_cpu == CGB_TYPE) {
        VBK_REG = VBK_ATTRIBUTES;
        set_tile_map((DEVICE_SCREEN_WIDTH - (GBDK_2020_logo_WIDTH >> 3)) >> 1, 
                     (DEVICE_SCREEN_HEIGHT - (GBDK_2020_logo_HEIGHT >> 3)) >> 1, 
                     GBDK_2020_logo_WIDTH >> 3, 
                     GBDK_2020_logo_HEIGHT >> 3, 
                     GBDK_2020_logo_map_attributes);
        VBK_REG = VBK_TILES;
    }
#elif defined(SYSTEM_NES)
    // Make sure attribute coordinates are rounded to 2
    set_bkg_attributes((((DEVICE_SCREEN_WIDTH - (GBDK_2020_logo_WIDTH >> 3)) >> 1) & 0xFE) >> 1, 
                       (((DEVICE_SCREEN_HEIGHT - (GBDK_2020_logo_HEIGHT >> 3)) >> 1) & 0xFE) >> 1, 
                       GBDK_2020_logo_MAP_ATTRIBUTES_WIDTH, 
                       GBDK_2020_logo_MAP_ATTRIBUTES_HEIGHT, 
                       GBDK_2020_logo_map_attributes);
#endif
#if defined(SYSTEM_NES)
    // Make sure tile coordinates are rounded to 2, to match attribute table
    set_tile_map(((DEVICE_SCREEN_WIDTH - (GBDK_2020_logo_WIDTH >> 3)) >> 1) & 0xFE, 
                 ((DEVICE_SCREEN_HEIGHT - (GBDK_2020_logo_HEIGHT >> 3)) >> 1) & 0xFE, 
                 GBDK_2020_logo_WIDTH >> 3, 
                 GBDK_2020_logo_HEIGHT >> 3, 
                 GBDK_2020_logo_map);
#else
    set_tile_map((DEVICE_SCREEN_WIDTH - (GBDK_2020_logo_WIDTH >> 3)) >> 1, 
                 (DEVICE_SCREEN_HEIGHT - (GBDK_2020_logo_HEIGHT >> 3)) >> 1, 
                 GBDK_2020_logo_WIDTH >> 3, 
                 GBDK_2020_logo_HEIGHT >> 3, 
                 GBDK_2020_logo_map);
#endif
    SHOW_BKG;
    DISPLAY_ON;
}