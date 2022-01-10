#include <gbdk/platform.h>
#include <stdint.h>

#include <gbdk/incbin.h>

INCBIN(logo_tiles_data, "res/gbdk2020.bin") // Variable name to use, Path to file
INCBIN_EXTERN(logo_tiles_data)              // Extern declarations for binary data

INCBIN(logo_map, "res/gbdk2020_map.bin")
INCBIN_EXTERN(logo_map)

INCBIN(blank_tile_data, "res/blanktile.bin")
INCBIN_EXTERN(blank_tile_data)


#define TILE_BYTES 16 // 16 bytes per background tile


// Since incbin just includes a binary file (the logo tiles)
// a map needs to be created for them. For this example
// the tiles are non-deduplciated, so a array of incrementing
// values can be used. There are 84 tiles.
#define LOGO_MAP_WIDTH  7u
#define LOGO_MAP_HEIGHT 12u
#define LOGO_MAP_X      (20u - LOGO_MAP_WIDTH) / 2u  // Center on X axis
#define LOGO_MAP_Y      (18u - LOGO_MAP_HEIGHT) / 2u // Center on Y axis

void init_gfx() {
    // Load a single clear background tile at location 0x80 and clear/fill the map with it
    set_bkg_data(0x80u, 1u, blank_tile_data); // The first 0x80u here is the tile ID
    fill_bkg_rect(0u, 0u, DEVICE_SCREEN_WIDTH, DEVICE_SCREEN_HEIGHT, 0x80u);   // The last 0x80u here is the tile ID 

    // Load logo background tiles and map
    // They start at 0u
    set_bkg_data(0u, INCBIN_SIZE(logo_tiles_data) / TILE_BYTES, logo_tiles_data);
    set_bkg_tiles(LOGO_MAP_X, LOGO_MAP_Y,
                  LOGO_MAP_WIDTH, LOGO_MAP_HEIGHT,
                  logo_map);

    // Turn the background map on to make it visible
    SHOW_BKG;
}



void main(void)
{
    init_gfx();

    // Loop forever
    while(1) {

        // Game main loop processing goes here

        // Done processing, yield CPU and wait for start of next frame
        wait_vbl_done();
    }
}
