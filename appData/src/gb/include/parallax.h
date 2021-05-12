#ifndef PARALLAX_H_INCLUDE
#define PARALLAX_H_INCLUDE

#include <gb/gb.h>

#define PARALLAX_MAX_HEIGHT 20
#define PARALLAX_STEP(start, end, shift)  {0, (end)?(((end) << 3) - 1):0, (shift), (start), (end)?((end)-(start)):(PARALLAX_MAX_HEIGHT-(start))}

typedef struct parallax_row_t {
    UBYTE scx;      // x scroll position for current slice
    UBYTE next_y;   // y position of next LYC
    INT8  shift;    // shift of scroll position within the world
    UBYTE start_tile;
    UBYTE tile_height;
    UBYTE shadow_scx;
} parallax_row_t;

extern parallax_row_t parallax_rows[3];
extern parallax_row_t * parallax_row;

void parallax_init() __banked;
void parallax_LCD_isr() __nonbanked;

#endif