#pragma bank 255

#include "vm_actor.h"

#include <gb/metasprites.h>

#include "actor.h"
#include "game_time.h"
#include "data_manager.h"
#include "scroll.h"
#include "math.h"
#include "macro.h"

BANKREF(VM_ACTOR)

#define EMOTE_TOTAL_FRAMES         60
#define MOVE_INACTIVE              0
#define MOVE_ALLOW_H               1
#define MOVE_ALLOW_V               2
#define MOVE_DIR_H                 4
#define MOVE_DIR_V                 8
#define MOVE_ACTIVE_H              16
#define MOVE_ACTIVE_V              32
#define MOVE_NEEDED_H              64
#define MOVE_NEEDED_V              128
#define MOVE_H                     (MOVE_ALLOW_H | MOVE_NEEDED_H)
#define MOVE_V                     (MOVE_ALLOW_V | MOVE_NEEDED_V)
#define TILE_FRACTION_MASK         0b1111111
#define ONE_TILE_DISTANCE          128


typedef struct act_move_to_t {
    INT16 ID;
    INT16 X, Y;
    UBYTE ATTR;
} act_move_to_t;

typedef struct act_set_pos_t {
    INT16 ID;
    INT16 X, Y;
} act_set_pos_t;

typedef struct act_set_frame_t {
    INT16 ID;
    INT16 FRAME;
} act_set_frame_t;

typedef struct gbs_farptr_t {
    INT16 BANK;
    const void * DATA;
} gbs_farptr_t;

