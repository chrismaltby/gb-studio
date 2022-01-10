#include <stdint.h>
#include <stdio.h>

#include <gbdk/platform.h>
#include <gbdk/font.h>
#include <gbdk/bcd.h>

BCD bcd  = MAKE_BCD(10203040);
BCD bcd2 = MAKE_BCD(05060708);
BCD bcd3 = MAKE_BCD(11111111);

uint8_t len = 0;
unsigned char buf[10];

void main() {
    font_init();
    font_set(font_load(font_spect));

    len = bcd2text(&bcd, 0x10, buf);
    set_bkg_tiles(5, 5, len, 1, buf);

    bcd_add(&bcd, &bcd2);

    len = bcd2text(&bcd, 0x10, buf);
    set_bkg_tiles(5, 6, len, 1, buf);

    bcd_sub(&bcd, &bcd3);

    len = bcd2text(&bcd, 0x10, buf);
    set_bkg_tiles(5, 7, len, 1, buf);

    uint2bcd(12345, &bcd);

    len = bcd2text(&bcd, 0x10, buf);
    set_bkg_tiles(5, 8, len, 1, buf);
}