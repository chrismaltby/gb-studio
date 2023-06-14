#include <gb/gb.h>
#include <stdint.h>
#include <stdio.h>

#include <gb/emu_debug.h>

const uint8_t scanline_offsets_tbl[] = {0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3, 3, 2, 1, 0};
const uint8_t * scanline_offsets = scanline_offsets_tbl;

#define SCROLL_POS 15
#define SCROLL_POS_PIX_START (SCROLL_POS * 8) - 1
#define SCROLL_POS_PIX_END ((SCROLL_POS + 1) * 8) - 1

uint8_t scroller_x = 0;

void scanline_isr() {
    switch (LYC_REG) {
        case 0: 
            SCX_REG = 0;
            LYC_REG = SCROLL_POS_PIX_START;
            break;
        case SCROLL_POS_PIX_START:
            SCX_REG = scroller_x;
            LYC_REG = SCROLL_POS_PIX_END;
            break;
        case SCROLL_POS_PIX_END:
            SCX_REG = LYC_REG = 0;
            break;
    }
}

const uint8_t scroller_text[] = "This is a text scroller demo for GBDK-2020. You can use ideas, that are "\
"shown in this demo, to make different parallax effects, scrolling of tilemaps which are larger than 32x32 "\
"tiles and TEXT SCROLLERS, of course! Need to write something else to make this text longer than 256 characters. "\
"The quick red fox jumps over the lazy brown dog. 0123456789.          ";

const uint8_t * scroller_next_char = scroller_text;
uint8_t * scroller_vram_addr;
uint16_t base, limit;

void main() {
    printf("Scrolling %d chars", sizeof(scroller_text) - 1);
    
    CRITICAL {
        STAT_REG |= STATF_LYC; LYC_REG = 0;
        add_LCD(scanline_isr);
    }
    set_interrupts(VBL_IFLAG | LCD_IFLAG);

    scroller_vram_addr = get_bkg_xy_addr(20, SCROLL_POS);
    set_vram_byte(scroller_vram_addr, *scroller_next_char - 0x20);
    
    base = (uint16_t) scroller_vram_addr & 0xffe0;
    limit = base + 0x20;
    
    while (1) {
        scroller_x++;
        if ((scroller_x & 0x07) == 0) {
            // next letter
            scroller_next_char++;
            if (*scroller_next_char == 0) scroller_next_char = scroller_text;
            
            // next vram position
            scroller_vram_addr++;
            if (scroller_vram_addr == (uint8_t *)limit) scroller_vram_addr = (uint8_t *)base;
            
            // put next char
            set_vram_byte(scroller_vram_addr, *scroller_next_char - 0x20);
        }
        wait_vbl_done();        
    }
}