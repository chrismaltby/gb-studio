/** @file gb/metasprites.h

    @anchor metasprite_main_docs
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

    \code
    // Example:
    // Hide rest of the hardware sprites, because amount
    // of sprites differ between animation frames.
    // (where hiwater == last hardware sprite used + 1)
    hide_sprites_range(hiwater, MAX_HARDWARE_SPRITES);
    \endcode

    @anchor metasprite_and_sprite_properties
    # Metasprites and sprite properties (including cgb palette)

    When the move_metasprite_*() functions are called they
    update all properties for the affected sprites in the
    Shadow OAM. This means any existing property flags set
    for a sprite (CGB palette, BG/WIN priority, Tile VRAM Bank)
    will get overwritten.

    How to use sprite property flags with metasprites:
    - Primary method: Use the `base_prop` parameter for the
      move_metasprite_*() functions.
      - For more details about the properties on the Game Boy see: https://gbdev.io/pandocs/OAM.html#byte-3--attributesflags
      - This can be left at zero for defaults
      - Various `OAMF_*` flags can be used depending on the platform:
        - @ref OAMF_BANK0, @ref OAMF_BANK1
        - @ref OAMF_CGB_PAL0, @ref OAMF_CGB_PAL1, @ref OAMF_CGB_PAL2, @ref OAMF_CGB_PAL3,
          @ref OAMF_CGB_PAL4, @ref OAMF_CGB_PAL5, @ref OAMF_CGB_PAL6, @ref OAMF_CGB_PAL7,
        - @ref OAMF_PAL0, @ref OAMF_PAL1,
        - @ref OAMF_PALMASK, @ref OAMF_PRI, @ref OAMF_XFLIP, @ref OAMF_YFLIP

    - Alternate method: The metasprite structures can have the
      property flags modified before compilation (such as with
      `-sp <props>` in the @ref utility_png2asset "png2asset" tool).

    The following functions only support hardware sprite flipping
    on the Game Boy / Mega Duck and NES. For other consoles which
    do not have hardware sprite flipping see the cross-platform
    metasprite example for a workaround (with some performance penalty).

    - @ref move_metasprite_flipx()
    - @ref move_metasprite_flipy()
    - @ref move_metasprite_flipxy()

    To test for hardware support see
    @ref HARDWARE_SPRITE_CAN_FLIP_X and @ref HARDWARE_SPRITE_CAN_FLIP_Y.
    Also see @ref docs_consoles_supported_list for a brief summary of
    console capabilities.
*/

#ifndef _METASPRITES_H_INCLUDE
#define _METASPRITES_H_INCLUDE

#include <gb/hardware.h>
#include <types.h>
#include <stdint.h>

/** Metasprite sub-item structure
    @param dy        (int8_t)  Y coordinate of the sprite relative to the metasprite origin (pivot)
    @param dx        (int8_t)  X coordinate of the sprite relative to the metasprite origin (pivot)
    @param dtile     (uint8_t) Start tile relative to the metasprites own set of tiles
    @param props     (uint8_t) Property Flags

    Metasprites are built from multiple metasprite_t items (one for each sub-sprite)
    and a pool of tiles they reference. If a metasprite has multiple frames then each
    frame will be built from some number of metasprite_t items (which may vary based
    on how many sprites are required for that particular frame).

    A metasprite frame is terminated with a {metasprite_end} entry.
*/
typedef struct metasprite_t {
    int8_t  dy, dx;
    uint8_t dtile;
    uint8_t props;
} metasprite_t;

#define metasprite_end -128
#define METASPR_ITEM(dy,dx,dt,a) {(dy),(dx),(dt),(a)}
#define METASPR_TERM {metasprite_end}

extern const void * __current_metasprite;
extern uint8_t __current_base_tile;
extern uint8_t __current_base_prop;
extern uint8_t __render_shadow_OAM;


static uint8_t __move_metasprite(uint8_t id, uint16_t yx);
static uint8_t __move_metasprite_flipx(uint8_t id, uint16_t yx);
static uint8_t __move_metasprite_flipy(uint8_t id, uint16_t yx);
static uint8_t __move_metasprite_flipxy(uint8_t id, uint16_t yx);
static uint8_t __move_metasprite_vflip(uint8_t id, uint16_t yx);
static uint8_t __move_metasprite_hflip(uint8_t id, uint16_t yx);
static uint8_t __move_metasprite_hvflip(uint8_t id, uint16_t yx);
static void __hide_metasprite(uint8_t id);

/**
    Hides all hardware sprites in range from <= X < to
    @param from start OAM index
    @param to finish OAM index (must be <= MAX_HARDWARE_SPRITES)

    @see hide_sprite, MAX_HARDWARE_SPRITES
 */
void hide_sprites_range(uint8_t from, uint8_t to);

/** Moves metasprite to the absolute position x and y

    @param metasprite   Pointer to the first struct of the metasprite (for the desired frame)
    @param base_tile    Number of the first tile where the metasprite's tiles start
    @param base_prop    Base sprite property flags (can be used to set palette, etc)
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

    Note: Overwrites OAM sprite properties (such as CGB Palette), see
          @ref metasprite_and_sprite_properties "Metasprites and sprite properties".

    @return Number of hardware sprites used to draw this metasprite
 */
inline uint8_t move_metasprite_ex(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_prop, uint8_t base_sprite, uint8_t x, uint8_t y) {
    __current_metasprite = metasprite;
    __current_base_tile = base_tile;
    __current_base_prop = base_prop;
    return __move_metasprite(base_sprite, (y << 8) | (uint8_t)x);
}

