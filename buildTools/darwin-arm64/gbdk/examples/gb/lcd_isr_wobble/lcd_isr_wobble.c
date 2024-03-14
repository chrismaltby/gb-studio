#include <gb/gb.h>
#include <stdint.h>
#include <stdio.h>

#include <gb/emu_debug.h>

const uint8_t scanline_offsets_tbl[] = {0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3, 3, 2, 1, 0};
const uint8_t * scanline_offsets = scanline_offsets_tbl;

void scanline_isr(void) {
    SCX_REG = scanline_offsets[(uint8_t)(LY_REG & 0x07u)];
}


void main(void) {
    printf("This is\na wobble\ntest\nfor DMG\n|\n|\n|\n|\n|");
    
    CRITICAL {
        STAT_REG = STATF_MODE00;
        add_LCD(scanline_isr);
	add_LCD(nowait_int_handler);
    }
    set_interrupts(IE_REG | LCD_IFLAG);

    while (TRUE) {
        vsync();        
        scanline_offsets = scanline_offsets_tbl + ((sys_time >> 2) & 0x07u);
    }
}