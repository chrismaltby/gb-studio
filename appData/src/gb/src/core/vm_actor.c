#pragma bank 2

#include "vm.h"

#include "actor.h"
#include "game_time.h"
#include "data_manager.h"
#include "scroll.h"
#include "math.h"
#include "metasprite.h"

#define EMOTE_TOTAL_FRAMES         60

typedef struct act_move_to_t {
    UBYTE ID;
    UBYTE _pad0; 
    INT16 X, Y;
    UBYTE ATTR; 
} act_move_to_t;

typedef struct act_set_pos_t {
    INT16 ID;
    INT16 X, Y;
} act_set_pos_t;

void vm_actor_move_to(SCRIPT_CTX * THIS, INT16 idx) __banked {
    actor_t *actor;
    direction_e new_dir = DIR_DOWN;

    // indicate waitable state of context
    THIS->waitable = 1;

    act_move_to_t * params = VM_REF_TO_PTR(idx);
    actor = actors + params->ID;

    if (THIS->flags == 0) {
        THIS->flags = 1;
        // Check for collisions in path
        if (params->ATTR & ACTOR_ATTR_CHECK_COLL) {
            if (params->ATTR & ACTOR_ATTR_H_FIRST) {
                // Check for horizontal collision
                if (actor->pos.x != params->X) {
                    UBYTE check_dir = (actor->pos.x > params->X) ? CHECK_DIR_LEFT : CHECK_DIR_RIGHT;
                    params->X = check_collision_in_direction((actor->pos.x >> 7), (actor->pos.y >> 7), (params->X >> 7), check_dir) << 7;
                }
                // Check for vertical collision
                if (actor->pos.y != params->Y) {
                    UBYTE check_dir = (actor->pos.y > params->Y) ? CHECK_DIR_UP : CHECK_DIR_DOWN;
                    params->Y = check_collision_in_direction((params->X >> 7), (actor->pos.y >> 7), (params->Y >> 7), check_dir) << 7;
                }
            } else {
                // Check for vertical collision
                if (actor->pos.y != params->Y) {
                    UBYTE check_dir = (actor->pos.y > params->Y) ? CHECK_DIR_UP : CHECK_DIR_DOWN;
                    params->Y = check_collision_in_direction((actor->pos.x >> 7), (actor->pos.y >> 7), (params->Y >> 7), check_dir) << 7;
                }
                // Check for horizontal collision
                if (actor->pos.x != params->X) {
                    UBYTE check_dir = (actor->pos.x > params->X) ? CHECK_DIR_LEFT : CHECK_DIR_RIGHT;
                    params->X = check_collision_in_direction((actor->pos.x >> 7), (params->Y >> 7), (params->X >> 7), check_dir) << 7;
                }
            }
        }
    }

    // Actor reached destination
    if ((actor->pos.x == params->X) && (actor->pos.y == params->Y)) {
        THIS->flags = 0;
        actor_set_anim_idle(actor);
        return;
    }

    // Actor not at horizontal destination
    if ((actor->pos.x != params->X) &&
        ((params->ATTR & ACTOR_ATTR_H_FIRST) || (actor->pos.y == params->Y))) {
        if (actor->pos.x < params->X) {
            new_dir = DIR_RIGHT;
        } else if (actor->pos.x > params->X) {
            new_dir = DIR_LEFT;
        }
    } else {
        // Actor not at vertical destination
        if (actor->pos.y < params->Y) {
            new_dir = DIR_DOWN;
        } else if (actor->pos.y > params->Y) {
            new_dir = DIR_UP;
        }
    }

    // If changed direction, trigger actor rerender
    if (actor->dir != new_dir) {
        actor_set_dir(actor, new_dir, TRUE);        
    }

    // Move actor
    point_translate_dir(&actor->pos, actor->dir, actor->move_speed);

    THIS->PC -= (INSTRUCTION_SIZE + sizeof(idx));
    return;
}

void vm_actor_activate(SCRIPT_CTX * THIS, INT16 idx) __banked {    
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    activate_actor(actors + *n_actor);
}

void vm_actor_deactivate(SCRIPT_CTX * THIS, INT16 idx) __banked {    
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    deactivate_actor(actors + *n_actor);
}

void vm_actor_set_dir(SCRIPT_CTX * THIS, INT16 idx, direction_e dir) __banked {
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    actor_set_dir(actors + *n_actor, dir, FALSE);
}

void vm_actor_set_anim(SCRIPT_CTX * THIS, INT16 idx, INT16 idx_anim) __banked {
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    UBYTE * n_anim = VM_REF_TO_PTR(idx_anim);
    actor_set_anim(actors + *n_actor, *n_anim);
}

void vm_actor_set_pos(SCRIPT_CTX * THIS, INT16 idx) __banked {
    actor_t *actor;
    
    act_set_pos_t * params = VM_REF_TO_PTR(idx);
    actor = actors + (UBYTE)(params->ID);

    actor->pos.x = params->X;
    actor->pos.y = params->Y;
}

void vm_actor_get_pos(SCRIPT_CTX * THIS, INT16 idx) __banked {
    actor_t *actor;
    
    act_set_pos_t * params = VM_REF_TO_PTR(idx);
    actor = actors + (UBYTE)(params->ID);

    params->X = actor->pos.x;
    params->Y = actor->pos.y;
}

void vm_actor_emote(SCRIPT_CTX * THIS, INT16 idx, UBYTE emote_sprite_bank, spritesheet_t *emote_sprite) __banked {

    // on first call load emote sprite 
    if (THIS->flags == 0) {
        UBYTE * n_actor = VM_REF_TO_PTR(idx);
        THIS->flags = 1;
        emote_actor = actors + *n_actor;
        emote_timer = 1;
        load_emote(emote_sprite, emote_sprite_bank);
    }

    if (emote_timer == EMOTE_TOTAL_FRAMES) {
        // Reset ctx flags
        THIS->flags = 0;
        emote_actor = NULL;
    } else {
        THIS->waitable = 1;
        emote_timer++;
        THIS->PC -= (INSTRUCTION_SIZE + sizeof(idx) + sizeof(emote_sprite_bank) + sizeof(emote_sprite));
    }
}

void vm_actor_set_bounds(SCRIPT_CTX * THIS, INT16 idx, BYTE left, BYTE right, BYTE top, BYTE bottom) __banked {
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    actor_t * actor = actors + *n_actor;
    actor->bounds.left = left;
    actor->bounds.right = right;
    actor->bounds.top = top;
    actor->bounds.bottom = bottom;
}

void vm_actor_set_spritesheet(SCRIPT_CTX * THIS, INT16 idx, UBYTE spritesheet_bank, const spritesheet_t *spritesheet) __banked {
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    actor_t * actor = actors + *n_actor;
    load_sprite(actor->base_tile, spritesheet, spritesheet_bank);
    actor->sprite.bank = spritesheet_bank;
    actor->sprite.ptr = (void *)spritesheet;
    load_animations(spritesheet, spritesheet_bank, actor->animations);
    actor_reset_anim(actor);
}

void vm_actor_replace_tile(SCRIPT_CTX * THIS, INT16 idx, UBYTE target_tile, UBYTE tileset_bank, const tileset_t * tileset, UBYTE start_tile, UBYTE length) __banked {
    UBYTE * n_actor = VM_REF_TO_PTR(idx);
    actor_t * actor = actors + *n_actor;
    SetBankedSpriteData(actor->base_tile + target_tile, length, tileset->tiles + (start_tile << 4), tileset_bank);
}
