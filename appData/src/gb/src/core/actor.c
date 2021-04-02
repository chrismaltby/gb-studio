#pragma bank 1

#include <gb/gb.h>
#include <string.h>

#include "actor.h"
#include "game_time.h"
#include "scroll.h"
#include "linked_list.h"
#include "math.h"
#include "collision.h"
#include "metasprite.h"
#include "vm.h"

#ifdef STRICT
    #include <gb/bgb_emu.h>
    #include <gb/crash_handler.h>
#endif

#define EMOTE_BOUNCE_FRAMES        15
#define EMOTE_TILE                 124

#define BANK_EMOTE_METASPRITE 1

const BYTE emote_offsets[] = {2, 1, 0, -1, -2, -3, -4, -5, -6, -5, -4, -3, -2, -1, 0};

const metasprite_t emote_metasprite[]  = {
    {0, 0, 0, 0}, {0, 8, 2, 0}, {metasprite_end}
};

actor_t actors[MAX_ACTORS];
actor_t *actors_active_head;
actor_t *actors_inactive_head;

UINT8 screen_x, screen_y;
actor_t *invalid;
UBYTE player_moving;
UBYTE player_iframes;
actor_t *player_collision_actor;
far_ptr_t *script_p_hit1, script_p_hit2, script_p_hit3;
actor_t *emote_actor;
UBYTE emote_timer;

UBYTE allocated_hardware_sprites;

void actors_init() __banked {
    actors_active_head = actors_inactive_head = NULL;
    player_moving           = FALSE;
    player_iframes          = 0;
    player_collision_actor  = NULL;
    emote_actor             = NULL;

    memset(actors, 0, sizeof(actors));
}

void player_init() __banked {
    actor_set_anim_idle(&PLAYER);
    PLAYER.hidden = FALSE;
}

void actors_update() __nonbanked {
    UBYTE _save = _current_bank;
    static actor_t *actor;

    // PLAYER is always last in the active list and always present
    actor = &PLAYER;

    if (emote_actor) {
        SWITCH_ROM_MBC1(BANK_EMOTE_METASPRITE); // bank of emote_offsets[] and emote_metasprite[]
        screen_x = (emote_actor->pos.x >> 4) - scroll_x + 8;
        screen_y = (emote_actor->pos.y >> 4) - scroll_y - 16;   
        if (emote_timer < EMOTE_BOUNCE_FRAMES) {
            screen_y += emote_offsets[emote_timer];
        }             
        allocated_hardware_sprites += move_metasprite(
            emote_metasprite,
            EMOTE_TILE,
            allocated_hardware_sprites,
            screen_x,
            screen_y
        );        
    }

    while (actor) {
        if (actor->pinned) 
            screen_x = (actor->pos.x >> 4) + 8, screen_y = (actor->pos.y >> 4) + 8;
        else 
            screen_x = (actor->pos.x >> 4) - draw_scroll_x + 8, screen_y = (actor->pos.y >> 4) - draw_scroll_y + 8;

        if (
            // Offscreen horizontally
            ((screen_x > 168) && (screen_x < 256 - actor->bounds.right)) ||
            // or offscreen vertically
            ((screen_y > 160) && (screen_y < 256 + actor->bounds.top))
        ) {
            // Deactivate if offscreen
            actor_t * prev = actor->prev;
            deactivate_actor(actor);
            actor = prev;
            continue;
        } else if ((WX_REG != 7) && (WX_REG < (UINT8)screen_x + 8) && (WY_REG < (UINT8)(screen_y)-8)) {
            // Hide if under window (don't deactivate)
            actor = actor->prev;
            continue;
        } else if (actor->hidden) {
            actor = actor->prev;
            continue;            
        }

        // Check reached animation tick frame
        if ((game_time & actor->anim_tick) == 0) {
            actor->frame++;
            // Check reached end of animation
            if (actor->frame == actor->frame_end) {
                actor->frame = actor->frame_start;
            }
        }

        SWITCH_ROM_MBC1(actor->sprite.bank);
        spritesheet_t *sprite = actor->sprite.ptr;
        
        allocated_hardware_sprites += move_metasprite(
            *(sprite->metasprites + actor->frame),
            actor->base_tile,
            allocated_hardware_sprites,
            screen_x,
            screen_y
        );

        actor = actor->prev;
    }

    SWITCH_ROM_MBC1(_save);
}

