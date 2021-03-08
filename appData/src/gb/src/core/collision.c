#include "collision.h"

#define MAX_UINT8 0xFF

UBYTE tile_at_2x2(UBYTE tx, UBYTE ty) {
    UBYTE _save = _current_bank;
    UBYTE* collision_ptr_tmp;
    UBYTE tile;

    // Check tile outside of bounds
    if (tx == MAX_UINT8 || tx == image_tile_width || ty == image_tile_height ||
        ty == MAX_UINT8) {
        return COLLISION_ALL;
    }

    // Get y_offset with ty * width. Then add tx + collision_ptr offset
    collision_ptr_tmp = ty * (UINT16)image_tile_width + tx + collision_ptr;

    SWITCH_ROM_MBC1(collision_bank);
    tile = (UBYTE) * (collision_ptr_tmp);
    if (!tile) {
        tile = (UBYTE) * (collision_ptr_tmp + 1U);
        if (!tile) {
            // add 1 more y_offset
            collision_ptr_tmp = collision_ptr_tmp + (UINT16)image_tile_width;
            tile = (UBYTE) * (collision_ptr_tmp);
            if (!tile) {
                tile = (UBYTE) * (collision_ptr_tmp + 1U);
            }
        }
    } 
    SWITCH_ROM_MBC1(_save);

    return tile;
}
