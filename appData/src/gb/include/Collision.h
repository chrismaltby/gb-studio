#ifndef COLLISIONS_H
#define COLLISIONS_H

#include <gb/gb.h>

#define OUT_OF_BOUNDS 255
#define TILE_SOLID 1
#define TILE_PLATFORM 2

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
