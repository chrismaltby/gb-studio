#pragma bank 5

#include "states/Adventure.h"
#include "Actor.h"
#include "Camera.h"
#include "Collision.h"
#include "GameTime.h"
#include "Input.h"
#include "ScriptRunner.h"
#include "Scroll.h"
#include "Trigger.h"
#include "rand.h"

#define ADVENTURE_CAMERA_DEADZONE 8

void Start_Adventure() {
  // Set camera to follow player
  camera_offset.x = 0;
  camera_offset.y = 0;
  camera_deadzone.x = ADVENTURE_CAMERA_DEADZONE;
  camera_deadzone.y = ADVENTURE_CAMERA_DEADZONE;
}

void Update_Adventure() {
  WORD tile_x, tile_y;
  UBYTE hit_actor = 0;
  UBYTE hit_trigger = 0;
  Vector2D backup_dir;

  player.moving = FALSE;

  // Move
  // player.dir.x = 0;
  if (INPUT_LEFT) {
    player.dir.x = -1;
    player.moving = TRUE;
    player.rerender = TRUE;
  } else if (INPUT_RIGHT) {
    player.dir.x = 1;
    player.moving = TRUE;
    player.rerender = TRUE;
  }

  // player.dir.y = 0;
  if (INPUT_UP) {
    player.dir.y = -1;
    player.moving = TRUE;
    player.rerender = TRUE;
  } else if (INPUT_DOWN) {
    player.dir.y = 1;
    player.moving = TRUE;
    player.rerender = TRUE;
  }

  if ((INPUT_LEFT || INPUT_RIGHT) && !INPUT_UP && !INPUT_DOWN) {
    player.dir.y = 0;
  } else if ((INPUT_UP || INPUT_DOWN) && !INPUT_LEFT && !INPUT_RIGHT) {
    player.dir.x = 0;
  }

  backup_dir.x = player.dir.x;
  backup_dir.y = player.dir.y;

  tile_x = (player.pos.x + 4 + player.dir.x) >> 3;  // Add Left right Bias for Moving=True
  tile_y = (player.pos.y + 7) >> 3;

  if (INPUT_A_PRESSED) {
    hit_actor = ActorInFrontOfPlayer(8, TRUE);
    if (hit_actor != NO_ACTOR_COLLISON) {
      ScriptStart(&actors[hit_actor].events_ptr);
    }
  }

  // Left Collision
  if (player.dir.x < 0) {
    if (TileAt(tile_x, tile_y)) {
      player.pos.x = (tile_x << 3) + 4;
      player.dir.x = 0;
    } else if (TileAt(tile_x, (player.pos.y) >> 3)) {
      player.dir.y = 1;
    }
  }

  // Right Collision
  if (player.dir.x > 0) {
    if (TileAt(tile_x + 1, tile_y)) {
      player.pos.x = (tile_x << 3) - 5;
      player.dir.x = 0;
    } else if (TileAt(tile_x + 1, (player.pos.y) >> 3)) {
      player.dir.y = 1;
    }
  }

  tile_x = (player.pos.x + 4 - player.dir.x) >> 3;  // Remove LeftRight Bias to not stick
  tile_y = (player.pos.y + player.dir.y) >> 3;

  // Up Collision
  if (player.dir.y < 0) {
    if (TileAt(tile_x, tile_y) ||     // Left Edge
        (TileAt(tile_x + 1, tile_y))  // Right edge
    ) {
      player.pos.y = (tile_y + 1 << 3);
      player.dir.y = 0;
    }
  }

  // Down Collision
  if (player.dir.y > 0) {
    if (TileAt(tile_x, tile_y + 1) ||     // Left Edge
        (TileAt(tile_x + 1, tile_y + 1))  // Right edge
    ) {
      player.pos.y = (tile_y << 3);
      player.dir.y = 0;
    }
  }

  if (player.moving) {
    if (!(player.dir.x > 0 | player.dir.x<0 | player.dir.y> 0 | player.dir.y < 0)) {
      player.moving = FALSE;
      player.dir.x = backup_dir.x;
      player.dir.y = backup_dir.y;
    }
  }

  tile_x = (player.pos.x + 4) >> 3;
  tile_y = (player.pos.y) >> 3;

  // Check for trigger collisions
  if (ActivateTriggerAt(tile_x, tile_y, FALSE)) {
    // Landed on a trigger
    return;
  }

  // Actor Collisions
  hit_actor = ActorOverlapsPlayer(FALSE);
  if (hit_actor && hit_actor != NO_ACTOR_COLLISON) {
    if (hit_actor == ActorInFrontOfPlayer(8, FALSE)) {
      player.moving = FALSE;
    }
    if (player_iframes == 0) {
      if (actors[hit_actor].collision_group) {
        player.hit_actor = 0;
        player.hit_actor = hit_actor;
      } else {
        player_iframes = 10;
      }
    }
  }

  // Move player
  if (player.moving) {
    // Move actor
    if (player.move_speed == 0) {
      // Half speed only move every other frame
      if (IS_FRAME_2) {
        player.pos.x += (WORD)player.dir.x;
        player.pos.y += (WORD)player.dir.y;
      }
    } else {
      player.pos.x += (WORD)(player.dir.x * player.move_speed);
      player.pos.y += (WORD)(player.dir.y * player.move_speed);
    }
  }
}
