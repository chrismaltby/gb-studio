#ifndef COLLISIONS_H
#define COLLISIONS_H

#include <gb/gb.h>

#define OUT_OF_BOUNDS 255

#define COLLISION_TOP 0x1
#define COLLISION_BOTTOM 0x2
#define COLLISION_LEFT 0x4
#define COLLISION_RIGHT 0x8
#define COLLISION_ALL 0xF
#define TILE_PROP_LADDER 0x10

/**
 * Return collision tile value at given tile x,y coordinate.
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return Tile value, 0 if no collisions, 255 if out of bounds
 */
UBYTE TileAt(UINT16 tx, UINT16 ty);

UBYTE TileAt2x1(UINT16 tx, UINT16 ty);

UBYTE TileAt2x2(UINT16 tx, UINT16 ty);

#endif
