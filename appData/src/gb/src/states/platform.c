#pragma bank 255

#include "data/states_defines.h"
#include "states/platform.h"

#include "actor.h"
#include "camera.h"
#include "collision.h"
#include "data_manager.h"
#include "game_time.h"
#include "input.h"
#include "math.h"
#include "scroll.h"
#include "trigger.h"
#include "vm.h"

#ifndef INPUT_PLATFORM_JUMP
#define INPUT_PLATFORM_JUMP        INPUT_A
#endif
#ifndef INPUT_PLATFORM_RUN
#define INPUT_PLATFORM_RUN         INPUT_B
#endif
#ifndef INPUT_PLATFORM_INTERACT
#define INPUT_PLATFORM_INTERACT    INPUT_A
#endif
#ifndef PLATFORM_CAMERA_DEADZONE_X
#define PLATFORM_CAMERA_DEADZONE_X 4
#endif
#ifndef PLATFORM_CAMERA_DEADZONE_Y
#define PLATFORM_CAMERA_DEADZONE_Y 16
#endif

UBYTE grounded;
UBYTE on_ladder;
WORD pl_vel_x;
WORD pl_vel_y;
WORD plat_min_vel;
WORD plat_walk_vel;
WORD plat_climb_vel;
WORD plat_run_vel;
WORD plat_walk_acc;
WORD plat_run_acc;
WORD plat_dec;
WORD plat_jump_vel;
WORD plat_grav;
WORD plat_hold_grav;
WORD plat_max_fall_vel;

void platform_init() BANKED {
    UBYTE tile_x, tile_y;

    pl_vel_x = 0;
    pl_vel_y = plat_grav << 2;

    if (PLAYER.dir == DIR_UP || PLAYER.dir == DIR_DOWN) {
        PLAYER.dir = DIR_RIGHT;
    }

    tile_x = PLAYER.pos.x >> 7;
    tile_y = PLAYER.pos.y >> 7;

    grounded = FALSE;

    // If starting tile was a ladder start scene attached to it
    if (tile_at(tile_x, tile_y - 1) & TILE_PROP_LADDER) {
        // Snap to ladder
        UBYTE p_half_width = (PLAYER.bounds.right - PLAYER.bounds.left) >> 1;
        PLAYER.pos.x = (((tile_x << 3) + 4 - (PLAYER.bounds.left + p_half_width) << 4));
        actor_set_anim(&PLAYER, ANIM_CLIMB);
        actor_stop_anim(&PLAYER);
        on_ladder = TRUE;
    } else {
        on_ladder = FALSE;
        actor_set_anim_idle(&PLAYER);
    }

    camera_offset_x = 0;
    camera_offset_y = 0;
    camera_deadzone_x = PLATFORM_CAMERA_DEADZONE_X;
    camera_deadzone_y = PLATFORM_CAMERA_DEADZONE_Y;

    game_time = 0;
}

