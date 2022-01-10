/** @file sms/metasprites.h
    
    # Metasprite support

    A metasprite is a larger sprite made up from a 
    collection of smaller individual hardware sprites.
    Different frames of the same metasprites can share
    tile data.

    The api supports metasprites in both 
    @ref SPRITES_8x8 and @ref SPRITES_8x16 mode. If
    8x16 mode is used then the height of the metasprite
    must be a multiple of 16.

    The origin (pivot) for the metasprite is not required
    to be in the upper left-hand corner as with regular
    hardware sprites.

    Use the @ref utility_png2asset tool to convert single
    or multiple frames of graphics into metasprite
    structured data for use with the ...metasprite...()
    functions.

    # Metasprites composed of variable numbers of sprites

    When using png2asset, it's common for the output of
    different frames to be composed of different numbers
    of hardware sprites (since it's trying to create each
    frame as efficiently as possible). Due to that, it's
    good practice to clear out (hide) unused sprites in the
    shadow_OAM that have been set by previous frames.
*/

#ifndef _METASPRITES_H_INCLUDE
#define _METASPRITES_H_INCLUDE

#include <sms/hardware.h>
#include <types.h>
#include <stdint.h>

/** Metasprite sub-item structure
    @param dy        (int8_t)  Y coordinate of the sprite relative to the metasprite origin (pivot)
    @param dx        (int8_t)  X coordinate of the sprite relative to the metasprite origin (pivot)
    @param dtile     (uint8_t) Start tile relative to the metasprites own set of tiles

    Metasprites are built from multiple metasprite_t items (one for each sub-sprite)
    and a pool of tiles they reference. If a metasprite has multiple frames then each
    frame will be built from some number of metasprite_t items (which may vary based
    on how many sprites are required for that particular frame).

    A metasprite frame is terminated with a {metasprite_end} entry.
*/
typedef struct metasprite_t {
    int8_t  dy, dx;
    uint8_t dtile;
} metasprite_t;

#define metasprite_end -128 
#define METASPR_ITEM(dy,dx,dt,a) {(dy),(dx),(dt)}
#define METASPR_TERM {metasprite_end}

extern const void * __current_metasprite;
extern uint8_t __current_base_tile;
extern uint8_t __render_shadow_OAM;


static uint8_t __move_metasprite(uint8_t id, uint8_t x, uint8_t y) Z88DK_CALLEE PRESERVES_REGS(iyh, iyl);
static void __hide_metasprite(uint8_t id) Z88DK_FASTCALL PRESERVES_REGS(iyh, iyl);

/**
 * Hides all hardware sprites in range from <= X < to
 * @param from start OAM index
 * @param to finish OAM index
 */ 
void hide_sprites_range(UINT8 from, UINT8 to) Z88DK_CALLEE PRESERVES_REGS(iyh, iyl);

/** Moves metasprite to the absolute position x and y

    @param metasprite   Pointer to the first struct of the metasprite (for the desired frame)
    @param base_tile    Number of the first tile where the metasprite's tiles start
    @param base_sprite  Number of the first hardware sprite to be used by the metasprite    
    @param x            Absolute x coordinate of the sprite
    @param y            Absolute y coordinate of the sprite

    Moves __metasprite__ to the absolute position __x__ and __y__
    (with __no flip__ on the X or Y axis). Hardware sprites are 
    allocated starting from __base_sprite__, using tiles 
    starting from __base_tile__.

    Sets:
    \li __current_metasprite = metasprite; 
    \li __current_base_tile = base_tile;

    @return Number of hardware sprites used to draw this metasprite
 */
inline uint8_t move_metasprite(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_sprite, uint8_t x, uint8_t y) {
    __current_metasprite = metasprite; 
    __current_base_tile = base_tile;
    return __move_metasprite(base_sprite, x, y); 
}

/** Hides a metasprite from the screen
 
    @param metasprite    Pointer to first struct of the desired metasprite frame
    @param base_sprite   Number of hardware sprite to start with

    Sets:
    \li __current_metasprite = metasprite;

 **/
inline void hide_metasprite(const metasprite_t * metasprite, uint8_t base_sprite) {
    __current_metasprite = metasprite; 
    __hide_metasprite(base_sprite);
}

#endif
