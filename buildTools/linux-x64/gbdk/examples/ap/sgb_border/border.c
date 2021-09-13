#include <gb/gb.h>
#include <stdint.h>
#include "sgb_border.h"

#include "border_data.h"

void main(void) {
    DISPLAY_ON; 
    set_sgb_border(border_chr, border_chr_size, border_map, border_map_size, border_pal, border_pal_size);
    while(1) {
        wait_vbl_done();
    }
}