void deactivate_actor(actor_t *actor) __banked {
#ifdef STRICT
    // Check exists in inactive list
    UBYTE found = 0;
    actor_t *current = actors_active_head;
    DL_CONTAINS(current, actor, found);
    if (!found)
    {
        BGB_MESSAGE("Deactivated non active actor\n");
        __HandleCrash();
        return;
    }
#endif
    if (!actor->enabled) return;
    if (actor == &PLAYER) return;
    actor->enabled = FALSE;
    DL_REMOVE_ITEM(actors_active_head, actor);
    DL_PUSH_HEAD(actors_inactive_head, actor);
    if (actor->ctx_id) {
        script_terminate(actor->ctx_id);
        actor->ctx_id = 0;
    }
}

void activate_actor(actor_t *actor) __banked {
#ifdef STRICT
    // Check exists in inactive list
    UBYTE found = 0;
    actor_t *current = actors_inactive_head;
    DL_CONTAINS(current, actor, found);
    if (!found)
    {
        BGB_MESSAGE("Activated non inactive actor\n");
        __HandleCrash();
        return;
    }
#endif
    if (actor->enabled) return;
    actor->enabled = TRUE;
    actor_set_anim_idle(actor);
    DL_REMOVE_ITEM(actors_inactive_head, actor);
    DL_PUSH_HEAD(actors_active_head, actor);
    if (actor->script_update.bank) {
        SCRIPT_CTX *ctx = script_execute(actor->script_update.bank, actor->script_update.ptr, 0, 0);
        actor->ctx_id = ctx->ID;
    }
}

void activate_actors_in_row(UBYTE x, UBYTE y) __banked {
    static actor_t *actor;
    actor = actors_inactive_head;

    while (actor) {
        UBYTE ty = actor->pos.y >> 7;
        if (ty == y) {
            UBYTE tx = actor->pos.x >> 7;
            if ((tx + 1 > x) && (tx < x + SCREEN_TILE_REFRES_W)) {
                actor_t * next = actor->next;
                activate_actor(actor);
                actor = next;
                continue;
            }
        }
        actor = actor->next;
    }    
}

void activate_actors_in_col(UBYTE x, UBYTE y) __banked {
    static actor_t *actor;
    actor = actors_inactive_head;
    while (actor) {
        UBYTE tx_left   = actor->pos.x >> 7;
        UBYTE ty_bottom = actor->pos.y >> 7;
        UBYTE tx_right  = ((actor->pos.x >> 4) + (actor->bounds.right)) >> 3;
        UBYTE ty_top    = ((actor->pos.y >> 4) + (actor->bounds.top)) >> 3;
        if (tx_left <= x && tx_right >= x && ty_top <= (y + SCREEN_TILE_REFRES_H) && ty_bottom >= y) {
            actor_t * next = actor->next;
            activate_actor(actor);
            actor=next;
            continue;
        }
        actor = actor->next;
    }
}

void actor_set_frames(actor_t *actor, UBYTE frame_start, UBYTE frame_end) __banked {
    if (actor->frame_start != frame_start || actor->frame_end != frame_end) {
        actor->frame = frame_start;
        actor->frame_start = frame_start;
        actor->frame_end = frame_end;
    }
}

void actor_set_anim_idle(actor_t *actor) __banked {
    actor_set_anim(actor, actor->dir);
}

void actor_set_anim_moving(actor_t *actor) __banked {
    actor_set_anim(actor, actor->dir + N_DIRECTIONS);
}

void actor_set_dir(actor_t *actor, direction_e dir, UBYTE moving) __banked {
    actor->dir = dir;
    if (moving) {
        actor_set_anim(actor, dir + N_DIRECTIONS);
    } else {
        actor_set_anim(actor, dir);
    }
}

