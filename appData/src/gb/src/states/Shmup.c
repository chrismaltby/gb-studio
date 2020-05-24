// clang-format off
#pragma bank=5
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

void Reset_Shmup();

void Start_Shmup() {
  // Set camera to follow player
  camera_target = &player.pos;
  camera_offset.x = -64;
  camera_offset.y = 0;
}

void Update_Shmup() {
  UBYTE tile_x, tile_y, hit_actor, hit_trigger, a, i;

  tile_x = (player.pos.x) >> 3;
  tile_y = (player.pos.y) >> 3;

  // Cleanup after script complete -------------------------------

  if (script_complete) {
    ActorsUnstick();
  }

  // NPC Logic ---------------------------------------------------

  for (i = 1; i < actors_active_size; i++) {
    a = actors_active[i];
    if (actors[a].movement_type == AI_RANDOM_WALK) {
      // Wave
      if (IS_FRAME_8) {
        if (actors[a].dir.y == -1) {
          if (actors[a].pos.y < actors[a].start_pos.y - 16) {
            actors[a].dir.y = 1;
          }
        } else {
          if (actors[a].pos.y > actors[a].start_pos.y + 16) {
            actors[a].dir.y = -1;
          }
        }
        actors[a].animate = TRUE;
        actors[a].moving = TRUE;
      }
    } else if (actors[a].movement_type == AI_RANDOM_FACE) {
      // Homing
      if (IS_FRAME_8) {
        actors[a].animate = TRUE;
        if (actors[a].pos.y == actors[a].start_pos.y) {
          if (actors[a].pos.x - player.pos.x < 50) {
            actors[a].dir.x = 1;
            if (actors[a].pos.y < player.pos.y) {
              actors[a].dir.y = 1;
            } else {
              actors[a].dir.y = -1;
            }
            actors[a].move_speed = 2;
            actors[a].moving = TRUE;
          }
        } else if (actors[a].dir.y == 1) {
          if (actors[a].pos.y > player.pos.y) {
            actors[a].dir.y = 0;
          }
        } else if (actors[a].dir.y == -1) {
          if (actors[a].pos.y < player.pos.y) {
            actors[a].dir.y = 0;
          }
        }
        if (actors[a].dir.x && (actors[a].pos.x - player.pos.x > 100)) {
          actors[a].moving = FALSE;
        }
      }
    }
  }

  // Player Logic ------------------------------------------------

  // Check for trigger collisions
  hit_trigger = TriggerAtTile(tile_x, tile_y);
  if (hit_trigger != MAX_TRIGGERS) {
    // Run trigger script
    ScriptStart(&triggers[hit_trigger].events_ptr);
  }

  // Check input to set player movement
  if (INPUT_UP && (player.pos.y > 4)) {
    player.dir.y = -1;
  } else if (INPUT_DOWN && (player.pos.y < (image_height - 8))) {
    player.dir.y = 1;
  } else {
    player.dir.y = 0;
  }
  if (player.pos.x < image_width - SCREEN_WIDTH_HALF - 64) {
    player.dir.x = 1;
  } else {
    if (player.move_speed == 0) {
      if (IS_FRAME_2) {
        player.pos.x--;
      }
    } else {
      player.pos.x -= player.move_speed;
    }
  }

  player.moving = TRUE;

  // Enemy Collisions
  hit_actor = ActorAt1x2Tile(tile_x + 1, tile_y, FALSE);
  if (hit_actor && hit_actor != NO_ACTOR_COLLISON) {
    Reset_Shmup();
  }

  // World Collisions
  if (TileAt(tile_x + 1, tile_y)) {
    Reset_Shmup();
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