void vm_actor_move_to(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    actor_t *actor;
    static direction_e new_dir = DIR_DOWN;

    // indicate waitable state of context
    THIS->waitable = 1;

    act_move_to_t * params = VM_REF_TO_PTR(idx);
    actor = actors + (UBYTE)(params->ID);

    if (THIS->flags == 0) {
        actor->movement_interrupt = FALSE;

        // Switch to moving animation frames
        actor_set_anim_moving(actor);

        // Snap to nearest pixel before moving
        actor->pos.x = actor->pos.x & 0xFFF0;
        actor->pos.y = actor->pos.y & 0xFFF0;

        if (CHK_FLAG(params->ATTR, ACTOR_ATTR_DIAGONAL)) {
            SET_FLAG(THIS->flags, MOVE_ALLOW_H | MOVE_ALLOW_V);
        } if (CHK_FLAG(params->ATTR, ACTOR_ATTR_H_FIRST)) {
            SET_FLAG(THIS->flags, MOVE_ALLOW_H);
        } else {
            SET_FLAG(THIS->flags, MOVE_ALLOW_V);
        }

        // Check for collisions in path
        if (CHK_FLAG(params->ATTR, ACTOR_ATTR_CHECK_COLL)) {
            if (CHK_FLAG(params->ATTR, ACTOR_ATTR_H_FIRST)) {
                // Check for horizontal collision
                if (actor->pos.x != params->X) {
                    UBYTE check_dir = (actor->pos.x > params->X) ? CHECK_DIR_LEFT : CHECK_DIR_RIGHT;
                    params->X = check_collision_in_direction(actor->pos.x, actor->pos.y, &actor->bounds, params->X, check_dir);
                }
                // Check for vertical collision
                if (actor->pos.y != params->Y) {
                    UBYTE check_dir = (actor->pos.y > params->Y) ? CHECK_DIR_UP : CHECK_DIR_DOWN;
                    params->Y = check_collision_in_direction(params->X, actor->pos.y, &actor->bounds, params->Y, check_dir);
                }
            } else {
                // Check for vertical collision
                if (actor->pos.y != params->Y) {
                    UBYTE check_dir = (actor->pos.y > params->Y) ? CHECK_DIR_UP : CHECK_DIR_DOWN;
                    params->Y = check_collision_in_direction(actor->pos.x, actor->pos.y, &actor->bounds, params->Y, check_dir);
                }
                // Check for horizontal collision
                if (actor->pos.x != params->X) {
                    UBYTE check_dir = (actor->pos.x > params->X) ? CHECK_DIR_LEFT : CHECK_DIR_RIGHT;
                    params->X = check_collision_in_direction(actor->pos.x, params->Y, &actor->bounds, params->X, check_dir);
                }
            }
        }

        // Actor already at destination
        if ((actor->pos.x != params->X)) {
            SET_FLAG(THIS->flags, MOVE_NEEDED_H);
        } else {
            SET_FLAG(THIS->flags, MOVE_ALLOW_V);
        }
        if (actor->pos.y != params->Y) {
            SET_FLAG(THIS->flags, MOVE_NEEDED_V);
        } else {
            SET_FLAG(THIS->flags, MOVE_ALLOW_H);
        }

        // Initialise movement directions
        if (actor->pos.x > params->X) {
            // Move left
            SET_FLAG(THIS->flags, MOVE_DIR_H);
        }
        if (actor->pos.y > params->Y) {
            // Move up
            SET_FLAG(THIS->flags, MOVE_DIR_V);
        }
    }

    // Interrupt actor movement
    if (actor->movement_interrupt) {
        // Set new X destination to next tile
        if ((actor->pos.x < params->X) && (actor->pos.x & TILE_FRACTION_MASK)) {   // Bitmask to check for non-grid-aligned position
            params->X = (actor->pos.x & ~TILE_FRACTION_MASK) + ONE_TILE_DISTANCE;  // If moving in positive direction, round up to next tile
        } else {
            params->X = actor->pos.x  & ~TILE_FRACTION_MASK;                       // Otherwise, round down
        }
        // Set new Y destination to next tile
        if ((actor->pos.y < params->Y) && (actor->pos.y & TILE_FRACTION_MASK)) {
            params->Y = (actor->pos.y & ~TILE_FRACTION_MASK) + ONE_TILE_DISTANCE;
        } else {
            params->Y = actor->pos.y  & ~TILE_FRACTION_MASK;
        }
        actor->movement_interrupt = FALSE;
    }

    // Move in X Axis
    if (CHK_FLAG(THIS->flags, MOVE_H) == MOVE_H) {
        // Get hoizontal direction from flags
        new_dir = CHK_FLAG(THIS->flags, MOVE_DIR_H) ? DIR_LEFT : DIR_RIGHT;

        // Move actor
        point_translate_dir(&actor->pos, new_dir, actor->move_speed);

        // Check for actor collision
        if (CHK_FLAG(params->ATTR, ACTOR_ATTR_CHECK_COLL) && actor_overlapping_bb(&actor->bounds, &actor->pos, actor, FALSE)) {
            point_translate_dir(&actor->pos, FLIPPED_DIR(new_dir), actor->move_speed);
            THIS->flags = 0;
            actor_set_anim_idle(actor);
            return;
        }

        // If first frame moving in this direction update actor direction
        if (!CHK_FLAG(THIS->flags, MOVE_ACTIVE_H)) {
            SET_FLAG(THIS->flags, MOVE_ACTIVE_H);
            actor_set_dir(actor, new_dir, TRUE);
        }

        // Check if overshot destination
        if (
            (new_dir == DIR_LEFT && (actor->pos.x <= params->X)) || // Overshot left
            (new_dir == DIR_RIGHT && (actor->pos.x >= params->X))   // Overshot right
        ) {
            // Reached Horizontal Destination
            actor->pos.x = params->X;
            SET_FLAG(THIS->flags, MOVE_ALLOW_V);
            CLR_FLAG(THIS->flags, MOVE_H);
        }
    }

    // Move in Y Axis
    if (CHK_FLAG(THIS->flags, MOVE_V) == MOVE_V) {
        // Get vertical direction from flags
        new_dir = CHK_FLAG(THIS->flags, MOVE_DIR_V) ? DIR_UP : DIR_DOWN;

        // Move actor
        point_translate_dir(&actor->pos, new_dir, actor->move_speed);

        // Check for actor collision
        if (CHK_FLAG(params->ATTR, ACTOR_ATTR_CHECK_COLL) && actor_overlapping_bb(&actor->bounds, &actor->pos, actor, FALSE)) {
            point_translate_dir(&actor->pos, FLIPPED_DIR(new_dir), actor->move_speed);
            THIS->flags = 0;
            actor_set_anim_idle(actor);
            return;
        }

        // If first frame moving in this direction update actor direction
        if (!CHK_FLAG(THIS->flags, MOVE_ACTIVE_V)) {
            SET_FLAG(THIS->flags, MOVE_ACTIVE_V);
            actor_set_dir(actor, new_dir, TRUE);
        }

        // Check if overshot destination
        if (
            (new_dir == DIR_UP && (actor->pos.y <= params->Y)) || // Overshot above
            (new_dir == DIR_DOWN &&  (actor->pos.y >= params->Y)) // Overshot below
         ) {
            actor->pos.y = params->Y;
            SET_FLAG(THIS->flags, MOVE_ALLOW_H);
            CLR_FLAG(THIS->flags, MOVE_V);
        }
    }

    // Actor reached destination
    if (!CHK_FLAG(THIS->flags, MOVE_NEEDED_H | MOVE_NEEDED_V)) {
        THIS->flags = MOVE_INACTIVE;
        actor_set_anim_idle(actor);
        return;
    }

    THIS->PC -= (INSTRUCTION_SIZE + sizeof(idx));
    return;
}

