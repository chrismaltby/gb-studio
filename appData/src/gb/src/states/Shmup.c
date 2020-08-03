// clang-format off
#pragma bank 5
// clang-format on

#include "states/Shmup.h"
#include "Scroll.h"
#include "Input.h"
#include "Collision.h"
#include "Actor.h"
#include "Trigger.h"
#include "GameTime.h"
#include "ScriptRunner.h"
#include "Camera.h"
#include "DataManager.h"
#include "rand.h"

#define SHOOTER_HURT_IFRAMES 6

UBYTE shooter_horizontal = 0;
BYTE shooter_direction = 0;

void Reset_Shmup();

void Start_Shmup() {
  camera_offset.x = 0;
  camera_offset.y = 0;
  camera_deadzone.x = 0;
  camera_deadzone.y = 0;
  
  if (player.dir.x < 0) {
    camera_offset.x = 48;
    shooter_horizontal = 1;
    shooter_direction = -1;
  } else if (player.dir.x > 0) {
    camera_offset.x = -64;
    shooter_horizontal = 1;
    shooter_direction = 1;
  } else if (player.dir.y < 0) {
    camera_offset.y = 48;
    shooter_horizontal = 0;
    shooter_direction = -1;
  } else {
    camera_offset.y = -48;
    shooter_horizontal = 0;
    shooter_direction = 1;
  }
}

void Update_Shmup() {
  UBYTE tile_x, tile_y, hit_actor, hit_trigger;

  tile_x = (player.pos.x) >> 3;
  tile_y = (player.pos.y) >> 3;

  // Check for trigger collisions
  if (ActivateTriggerAt(tile_x, tile_y)) {
    return;
  };

  if (shooter_horizontal) {
    // Check input to set player movement
    if (INPUT_RECENT_UP && Gt16(player.pos.y, 8) && !(TileAt(tile_x, tile_y - 1) & COLLISION_BOTTOM)) {
      player.dir.y = -1;
    } else if (INPUT_RECENT_DOWN && Lt16(player.pos.y, (image_height - 8)) &&
               !(TileAt(tile_x, tile_y + 1) & COLLISION_TOP)) {
      player.dir.y = 1;
    } else {
      player.dir.y = 0;
    }

    if (shooter_direction == 1) {
      // Left to right
      if (Lt16(player.pos.x, image_width - SCREEN_WIDTH_HALF - 64)) {
        player.dir.x = shooter_direction;
      } else {
        if (player.move_speed == 0) {
          if (IS_FRAME_2) {
            player.pos.x -= shooter_direction;
          }
        } else {
          player.pos.x -= player.move_speed * shooter_direction;
        }
      }
    } else {
      // Right to left
      if (Gt16(player.pos.x, SCREEN_WIDTH_HALF + 48)) {
        player.dir.x = shooter_direction;
      } else {
        if (player.move_speed == 0) {
          if (IS_FRAME_2) {
            player.pos.x -= shooter_direction;
          }
        } else {
          player.pos.x -= player.move_speed * shooter_direction;
        }
      }
    }
  } else {
    // Check input to set player movement[]
    if (INPUT_RECENT_LEFT && (player.pos.x > 0) && !(TileAt(tile_x, tile_y) & COLLISION_RIGHT)) {
      player.dir.x = -1;
    } else if (INPUT_RECENT_RIGHT && Lt16(player.pos.x, image_width - 16) &&
               !(TileAt(tile_x + 2, tile_y) & COLLISION_LEFT)) {
      player.dir.x = 1;
    } else {
      player.dir.x = 0;
    }

    if (shooter_direction == 1) {
      // Top to bottom
      if (Lt16(player.pos.y, image_height - SCREEN_WIDTH_HALF - 40)) {
        // player.pos.y++;
        player.dir.y = shooter_direction;
      } else {
        if (player.move_speed == 0) {
          if (IS_FRAME_2) {
            player.pos.y -= shooter_direction;
          }
        } else {
          player.pos.y -= player.move_speed * shooter_direction;
        }
      }
    } else {
      // Bottom to top
      if (Gt16(player.pos.y, SCREEN_WIDTH_HALF + 40)) {
        // player.pos.y++;
        player.dir.y = shooter_direction;
      } else {
        if (player.move_speed == 0) {
          if (IS_FRAME_2) {
            player.pos.y -= shooter_direction;
          }
        } else {
          player.pos.y -= player.move_speed * shooter_direction;
        }
      }
    }
  }

  player.moving = TRUE;

  // Actor Collisions
  hit_actor = ActorOverlapsPlayer(FALSE);
  if (hit_actor && hit_actor != NO_ACTOR_COLLISON && player_iframes == 0) {
    if (actors[hit_actor].collision_group) {
      player.hit_actor = 0;
      player.hit_actor = hit_actor;
    } else {
      player_iframes = 10;
      ScriptStartBg(&actors[hit_actor].events_ptr, hit_actor);
    }
  }
}

void Reset_Shmup() {
  UBYTE i;
  player.pos.x = player.start_pos.x;
  player.pos.y = player.start_pos.y;
  for (i = 1; i < actors_len; i++) {
    actors[i].pos.x = actors[i].start_pos.x;
    actors[i].pos.y = actors[i].start_pos.y;
  }
}
