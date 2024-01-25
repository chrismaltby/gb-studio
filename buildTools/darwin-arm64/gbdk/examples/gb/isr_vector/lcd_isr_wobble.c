#include <gb/gb.h>
#include <gb/isr.h>

const uint8_t scanline_offsets_tbl[] = {0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3, 3, 2, 1, 0};
const uint8_t * scanline_offsets = scanline_offsets_tbl;

void scanline_isr() CRITICAL INTERRUPT {
    SCX_REG = scanline_offsets[LY_REG & (uint8_t)7];
}
ISR_VECTOR(VECTOR_STAT, scanline_isr)

void main() {
    LCDC_REG |= LCDCF_BG8000;
    STAT_REG = STATF_MODE00;
    set_interrupts(VBL_IFLAG | LCD_IFLAG);
    SHOW_BKG;

    while (TRUE) {
        wait_vbl_done();        
        scanline_offsets = &scanline_offsets_tbl[(uint8_t)(sys_time >> 2) & 0x07u];
    }
}