actor_t *actor_at_tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked {
    for (actor_t *actor = actors_active_head; (actor); actor = actor->next) {
        if ((!inc_noclip && !actor->collision_enabled))
            continue;

        UBYTE a_tx = (actor->pos.x >> 7), a_ty = (actor->pos.y >> 7);
        if ((ty == a_ty || ty == a_ty + 1) && (tx == a_tx || tx == a_tx + 1 || tx == a_tx - 1)) return actor;
    }
    return NULL;
}

actor_t *actor_at_3x3_tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked {
    for (actor_t *actor = actors_active_head; (actor); actor = actor->next) {
        if ((!inc_noclip && !actor->collision_enabled))
            continue;

        UBYTE a_tx = (actor->pos.x >> 7), a_ty = (actor->pos.y >> 7);
        if ((ty == a_ty || ty == a_ty - 1 || ty == a_ty - 2) && (tx == a_tx || tx == a_tx - 1 || tx == a_tx - 2)) return actor;
    }
    return NULL;
}

actor_t *actor_at_1x3_tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked {
    for (actor_t *actor = actors_active_head; (actor); actor = actor->next) {
        if ((!inc_noclip && !actor->collision_enabled))
            continue;

        UBYTE a_tx = (actor->pos.x >> 7), a_ty = (actor->pos.y >> 7);
        if ((ty == a_ty || ty == a_ty - 1 || ty == a_ty - 2) && (tx == a_tx)) return actor;
    }
    return NULL;
}

actor_t *actor_at_3x1_tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked {
    for (actor_t *actor = actors_active_head; (actor); actor = actor->next) {
        if ((!inc_noclip && !actor->collision_enabled)) 
            continue;

        UBYTE a_tx = (actor->pos.x >> 7), a_ty = (actor->pos.y >> 7);
        if ((ty == a_ty) && (tx == a_tx || tx == a_tx - 1 || tx == a_tx - 2)) return actor;
    }
    return NULL;
}

actor_t *actor_at_1x2_tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked {
    for (actor_t *actor = actors_active_head; (actor); actor = actor->next) {
        if ((!inc_noclip && !actor->collision_enabled))
            continue;

        UBYTE a_tx = (actor->pos.x >> 7), a_ty = (actor->pos.y >> 7);
        if ((ty == a_ty || ty == a_ty - 1) && (tx == a_tx)) return actor;
    }
    return NULL;
}

actor_t *actor_in_front_of_player(UBYTE grid_size, UBYTE inc_noclip) __banked {
    UBYTE tile_x = (PLAYER.pos.x >> 7), tile_y = (PLAYER.pos.y >> 7);

    if (grid_size == 16) {
        if (PLAYER.dir == DIR_UP) {
            return actor_at_3x3_tile(tile_x - 1, tile_y - 3, inc_noclip);
        } else if (PLAYER.dir == DIR_DOWN) {
            return actor_at_3x3_tile(tile_x - 1, tile_y + 1, inc_noclip);
        } else {
            if (PLAYER.dir == DIR_LEFT) {
                return actor_at_3x3_tile(tile_x - 3, tile_y - 1, inc_noclip);
            } else if (PLAYER.dir == DIR_RIGHT) {
                return actor_at_3x3_tile(tile_x + 1, tile_y - 1, inc_noclip);
            }
        }
    } else {
        if (PLAYER.dir == DIR_UP) {
            return actor_at_3x1_tile(tile_x - 1, tile_y - 1, inc_noclip);
        } else if (PLAYER.dir == DIR_DOWN) {
            return actor_at_3x1_tile(tile_x - 1, tile_y + 2, inc_noclip);
        } else {
            if (PLAYER.dir == DIR_LEFT) {
                return actor_at_1x2_tile(tile_x - 2, tile_y, inc_noclip);
            } else if (PLAYER.dir == DIR_RIGHT) {
                return actor_at_1x2_tile(tile_x + 2, tile_y, inc_noclip);
            }
        }
    }

    return NULL;
}

