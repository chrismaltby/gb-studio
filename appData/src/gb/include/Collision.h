#ifndef COLLISIONS_H
#define COLLISIONS_H

#include <gb/gb.h>

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
 * @return Tile value, 0 if no collisions, COLLISION_ALL if out of bounds
 */
UBYTE TileAt(UBYTE tx, UBYTE ty);

/**
 * Return collision tile value at given tile x,y coordinate. (check 2 tiles wide, 1 tile high)
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return Tile value, 0 if no collisions, COLLISION_ALL if out of bounds
 */
UBYTE TileAt2x1(UBYTE tx, UBYTE ty);

/**
 * Return collision tile value at given tile x,y coordinate. (check 2 tiles wide, 2 tiles high)
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return Tile value, 0 if no collisions, COLLISION_ALL if out of bounds
 */
UBYTE TileAt2x2(UBYTE tx, UBYTE ty);

#endif
