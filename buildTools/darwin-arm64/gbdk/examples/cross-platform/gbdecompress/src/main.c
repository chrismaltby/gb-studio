#include <gbdk/platform.h>
#include <gbdk/gbdecompress.h>

#include <stdint.h>

// Include graphics data
#include "monalisa_tiles_comp.h"
#include "monalisa_map.h"

// The map tiles were exported from GBTD with compression enabled
// using this updated version of GBTD: https://github.com/untoxa/GBTD_GBMB
// Size was 4096 bytes -> 3493 bytes

uint8_t buffer[4096];

void main(void)
{  
    // Decompress the map tiles into the background tile vram.
    //
    // Notice that the number of tiles isn't specified. The amount 
    // of data to decompress is embedded in the compressed data.
    //
    // Note: For non-compressed data the equivalent would be: set_bkg_data(0, 253u, monalisa_tiles)
    //
    set_bkg_data(0, gb_decompress(monalisa_tiles_comp, buffer) >> 4, buffer);

    // Now set the map and turn the background on
    set_bkg_tiles(0,0, monalisa_mapWidth, monalisa_mapHeight, monalisa_mapPLN0);
    SHOW_BKG;
    
    // Loop forever
    while(1) {

        // Main loop processing goes here

        // Done processing, yield CPU and wait for start of next frame
        wait_vbl_done();
    }
}




