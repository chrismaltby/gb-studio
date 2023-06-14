#include <gb/gb.h>
#include <stdint.h>
#include "sgb_border.h"

#include "border_data.h"

void main(void) {

    // Wait 4 frames
    // For SGB on PAL SNES this delay is required on startup, otherwise borders don't show up
    for (uint8_t i = 4; i != 0; i--) wait_vbl_done();

    DISPLAY_ON;
    set_sgb_border(border_chr, border_chr_size, border_map, border_map_size, border_pal, border_pal_size);
    while(1) {
        wait_vbl_done();
    }
}