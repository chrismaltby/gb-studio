#ifndef _METASPRITES_H_INVCLUDE
#define _METASPRITES_H_INVCLUDE

/**
 * metasprite item description
 */
typedef struct metasprite_item_t {
    INT8  did;
    INT8  dy, dx;
    UINT8 dtile;
    UINT8 props;
} metasprite_item_t;

/**
 * Metasprite description
 */
typedef struct metasprite_t {
    UINT8 count;
    metasprite_item_t items[];
} metasprite_t;

#define metasprite_end 0 

extern const void * __current_metasprite;
extern UBYTE __current_base_tile;
extern UBYTE __render_shadow_OAM;

static UBYTE __move_metasprite(UINT8 id, UINT8 x, UINT8 y);
static void __hide_metasprite(UINT8 id);

/**
 * Moves metasprite to the absolute position x and y, allocating hardware sprites from base_sprite using tiles from bast_tile
 * @param metasprite metasprite description
 * @param base_tile start tile where tiles for that metasprite begin
 * @param base_sprite start hardware sprite
 * @param x absolute x coordinate of the sprite
 * @param y absolute y coordinate of the sprite
 **/
inline UBYTE move_metasprite(const void * metasprite, UINT8 base_tile, UINT8 base_sprite, UINT8 x, UINT8 y) {
    __current_metasprite = metasprite; 
    __current_base_tile = base_tile;
    return __move_metasprite(base_sprite, x, y); 
}

/**
 * Hides metasprite from screen
 * @param metasprite metasprite description
 * @param base_sprite start hardware sprite
 **/
inline void hide_metasprite(const void * metasprite, UINT8 base_sprite) {
    __current_metasprite = metasprite; 
    __hide_metasprite(base_sprite);
}

#endif