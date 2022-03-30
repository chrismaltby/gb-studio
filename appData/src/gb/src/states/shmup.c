#pragma bank 3

#include "data/states_defines.h"
#include "states/shmup.h"

#include "actor.h"
#include "camera.h"
#include "collision.h"
#include "data_manager.h"
#include "game_time.h"
#include "input.h"
#include "trigger.h"
#include "vm.h"

#ifndef SHMUP_HURT_IFRAMES
#define SHMUP_HURT_IFRAMES 10
#endif

UINT8 shmup_scroll_speed = 16;
UBYTE shmup_reached_end;
UWORD shmup_dest;
direction_e shmup_direction;

void shmup_init() BANKED {

    camera_offset_x = 0;
    camera_offset_y = 0;
    camera_deadzone_x = 0;
    camera_deadzone_y = 0;

    shmup_direction = PLAYER.dir;

    if (shmup_direction == DIR_LEFT) {
        // Right to left scrolling
        camera_offset_x = 48;
        shmup_dest = (SCREEN_WIDTH_HALF + 48) << 4;
    } else if (shmup_direction == DIR_RIGHT) {
        // Left to right scrolling
        camera_offset_x = -64;
        shmup_dest = (image_width - SCREEN_WIDTH_HALF - 64) << 4;
    } else if (shmup_direction == DIR_UP) {
        // Bottom to top scrolling
        camera_offset_y = 48;
        shmup_dest = (SCREEN_WIDTH_HALF + 40) << 4;
    } else {
        // Top to bottom scrolling
        camera_offset_y = -48;
        shmup_dest = (image_height - SCREEN_WIDTH_HALF - 40) << 4;
    }

    shmup_reached_end = FALSE;
}

void shmup_update() BANKED {
    actor_t *hit_actor;
    UBYTE tile_start, tile_end;
    direction_e new_dir = DIR_NONE;
    player_moving = FALSE;

    if (IS_DIR_HORIZONTAL(shmup_direction)) {
        if (INPUT_UP) {
            player_moving = TRUE;
            new_dir = DIR_UP;
        } else if (INPUT_DOWN) {
            player_moving = TRUE;
            new_dir = DIR_DOWN;
        } else {
            new_dir = shmup_direction;
        }
    } else {
        if (INPUT_LEFT) {
            player_moving = TRUE;
            new_dir = DIR_LEFT;
        } else if (INPUT_RIGHT) {
            player_moving = TRUE;
            new_dir = DIR_RIGHT;
        } else {
            new_dir = shmup_direction;
        }
    }

    // Set animation if direction has changed
    if (new_dir != PLAYER.dir) {
        actor_set_dir(&PLAYER, new_dir, player_moving);
    }

    // Move player from input
    if (player_moving) {
        upoint16_t new_pos;
        new_pos.x = PLAYER.pos.x;
        new_pos.y = PLAYER.pos.y;
        point_translate_dir(&new_pos, PLAYER.dir, PLAYER.move_speed);

        // Check for tile collisions
        if (IS_DIR_HORIZONTAL(shmup_direction)) {
            // Step Y
            tile_start = (((PLAYER.pos.x >> 4) + PLAYER.bounds.left)  >> 3);
            tile_end   = (((PLAYER.pos.x >> 4) + PLAYER.bounds.right) >> 3) + 1;
            if (PLAYER.dir == DIR_DOWN) {
                UBYTE tile_y = ((new_pos.y >> 4) + PLAYER.bounds.bottom) >> 3;
                while (tile_start != tile_end) {
                    if (tile_at(tile_start, tile_y) & COLLISION_TOP) {
                        new_pos.y = ((((tile_y) << 3) - PLAYER.bounds.bottom) << 4) - 1;
                        break;
                    }
                    tile_start++;
                }
                PLAYER.pos.y = new_pos.y;
            } else {
                UBYTE tile_y = (((new_pos.y >> 4) + PLAYER.bounds.top) >> 3);
                while (tile_start != tile_end) {
                    if (tile_at(tile_start, tile_y) & COLLISION_BOTTOM) {
                        new_pos.y = ((((UBYTE)(tile_y + 1) << 3) - PLAYER.bounds.top) << 4) + 1;
                        break;
                    }
                    tile_start++;
                }
                PLAYER.pos.y = new_pos.y;
            }
        } else {
            // Step X
            tile_start = (((PLAYER.pos.y >> 4) + PLAYER.bounds.top)    >> 3);
            tile_end   = (((PLAYER.pos.y >> 4) + PLAYER.bounds.bottom) >> 3) + 1;
            if (PLAYER.dir == DIR_RIGHT) {
                UBYTE tile_x = ((new_pos.x >> 4) + PLAYER.bounds.right) >> 3;
                while (tile_start != tile_end) {
                    if (tile_at(tile_x, tile_start) & COLLISION_LEFT) {
                        new_pos.x = (((tile_x << 3) - PLAYER.bounds.right) << 4) - 1;           
                        break;
                    }
                    tile_start++;
                }
                PLAYER.pos.x = MIN((image_width - 16) << 4, new_pos.x);
            } else {
                UBYTE tile_x = ((new_pos.x >> 4) + PLAYER.bounds.left) >> 3;
                while (tile_start != tile_end) {
                    if (tile_at(tile_x, tile_start) & COLLISION_RIGHT) {
                        new_pos.x = ((((tile_x + 1) << 3) - PLAYER.bounds.left) << 4) + 1;         
                        break;
                    }
                    tile_start++;
                }
                PLAYER.pos.x = MAX(0, (WORD)new_pos.x);
            }
        }
    }

    // Auto scroll background
    if (!shmup_reached_end) {
        point_translate_dir(&PLAYER.pos, shmup_direction, shmup_scroll_speed);

        // Check if reached end of screen
        if ((shmup_direction == DIR_RIGHT) && (PLAYER.pos.x > shmup_dest)) {
            shmup_reached_end = TRUE;
            PLAYER.pos.x = shmup_dest;
        } else if ((shmup_direction == DIR_LEFT) && (PLAYER.pos.x < shmup_dest)) {
            shmup_reached_end = TRUE;
            PLAYER.pos.x = shmup_dest;
        } else if ((shmup_direction == DIR_DOWN) && (PLAYER.pos.y > shmup_dest)) {
            shmup_reached_end = TRUE;
            PLAYER.pos.y = shmup_dest;
        } else if ((shmup_direction == DIR_UP) && (PLAYER.pos.y < shmup_dest)) {
            shmup_reached_end = TRUE;
            PLAYER.pos.y = shmup_dest;
        }
    }

    if (IS_FRAME_ODD) {
        // Check for trigger collisions
        if (trigger_activate_at_intersection(&PLAYER.bounds, &PLAYER.pos, FALSE)) {
            // Landed on a trigger
            return;
        }

        // Check for actor collisions
        hit_actor = actor_overlapping_player(FALSE);
        if (hit_actor != NULL && hit_actor->collision_group) {
            player_register_collision_with(hit_actor);
        } else if (INPUT_A_PRESSED) {
            if (!hit_actor) {
                hit_actor = actor_in_front_of_player(8, TRUE);
            }
            if (hit_actor && !hit_actor->collision_group && hit_actor->script.bank) {
                script_execute(hit_actor->script.bank, hit_actor->script.ptr, 0, 1, 0);
            }
        }
    }
}
