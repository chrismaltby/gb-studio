#ifndef __SGBBORDER_H_INCLUDE
#define __SGBBORDER_H_INCLUDE

#include <gb/gb.h>

#define SNES_RGB(R,G,B) (UINT16)((B) << 10 | (G) << 5 | (R))

/** sets SGB border */

void set_sgb_border(unsigned char * tiledata, size_t tiledata_size, UBYTE tiledata_bank,
                    unsigned char * tilemap,  size_t tilemap_size,  UBYTE tilemap_bank,
                    unsigned char * palette,  size_t palette_size,  UBYTE palette_bank) BANKED;

#endif