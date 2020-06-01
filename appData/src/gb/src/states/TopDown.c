// clang-format off
#pragma bank=5
// clang-format on

#include "states/TopDown.h"
#include "Scroll.h"
#include "Input.h"
#include "Collision.h"
#include "Actor.h"
#include "Trigger.h"
#include "GameTime.h"
#include "ScriptRunner.h"
#include "Camera.h"
#include "rand.h"

void Start_TopDown() {
  // Set camera to follow player
  camera_target = &player.pos;
  camera_offset.x = 0;
  camera_offset.y = 0;
}

void Update_TopDown() {
  UBYTE tile_x, tile_y, hit_actor, hit_trigger;

  tile_x = player.pos.x >> 3;
  tile_y = player.pos.y >> 3;

  if (PlayerOnTile()) {
    // If player was moving on the previous frame
    if (player.moving) {
      // Check for trigger collisions
      hit_trigger = TriggerAtTile(tile_x, tile_y);
      if (hit_trigger != MAX_TRIGGERS) {
        // Stop player from moving
        PlayerStopMovement();

        // Run trigger script
        TriggerRunScript(hit_trigger);
        return;
      }
    }

    // Player landed on an 8x8px tile
    // so stop movement for now
    PlayerStopMovement();

    // Check input to set player movement
    if (INPUT_LEFT) {
      PlayerSetMovement(-1, 0);
    } else if (INPUT_RIGHT) {
      PlayerSetMovement(1, 0);
    } else if (INPUT_UP) {
      PlayerSetMovement(0, -1);
    } else if (INPUT_DOWN) {
      PlayerSetMovement(0, 1);
    }

    if (INPUT_A_PRESSED) {
      // Find actor in front of player
      hit_actor = ActorInFrontOfPlayer();

      if (hit_actor != NO_ACTOR_COLLISON) {
        // Turn actor to face player
        actors[hit_actor].dir.x = -player.dir.x;
        actors[hit_actor].dir.y = -player.dir.y;
        actors[hit_actor].rerender = TRUE;

        // Stop player from moving
        PlayerStopMovement();

        // Run actors interact script
        ActorRunScript(hit_actor);
      }
    }
  }
}