void vm_actor_move_cancel(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    actor_t * actor = actors + *n_actor;

    actor->movement_interrupt = TRUE;
}

void vm_actor_activate(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    actor_t * actor = actors + *n_actor;
    if (actor == &PLAYER) {
        actor->hidden = FALSE;
    } else {
        actor->disabled = FALSE;
        activate_actor(actor);
    }
}

void vm_actor_deactivate(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    actor_t * actor = actors + *n_actor;
    if (actor == &PLAYER) {
        actor->hidden = TRUE;
    } else {
        actor->disabled = TRUE;
        deactivate_actor(actor);
    }
}

void vm_actor_terminate_update(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    actor_t *actor;

    act_set_pos_t * params = VM_REF_TO_PTR(idx);
    actor = actors + (UBYTE)(params->ID);

    if ((actor->hscript_update & SCRIPT_TERMINATED) == 0) {
        script_terminate(actor->hscript_update);
    }
}

void vm_actor_set_dir(SCRIPT_CTX * THIS, INT16 idx, direction_e dir) OLDCALL BANKED {
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    actor_set_dir(actors + *n_actor, dir, FALSE);
}

void vm_actor_set_anim(SCRIPT_CTX * THIS, INT16 idx, INT16 idx_anim) OLDCALL BANKED {
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    UBYTE * n_anim = VM_REF_TO_PTR(idx_anim);
    actor_set_anim(actors + *n_actor, *n_anim);
}

void vm_actor_set_pos(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    actor_t *actor;

    act_set_pos_t * params = VM_REF_TO_PTR(idx);
    actor = actors + (UBYTE)(params->ID);

    actor->pos.x = params->X;
    actor->pos.y = params->Y;
}

void vm_actor_get_pos(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    actor_t *actor;

    act_set_pos_t * params = VM_REF_TO_PTR(idx);
    actor = actors + (UBYTE)(params->ID);

    params->X = actor->pos.x;
    params->Y = actor->pos.y;
}

void vm_actor_get_dir(SCRIPT_CTX * THIS, INT16 idx, INT16 dest) OLDCALL BANKED {
    UWORD * A;
    actor_t *actor;

    act_set_pos_t * params = VM_REF_TO_PTR(idx);
    actor = actors + (UBYTE)(params->ID);

    if (dest < 0) A = THIS->stack_ptr + dest; else A = script_memory + dest;
    *A = actor->dir;
}

void vm_actor_get_angle(SCRIPT_CTX * THIS, INT16 idx, INT16 dest) OLDCALL BANKED {
    UWORD * A;
    actor_t *actor;

    act_set_pos_t * params = VM_REF_TO_PTR(idx);
    actor = actors + (UBYTE)(params->ID);

    if (dest < 0) A = THIS->stack_ptr + dest; else A = script_memory + dest;
    *A = dir_angle_lookup[actor->dir];
}

void vm_actor_emote(SCRIPT_CTX * THIS, INT16 idx, UBYTE emote_tiles_bank, const unsigned char *emote_tiles) OLDCALL BANKED {

    // on first call load emote sprite
    if (THIS->flags == 0) {
        UBYTE * n_actor = VM_REF_TO_PTR(idx);
        THIS->flags = 1;
        emote_actor = actors + *n_actor;
        emote_timer = 1;
        load_emote(emote_tiles, emote_tiles_bank);
    }

    if (emote_timer == EMOTE_TOTAL_FRAMES) {
        // Reset ctx flags
        THIS->flags = 0;
        emote_actor = NULL;
    } else {
        THIS->waitable = 1;
        emote_timer++;
        THIS->PC -= (INSTRUCTION_SIZE + sizeof(idx) + sizeof(emote_tiles_bank) + sizeof(emote_tiles));
    }
}

void vm_actor_set_bounds(SCRIPT_CTX * THIS, INT16 idx, BYTE left, BYTE right, BYTE top, BYTE bottom) OLDCALL BANKED {
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    actor_t * actor = actors + *n_actor;
    actor->bounds.left = left;
    actor->bounds.right = right;
    actor->bounds.top = top;
    actor->bounds.bottom = bottom;
}