void platform_update() BANKED {
    UBYTE tile_start, tile_end;
    actor_t *hit_actor;
    UBYTE p_half_width = (PLAYER.bounds.right - PLAYER.bounds.left) >> 1;

    // Input
    if (on_ladder) {
        // PLAYER.pos.x = 0;
        UBYTE tile_x_mid = ((PLAYER.pos.x >> 4) + PLAYER.bounds.left + p_half_width) >> 3; 
        pl_vel_y = 0;
        if (INPUT_UP) {
            // Climb laddder
            UBYTE tile_y = ((PLAYER.pos.y >> 4) + PLAYER.bounds.top + 1) >> 3;
            if (tile_at(tile_x_mid, tile_y) & TILE_PROP_LADDER) {
                pl_vel_y = -plat_climb_vel;
            }
        } else if (INPUT_DOWN) {
            // Descend ladder
            UBYTE tile_y = ((PLAYER.pos.y >> 4) + PLAYER.bounds.bottom + 1) >> 3;
            if (tile_at(tile_x_mid, tile_y) & TILE_PROP_LADDER) {
                pl_vel_y = plat_climb_vel;
            }
        } else if (INPUT_LEFT) {
            on_ladder = FALSE;
            // Check if able to leave ladder on left
            tile_start = (((PLAYER.pos.y >> 4) + PLAYER.bounds.top)    >> 3);
            tile_end   = (((PLAYER.pos.y >> 4) + PLAYER.bounds.bottom) >> 3) + 1;
            while (tile_start != tile_end) {
                if (tile_at(tile_x_mid - 1, tile_start) & COLLISION_RIGHT) {
                    on_ladder = TRUE;
                    break;
                }
                tile_start++;
            }            
        } else if (INPUT_RIGHT) {
            on_ladder = FALSE;
            // Check if able to leave ladder on right
            tile_start = (((PLAYER.pos.y >> 4) + PLAYER.bounds.top)    >> 3);
            tile_end   = (((PLAYER.pos.y >> 4) + PLAYER.bounds.bottom) >> 3) + 1;
            while (tile_start != tile_end) {
                if (tile_at(tile_x_mid + 1, tile_start) & COLLISION_LEFT) {
                    on_ladder = TRUE;
                    break;
                }
                tile_start++;
            }
        }
        PLAYER.pos.y += (pl_vel_y >> 8);
    } else {

        // Horizontal Movement
        if (INPUT_LEFT) {
            if (INPUT_PLATFORM_RUN) {
                pl_vel_x -= plat_run_acc;
                pl_vel_x = CLAMP(pl_vel_x, -plat_run_vel, -plat_min_vel);
            } else {
                pl_vel_x -= plat_walk_acc;
                pl_vel_x = CLAMP(pl_vel_x, -plat_walk_vel, -plat_min_vel);
            } 
        } else if (INPUT_RIGHT) {
            if (INPUT_PLATFORM_RUN) {
                pl_vel_x += plat_run_acc;
                pl_vel_x = CLAMP(pl_vel_x, plat_min_vel, plat_run_vel);
            } else {
                pl_vel_x += plat_walk_acc;
                pl_vel_x = CLAMP(pl_vel_x, plat_min_vel, plat_walk_vel);
            }
        } else if (grounded) {
            if (pl_vel_x < 0) {
                pl_vel_x += plat_dec;
                if (pl_vel_x > 0) {
                    pl_vel_x = 0;
                }
            } else if (pl_vel_x > 0) {
                pl_vel_x -= plat_dec;
                if (pl_vel_x < 0) {
                    pl_vel_x = 0;
                }
            }
        }

        // Vertical Movement
        if (INPUT_UP) {
            // Grab upwards ladder
            UBYTE tile_x_mid = ((PLAYER.pos.x >> 4) + PLAYER.bounds.left + p_half_width) >> 3;
            UBYTE tile_y   = (((PLAYER.pos.y >> 4) + PLAYER.bounds.top) >> 3);
            if (tile_at(tile_x_mid, tile_y) & TILE_PROP_LADDER) {
                PLAYER.pos.x = (((tile_x_mid << 3) + 4 - (PLAYER.bounds.left + p_half_width) << 4));
                on_ladder = TRUE;
                pl_vel_x = 0;
            }
        } else if (INPUT_DOWN) {
            // Grab downwards ladder
            UBYTE tile_x_mid = ((PLAYER.pos.x >> 4) + PLAYER.bounds.left + p_half_width) >> 3;
            UBYTE tile_y   = (((PLAYER.pos.y >> 4) + PLAYER.bounds.bottom) >> 3) + 1;
            if (tile_at(tile_x_mid, tile_y) & TILE_PROP_LADDER) {
                PLAYER.pos.x = (((tile_x_mid << 3) + 4 - (PLAYER.bounds.left + p_half_width) << 4));
                on_ladder = TRUE;
                pl_vel_x = 0;
            }
        }

        // Gravity
        if (INPUT_PLATFORM_JUMP && pl_vel_y < 0) {
            pl_vel_y += plat_hold_grav;
        } else {
            pl_vel_y += plat_grav;
        }

        // Step X
        tile_start = (((PLAYER.pos.y >> 4) + PLAYER.bounds.top)    >> 3);
        tile_end   = (((PLAYER.pos.y >> 4) + PLAYER.bounds.bottom) >> 3) + 1;
        if (pl_vel_x > 0) {
            UWORD new_x = PLAYER.pos.x + (pl_vel_x >> 8);
            UBYTE tile_x = ((new_x >> 4) + PLAYER.bounds.right) >> 3;
            while (tile_start != tile_end) {
                if (tile_at(tile_x, tile_start) & COLLISION_LEFT) {
                    new_x = (((tile_x << 3) - PLAYER.bounds.right) << 4) - 1;
                    pl_vel_x = 0;
                    break;
                }
                tile_start++;
            }
            PLAYER.pos.x = MIN((image_width - 16) << 4, new_x);
        } else if (pl_vel_x < 0) {
            WORD new_x = PLAYER.pos.x + (pl_vel_x >> 8);
            UBYTE tile_x = ((new_x >> 4) + PLAYER.bounds.left) >> 3;
            while (tile_start != tile_end) {
                if (tile_at(tile_x, tile_start) & COLLISION_RIGHT) {
                    new_x = ((((tile_x + 1) << 3) - PLAYER.bounds.left) << 4) + 1;
                    pl_vel_x = 0;
                    break;
                }
                tile_start++;
            }
            PLAYER.pos.x = MAX(0, new_x);
        }

        // Step Y
        grounded = FALSE;    
        tile_start = (((PLAYER.pos.x >> 4) + PLAYER.bounds.left)  >> 3);
        tile_end   = (((PLAYER.pos.x >> 4) + PLAYER.bounds.right) >> 3) + 1;
        if (pl_vel_y > 0) {
            UWORD new_y = PLAYER.pos.y + (pl_vel_y >> 8);
            UBYTE tile_y = ((new_y >> 4) + PLAYER.bounds.bottom) >> 3;
            while (tile_start != tile_end) {
                if (tile_at(tile_start, tile_y) & COLLISION_TOP) {
                    new_y = ((((tile_y) << 3) - PLAYER.bounds.bottom) << 4) - 1;
                    grounded = TRUE;
                    pl_vel_y = 0;
                    break;
                }
                tile_start++;
            }
            PLAYER.pos.y = new_y;
        } else if (pl_vel_y < 0) {
            UWORD new_y = PLAYER.pos.y + (pl_vel_y >> 8);
            UBYTE tile_y = (((new_y >> 4) + PLAYER.bounds.top) >> 3);
            while (tile_start != tile_end) {
                if (tile_at(tile_start, tile_y) & COLLISION_BOTTOM) {
                    new_y = ((((UBYTE)(tile_y + 1) << 3) - PLAYER.bounds.top) << 4) + 1;
                    pl_vel_y = 0;
                    break;
                }
                tile_start++;
            }
            PLAYER.pos.y = new_y;
        }

        // Clamp Y Velocity
        pl_vel_y = MIN(pl_vel_y, plat_max_fall_vel);
    }

    UBYTE tile_x_mid = ((PLAYER.pos.x >> 4) + ((PLAYER.bounds.right - PLAYER.bounds.left) >> 2)) >> 3;
    UBYTE tile_y_mid = ((PLAYER.pos.y >> 4) + ((PLAYER.bounds.bottom - PLAYER.bounds.top) >> 2)) >> 3;

    // Check for trigger collisions
    if (trigger_activate_at_intersection(&PLAYER.bounds, &PLAYER.pos, INPUT_UP_PRESSED)) {
        // Landed on a trigger
        return;
    }

    // Actor Collisions
    UBYTE can_jump = TRUE;
    hit_actor = actor_overlapping_player(FALSE);
    if (hit_actor != NULL && hit_actor->collision_group) {
        player_register_collision_with(hit_actor);
    } else if (INPUT_PRESSED(INPUT_PLATFORM_INTERACT)) {
        if (!hit_actor) {
            hit_actor = actor_in_front_of_player(8, TRUE);
        }
        if (hit_actor && !hit_actor->collision_group && hit_actor->script.bank) {
            script_execute(hit_actor->script.bank, hit_actor->script.ptr, 0, 1, 0);
            can_jump = FALSE;
        }
    }

    // Jump
    if (INPUT_PRESSED(INPUT_PLATFORM_JUMP) && grounded && can_jump) {
        pl_vel_y = -plat_jump_vel;
        grounded = FALSE;
    }

    // Player animation
    if (on_ladder) {
        actor_set_anim(&PLAYER, ANIM_CLIMB);
        if (pl_vel_y == 0) {
            actor_stop_anim(&PLAYER);
        }
    } else if (grounded) {
        if (pl_vel_x < 0) {
            actor_set_dir(&PLAYER, DIR_LEFT, TRUE);
        } else if (pl_vel_x > 0) {
            actor_set_dir(&PLAYER, DIR_RIGHT, TRUE);
        } else {
            actor_set_anim_idle(&PLAYER);
        }
    } else {
        if (PLAYER.dir == DIR_LEFT) {
            actor_set_anim(&PLAYER, ANIM_JUMP_LEFT);
        } else {
            actor_set_anim(&PLAYER, ANIM_JUMP_RIGHT);
        }
    }
}
