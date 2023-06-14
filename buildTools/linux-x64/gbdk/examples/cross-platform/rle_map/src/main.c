#include <gbdk/platform.h>
#include <gbdk/incbin.h>
#include <stdbool.h>

#include <gbdk/rledecompress.h>

// The Tile data is not compressed
INCBIN(map_tiles, "res/map_tiles.bin")
INCBIN_EXTERN(map_tiles)

// The Map data is compressed using: gbcompress --alg=rle
// The map is ordered in sequential columns 18 tiles high
// so it's easy to load one entire screen column worth at a time.
#define MAP_DATA_HEIGHT 18
INCBIN(map_compressed, "res/map.bin.rle")
INCBIN_EXTERN(map_compressed)

uint8_t data[MAP_DATA_HEIGHT];  // Collision map buffer
uint8_t scrollpos = 0;              // Scroll position in pixels
uint8_t datapos = 0;                // x position in tiles inside the collision map

void main() {
    if(DEVICE_SCREEN_BUFFER_WIDTH == DEVICE_SCREEN_WIDTH)
    {
        // On platforms where screen buffer has no more space than physical screen,
        // the next map column will be written to the leftmost screen column.
        // So we blank the leftmost column to hide visual artifacts where possible.
        HIDE_LEFT_COLUMN;
    }
    SHOW_BKG;

    // Load Tile data
    set_bkg_data(0, INCBIN_SIZE(map_tiles) >> 4, map_tiles);

    // Initialize decompressor with Map data
    rle_init(map_compressed);

    // To get started, decompress and display a whole screen worth,
    // + 1 additional column in the direction being scrolled (to
    // avoid screen tearing from drawing a column right as it scrolls into view)
    for (uint8_t i = 0; (i != DEVICE_SCREEN_WIDTH + 1); i++) {
        rle_decompress(data, MAP_DATA_HEIGHT);
        // pre-process column here
        // ...

        // Draw current column starting at row 0
        set_bkg_tiles(i & (DEVICE_SCREEN_BUFFER_WIDTH-1), 0, 1, MAP_DATA_HEIGHT, data);
    }

    // main game loop
    datapos = 0;
    scrollpos = 1;
    while(TRUE) {

        wait_vbl_done();

        // Scroll one pixel to the right
        // (This should be done as close to wait_vbl_done and before
        // the map drawing below to avoid tearing at the top of the screen)
        scrollpos++;
        move_bkg(scrollpos, 0);

        // Once for every 8 pixels scrolled: draw a
        // new column of tiles on the right-most edge
        if ((scrollpos & 0x07u) == 0) {

            // Get hardware map tile X column from scroll position / 8
            // Then + 1 since there's a 1 tile column buffer on the right edge
            datapos = (scrollpos >> 3);
            uint8_t map_x_column = (datapos + DEVICE_SCREEN_WIDTH) & (DEVICE_SCREEN_BUFFER_WIDTH-1);

            // Decompress a column worth of data
            // If the end of compressed data is reached, reset decompression
            // and resume at the start (to make infinite scrolling)
            if (!rle_decompress(data, MAP_DATA_HEIGHT)) {
                rle_init(map_compressed);
                rle_decompress(data, MAP_DATA_HEIGHT);
            }
            // pre-process column here
            // ...

            // Display column
            set_bkg_tiles(map_x_column, 0, 1, MAP_DATA_HEIGHT, data);
        }
    }
}
