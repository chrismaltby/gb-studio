#include <gbdk/platform.h>
#include <gbdk/incbin.h>
#include <stdint.h>


// Include for using ISR_VECTOR()
#include <gb/isr.h>

void init_gfx(void);

// Wobble Look up Table
const uint8_t scanline_offsets_tbl[] = {0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3, 3, 2, 1, 0};
const uint8_t * scanline_offsets = scanline_offsets_tbl;

// Create the ISR Function
void scanline_isr(void) CRITICAL INTERRUPT {
    SCX_REG = scanline_offsets[LY_REG & (uint8_t)7];
}
// Then set the LCD Status (scanline) interrupt to call the ISR function
// directly without using the GBDK interrupt dispatcher
ISR_VECTOR(VECTOR_STAT, scanline_isr)

// Note:
//    The LCD STAT vector (@ref VECTOR_STAT) cannot be used
//    in the same program as `stdio.h` since they install
//    an ISR vector to the same location.


void main(void) {

    // Load the background image
    init_gfx();

    // Set up the interrupt and enable it
    STAT_REG = STATF_MODE00;
    set_interrupts(VBL_IFLAG | LCD_IFLAG);

    // Show the background
    SHOW_BKG;

    while (TRUE) {
        vsync();        
        scanline_offsets = &scanline_offsets_tbl[(uint8_t)(sys_time >> 2) & 0x07u];
    }
}



// ==== Below just loads the background graphics ====

// Some graphics of a game boy
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

void init_gfx(void) {
    // Load a single clear background tile at location 0x80 and clear/fill the map with it
    set_bkg_data(0x80u, 1u, blank_tile_data); // The first 0x80u here is the tile ID
    fill_bkg_rect(0u, 0u, DEVICE_SCREEN_BUFFER_WIDTH, DEVICE_SCREEN_BUFFER_HEIGHT, 0x80u);   // The last 0x80u here is the tile ID 

    // Load logo background tiles and map
    // They start at 0u
    set_bkg_data(0u, INCBIN_SIZE(logo_tiles_data) / TILE_BYTES, logo_tiles_data);
    set_bkg_tiles(LOGO_MAP_X, LOGO_MAP_Y,
                  LOGO_MAP_WIDTH, LOGO_MAP_HEIGHT,
                  logo_map);
}

