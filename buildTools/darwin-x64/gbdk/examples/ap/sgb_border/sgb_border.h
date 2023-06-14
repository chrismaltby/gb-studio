#ifndef __SGB_BORDER_H_INCLUDE
#define __SGB_BORDER_H_INCLUDE

#include <gb/gb.h>
#include <stdint.h>

#define SNES_RGB(R,G,B) (uint16_t)((B) << 10 | (G) << 5 | (R))

/** sets SGB border

    When using the SGB with a PAL SNES, a delay should be added
    just after program startup such as:

    \code{.c}
    // Wait 4 frames
    // For PAL SNES this delay is required on startup
    for (uint8_t i = 4; i != 0; i--) wait_vbl_done();
    \endcode
*/
void set_sgb_border(unsigned char * tiledata, size_t tiledata_size,
                    unsigned char * tilemap, size_t tilemap_size,
                    unsigned char * palette, size_t palette_size);

#endif