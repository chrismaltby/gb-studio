#pragma bank 255

#include "data/states_defines.h"
#include "states/topdown.h"

#include "actor.h"
#include "camera.h"
#include "collision.h"
#include "data_manager.h"
#include "game_time.h"
#include "input.h"
#include "trigger.h"
#include "math.h"
#include "vm.h"

#ifndef INPUT_TOPDOWN_INTERACT
#define INPUT_TOPDOWN_INTERACT INPUT_A
#endif

UBYTE topdown_grid;

void topdown_init() BANKED {
    camera_offset_x = 0;
    camera_offset_y = 0;
    camera_deadzone_x = 0;
    camera_deadzone_y = 0;

    if (topdown_grid == 16) {
        // Snap to 16px grid
        PLAYER.pos.x = ((PLAYER.pos.x >> 8) << 8);
        PLAYER.pos.y = ((PLAYER.pos.y >> 8) << 8) + 128;
    } else {
        PLAYER.pos.x = ((PLAYER.pos.x >> 7) << 7);
        PLAYER.pos.y = ((PLAYER.pos.y >> 7) << 7);
    }
}

void topdown_update() BANKED {
    actor_t *hit_actor;
    UBYTE tile_start, tile_end;
    direction_e new_dir = DIR_NONE;

    // Is player on an 8x8px tile?
    if ((topdown_grid == 16 && ON_16PX_GRID(PLAYER.pos)) ||
        (topdown_grid == 8 && ON_8PX_GRID(PLAYER.pos))) {
        // Player landed on an tile
        // so stop movement for now
        player_moving = FALSE;

        // Check for trigger collisions
        if (trigger_activate_at_intersection(&PLAYER.bounds, &PLAYER.pos, FALSE)) {
            // Landed on a trigger
            return;
        }

        // Check input to set player movement
        if (INPUT_RECENT_LEFT) {
            player_moving = TRUE;
            new_dir = DIR_LEFT;

            // Check for collisions to left of player
            tile_start = (((PLAYER.pos.y >> 4) + PLAYER.bounds.top)    >> 3);
            tile_end   = (((PLAYER.pos.y >> 4) + PLAYER.bounds.bottom) >> 3) + 1;
            UBYTE tile_x = ((PLAYER.pos.x >> 4) + PLAYER.bounds.left) >> 3;
            while (tile_start != tile_end) {
                if (tile_at(tile_x - 1, tile_start) & COLLISION_RIGHT) {
                    player_moving = FALSE;
                    break;
                }
                tile_start++;
            }
        } else if (INPUT_RECENT_RIGHT) {
            player_moving = TRUE;
            new_dir = DIR_RIGHT;

            // Check for collisions to right of player
            tile_start = (((PLAYER.pos.y >> 4) + PLAYER.bounds.top)    >> 3);
            tile_end   = (((PLAYER.pos.y >> 4) + PLAYER.bounds.bottom) >> 3) + 1;
            UBYTE tile_x = ((PLAYER.pos.x >> 4) + PLAYER.bounds.right) >> 3;
            while (tile_start != tile_end) {
                if (tile_at(tile_x + 1, tile_start) & COLLISION_LEFT) {
                    player_moving = FALSE;
                    break;
                }
                tile_start++;
            }
        } else if (INPUT_RECENT_UP) {
            player_moving = TRUE;
            new_dir = DIR_UP;

            // Check for collisions below player
            tile_start = (((PLAYER.pos.x >> 4) + PLAYER.bounds.left)  >> 3);
            tile_end   = (((PLAYER.pos.x >> 4) + PLAYER.bounds.right) >> 3) + 1;
            UBYTE tile_y = ((PLAYER.pos.y >> 4) + PLAYER.bounds.top) >> 3;
            while (tile_start != tile_end) {
                if (tile_at(tile_start, tile_y - 1) & COLLISION_BOTTOM) {
                    player_moving = FALSE;
                    break;
                }
                tile_start++;
            }
        } else if (INPUT_RECENT_DOWN) {
            player_moving = TRUE;
            new_dir = DIR_DOWN;

            // Check for collisions below player
            tile_start = (((PLAYER.pos.x >> 4) + PLAYER.bounds.left)  >> 3);
            tile_end   = (((PLAYER.pos.x >> 4) + PLAYER.bounds.right) >> 3) + 1;
            UBYTE tile_y = ((PLAYER.pos.y >> 4) + PLAYER.bounds.bottom) >> 3;
            while (tile_start != tile_end) {
                if (tile_at(tile_start, tile_y + 1) & COLLISION_TOP) {
                    player_moving = FALSE;
                    break;
                }
                tile_start++;
            }
        }

        // Update direction animation
        if (new_dir != DIR_NONE) {
            actor_set_dir(&PLAYER, new_dir, player_moving);
        } else {
            actor_set_anim_idle(&PLAYER);
        }

        if (IS_FRAME_ODD) {
            // Check for actor overlap
            hit_actor = actor_overlapping_player(FALSE);
            if (hit_actor != NULL && hit_actor->collision_group) {
                player_register_collision_with(hit_actor);
            }
        }

        // Check if walked in to actor
        if (player_moving) {
            hit_actor = actor_in_front_of_player(topdown_grid, FALSE);
            if (hit_actor != NULL) {
                player_register_collision_with(hit_actor);
                actor_stop_anim(&PLAYER);
                player_moving = FALSE;
            }
        }

        if (INPUT_PRESSED(INPUT_TOPDOWN_INTERACT)) {
            hit_actor = actor_in_front_of_player(topdown_grid, TRUE);
            if (hit_actor != NULL && !hit_actor->collision_group) {
                actor_set_dir(hit_actor, FLIPPED_DIR(PLAYER.dir), FALSE);
                player_moving = FALSE;
                if (hit_actor->script.bank) {
                    script_execute(hit_actor->script.bank, hit_actor->script.ptr, 0, 1, 0);
                }
            }
        }
    }

    if (player_moving) point_translate_dir(&PLAYER.pos, PLAYER.dir, PLAYER.move_speed);
}