/** Obsolete. This function has been replaced by move_metasprite_ex()
*/
inline uint8_t move_metasprite(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_sprite, uint8_t x, uint8_t y) {
    __current_metasprite = metasprite;
    __current_base_tile = base_tile;
    __current_base_prop = 0;
    return __move_metasprite(base_sprite, (y << 8) | (uint8_t)x);
}

/** Moves metasprite to the absolute position x and y, __flipped by X (horizontally)__

    @param metasprite   Pointer to the first struct of the metasprite (for the desired frame)
    @param base_tile    Number of the first tile where the metasprite's tiles start
    @param base_prop    Base sprite property flags (can be used to set palette, etc)
    @param base_sprite  Number of the first hardware sprite to be used by the metasprite
    @param x            Absolute x coordinate of the sprite
    @param y            Absolute y coordinate of the sprite

    Same as @ref move_metasprite(), but with the metasprite flipped by X (horizontally).

    Sets:
    \li __current_metasprite = metasprite;
    \li __current_base_tile = base_tile;

    Note: Overwrites OAM sprite properties (such as CGB palette), see
          @ref metasprite_and_sprite_properties "Metasprites and sprite properties".

    This function is only available on Game Boy and related clone consoles.

    @return Number of hardware sprites used to draw this metasprite

    @see move_metasprite()
*/
inline uint8_t move_metasprite_flipx(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_prop, uint8_t base_sprite, uint8_t x, uint8_t y) {
    __current_metasprite = metasprite;
    __current_base_tile = base_tile;
    __current_base_prop = base_prop;
    return __move_metasprite_flipx(base_sprite, (y << 8) | (uint8_t)(x - 8u));
}

/** Obsolete. This function has been replaced by move_metasprite_flipx()
*/
inline uint8_t move_metasprite_vflip(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_sprite, uint8_t x, uint8_t y) {
    __current_metasprite = metasprite;
    __current_base_tile = base_tile;
    __current_base_prop = 0;
    return __move_metasprite_vflip(base_sprite, (y << 8) | (uint8_t)(x - 8u));
}


/** Moves metasprite to the absolute position x and y, __flipped by Y (vertically)__

    @param metasprite   Pointer to the first struct of the metasprite (for the desired frame)
    @param base_tile    Number of the first tile where the metasprite's tiles start
    @param base_prop    Base sprite property flags (can be used to set palette, etc)
    @param base_sprite  Number of the first hardware sprite to be used by the metasprite
    @param x            Absolute x coordinate of the sprite
    @param y            Absolute y coordinate of the sprite

    Same as @ref move_metasprite(), but with the metasprite flipped by Y (vertically).

    Sets:
    \li __current_metasprite = metasprite;
    \li __current_base_tile = base_tile;

    Note: Overwrites OAM sprite properties (such as CGB palette), see
          @ref metasprite_and_sprite_properties "Metasprites and sprite properties".

    This function is only available on Game Boy and related clone consoles.

    @return Number of hardware sprites used to draw this metasprite

    @see move_metasprite()
*/
inline uint8_t move_metasprite_flipy(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_prop, uint8_t base_sprite, uint8_t x, uint8_t y) {
    __current_metasprite = metasprite;
    __current_base_tile = base_tile;
    __current_base_prop = base_prop;
    return __move_metasprite_flipy(base_sprite, ((y - ((LCDC_REG & LCDCF_OBJ16) ? 16u : 8u)) << 8) | x);
}

/** Obsolete. This function has been replaced by move_metasprite_flipy()
*/
inline uint8_t move_metasprite_hflip(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_sprite, uint8_t x, uint8_t y) {
    __current_metasprite = metasprite;
    __current_base_tile = base_tile;
    __current_base_prop = 0;
    return __move_metasprite_hflip(base_sprite, ((y - ((LCDC_REG & LCDCF_OBJ16) ? 16u : 8u)) << 8) | x);
}

/** Moves metasprite to the absolute position x and y, __flipped by X and Y (horizontally and vertically)__

    @param metasprite   Pointer to the first struct of the metasprite (for the desired frame)
    @param base_tile    Number of the first tile where the metasprite's tiles start
    @param base_prop    Base sprite property flags (can be used to set palette, etc)
    @param base_sprite  Number of the first hardware sprite to be used by the metasprite
    @param x            Absolute x coordinate of the sprite
    @param y            Absolute y coordinate of the sprite

    Same as @ref move_metasprite(), but with the metasprite flipped by X and Y (horizontally and vertically).

    Sets:
    \li __current_metasprite = metasprite;
    \li __current_base_tile = base_tile;

    Note: Overwrites OAM sprite properties (such as CGB palette), see
          @ref metasprite_and_sprite_properties "Metasprites and sprite properties".

    This function is only available on Game Boy and related clone consoles.

    @return Number of hardware sprites used to draw this metasprite

    @see move_metasprite()
*/
inline uint8_t move_metasprite_flipxy(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_prop, uint8_t base_sprite, uint8_t x, uint8_t y) {
    __current_metasprite = metasprite;
    __current_base_tile = base_tile;
    __current_base_prop = base_prop;
    return __move_metasprite_flipxy(base_sprite, ((y - ((LCDC_REG & LCDCF_OBJ16) ? 16u : 8u)) << 8) | (uint8_t)(x - 8));
}

/** Obsolete. This function has been replaced by move_metasprite_flipxy()
*/
inline uint8_t move_metasprite_hvflip(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_sprite, uint8_t x, uint8_t y) {
    __current_metasprite = metasprite;
    __current_base_tile = base_tile;
    __current_base_prop = 0;
    return __move_metasprite_hvflip(base_sprite, ((y - ((LCDC_REG & LCDCF_OBJ16) ? 16u : 8u)) << 8) | (uint8_t)(x - 8));
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
