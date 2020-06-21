// clang-format off
#pragma bank=5
// clang-format on

#include "states/Adventure.h"
#include "Scroll.h"
#include "Input.h"
#include "Collision.h"
#include "Actor.h"
#include "Trigger.h"
#include "GameTime.h"
#include "ScriptRunner.h"
#include "Camera.h"
#include "rand.h"

void Start_Adventure() {
  // Set camera to follow player
  camera_target = &player.pos;
  camera_offset.x = 0;
  camera_offset.y = 0;
}

void Update_Adventure() {
  WORD tile_x, tile_y;
  UBYTE camera_y, player_y, i, a;
  UINT16 tmp_y;
  UBYTE hit_actor = 0;
  UBYTE hit_trigger = 0;

  player.moving = FALSE;

  // Move
  player.dir.x = 0;
  if (INPUT_LEFT) {
    player.dir.x = -1;
    player.moving = TRUE;
    player.rerender = TRUE;
  } else if (INPUT_RIGHT) {
    player.dir.x = 1;
    player.moving = TRUE;
    player.rerender = TRUE;
  }

  player.dir.y = 0;
  if (INPUT_UP) {
    player.dir.y = -1;
    player.moving = TRUE;
    player.rerender = TRUE;
  } else if (INPUT_DOWN) {
    player.dir.y = 1;
    player.moving = TRUE;
    player.rerender = TRUE;
  }

  tile_x = (player.pos.x + 4) >> 3;
  tile_y = (player.pos.y) >> 3;

  if (INPUT_A_PRESSED) {
    hit_actor = ActorInFrontOfPlayer();
    if (hit_actor != NO_ACTOR_COLLISON) {
      ScriptStart(&actors[hit_actor].events_ptr);
    }
  }

  // Left Collision
  if (player.dir.x < 0) {
    if (TileAt(tile_x, tile_y) || TileAt(tile_x, tile_y - 1)) {
      player.moving = FALSE;
      player.pos.x = (tile_x * 8) - (5 * player.dir.x);
      tile_x = (player.pos.x + 4) >> 3;
    }
  }

  // Right Collision
  if (player.dir.x > 0) {
    if (TileAt(tile_x + 1, tile_y) || TileAt(tile_x + 1, tile_y - 1)) {
      player.moving = FALSE;
      player.pos.x = (tile_x * 8) - (5 * player.dir.x);
      tile_x = (player.pos.x + 4) >> 3;
    }
  }

  // Up Collision
  if (player.dir.y < 0) {
    if (TileAt(tile_x, tile_y - 1) ||                                    // Left Edge
        (((player.pos.x) & 0x7) != 0 && TileAt(tile_x + 1, tile_y - 1))  // Right edge
    ) {
      player.moving = FALSE;
      player.pos.y = (tile_y * 8);
      tile_y = player.pos.y >> 3;
    }
  }

  // Down Collision
  if (player.dir.y > 0) {
    if (TileAt(tile_x, tile_y + 1) ||                                    // Left Edge
        (((player.pos.x) & 0x7) != 0 && TileAt(tile_x + 1, tile_y + 1))  // Right edge
    ) {
      player.moving = FALSE;
      player.pos.y = (tile_y * 8);
      tile_y = player.pos.y >> 3;
    }
  }

  // If player was moving on the previous frame
  if (!player.moving) {
    // Check for trigger collisions
    hit_trigger = TriggerAtTile(tile_x, tile_y);
    if (hit_trigger != MAX_TRIGGERS) {
      // Run trigger script
      ScriptStart(&triggers[hit_trigger].events_ptr);
      player.moving = FALSE;
      return;
    }
  }

  // Actor Collisions
  hit_actor = ActorOverlapsPlayer(FALSE);
  if (hit_actor && hit_actor != NO_ACTOR_COLLISON && player_iframes == 0) {
    if(actors[hit_actor].collision_group) {
      player.hit_actor = 0;
      player.hit_actor = hit_actor;
    } else {
      player_iframes = 10;
      ScriptStartBg(&actors[hit_actor].events_ptr, hit_actor);
    }
  }

}
