/** @file gb/metasprites.h
    
    Metasprite support

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
*/

#ifndef _METASPRITES_H_INCLUDE
#define _METASPRITES_H_INCLUDE

/** Metasprite sub-item structure
    @param dy        (INT8)  Y coordinate of the sprite relative to the metasprite origin (pivot)
    @param dx        (INT8)  X coordinate of the sprite relative to the metasprite origin (pivot)
    @param dtile     (UINT8) Start tile relative to the metasprites own set of tiles
    @param props     (UINT8) Property Flags

    Metasprites are built from multiple metasprite_t items (one for each sub-sprite)
    and a pool of tiles they reference. If a metasprite has multiple frames then each
    frame will be built from some number of metasprite_t items (which may vary based
    on how many sprites are required for that particular frame).
*/
typedef struct metasprite_t {
    INT8  dy, dx;
    UINT8 dtile;
    UINT8 props;
} metasprite_t;

#define metasprite_end -128 

extern const void * __current_metasprite;
extern UBYTE __current_base_tile;
extern UBYTE __render_shadow_OAM;


static UBYTE __move_metasprite(UINT8 id, UINT8 x, UINT8 y);
static UBYTE __move_metasprite_vflip(UINT8 id, UINT8 x, UINT8 y);
static UBYTE __move_metasprite_hflip(UINT8 id, UINT8 x, UINT8 y);
static UBYTE __move_metasprite_hvflip(UINT8 id, UINT8 x, UINT8 y);
static void __hide_metasprite(UINT8 id);


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
inline UBYTE move_metasprite(const metasprite_t * metasprite, UINT8 base_tile, UINT8 base_sprite, UINT8 x, UINT8 y) {
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

    @return Number of hardware sprites used to draw this metasprite

    @see move_metasprite()
*/
inline UBYTE move_metasprite_vflip(const metasprite_t * metasprite, UINT8 base_tile, UINT8 base_sprite, UINT8 x, UINT8 y) {
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

    @return Number of hardware sprites used to draw this metasprite

    @see move_metasprite()
*/
inline UBYTE move_metasprite_hflip(const metasprite_t * metasprite, UINT8 base_tile, UINT8 base_sprite, UINT8 x, UINT8 y) {
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

    @return Number of hardware sprites used to draw this metasprite

    @see move_metasprite()
*/
inline UBYTE move_metasprite_hvflip(const metasprite_t * metasprite, UINT8 base_tile, UINT8 base_sprite, UINT8 x, UINT8 y) {
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
inline void hide_metasprite(const metasprite_t * metasprite, UINT8 base_sprite) {
    __current_metasprite = metasprite; 
    __hide_metasprite(base_sprite);
}

#endif
