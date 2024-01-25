#include <gbdk/platform.h>

#include "logo.h"

void main() {
    fill_bkg_rect(0,0,DEVICE_SCREEN_WIDTH, DEVICE_SCREEN_HEIGHT, 0);
#if defined(SYSTEM_SEGA)
    set_palette(0, 1, logo_palettes);
#elif defined(SYSTEM_CGB)
    if (_cpu == CGB_TYPE) {
        set_bkg_palette(0, 1, logo_palettes);
    }
#endif
    set_native_tile_data(0, logo_TILE_COUNT, logo_tiles);
#if defined(SYSTEM_CGB)
    if (_cpu == CGB_TYPE) {
        VBK_REG = 1;
        set_tile_map(0, 0, logo_WIDTH >> 3, logo_HEIGHT >> 3, logo_map_attributes);
        VBK_REG = 0;
    }
#endif
    set_tile_map(0, 0, logo_WIDTH >> 3, logo_HEIGHT >> 3, logo_map);
    SHOW_BKG;
}