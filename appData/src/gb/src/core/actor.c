#pragma bank 255

#include "actor.h"

#include <gb/gb.h>
#include <gb/metasprites.h>
#include <string.h>

#include "system.h"
#include "interrupts.h"
#include "game_time.h"
#include "scroll.h"
#include "linked_list.h"
#include "math.h"
#include "collision.h"
#include "ui.h"
#include "vm.h"

#ifdef STRICT
    #include <gb/bgb_emu.h>
    #include <gb/crash_handler.h>
#endif

#define EMOTE_BOUNCE_FRAMES        15
#define EMOTE_TILE                 124
#define ANIM_PAUSED                255

#define TILE16_OFFSET              64u
#define SCREEN_TILE16_W            10u
#define SCREEN_TILE16_H            9u
#define ACTOR_BOUNDS_TILE16        6u
#define ACTOR_BOUNDS_TILE16_HALF   3u


#ifdef CGB
#define NO_OVERLAY_PRIORITY ((!_is_CGB) && ((overlay_priority & S_PRIORITY) == 0))
#else
#define NO_OVERLAY_PRIORITY (TRUE)
#endif

BANKREF(ACTOR)

const BYTE emote_offsets[] = {2, 1, 0, -1, -2, -3, -4, -5, -6, -5, -4, -3, -2, -1, 0};

const metasprite_t emote_metasprite[]  = {
    {0, 0, 0, 7}, {0, 8, 2, 7}, {metasprite_end}
};

actor_t actors[MAX_ACTORS];
actor_t * actors_active_head;
actor_t * actors_active_tail;
actor_t * actors_inactive_head;

UINT8 screen_x, screen_y;
actor_t * invalid;
UBYTE player_moving;
UBYTE player_iframes;
actor_t * player_collision_actor;
actor_t * emote_actor;
UBYTE emote_timer;

UBYTE allocated_hardware_sprites;

void actors_init() BANKED {
    actors_active_tail = actors_active_head = actors_inactive_head = NULL;
    player_moving           = FALSE;
    player_iframes          = 0;
    player_collision_actor  = NULL;
    emote_actor             = NULL;

    memset(actors, 0, sizeof(actors));
}

void player_init() BANKED {
    actor_set_anim_idle(&PLAYER);
    PLAYER.hidden = FALSE;
    PLAYER.disabled = FALSE;
}

