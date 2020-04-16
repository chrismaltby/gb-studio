// clang-format off
#pragma bank=18
// clang-format on

#include "TopDown.h"
#include "Scroll.h"
#include "Input.h"
#include "Collision.h"
#include "Actor.h"
#include "Trigger.h"
#include "GameTime.h"
#include "ScriptRunner.h"

void Start_TopDown() { scroll_target = &player.pos; }

void Update_TopDown() {
  UBYTE tile_x, tile_y, hit_actor, hit_trigger;

  tile_x = player.pos.x >> 3;
  tile_y = player.pos.y >> 3;

  // Move NPCs
  /*
  for (i = 1; i < actors_active_size; i++)
  {
      a = actors_active[i];
      if (ACTOR_ON_TILE(a))
      {
          if (IS_FRAME_32)
          {
              rnd = rand();
              if (rnd & 0x1u)
              {
                  rnd = rand();
                  actors[a].vel.x = 1 - ((rnd & 0x1u) * 2);
                  actors[a].vel.y = 0;
              }
              else
              {
                  rnd = rand();
                  actors[a].vel.x = 0;
                  actors[a].vel.y = 1 - ((rnd & 0x1u) * 2);
              }
          }
          else
          {
              actors[a].vel.x = 0;
              actors[a].vel.y = 0;
          }
      }
  }
  */

  // Player handling
  if (PlayerOnTile()) {
    if (player.vel.x != 0 || player.vel.y != 0) {
      // Check trigger collisions
      hit_trigger = TriggerAtTile(tile_x, tile_y);
      if (hit_trigger != MAX_TRIGGERS) {
        PlayerStopMovement();
        ScriptStart(&triggers[hit_trigger].events_ptr);
        return;
      }
    }

    PlayerStopMovement();

    if (INPUT_LEFT) {
      PlayerSetMovement(-1, 0);
    } else if (INPUT_RIGHT) {
      PlayerSetMovement(1, 0);
    } else {
      if (INPUT_UP) {
        PlayerSetMovement(0, -1);
      } else if (INPUT_DOWN) {
        PlayerSetMovement(0, 1);
      }
    }

    if (INPUT_A_PRESSED) {
      hit_actor = ActorInFrontOfPlayer();

      if (hit_actor) {
        actors[hit_actor].dir.x = -player.dir.x;
        actors[hit_actor].dir.y = -player.dir.y;
        actors[hit_actor].rerender = TRUE;
        PlayerStopMovement();
        ScriptStart(&actors[hit_actor].events_ptr);
      }
    }
  }
}
