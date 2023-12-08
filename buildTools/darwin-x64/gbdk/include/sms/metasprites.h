/** @file sms/metasprites.h

    # Metasprite support

    A metasprite is a larger sprite made up from a
    collection of smaller individual hardware sprites.
    Different frames of the same metasprites can share
    tile data.

    See the main @ref metasprite_main_docs "metasprite docs"
    under the game Boy platform for additional details.
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


static uint8_t __move_metasprite(uint8_t id, uint16_t x, uint16_t y);
static uint8_t __move_metasprite_flipx(uint8_t id, uint16_t x, uint16_t y);
static uint8_t __move_metasprite_flipy(uint8_t id, uint16_t x, uint16_t y);
static uint8_t __move_metasprite_flipxy(uint8_t id, uint16_t x, uint16_t y);
static void __hide_metasprite(uint8_t id) Z88DK_FASTCALL PRESERVES_REGS(iyh, iyl);

/**
 * Hides all hardware sprites in range from <= X < to
 * @param from start OAM index
 * @param to finish OAM index
 */
void hide_sprites_range(UINT8 from, UINT8 to) PRESERVES_REGS(iyh, iyl);

/** Moves metasprite to the absolute position x and y

    @param metasprite   Pointer to the first struct of the metasprite (for the desired frame)
    @param base_tile    Number of the first tile where the metasprite's tiles start
    @param base_prop    Base sprite property flags (unused on this platform)
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
inline uint8_t move_metasprite_ex(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_prop, uint8_t base_sprite, uint16_t x, uint16_t y) {
    base_prop;
    __current_metasprite = metasprite;
    __current_base_tile = base_tile;
    return __move_metasprite(base_sprite, x, y);
}

/** Obsolete. This function has been replaced by move_metasprite_ex()
*/
inline uint8_t move_metasprite(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_sprite, uint16_t x, uint16_t y) {
    __current_metasprite = metasprite;
    __current_base_tile = base_tile;
    return __move_metasprite(base_sprite, x, y);
}

/** Moves metasprite to the absolute position x and y, __flipped by X (horizontally)__

    @param metasprite   Pointer to the first struct of the metasprite (for the desired frame)
    @param base_tile    Number of the first tile where the metasprite's tiles start
    @param base_prop    Base sprite property flags (unused on this platform)
    @param base_sprite  Number of the first hardware sprite to be used by the metasprite
    @param x            Absolute x coordinate of the sprite
    @param y            Absolute y coordinate of the sprite

    Same as @ref move_metasprite(), but with the metasprite flipped by X (horizontally).

    Sets:
    \li __current_metasprite = metasprite;
    \li __current_base_tile = base_tile;

    Note: Overwrites OAM sprite properties (such as palette), see
          @ref metasprite_and_sprite_properties "Metasprites and sprite properties".

    @return Number of hardware sprites used to draw this metasprite

    @see move_metasprite()
*/
inline uint8_t move_metasprite_flipx(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_prop, uint8_t base_sprite, uint16_t x, uint16_t y) {
    base_prop;
    __current_metasprite = metasprite;
    __current_base_tile = base_tile;
    return __move_metasprite_flipx(base_sprite, x - 8, y);
}

/** Moves metasprite to the absolute position x and y, __flipped by Y (vertically)__

    @param metasprite   Pointer to the first struct of the metasprite (for the desired frame)
    @param base_tile    Number of the first tile where the metasprite's tiles start
    @param base_prop    Base sprite property flags (unused on this platform)
    @param base_sprite  Number of the first hardware sprite to be used by the metasprite
    @param x            Absolute x coordinate of the sprite
    @param y            Absolute y coordinate of the sprite

    Same as @ref move_metasprite(), but with the metasprite flipped by Y (vertically).

    Sets:
    \li __current_metasprite = metasprite;
    \li __current_base_tile = base_tile;

    Note: Overwrites OAM sprite properties (such as palette), see
          @ref metasprite_and_sprite_properties "Metasprites and sprite properties".

    @return Number of hardware sprites used to draw this metasprite

    @see move_metasprite()
*/
inline uint8_t move_metasprite_flipy(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_prop, uint8_t base_sprite, uint16_t x, uint16_t y) {
    base_prop;
    __current_metasprite = metasprite;
    __current_base_tile = base_tile;
    return __move_metasprite_flipy(base_sprite, x, y - ((__READ_VDP_REG(VDP_R1) & R1_SPR_8X16) ? 16 : 8) );
}

/** Moves metasprite to the absolute position x and y, __flipped by X and Y (horizontally and vertically)__

    @param metasprite   Pointer to the first struct of the metasprite (for the desired frame)
    @param base_tile    Number of the first tile where the metasprite's tiles start
    @param base_prop    Base sprite property flags (unused on this platform)
    @param base_sprite  Number of the first hardware sprite to be used by the metasprite
    @param x            Absolute x coordinate of the sprite
    @param y            Absolute y coordinate of the sprite

    Same as @ref move_metasprite(), but with the metasprite flipped by X and Y (horizontally and vertically).

    Sets:
    \li __current_metasprite = metasprite;
    \li __current_base_tile = base_tile;

    Note: Overwrites OAM sprite properties (such as palette), see
          @ref metasprite_and_sprite_properties "Metasprites and sprite properties".

    @return Number of hardware sprites used to draw this metasprite

    @see move_metasprite()
*/
inline uint8_t move_metasprite_flipxy(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_prop, uint8_t base_sprite, uint16_t x, uint16_t y) {
    base_prop;
    __current_metasprite = metasprite;
    __current_base_tile = base_tile;
    return __move_metasprite_flipxy(base_sprite, x - 8, y - ((__READ_VDP_REG(VDP_R1) & R1_SPR_8X16) ? 16 : 8));
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
