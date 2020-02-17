#include "Collision.h"
#include "DataManager.h"
#include "BankManager.h"

#define MAX_UINT16 0xFFFF

UBYTE TileAt(UINT16 x, UINT16 y)
{
    UBYTE tile;
    // Check tile outside of bounds
    if (x == MAX_UINT16 ||
        x == image_tile_width ||
        y == image_tile_height ||
        y == MAX_UINT16)
    {
        return TRUE;
    }
    PUSH_BANK(collision_bank);
    tile = (UBYTE) * (collision_ptr + (y * image_tile_width) + x);
    POP_BANK;
    return tile;
}
