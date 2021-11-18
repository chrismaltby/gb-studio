#include <gbdk/platform.h>
#include <gbdk/incbin.h>

#include <gbdk/rledecompress.h>

INCBIN(level1_tiles, "res/level1_tiles.bin")
INCBIN_EXTERN(level1_tiles)

INCBIN(level1_map, "res/level1_map.rle")
INCBIN_EXTERN(level1_map)

extern uint8_t sample_rle_data[];

#define DATA_HEIGHT 16

uint8_t data[32][DATA_HEIGHT];      // collision map buffer
uint8_t scrollpos = 0;              // scroll position in pixels
uint8_t datapos = 0;                // x position in tiles inside the collision map

void main() {    
    SHOW_BKG;

    set_bkg_data(0, INCBIN_SIZE(level1_tiles) >> 4, level1_tiles);

    rle_init(level1_map);           // initialize decompressor

    // decompress and display whole screen
    uint8_t * data_ptr = &data[0][0];
    for (uint8_t i = 0; (rle_decompress(data_ptr, DATA_HEIGHT)) && (i != DEVICE_SCREEN_WIDTH); i++) {
        // pre-process column here
        // ...

        // display column
        set_bkg_tiles(i, 2, 1, DATA_HEIGHT, data_ptr);
    }

    // main game loop
    datapos = scrollpos = 0;
    while(TRUE) {
        if ((scrollpos & 7) == 0) {
            datapos = (scrollpos >> 3);
            uint8_t x_pos = (datapos + DEVICE_SCREEN_WIDTH) & 31;
            // decompress and display column
            data_ptr = &data[x_pos][0];
            if (rle_decompress(data_ptr, DATA_HEIGHT)) {
                    // pre-process column here
                    // ...

                    // display column
                    set_bkg_tiles(x_pos, 2, 1, DATA_HEIGHT, data_ptr);
                    scrollpos++;
                    move_bkg(scrollpos, 0);
            } 
        } else {
            scrollpos++;
            move_bkg(scrollpos, 0);
        }
        wait_vbl_done();
    }
}
