// clang-format off
#pragma bank=5
// clang-format on

#include "states/Platform.h"
#include "Actor.h"
#include "BankManager.h"
#include "Camera.h"
#include "Collision.h"
#include "Core_Main.h"
#include "DataManager.h"
#include "GameTime.h"
#include "Input.h"
#include "Math.h"
#include "ScriptRunner.h"
#include "Scroll.h"
#include "Sprite.h"
#include "Trigger.h"

#define MIN_WALK_VEL 0x130
#define WALK_ACC 0x98
#define RUN_ACC 0xe4
#define RELEASE_DEC 0xd0
#define SKID_DEC 0x1a0
#define MAX_WALK_VEL 0x1900
#define MAX_RUN_VEL 0x2900
#define SKID_TURN_VEL 0x900
#define JUMP_MOMENTUM 0x98
#define JUMP_VEL 0x4000
#define HOLD_GRAV 0x200
#define GRAV 0x700
#define MAX_FALL_VEL 0x4E20
#define PLATFORM_CAMERA_DEADZONE_X 4
#define PLATFORM_CAMERA_DEADZONE_Y 16

UBYTE grounded = FALSE;
WORD pl_vel_x = 0;
WORD pl_vel_y = 0;
WORD pl_pos_x = 16512;
WORD pl_pos_y = 1024;

void Start_Platform() {
  LOG("START PLATFORM\n");

  player.moving = FALSE;
  pl_pos_x = (player.pos.x + 4u) << 4;
  pl_pos_y = player.pos.y << 4;
  pl_vel_x = 0;
  pl_vel_y = 0;

  if (player.dir.x == 0) {
    player.dir.y = 0;
    player.dir.x = 1;
    player.rerender = TRUE;
  }

  grounded = FALSE;

  camera_target = &player.pos;
  camera_offset.x = 0;
  camera_offset.y = 0;
  camera_deadzone.x = PLATFORM_CAMERA_DEADZONE_X;
  camera_deadzone.y = PLATFORM_CAMERA_DEADZONE_Y;

  game_time = 0;
  LOG("END START PLATFORM\n");
}

