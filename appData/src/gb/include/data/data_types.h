#ifndef DATA_TYPES_H
#define DATA_TYPES_H

#include "BankData.h"

typedef struct actor_t {
    UINT8 x, y;
    UINT8 sprite, sprite_type, palette;
    UINT8 n_frames, initial_frame;
    UINT8 animate, direction;
    UINT8 move_speed, anim_speed;
    UINT8 pinned, collision_group;
    far_ptr_t script, script_update, script_hit1, script_hit2, script_hit3;
} actor_t;

typedef struct trigger_t {
    UINT8 x, y, width, height;
    far_ptr_t script;
} trigger_t;

typedef struct scene_t {
    UINT8 width, height;
    UINT8 type, n_actors, n_triggers, n_sprites;
    far_ptr_t background, collisions, colors, palette, sprite_palette;
    far_ptr_t script_init, script_p_hit1, script_p_hit2, script_p_hit3;
    far_ptr_t sprites;
    far_ptr_t actors;
    far_ptr_t triggers;
} scene_t;

typedef struct background_t {
    UINT8 width, height;
    far_ptr_t tileset;
    UINT8 tiles[];
} background_t;

typedef struct tileset_t {
    UINT8 n_tiles;
    UINT8 tiles[];
} tileset_t;

typedef struct spritesheet_t {
    UINT8 n_frames;
    UINT8 frames[];
} spritesheet_t;

#endif
