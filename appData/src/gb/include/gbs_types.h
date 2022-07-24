#ifndef GBS_TYPES_H
#define GBS_TYPES_H

#include <gb/gb.h>
#include <gb/cgb.h>
#include <gb/metasprites.h>

#include <stdint.h>
#include <stdbool.h>

#include "bankdata.h"
#include "parallax.h"
#include "collision.h"

typedef enum {
    SCENE_TYPE_TOPDOWN = 0,
    SCENE_TYPE_PLATFORM,
    SCENE_TYPE_ADVENTURE,
    SCENE_TYPE_SHMUP,
    SCENE_TYPE_POINTNCLICK,
    SCENE_TYPE_LOGO
} scene_type_e;

typedef enum {
    LCD_simple,
    LCD_parallax,
    LCD_fullscreen
} LCD_isr_e;

typedef enum {
    COLLISION_GROUP_NONE = 0,
    COLLISION_GROUP_PLAYER = 1,
    COLLISION_GROUP_1 = 2,
    COLLISION_GROUP_2 = 4,
    COLLISION_GROUP_3 = 8,
} collision_group_e;

typedef struct animation_t
{
    uint8_t start;
    uint8_t end;
} animation_t;

typedef struct actor_t
{
    bool active               : 1;
    bool pinned               : 1;
    bool hidden               : 1;
    bool disabled             : 1;
    bool anim_noloop          : 1;
    bool collision_enabled    : 1;
    bool movement_interrupt   : 1;
    bool persistent           : 1;
    upoint16_t pos;
    direction_e dir;
    bounding_box_t bounds;
    uint8_t base_tile;
    uint8_t frame;
    uint8_t frame_start;
    uint8_t frame_end;
    uint8_t anim_tick;
    uint8_t move_speed;
    uint8_t animation;
    uint8_t reserve_tiles;
    animation_t animations[8];
    far_ptr_t sprite;
    far_ptr_t script, script_update;
    uint16_t hscript_update, hscript_hit;

    // Collisions
    collision_group_e collision_group;

    // Linked list
    struct actor_t *next;
    struct actor_t *prev;
} actor_t;

#define TRIGGER_HAS_ENTER_SCRIPT    1
#define TRIGGER_HAS_LEAVE_SCRIPT    2

typedef struct trigger_t {
    uint8_t x, y, width, height;
    far_ptr_t script;
    uint8_t script_flags;
} trigger_t;

typedef struct scene_t {
    uint8_t width, height;
    scene_type_e type;
    uint8_t n_actors, n_triggers, n_projectiles, n_sprites;
    uint8_t reserve_tiles;
    far_ptr_t player_sprite;
    far_ptr_t background, collisions;
    far_ptr_t palette, sprite_palette;
    far_ptr_t script_init, script_p_hit1;
    far_ptr_t sprites;
    far_ptr_t actors;
    far_ptr_t triggers;
    far_ptr_t projectiles;
    parallax_row_t parallax_rows[3];
} scene_t;

typedef struct background_t {
    uint8_t width, height;
    far_ptr_t tileset;
    far_ptr_t cgb_tileset;
    far_ptr_t tilemap;              // far pointer to array of bytes with map
    far_ptr_t cgb_tilemap_attr;     // far pointer to array of bytes with CGB attributes (may be NULL)
} background_t;

typedef struct tileset_t {
    uint16_t n_tiles;                  // actual amount of 8x8 tiles in tiles[] array
    uint8_t tiles[];
} tileset_t;

typedef struct spritesheet_t {
    uint8_t n_metasprites;
    point8_t emote_origin;
    metasprite_t * const *metasprites;
    animation_t *animations;
    uint16_t *animations_lookup;
    bounding_box_t bounds;
    far_ptr_t tileset;              // far pointer to sprite tileset
    far_ptr_t cgb_tileset;          // far pointer to additional CGB tileset (may be NULL)
} spritesheet_t;

typedef struct projectile_def_t
{
    bounding_box_t bounds;
    far_ptr_t sprite;
    uint8_t life_time;
    uint8_t base_tile;
    animation_t animations[4];
    uint8_t anim_tick;
    uint8_t move_speed;
    uint16_t initial_offset;
    collision_group_e collision_group;
    uint8_t collision_mask;
} projectile_def_t;

typedef struct projectile_t
{
    bool anim_noloop          : 1;
    bool strong               : 1;
    upoint16_t pos;
    point16_t delta_pos;
    uint8_t frame;
    uint8_t frame_start;
    uint8_t frame_end;
    projectile_def_t def;
    struct projectile_t *next;
} projectile_t;

#define FONT_RECODE     1
#define FONT_VWF        2
#define FONT_VWF_1BIT   4

#define FONT_RECODE_SIZE_7BIT 0x7fu

typedef struct font_desc_t {
    uint8_t attr, mask;
    const uint8_t * recode_table;
    const uint8_t * widths;
    const uint8_t * bitmaps;
} font_desc_t;

typedef struct scene_stack_item_t {
    far_ptr_t scene;
    upoint16_t pos;
    direction_e dir;
} scene_stack_item_t;

typedef struct menu_item_t {
    uint8_t X, Y;
    uint8_t iL, iR, iU, iD;
} menu_item_t;

#define DMG_BLACK 0x03
#define DMG_DARK_GRAY 0x02
#define DMG_LITE_GRAY 0x01
#define DMG_WHITE 0x00

#ifndef DMG_PALETTE
#define DMG_PALETTE(C0, C1, C2, C3) ((uint8_t)((((C3) & 0x03) << 6) | (((C2) & 0x03) << 4) | (((C1) & 0x03) << 2) | ((C0) & 0x03)))
#endif

#define CGB_PALETTE(C0, C1, C2, C3) {C0, C1, C2, C3}
#define CGB_COLOR(R, G, B) ((uint16_t)(((R) & 0x1f) | (((G) & 0x1f) << 5) | (((B) & 0x1f) << 10)))

typedef struct palette_entry_t {
    uint16_t c0, c1, c2, c3;
} palette_entry_t;

typedef struct palette_t {
    uint8_t mask;
    uint8_t palette[2];
    palette_entry_t cgb_palette[];
} palette_t;

#endif