void actors_update() NONBANKED {
    UBYTE _save = _current_bank;
    static actor_t *actor;
    static uint8_t screen_tile16_x, screen_tile16_y;
    static uint8_t actor_tile16_x, actor_tile16_y;

    // Convert scroll pos to 16px tile coordinates
    // allowing full range of scene to be represented in 7 bits
    // offset by 64 to allow signed comparisions on
    // unsigned int values (is faster)
    screen_tile16_x = (draw_scroll_x >> 4) + TILE16_OFFSET;
    screen_tile16_y = (draw_scroll_y >> 4) + TILE16_OFFSET;

    if (emote_actor) {
        SWITCH_ROM(emote_actor->sprite.bank);
        spritesheet_t *sprite = emote_actor->sprite.ptr;
        screen_x = (emote_actor->pos.x >> 4) - scroll_x + 8 + sprite->emote_origin.x;
        screen_y = (emote_actor->pos.y >> 4) - scroll_y + 8 + sprite->emote_origin.y;

        SWITCH_ROM(BANK(ACTOR));  // bank of emote_offsets[] and emote_metasprite[]
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

    actor = actors_active_tail;
    while (actor) {
        if (actor->pinned) {
            screen_x = (actor->pos.x >> 4) + 8, screen_y = (actor->pos.y >> 4) + 8;
        } else {
            screen_x = (actor->pos.x >> 4) - draw_scroll_x + 8, screen_y = (actor->pos.y >> 4) - draw_scroll_y + 8;
            // Bottom right coordinate of actor in 16px tile coordinates
            // Subtract bounding box estimate width/height
            // and offset by 64 to allow signed comparisons with screen tiles
            actor_tile16_x = (actor->pos.x >> 8) + ACTOR_BOUNDS_TILE16_HALF + TILE16_OFFSET;
            actor_tile16_y = (actor->pos.y >> 8) + ACTOR_BOUNDS_TILE16_HALF + TILE16_OFFSET;

            if (
                // Actor right edge < screen left edge
                (actor_tile16_x < screen_tile16_x) ||
                // Actor left edge > screen right edge
                (actor_tile16_x - ACTOR_BOUNDS_TILE16 - SCREEN_TILE16_W > screen_tile16_x) ||
                // Actor bottom edge < screen top edge
                (actor_tile16_y < screen_tile16_y) ||
                // Actor top edge > screen bottom edge
                (actor_tile16_y - ACTOR_BOUNDS_TILE16 - SCREEN_TILE16_H > screen_tile16_y)
            ) {
                if (actor->persistent) {
                    actor = actor->prev;
                    continue;
                }
                // Deactivate if offscreen
                actor_t * prev = actor->prev;
                if (!VM_ISLOCKED()) deactivate_actor(actor);
                actor = prev;
                continue;
            }
        }
        if (NO_OVERLAY_PRIORITY && (!show_actors_on_overlay) && (WX_REG != MINWNDPOSX) && (WX_REG < (UINT8)screen_x + 8) && (WY_REG < (UINT8)(screen_y) - 8)) {
            // Hide if under window (don't deactivate)
            actor = actor->prev;
            continue;
        } else if (actor->hidden) {
            actor = actor->prev;
            continue;
        }

        // Check reached animation tick frame
        if ((actor->anim_tick != ANIM_PAUSED) && (game_time & actor->anim_tick) == 0) {
            actor->frame++;
            // Check reached end of animation
            if (actor->frame == actor->frame_end) {
                if (actor->anim_noloop) {
                    actor->frame--;
                    // TODO: execute onAnimationEnd here + set to ANIM_PAUSED?
                } else {
                    actor->frame = actor->frame_start;
                }
            }
        }

        SWITCH_ROM(actor->sprite.bank);
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

    SWITCH_ROM(_save);
}

void deactivate_actor(actor_t *actor) BANKED {
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
    if (!actor->active) return;
    if (actor == &PLAYER) return;
    actor->active = FALSE;
    DL_REMOVE_ITEM(actors_active_head, actor);
    DL_PUSH_HEAD(actors_inactive_head, actor);
    if ((actor->hscript_update & SCRIPT_TERMINATED) == 0) {
        script_terminate(actor->hscript_update);
    }
    if ((actor->hscript_hit & SCRIPT_TERMINATED) == 0) {
        script_detach_hthread(actor->hscript_hit);
    }
}

void activate_actor(actor_t *actor) BANKED {
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
    if (actor->active || actor->disabled) return;
    actor->active = TRUE;
    actor_set_anim_idle(actor);
    DL_REMOVE_ITEM(actors_inactive_head, actor);
    DL_PUSH_HEAD(actors_active_head, actor);
    actor->hscript_update = SCRIPT_TERMINATED;
    if (actor->script_update.bank) {
        script_execute(actor->script_update.bank, actor->script_update.ptr, &(actor->hscript_update), 0);
    }
    actor->hscript_hit = SCRIPT_TERMINATED;
}

void activate_actors_in_row(UBYTE x, UBYTE y) BANKED {
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

void activate_actors_in_col(UBYTE x, UBYTE y) BANKED {
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

void actor_set_frames(actor_t *actor, UBYTE frame_start, UBYTE frame_end) BANKED {
    if ((actor->frame_start != frame_start) || (actor->frame_end != frame_end)) {
        actor->frame = frame_start;
        actor->frame_start = frame_start;
        actor->frame_end = frame_end;
    }
}

void actor_set_frame_offset(actor_t *actor, UBYTE frame_offset) BANKED {
    actor->frame = actor->frame_start + (frame_offset % (actor->frame_end - actor->frame_start));
}

UBYTE actor_get_frame_offset(actor_t *actor) BANKED {
    return actor->frame - actor->frame_start;
}

void actor_set_anim_idle(actor_t *actor) BANKED {
    actor_set_anim(actor, actor->dir);
}

void actor_set_anim_moving(actor_t *actor) BANKED {
    actor_set_anim(actor, actor->dir + N_DIRECTIONS);
}

void actor_set_dir(actor_t *actor, direction_e dir, UBYTE moving) BANKED {
    actor->dir = dir;
    if (moving) {
        actor_set_anim(actor, dir + N_DIRECTIONS);
    } else {
        actor_set_anim(actor, dir);
    }
}

actor_t *actor_at_tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) BANKED {
    for (actor_t *actor = actors_active_head; (actor); actor = actor->next) {
        if ((!inc_noclip && !actor->collision_enabled))
            continue;

        UBYTE a_tx = (actor->pos.x >> 7), a_ty = (actor->pos.y >> 7);
        if ((ty == a_ty || ty == a_ty + 1) && (tx == a_tx || tx == a_tx + 1 || tx == a_tx - 1)) return actor;
    }
    return NULL;
}

actor_t *actor_in_front_of_player(UBYTE grid_size, UBYTE inc_noclip) BANKED {
    upoint16_t offset;
    offset.x = PLAYER.pos.x;
    offset.y = PLAYER.pos.y;
    point_translate_dir_word(&offset, PLAYER.dir, grid_size << 4);
    return actor_overlapping_bb(&PLAYER.bounds, &offset, &PLAYER, inc_noclip);
}

actor_t *actor_overlapping_player(UBYTE inc_noclip) BANKED {
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

actor_t *actor_overlapping_bb(bounding_box_t *bb, upoint16_t *offset, actor_t *ignore, UBYTE inc_noclip) BANKED {
    actor_t *actor = &PLAYER;

    while (actor) {
        if (actor == ignore || (!inc_noclip && !actor->collision_enabled)) {
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

void actors_handle_player_collision() BANKED {
    if (player_iframes == 0 && player_collision_actor != NULL) {
        if (player_collision_actor->collision_group) {
            // Execute scene player hit scripts based on actor's collision group
            if (PLAYER.script.bank) {
                script_execute(PLAYER.script.bank, PLAYER.script.ptr, 0, 1, (UWORD)(player_collision_actor->collision_group));
            }
            // Execute actor's onHit player script
            if (player_collision_actor->script.bank) {
                script_execute(player_collision_actor->script.bank,
                               player_collision_actor->script.ptr, 0, 1, 0);
            }

            // Set player to be invicible for N frames
            player_iframes = PLAYER_HURT_IFRAMES;
        }
    } else if (player_iframes != 0) {
        player_iframes--;
    }
    player_collision_actor = NULL;
}

UWORD check_collision_in_direction(UWORD start_x, UWORD start_y, bounding_box_t *bounds, UWORD end_pos, col_check_dir_e check_dir) BANKED {
    WORD tx1, ty1, tx2, ty2, tt;
    switch (check_dir) {
        case CHECK_DIR_LEFT:  // Check left
            tx1 = (((start_x >> 4) + bounds->left) >> 3);
            tx2 = (((end_pos >> 4) + bounds->left) >> 3) - 1;
            ty1 = (((start_y >> 4) + bounds->top) >> 3);
            ty2 = (((start_y >> 4) + bounds->bottom) >> 3) + 1;
            while (tx1 != tx2) {
                tt = ty1;
                while (tt != ty2) {
                    if (tile_at(tx1, tt) & COLLISION_RIGHT) {
                        return ((tx1 + 1) << 7) - (bounds->left << 4);
                    }
                    tt++;
                }
                tx1--;
            }
            return end_pos;
        case CHECK_DIR_RIGHT:  // Check right
            tx1 = (((start_x >> 4) + bounds->right) >> 3);
            tx2 = (((end_pos >> 4) + bounds->right) >> 3) + 1;
            ty1 = (((start_y >> 4) + bounds->top) >> 3);
            ty2 = (((start_y >> 4) + bounds->bottom) >> 3) + 1;
            while (tx1 != tx2) {
                tt = ty1;
                while (tt != ty2) {
                    if (tile_at(tx1, tt) & COLLISION_LEFT) {
                        return (tx1 << 7) - ((bounds->right + 1) << 4);
                    }
                    tt++;
                }
                tx1++;
            }
            return end_pos;
        case CHECK_DIR_UP:  // Check up
            ty1 = (((start_y >> 4) + bounds->top) >> 3);
            ty2 = (((end_pos >> 4) + bounds->top) >> 3) - 1;
            tx1 = (((start_x >> 4) + bounds->left) >> 3);
            tx2 = (((start_x >> 4) + bounds->right) >> 3) + 1;
            while (ty1 != ty2) {
                tt = tx1;
                while (tt != tx2) {
                    if (tile_at(tt, ty1) & COLLISION_BOTTOM) {
                        return ((ty1 + 1) << 7) - ((bounds->top) << 4);
                    }
                    tt++;
                }
                ty1--;
            }
            return end_pos;
        case CHECK_DIR_DOWN:  // Check down
            ty1 = (((start_y >> 4) + bounds->bottom) >> 3);
            ty2 = (((end_pos >> 4) + bounds->bottom) >> 3) + 1;
            tx1 = (((start_x >> 4) + bounds->left) >> 3);
            tx2 = (((start_x >> 4) + bounds->right) >> 3) + 1;
            while (ty1 != ty2) {
                tt = tx1;
                while (tt != tx2) {
                    if (tile_at(tt, ty1) & COLLISION_TOP) {
                        return ((ty1) << 7) - ((bounds->bottom + 1) << 4);
                    }
                    tt++;
                }
                ty1++;
            }
            return end_pos;
    }
    return end_pos;
}
