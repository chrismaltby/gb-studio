#ifndef COLLISIONS_H
#define COLLISIONS_H

#include <gb/gb.h>

#include "math.h"
#include "bankdata.h"

#define COLLISION_TOP 0x1
#define COLLISION_BOTTOM 0x2
#define COLLISION_LEFT 0x4
#define COLLISION_RIGHT 0x8
#define COLLISION_ALL 0xF
#define COLLISION_X (COLLISION_LEFT | COLLISION_RIGHT)
#define COLLISION_Y (COLLISION_TOP | COLLISION_BOTTOM)
#define TILE_PROP_LADDER 0x10

typedef struct bounding_box_t {
    BYTE left, right, top, bottom;
} bounding_box_t;

extern UBYTE collision_bank;
extern unsigned char *collision_ptr;
extern UBYTE image_tile_width;
extern UBYTE image_tile_height;

/**
 * Check if point is within positioned bounding box.
 *
 * @param bb Pointer to bounding box
 * @param offset Pointer to position offset for bounding box (e.g Actor position)
 * @param point Pointer to position to look for within bounding box
 * @return Point is within bounding box
 */
inline UBYTE bb_contains(bounding_box_t *bb, upoint16_t *offset, upoint16_t *point) {
    if ((point->x < (offset->x >> 4) + bb->left) || 
        (point->x > (offset->x >> 4) + bb->right)) return FALSE;
    if ((point->y < (offset->y >> 4) + bb->top) || 
        (point->y > (offset->y >> 4) + bb->bottom)) return FALSE;
    return TRUE;
}

/**
 * Check if two positioned bounding boxes intersect.
 *
 * @param bb_a Pointer to bounding box A
 * @param offset_a Pointer to position offset for bounding box A
 * @param bb_b Pointer to bounding box B
 * @param offset_b Pointer to position offset for bounding box B
 * @return Positioned bounding boxes intersect
 */
inline UBYTE bb_intersects(bounding_box_t *bb_a, upoint16_t *offset_a, bounding_box_t *bb_b, upoint16_t *offset_b) {
    if (((offset_b->x >> 4) + bb_b->left   > (offset_a->x >> 4) + bb_a->right) ||
        ((offset_b->x >> 4) + bb_b->right  < (offset_a->x >> 4) + bb_a->left)) return FALSE;
    if (((offset_b->y >> 4) + bb_b->top    > (offset_a->y >> 4) + bb_a->bottom) ||
        ((offset_b->y >> 4) + bb_b->bottom < (offset_a->y >> 4) + bb_a->top)) return FALSE;
    return TRUE;
}

inline UBYTE bb_intersects_alt(bounding_box_t *bb_a, upoint16_t *offset_a, bounding_box_t *bb_b, upoint16_t *offset_b) {
    __asm__("ld b,b");
    BYTE ox = (((int16_t)(offset_b->x) - (offset_a->x)) >> 4) + 1;
    if (((ox + (bb_b->left - bb_a->right)) > 0) ||
        ((ox + (bb_b->right - bb_a->left)) < 0)) return FALSE;
    BYTE oy = (((int16_t)(offset_b->y) - (offset_a->y)) >> 4) + 1;
    if (((oy + (bb_b->top - bb_a->bottom)) > 0) ||
        ((oy + (bb_b->bottom - bb_a->top)) < 0)) return FALSE;
    __asm__("ld b,b");
    return TRUE;
}

/**
 * Return collision tile value at given tile x,y coordinate.
 *
 * @param tx Left tile
 * @param ty Top tile
 * @return Tile value, 0 if no collisions, COLLISION_ALL if out of bounds
 */
inline UBYTE tile_at(UBYTE tx, UBYTE ty) {
    if ((tx < image_tile_width) && (ty < image_tile_height)) 
        return ReadBankedUBYTE(collision_ptr + (ty * (UINT16)image_tile_width) + tx, collision_bank);
    return COLLISION_ALL;
}

#endif
