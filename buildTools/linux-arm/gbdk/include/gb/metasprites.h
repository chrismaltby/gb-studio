/** @file gb/metasprites.h
    
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

    Use the @ref utility_png2mtspr tool to convert single
    or multiple frames of graphics into metasprite
    structured data for use with the ...metasprite...()
    functions.

    # Metasprites composed of variable numbers of sprites

    When using png2mtspr, it's common for the output of
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
    for (uint8_t i = hiwater; i < 40; i++) shadow_OAM[i].y = 0;
    \endcode

    @anchor metasprite_and_sprite_properties
    # Metasprites and sprite properties (including cgb palette)

    When the move_metasprite_*() functions are called they
    update all properties for the affected sprites in the
    Shadow OAM. This means any existing property flags set
    for a sprite (CGB palette, BG/WIN priority, Tile VRAM Bank)
    will get overwritten.

    How to use sprite property flags with metasprites: 
    - Metsaprite structures can be copied into RAM so their
      property flags can be modified at runtime.
    - The metasprite structures can have the property flags
      modified before compilation (such as with `-sp <props>`
      in the @ref utility_png2mtspr "png2mtspr" tool).
    - Update properties for the affected sprites after calling
      a move_metasprite_*() function.
*/

#ifndef _METASPRITES_H_INCLUDE
#define _METASPRITES_H_INCLUDE

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

extern const void * __current_metasprite;
extern uint8_t __current_base_tile;
extern uint8_t __render_shadow_OAM;


static uint8_t __move_metasprite(uint8_t id, uint8_t x, uint8_t y);
static uint8_t __move_metasprite_vflip(uint8_t id, uint8_t x, uint8_t y);
static uint8_t __move_metasprite_hflip(uint8_t id, uint8_t x, uint8_t y);
static uint8_t __move_metasprite_hvflip(uint8_t id, uint8_t x, uint8_t y);
static void __hide_metasprite(uint8_t id);


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

    Note: Overwrites OAM sprite properties (such as CGB Palette), see
          @ref metasprite_and_sprite_properties "Metasprites and sprite properties".

    @return Number of hardware sprites used to draw this metasprite
 */
inline uint8_t move_metasprite(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_sprite, uint8_t x, uint8_t y) {
    __current_metasprite = metasprite; 
    __current_base_tile = base_tile;
    return __move_metasprite(base_sprite, x, y); 
}

/** Moves metasprite to the absolute position x and y, __flipped on the Y axis__

    @param metasprite   Pointer to the first struct of the metasprite (for the desired frame)
    @param base_tile    Number of the first tile where the metasprite's tiles start
    @param base_sprite  Number of the first hardware sprite to be used by the metasprite    
    @param x            Absolute x coordinate of the sprite
    @param y            Absolute y coordinate of the sprite

    Same as @ref move_metasprite(), but with the metasprite flipped on the Y axis only.

    Sets:
    \li __current_metasprite = metasprite; 
    \li __current_base_tile = base_tile;

    Note: Overwrites OAM sprite properties (such as CGB palette), see
          @ref metasprite_and_sprite_properties "Metasprites and sprite properties".

    @return Number of hardware sprites used to draw this metasprite

    @see move_metasprite()
*/
inline uint8_t move_metasprite_vflip(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_sprite, uint8_t x, uint8_t y) {
    __current_metasprite = metasprite; 
    __current_base_tile = base_tile;
    return __move_metasprite_vflip(base_sprite, x - 8, y); 
}


/** Moves metasprite to the absolute position x and y, __flipped on the X axis__

    @param metasprite   Pointer to the first struct of the metasprite (for the desired frame)
    @param base_tile    Number of the first tile where the metasprite's tiles start
    @param base_sprite  Number of the first hardware sprite to be used by the metasprite    
    @param x            Absolute x coordinate of the sprite
    @param y            Absolute y coordinate of the sprite

    Same as @ref move_metasprite(), but with the metasprite flipped on the X axis only.

    Sets:
    \li __current_metasprite = metasprite; 
    \li __current_base_tile = base_tile;

    Note: Overwrites OAM sprite properties (such as CGB palette), see
          @ref metasprite_and_sprite_properties "Metasprites and sprite properties".

    @return Number of hardware sprites used to draw this metasprite

    @see move_metasprite()
*/
inline uint8_t move_metasprite_hflip(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_sprite, uint8_t x, uint8_t y) {
    __current_metasprite = metasprite; 
    __current_base_tile = base_tile;
    return __move_metasprite_hflip(base_sprite, x, y - ((LCDC_REG & 0x04U) ? 16 : 8) ); 
}

/** Moves metasprite to the absolute position x and y, __flipped on the X and Y axis__

    @param metasprite   Pointer to the first struct of the metasprite (for the desired frame)
    @param base_tile    Number of the first tile where the metasprite's tiles start
    @param base_sprite  Number of the first hardware sprite to be used by the metasprite    
    @param x            Absolute x coordinate of the sprite
    @param y            Absolute y coordinate of the sprite

    Same as @ref move_metasprite(), but with the metasprite flipped on both the X and Y axis.

    Sets:
    \li __current_metasprite = metasprite; 
    \li __current_base_tile = base_tile;

    Note: Overwrites OAM sprite properties (such as CGB palette), see
          @ref metasprite_and_sprite_properties "Metasprites and sprite properties".

    @return Number of hardware sprites used to draw this metasprite

    @see move_metasprite()
*/
inline uint8_t move_metasprite_hvflip(const metasprite_t * metasprite, uint8_t base_tile, uint8_t base_sprite, uint8_t x, uint8_t y) {
    __current_metasprite = metasprite; 
    __current_base_tile = base_tile;
    return __move_metasprite_hvflip(base_sprite, x - 8, y - ((LCDC_REG & 0x04U) ? 16 : 8)); 
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