actor_t *actor_overlapping_player(UBYTE inc_noclip) __banked {
    actor_t *actor = PLAYER.prev;

    while (actor) {
        if (!inc_noclip && !actor->collision_enabled) {
            actor = actor->prev;
            continue;
        };

        if (bb_intersects(&PLAYER.bounds, &PLAYER.pos, &actor->bounds, &actor->pos)) {
            return actor;
        }

        actor = actor->prev;
    }

    return NULL;
}

actor_t *actor_overlapping_bb(bounding_box_t *bb, upoint16_t *offset, UBYTE inc_noclip) __banked {
    actor_t *actor = &PLAYER;

    while (actor) {
        if (!inc_noclip && !actor->collision_enabled) {
            actor = actor->prev;
            continue;
        };

        if (bb_intersects(bb, offset, &actor->bounds, &actor->pos)) {
            return actor;
        }

        actor = actor->prev;
    }

    return NULL;
}

void actors_handle_player_collision() __banked {
    if (player_iframes == 0 && player_collision_actor != NULL) {
        if (player_collision_actor->collision_group) {
            // Execute scene player hit scripts based on actor's collision group
            switch (player_collision_actor->collision_group) {
                case COLLISION_GROUP_1: {
                    if (PLAYER.script_hit1.bank) {
                        script_execute(PLAYER.script_hit1.bank, PLAYER.script_hit1.ptr, 0, 0);
                    }
                    break;
                }
                case COLLISION_GROUP_2: {
                    if (PLAYER.script_hit2.bank) {
                        script_execute(PLAYER.script_hit2.bank, PLAYER.script_hit2.ptr, 0, 0);
                    }
                    break;
                }                
                case COLLISION_GROUP_3: {
                    if (PLAYER.script_hit3.bank) {
                        script_execute(PLAYER.script_hit3.bank, PLAYER.script_hit3.ptr, 0, 0);
                    }
                    break;
                } 
            }
  
            // Execute actor's onHit player script
            if (player_collision_actor->script.bank) {
                script_execute(player_collision_actor->script.bank,
                               player_collision_actor->script.ptr, 0, 0);
            }

            // Set player to be invicible for N frames
            player_iframes = PLAYER_HURT_IFRAMES;
        }
    } else if (player_iframes != 0) {
        player_iframes--;
    }
    player_collision_actor = NULL; 
}

UBYTE check_collision_in_direction(UBYTE start_x, UBYTE start_y, UBYTE end_tile, col_check_dir_e check_dir) __banked {
    switch (check_dir) {
        case CHECK_DIR_LEFT:  // Check left
            while (start_x != end_tile) {
                    if (tile_at_2x2(start_x - 1, start_y - 1) ||                    // Tile left
                        actor_at_1x3_tile(start_x - 2, start_y - 1, FALSE) != NULL  // Actor left
                    ) {
                        return start_x;
                    }
                    start_x--;
            }
            return end_tile;
        case CHECK_DIR_RIGHT:  // Check right
            while (start_x != end_tile) {
                if (tile_at_2x2(start_x + 1, start_y - 1) ||                    // Tile right
                    actor_at_1x3_tile(start_x + 2, start_y - 1, FALSE) != NULL  // Actor right
                ) {
                    return start_x;
                }
                start_x++;
            }
            return end_tile;
        case CHECK_DIR_UP:  // Check up
            while (start_y != end_tile) {
                if (tile_at_2x2(start_x, start_y - 2) ||                          // Tile up
                    (actor_at_3x1_tile(start_x - 1, start_y - 2, FALSE) != NULL)  // Actor up
                ) {
                return start_y;
                }
                start_y--;
            }
            return end_tile;
        case CHECK_DIR_DOWN:  // Check down
            while (start_y != end_tile) {
                if (tile_at_2x2(start_x, start_y) ||                               // Tile down
                    actor_at_3x1_tile(start_x - 1, start_y + 1, FALSE) != NULL ||  // Actor down 1 tile
                    actor_at_3x1_tile(start_x - 1, start_y + 2, FALSE) != NULL     // Actor down 2 tiles
                ) {
                return start_y;
                }
                start_y++;
            }
            return end_tile;
    }
    return end_tile;
}
