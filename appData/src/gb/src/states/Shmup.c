#pragma bank 5

#include "states/Shmup.h"
#include "Actor.h"
#include "Camera.h"
#include "Collision.h"
#include "DataManager.h"
#include "GameTime.h"
#include "Input.h"
#include "ScriptRunner.h"
#include "Trigger.h"

#define SHOOTER_HURT_IFRAMES 10

UBYTE shooter_horizontal = 0;
BYTE shooter_direction = 0;
UBYTE shooter_reached_end = 0;

void Start_Shmup() {
  camera_offset.x = 0;
  camera_offset.y = 0;
  camera_deadzone.x = 0;
  camera_deadzone.y = 0;

  if (player.dir.x < 0) {
    // Right to left scrolling
    camera_offset.x = 56;
    shooter_horizontal = 1;
    shooter_direction = -1;
    // Set dir x to face right so sprite doesn't flip
    // Up to you to provide left facing ship sprite
    player.dir.x = 1;
  } else if (player.dir.x > 0) {
    // Left to right scrolling
    camera_offset.x = -56;
    shooter_horizontal = 1;
    shooter_direction = 1;
  } else if (player.dir.y < 0) {
    // Bottom to top scrolling
    camera_offset.y = 56;
    shooter_horizontal = 0;
    shooter_direction = -1;
  } else {
    // Top to bottom scrolling
    camera_offset.y = -40;
    shooter_horizontal = 0;
    shooter_direction = 1;
  }

  shooter_reached_end = FALSE;

  player.animate = TRUE;
}

void Update_Shmup() {
  UBYTE tile_x, tile_y, hit_actor;

  tile_x = DIV_8(player.pos.x);
  tile_y = DIV_8(player.pos.y);

  // Check for trigger collisions
  if (ActivateTriggerAt(tile_x, tile_y, FALSE)) {
    return;
  };

  if (shooter_horizontal) {
    // Check input to set player movement
    if (INPUT_RECENT_UP && Gt16(player.pos.y, 8) &&
        !(TileAt(tile_x, tile_y - 1) & COLLISION_BOTTOM)) {
      player.dir.y = -1;
      player.dir.x = 0;
    } else if (INPUT_RECENT_DOWN && Lt16(player.pos.y, (image_height - 8)) &&
               !(TileAt(tile_x, tile_y + 1) & COLLISION_TOP)) {
      player.dir.y = 1;
      player.dir.x = 0;
    } else {
      player.dir.y = 0;
      player.dir.x = 1;
    }

    if (INPUT_UP_PRESSED || INPUT_DOWN_PRESSED) {
      // Rerender on first frame direction changed
      player.rerender = TRUE;
    }

    // Check if player has reached end of scene
    if (shooter_direction == 1) {
      // Left to right
      if (Gt16(player.pos.x, image_width - SCREEN_WIDTH_HALF - 64)) {
        shooter_reached_end = TRUE;
      }
    } else {
      // Right to left
      if (Lt16(player.pos.x, SCREEN_WIDTH_HALF + 48)) {
        shooter_reached_end = TRUE;
      }
    }

    // Move player - Horizontal Scenes
    if (shooter_reached_end) {
      // Reached end of scene only move vertically
      if (player.move_speed == 0) {
        // Half speed only move every other frame
        if (IS_FRAME_2) {
          player.pos.y += (WORD)player.dir.y;
        }
      } else {
        player.pos.y += (WORD)(player.dir.y * player.move_speed);
      }
    } else {
      if (player.move_speed == 0) {
        // Half speed only move every other frame
        if (IS_FRAME_2) {
          player.pos.x += (WORD)shooter_direction;
          player.pos.y += (WORD)player.dir.y;
        }
      } else {
        player.pos.x += (WORD)(shooter_direction * player.move_speed);
        player.pos.y += (WORD)(player.dir.y * player.move_speed);
      }
    }

  } else {
    // Check input to set player movement
    if (INPUT_RECENT_LEFT && (player.pos.x > 0) && !(TileAt(tile_x, tile_y) & COLLISION_RIGHT)) {
      player.dir.x = -1;
      player.dir.y = 0;
    } else if (INPUT_RECENT_RIGHT && Lt16(player.pos.x, image_width - 16) &&
               !(TileAt(tile_x + 2, tile_y) & COLLISION_LEFT)) {
      player.dir.x = 1;
      player.dir.y = 0;
    } else {
      player.dir.x = 0;
      player.dir.y = shooter_direction;
    }

    if (INPUT_LEFT_PRESSED || INPUT_RIGHT_PRESSED) {
      // Rerender on first frame direction changed
      player.rerender = TRUE;
    }

    if (shooter_direction == 1) {
      // Top to bottom
      if (Gt16(player.pos.y, image_height - SCREEN_WIDTH_HALF - 40)) {
        shooter_reached_end = TRUE;
      }
    } else {
      // Bottom to top
      if (Lt16(player.pos.y, SCREEN_WIDTH_HALF + 40)) {
        shooter_reached_end = TRUE;
      }
    }

    // Move player - Vertical Scenes
    if (shooter_reached_end) {
      // Reached end of scene only move horizontally
      if (player.move_speed == 0) {
        // Half speed only move every other frame
        if (IS_FRAME_2) {
          player.pos.x += (WORD)player.dir.x;
        }
      } else {
        player.pos.x += (WORD)(player.dir.x * player.move_speed);
      }
    } else {
      if (player.move_speed == 0) {
        // Half speed only move every other frame
        if (IS_FRAME_2) {
          player.pos.x += (WORD)player.dir.x;
          player.pos.y += (WORD)shooter_direction;
        }
      } else {
        player.pos.x += (WORD)(player.dir.x * player.move_speed);
        player.pos.y += (WORD)(shooter_direction * player.move_speed);
      }
    }
  }

  // Actor Collisions
  hit_actor = ActorOverlapsPlayer(FALSE);
  if (hit_actor && hit_actor != NO_ACTOR_COLLISON && player_iframes == 0) {
    if (actors[hit_actor].collision_group) {
      player.hit_actor = 0;
      player.hit_actor = hit_actor;
    } else {
      player_iframes = SHOOTER_HURT_IFRAMES;
      ScriptStartBg(&actors[hit_actor].events_ptr, hit_actor);
    }
  }  
}