void Update_Platform() {
  WORD tile_x, tile_y;
  UBYTE hit_actor = 0;
  UBYTE hit_trigger = 0;

  // Update scene pos from player pos
  pl_pos_x = ((player.pos.x + 4u) << 4) + (pl_pos_x & 0xF);
  pl_pos_y = ((player.pos.y) << 4) + (pl_pos_y & 0xF);

  player.moving = FALSE;
  player.dir.y = 0;

  // Move
  if (INPUT_LEFT) {
    player.dir.x = -1;
    if (INPUT_A) {
      pl_vel_x -= RUN_ACC;
      pl_vel_x = CLAMP(pl_vel_x, -MAX_RUN_VEL, -MIN_WALK_VEL);
    } else {
      pl_vel_x -= WALK_ACC;
      pl_vel_x = CLAMP(pl_vel_x, -MAX_WALK_VEL, -MIN_WALK_VEL);
    }
  } else if (INPUT_RIGHT) {
    player.dir.x = 1;
    if (INPUT_A) {
      pl_vel_x += RUN_ACC;
      pl_vel_x = CLAMP(pl_vel_x, MIN_WALK_VEL, MAX_RUN_VEL);
    } else {
      pl_vel_x += WALK_ACC;
      pl_vel_x = CLAMP(pl_vel_x, MIN_WALK_VEL, MAX_WALK_VEL);
    }
  } else if (grounded) {
    if (pl_vel_x < 0) {
      pl_vel_x += RELEASE_DEC;
      if (pl_vel_x > 0) {
        pl_vel_x = 0;
      }
    } else if (pl_vel_x > 0) {
      pl_vel_x -= RELEASE_DEC;
      if (pl_vel_x < 0) {
        pl_vel_x = 0;
      }
    }
  }

  pl_pos_x += pl_vel_x >> 8;
  tile_x = pl_pos_x >> 7;
  tile_y = pl_pos_y >> 7;

  if (grounded && INPUT_A_PRESSED) {
    if (player.dir.x == 1) {
      hit_actor = ActorAtTile(tile_x + 2, tile_y, TRUE);
    } else {
      hit_actor = ActorAtTile(tile_x - 1, tile_y, TRUE);
    }
    if (hit_actor && (hit_actor != NO_ACTOR_COLLISON)) {
      ScriptStart(&actors[hit_actor].events_ptr);
    }
  }

  // Jump
  if (INPUT_B_PRESSED && grounded) {
    if (!(TileAt(tile_x, tile_y - 2) ||                                         // Left Edge
          (((pl_pos_x >> 4) & 0x7) != 0 && TileAt(tile_x + 1, tile_y - 2)))) {  // Right edge
      pl_vel_y = -JUMP_VEL;
      grounded = FALSE;
    }
  }

  // Gravity
  if (INPUT_B && pl_vel_y < 0) {
    pl_vel_y += HOLD_GRAV;
  } else {
    pl_vel_y += GRAV;
  }

  pl_vel_y = MIN(pl_vel_y, MAX_FALL_VEL);
  pl_pos_y += pl_vel_y >> 8;
  tile_y = pl_pos_y >> 7;

  // Left Collision
  if (pl_vel_x < 0) {
    if (TileAt(tile_x, tile_y) || TileAt(tile_x, tile_y - 1)) {
      pl_vel_x = 0;
      pl_pos_x = ((tile_x + 1) * 8) << 4;
      tile_x = pl_pos_x >> 7;
    }
  }

  // Right Collision
  if (pl_vel_x > 0) {
    if (TileAt(tile_x + 1, tile_y) || TileAt(tile_x + 1, tile_y - 1)) {
      pl_vel_x = 0;
      pl_pos_x = (tile_x * 8) << 4;
      tile_x = pl_pos_x >> 7;
    }
  }

  // Ground Collision
  if (pl_vel_y >= 0 &&
      (TileAt(tile_x, tile_y + 1) ||                                      // Left Edge
       (((pl_pos_x >> 4) & 0x7) != 0 && TileAt(tile_x + 1, tile_y + 1)))  // Right edge
  ) {
    grounded = TRUE;
    pl_vel_y = 0;
    pl_pos_y = (tile_y * 8) << 4;
  } else {
    grounded = FALSE;

    // Ceiling Collision
    if (pl_vel_y < 0) {
      if (TileAt(tile_x, tile_y - 2) ||                                     // Left Edge
          (((pl_pos_x >> 4) & 0x7) != 0 && TileAt(tile_x + 1, tile_y - 2))  // Right edge
      ) {
        if (MOD_128(pl_pos_y) < 32) {
          pl_vel_y = 0;
          pl_pos_y = ((tile_y * 8) << 4);
        }
      }
    }
  }

  if (!player.script_control) {
    player.pos.x = (pl_pos_x >> 4) - 4u;
    player.pos.y = pl_pos_y >> 4;
    player.animate = grounded && pl_vel_x != 0;
  } else {
    pl_vel_x = 0;
    pl_vel_y = 0;
  }

  // Check for trigger collisions
  hit_trigger = TriggerAtTile(tile_x, tile_y);
  if (hit_trigger != MAX_TRIGGERS) {
    // Run trigger script
    ScriptStart(&triggers[hit_trigger].events_ptr);
    player.moving = FALSE;
    return;
  }

  // Actor Collisions
  hit_actor = ActorOverlapsPlayer(FALSE);
  if (hit_actor && hit_actor != NO_ACTOR_COLLISON && player_iframes == 0) {
    if (actors[hit_actor].collision_group) {
      player.hit_actor = 0;
      player.hit_actor = hit_actor;
    }
  }
}
