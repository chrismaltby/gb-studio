#ifndef _METASPRITE_H_INCLUDE
#define _METASPRITE_H_INCLUDE

/**
 * metasprite item description
 */
typedef struct metasprite_t {
    INT8  dy, dx;
    UINT8 dtile;
    UINT8 props;
} metasprite_t;

#define metasprite_end -128 

extern volatile struct OAM_item_t shadow_OAM2[40];
extern UINT8 hide_sprites;

extern const void * __current_metasprite;
extern UBYTE __current_base_tile;
extern UBYTE __render_shadow_OAM;

static UBYTE __move_metasprite(UINT8 id, UINT8 x, UINT8 y);

/**
 * Moves metasprite to the absolute position x and y, allocating hardware sprites from base_sprite using tiles from bast_tile
 * @param metasprite metasprite description
 * @param base_tile start tile where tiles for that metasprite begin
 * @param base_sprite start hardware sprite
 * @param x absolute x coordinate of the sprite
 * @param y absolute y coordinate of the sprite
 **/
inline UBYTE move_metasprite(const metasprite_t * metasprite, UINT8 base_tile, UINT8 base_sprite, UINT8 x, UINT8 y) {
    __current_metasprite = metasprite; 
    __current_base_tile = base_tile;
    return __move_metasprite(base_sprite, x, y); 
}

/**
 * Hides all hardware sprites in range from <= X < to
 * @param from start OAM index
 * @param to finish OAM index
 */ 
void hide_hardware_sprites(UINT8 from, UINT8 to);

#endif