void vm_actor_set_spritesheet(SCRIPT_CTX * THIS, INT16 idx, UBYTE spritesheet_bank, const spritesheet_t *spritesheet) OLDCALL BANKED {
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    actor_t * actor = actors + *n_actor;
    load_sprite(actor->base_tile, spritesheet, spritesheet_bank);
    actor->sprite.bank = spritesheet_bank;
    actor->sprite.ptr = (void *)spritesheet;
    load_animations(spritesheet, spritesheet_bank, ANIM_SET_DEFAULT, actor->animations);
    load_bounds(spritesheet, spritesheet_bank, &actor->bounds);
    actor_reset_anim(actor);
}

void vm_actor_replace_tile(SCRIPT_CTX * THIS, INT16 idx, UBYTE target_tile, UBYTE tileset_bank, const tileset_t * tileset, UBYTE start_tile, UBYTE length) OLDCALL BANKED {
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    actor_t * actor = actors + *n_actor;
    SetBankedSpriteData(actor->base_tile + target_tile, length, tileset->tiles + (start_tile << 4), tileset_bank);
}

void vm_actor_set_anim_tick(SCRIPT_CTX * THIS, INT16 idx, UBYTE tick) OLDCALL BANKED {
    actor_t *actor;
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    actor = actors + *n_actor;
    actor->anim_tick = tick;
}

void vm_actor_set_move_speed(SCRIPT_CTX * THIS, INT16 idx, UBYTE speed) OLDCALL BANKED {
    actor_t *actor;
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    actor = actors + *n_actor;
    actor->move_speed = speed;
}

void vm_actor_set_anim_frame(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    actor_t *actor;

    act_set_frame_t * params = VM_REF_TO_PTR(idx);
    actor = actors + (UBYTE)(params->ID);

    actor_set_frame_offset(actor, params->FRAME);
}

void vm_actor_get_anim_frame(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    actor_t *actor;

    act_set_frame_t * params = VM_REF_TO_PTR(idx);
    actor = actors + (UBYTE)(params->ID);

    params->FRAME = actor_get_frame_offset(actor);
}

void vm_actor_set_anim_set(SCRIPT_CTX * THIS, INT16 idx, UWORD offset) OLDCALL BANKED {
    actor_t *actor;
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    actor = actors + *n_actor;
    load_animations(actor->sprite.ptr, actor->sprite.bank, offset, actor->animations);
    actor_reset_anim(actor);
}

void vm_actor_set_spritesheet_by_ref(SCRIPT_CTX * THIS, INT16 idxA, INT16 idxB) OLDCALL BANKED {
    actor_t *actor;
    UBYTE * n_actor = VM_REF_TO_PTR(idxA);
    actor = actors + *n_actor;

    gbs_farptr_t * params = VM_REF_TO_PTR(idxB);
    UBYTE spritesheet_bank = (UBYTE)(params->BANK);
    const spritesheet_t *spritesheet = params->DATA;

    load_sprite(actor->base_tile, spritesheet, spritesheet_bank);
    actor->sprite.bank = spritesheet_bank;
    actor->sprite.ptr = (void *)spritesheet;
    load_animations(spritesheet, spritesheet_bank, ANIM_SET_DEFAULT, actor->animations);
    load_bounds(spritesheet, spritesheet_bank, &actor->bounds);
    actor_reset_anim(actor);
}

void vm_actor_set_flags(SCRIPT_CTX * THIS, INT16 idx, UBYTE flags, UBYTE mask) OLDCALL BANKED {
    actor_t * actor = actors + *(UBYTE *)VM_REF_TO_PTR(idx);

    if (mask & ACTOR_FLAG_PINNED)      actor->pinned            = (flags & ACTOR_FLAG_PINNED);
    if (mask & ACTOR_FLAG_HIDDEN)      actor->hidden            = (flags & ACTOR_FLAG_HIDDEN);
    if (mask & ACTOR_FLAG_ANIM_NOLOOP) actor->anim_noloop       = (flags & ACTOR_FLAG_ANIM_NOLOOP);
    if (mask & ACTOR_FLAG_COLLISION)   actor->collision_enabled = (flags & ACTOR_FLAG_COLLISION);
    if (mask & ACTOR_FLAG_PERSISTENT)  actor->persistent        = (flags & ACTOR_FLAG_PERSISTENT);
}