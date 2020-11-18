#include <gb/gb.h>
#include "sgb_border.h"

#include "border.h"

void main(void) {
    DISPLAY_ON; 
    set_sgb_border(border_chr, sizeof(border_chr), border_map, sizeof(border_map), border_pal, sizeof(border_pal));
    while(1) {
        wait_vbl_done();
    }
}