#ifndef ACTOR_H
#define ACTOR_H

#include <gb/gb.h>
#include "bankdata.h"
#include "gbs_types.h"

#define MAX_ACTORS            20
#define MAX_ACTORS_ACTIVE     12

#define ACTOR_ATTR_H_FIRST    0x01
#define ACTOR_ATTR_CHECK_COLL 0x02

#define PLAYER                actors[0]
#define ON_8PX_GRID(A)        ( MOD_8((A).x >> 4) == 0 &&  MOD_8((A).y >> 4) == 0)
#define ON_16PX_GRID(A)       (MOD_16((A).x >> 4) == 0 && MOD_16((A).y >> 4) == 8)

#define PLAYER_HURT_IFRAMES   20

#define ANIM_JUMP_LEFT        4
#define ANIM_JUMP_RIGHT       6
#define ANIM_CLIMB            2

#define ANIM_CURSOR           0
#define ANIM_CURSOR_HOVER     1

typedef enum {
  CHECK_DIR_LEFT = 1,
  CHECK_DIR_RIGHT,
  CHECK_DIR_UP,
  CHECK_DIR_DOWN,
} col_check_dir_e;

extern actor_t actors[MAX_ACTORS];
extern actor_t *actors_active_head;
extern actor_t *actors_inactive_head;
extern UBYTE player_moving;
extern actor_t *player_collision_actor;
extern actor_t *emote_actor;
extern UBYTE emote_timer;

extern UBYTE allocated_hardware_sprites;

void actors_init() __banked;
void actors_update() __nonbanked;
void deactivate_actor(actor_t *actor) __banked;
void activate_actor(actor_t *actor) __banked;
void actor_set_frames(actor_t *actor, UBYTE frame_start, UBYTE frame_end) __banked;
void actor_set_frame_offset(actor_t *actor, UBYTE frame_offset) __banked;
UBYTE actor_get_frame_offset(actor_t *actor) __banked;
actor_t *actor_at_tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked;
actor_t *actor_in_front_of_player(UBYTE grid_size, UBYTE inc_noclip) __banked;
actor_t *actor_overlapping_player(UBYTE inc_noclip) __banked;
actor_t *actor_overlapping_bb(bounding_box_t *bb, upoint16_t *offset, actor_t *ignore, UBYTE inc_noclip) __banked;
void actor_set_anim_idle(actor_t *actor) __banked;
void actor_set_anim_moving(actor_t *actor) __banked;
void actor_set_dir(actor_t *actor, direction_e dir, UBYTE moving) __banked;
inline void actor_set_anim(actor_t *actor, UBYTE anim) {
    actor->animation = anim;
    actor_set_frames(actor, actor->animations[anim].start, actor->animations[anim].end + 1);
}
inline void actor_reset_anim(actor_t *actor) {
    actor_set_frames(actor, actor->animations[actor->animation].start, actor->animations[actor->animation].end + 1);
}
inline void actor_stop_anim(actor_t *actor) {
    actor->frame_start = actor->frame;
    actor->frame_end = actor->frame + 1;
}
inline void player_register_collision_with(actor_t *actor) {
    player_collision_actor = actor;
}
void actors_handle_player_collision() __banked;
UWORD check_collision_in_direction(UWORD start_x, UWORD start_y, bounding_box_t *bounds, UWORD end_pos, col_check_dir_e check_dir) __banked;
void activate_actors_in_row(UBYTE x, UBYTE y) __banked;
void activate_actors_in_col(UBYTE x, UBYTE y) __banked;
void player_init() __banked;

#endif
