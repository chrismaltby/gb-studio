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

#define SHOOTER_HURT_IFRAMES 6

UBYTE shooter_iframes = 0;

void Reset_Shmup();

void Start_Shmup() {
  // Set camera to follow player
  camera_target = &player.pos;
  camera_offset.x = -64;
  camera_offset.y = 0;
  shooter_iframes = 0;
}

void Update_Shmup() {
  UBYTE tile_x, tile_y, hit_actor, hit_trigger, a, i;

  tile_x = (player.pos.x) >> 3;
  tile_y = (player.pos.y) >> 3;

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
  if (hit_actor && hit_actor != NO_ACTOR_COLLISON && shooter_iframes == 0) {
    shooter_iframes = SHOOTER_HURT_IFRAMES;
    // ActorRunScript(hit_actor);
    ScriptStartBg(&actors[hit_actor].events_ptr, hit_actor);
  }

  // World Collisions
  if (TileAt(tile_x + 1, tile_y)) {
    Reset_Shmup();
  }

  if (shooter_iframes != 0 && IS_FRAME_8) {
    player.enabled = shooter_iframes & 0x1;
    shooter_iframes--;
  } else {
    player.enabled = TRUE;
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
