#include "Collision.h"
#include "DataManager.h"
#include "BankManager.h"

UBYTE TileAt(UINT16 x, UINT16 y)
{
    UBYTE tile;
    PUSH_BANK(collision_bank);
    tile = (UBYTE) *(collision_ptr + (y * image_tile_width) + x);
    POP_BANK;
    return tile;
}
