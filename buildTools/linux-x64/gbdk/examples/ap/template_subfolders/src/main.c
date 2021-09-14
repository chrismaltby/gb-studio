#include <gb/gb.h>
#include <stdint.h>
#include "../res/dungeon_map.h"
#include "../res/dungeon_tiles.h"


void init_gfx() {
    // Load Background tiles and then map
    set_bkg_data(0, 79u, dungeon_tiles);
    set_bkg_tiles(0, 0, 32u, 32u, dungeon_mapPLN0);

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
