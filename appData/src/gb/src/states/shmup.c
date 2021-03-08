#pragma bank 3

#include "states/shmup.h"
#include "actor.h"
#include "camera.h"
#include "collision.h"
#include "data_manager.h"
#include "game_time.h"
#include "input.h"
#include "trigger.h"

#define SHOOTER_HURT_IFRAMES 10

UBYTE shooter_horizontal = 0;
BYTE shooter_direction = 0;
UBYTE shooter_reached_end = 0;

void shmup_init() __banked {

/*
  // @todo
  // Shooter needs rewrite to remove dir_x, dir_y references

  camera_offset_x = 0;
  camera_offset_y = 0;
  camera_deadzone_x = 0;
  camera_deadzone_y = 0;

  if (PLAYER.dir_x < 0) {
    // Right to left scrolling
    camera_offset_x = 56;
    shooter_horizontal = 1;
    shooter_direction = -1;
    // Set dir x to face right so sprite doesn't flip
    // Up to you to provide left facing ship sprite
    PLAYER.dir_x = 1;
  } else if (PLAYER.dir_x > 0) {
    // Left to right scrolling
    camera_offset_x = -56;
    shooter_horizontal = 1;
    shooter_direction = 1;
  } else if (PLAYER.dir_y < 0) {
    // Bottom to top scrolling
    camera_offset_y = 56;
    shooter_horizontal = 0;
    shooter_direction = -1;
  } else {
    // Top to bottom scrolling
    camera_offset_y = -40;
    shooter_horizontal = 0;
    shooter_direction = 1;
  }

  shooter_reached_end = FALSE;

  */
}

void shmup_update() __banked {
  UBYTE tile_x, tile_y, hit_actor;

  /*
  tile_x = DIV_8(PLAYER.pos.x);
  tile_y = DIV_8(PLAYER.pos.y);

  // Check for trigger collisions
  if (trigger_activate_at(tile_x, tile_y, FALSE)) {
    return;
  };

  if (shooter_horizontal) {
    // Check input to set player movement
    if (INPUT_RECENT_UP && (PLAYER.pos.y > 8) &&
        !(tile_at(tile_x, tile_y - 1) & COLLISION_BOTTOM)) {
      PLAYER.dir_y = -1;
      PLAYER.dir_x = 0;
    } else if (INPUT_RECENT_DOWN && (PLAYER.pos.y < (image_height - 8)) &&
               !(tile_at(tile_x, tile_y + 1) & COLLISION_TOP)) {
      PLAYER.dir_y = 1;
      PLAYER.dir_x = 0;
    } else {
      PLAYER.dir_y = 0;
      PLAYER.dir_x = 1;
    }

    // if (INPUT_UP_PRESSED || INPUT_DOWN_PRESSED) {
    //   // Rerender on first frame direction changed
    //   PLAYER.rerender = TRUE;
    // }

    // Check if player has reached end of scene
    if (shooter_direction == 1) {
      // Left to right
      if ((PLAYER.pos.x > image_width - SCREEN_WIDTH_HALF - 64)) {
        shooter_reached_end = TRUE;
      }
    } else {
      // Right to left
      if ((PLAYER.pos.x < SCREEN_WIDTH_HALF + 48)) {
        shooter_reached_end = TRUE;
      }
    }

    // Move player - Horizontal Scenes
    if (shooter_reached_end) {
      // Reached end of scene only move vertically
      point_translate_dir(&PLAYER.pos, 0, PLAYER.dir_y, PLAYER.move_speed);
    } else {
      point_translate_dir(&PLAYER.pos, shooter_direction, PLAYER.dir_y, PLAYER.move_speed);
    }

  } else {
    // Check input to set player movement
    if (INPUT_RECENT_LEFT && (PLAYER.pos.x > 0) && !(tile_at(tile_x, tile_y) & COLLISION_RIGHT)) {
      PLAYER.dir_x = -1;
      PLAYER.dir_y = 0;
    } else if (INPUT_RECENT_RIGHT && (PLAYER.pos.x < image_width - 16) &&
               !(tile_at(tile_x + 2, tile_y) & COLLISION_LEFT)) {
      PLAYER.dir_x = 1;
      PLAYER.dir_y = 0;
    } else {
      PLAYER.dir_x = 0;
      PLAYER.dir_y = shooter_direction;
    }

    // if (INPUT_LEFT_PRESSED || INPUT_RIGHT_PRESSED) {
    //   // Rerender on first frame direction changed
    //   PLAYER.rerender = TRUE;
    // }

    if (shooter_direction == 1) {
      // Top to bottom
      if ((PLAYER.pos.y > image_height - SCREEN_WIDTH_HALF - 40)) {
        shooter_reached_end = TRUE;
      }
    } else {
      // Bottom to top
      if ((PLAYER.pos.y < SCREEN_WIDTH_HALF + 40)) {
        shooter_reached_end = TRUE;
      }
    }

    // Move player - Vertical Scenes
    if (shooter_reached_end) {
      point_translate_dir(&PLAYER.pos, PLAYER.dir_x, 0, PLAYER.move_speed);
    } else {
      point_translate_dir(&PLAYER.pos, PLAYER.dir_x, shooter_direction, PLAYER.move_speed);
    }
  }

  // Actor Collisions
  hit_actor = ActorOverlapsPlayer(FALSE);
  if (hit_actor && hit_actor != NO_ACTOR_COLLISON && player_iframes == 0) {
    if (actors[hit_actor].collision_group) {
      PLAYER.hit_actor = 0;
      PLAYER.hit_actor = hit_actor;
    } else {
      player_iframes = SHOOTER_HURT_IFRAMES;
      ScriptStartBg(&actors[hit_actor].events_ptr, hit_actor);
    }
  }  
  */
}
