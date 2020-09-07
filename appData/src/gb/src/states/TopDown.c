#pragma bank 5

#include "states/TopDown.h"
#include "Actor.h"
#include "Camera.h"
#include "Collision.h"
#include "DataManager.h"
#include "GameTime.h"
#include "Input.h"
#include "Trigger.h"

void Start_TopDown() {
  camera_offset.x = 0;
  camera_offset.y = 0;
  camera_deadzone.x = 0;
  camera_deadzone.y = 0;
}

void Update_TopDown() {
  UBYTE tile_x, tile_y, hit_actor;

  tile_x = DIV_8(player.pos.x);
  tile_y = DIV_8(player.pos.y);

  // Is player on an 8x8px tile?
  if (MOD_8(player.pos.x) == 0 && MOD_8(player.pos.y) == 0) {
    // Player landed on an 8x8px tile
    // so stop movement for now
    player.moving = FALSE;

    // Check for trigger collisions
    if (ActivateTriggerAt(tile_x, tile_y, FALSE)) {
      // If landed on a trigger don't update movement this frame
      return;
    }

    // Check input to set player movement
    if (INPUT_RECENT_LEFT) {
      UBYTE tile_left = tile_x - 1;

      player.dir.x = -1;
      player.dir.y = 0;
      player.rerender = TRUE;

      // Check for collisions to left of player
      hit_actor = ActorAt1x2Tile(tile_left - 1, tile_y, FALSE);
      if (tile_x != 0 && !(TileAt2x1(tile_left, tile_y) & COLLISION_RIGHT) &&
          (hit_actor == NO_ACTOR_COLLISON)) {
        player.moving = TRUE;
      }

      player.hit_actor = hit_actor;

    } else if (INPUT_RECENT_RIGHT) {
      UBYTE tile_right = tile_x + 1;

      player.dir.x = 1;
      player.dir.y = 0;
      player.rerender = TRUE;

      // Check for collisions to right of player
      hit_actor = ActorAt1x2Tile(tile_right + 1, tile_y, FALSE);
      if (tile_x != image_tile_width - 2 && !(TileAt2x1(tile_right, tile_y) & COLLISION_LEFT) &&
          (hit_actor == NO_ACTOR_COLLISON)) {
        player.moving = TRUE;
      }

      player.hit_actor = hit_actor;

    } else if (INPUT_RECENT_UP) {
      UBYTE tile_up = tile_y - 1;

      player.dir.x = 0;
      player.dir.y = -1;
      player.rerender = TRUE;

      // Check for collisions above player
      hit_actor = ActorAt3x1Tile(tile_x - 1, tile_up, FALSE);
      if (tile_y != 0 && !(TileAt2x1(tile_x, tile_up) & COLLISION_BOTTOM) && (hit_actor == NO_ACTOR_COLLISON)) {
        player.moving = TRUE;
      }

      player.hit_actor = hit_actor;

    } else if (INPUT_RECENT_DOWN) {
      UBYTE tile_down = tile_y + 1;

      player.dir.x = 0;
      player.dir.y = 1;
      player.rerender = TRUE;

      // Check for collisions below player
      hit_actor = ActorAt3x1Tile(tile_x - 1, tile_down + 1, FALSE);
      if (tile_y != image_tile_height - 1 && !(TileAt2x1(tile_x, tile_down) & COLLISION_TOP) && (hit_actor == NO_ACTOR_COLLISON)) {
        hit_actor = ActorAt3x1Tile(tile_x - 1, tile_down, FALSE);
        if (hit_actor == NO_ACTOR_COLLISON) {
          player.moving = TRUE;
        }
      }

      player.hit_actor = hit_actor;
    }

    hit_actor = ActorOverlapsPlayer(FALSE);
    if (hit_actor && hit_actor != NO_ACTOR_COLLISON) {
      if (actors[hit_actor].collision_group) {
        player.hit_actor = 0;
        player.hit_actor = hit_actor;
      }
    }

    if (INPUT_A_PRESSED) {
      // Find actor in front of player
      hit_actor = ActorInFrontOfPlayer();

      if (hit_actor != NO_ACTOR_COLLISON && !actors[hit_actor].collision_group) {
        // Turn actor to face player
        actors[hit_actor].dir.x = -player.dir.x;
        actors[hit_actor].dir.y = -player.dir.y;
        actors[hit_actor].rerender = TRUE;

        // Stop player from moving
        player.moving = FALSE;

        // Run actors interact script
        ActorRunScript(hit_actor);
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
