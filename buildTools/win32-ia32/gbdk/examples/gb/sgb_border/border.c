#include <gb/gb.h>
#include <stdint.h>
#include "sgb_border.h"

#include "border_data.h"

void main(void) {
    DISPLAY_ON; 
    set_sgb_border(border_data_tiles, sizeof(border_data_tiles), border_data_map, sizeof(border_data_map), border_data_palettes, sizeof(border_data_palettes));
    while(1) {
        wait_vbl_done();
    }
}