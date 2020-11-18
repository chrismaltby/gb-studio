#include "Actor.h"

#include "BankManager.h"
#include "Collision.h"
#include "GameTime.h"
#include "ScriptRunner.h"
#include "Scroll.h"
#include "Sprite.h"

void UpdateActors_b() __banked;
void ActivateActor_b(UBYTE i) __banked;
void DeactivateActor_b(UBYTE i) __banked;
UBYTE ActorInFrontOfPlayer_b(UBYTE grid_size, UBYTE inc_noclip) __banked;
UBYTE ActorInFrontOfActor_b(UBYTE i) __banked;
UBYTE CheckCollisionInDirection_b(UBYTE start_x, UBYTE start_y, UBYTE end_tile, COL_CHECK_DIR check_dir) __banked;
void InitPlayer_b() __banked;
UBYTE ActorAtTile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked;
UBYTE ActorAt1x2Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked;
UBYTE ActorAt1x3Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked;
UBYTE ActorAt3x1Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked;
UBYTE ActorAt2x3Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked;
UBYTE ActorAt3x3Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked;
UBYTE ActorOverlapsPlayer_b(UBYTE inc_noclip) __banked;
void ActorRunCollisionScripts_b() __banked;

Actor actors[MAX_ACTORS];
Actor* actor_ptrs[MAX_ACTORS];
UBYTE actors_active[MAX_ACTIVE_ACTORS];
UBYTE actors_active_size = 0;
UBYTE actor_move_settings = 0;

Pos map_next_pos;
Vector2D map_next_dir;
UWORD map_next_sprite = 0;
UBYTE player_iframes = 0;

void ActorsInit() {
  UBYTE i;
  for (i = 0; i != MAX_ACTORS; i++) {
    actor_ptrs[i] = &actors[i];
  }
}

void ActivateActor(UBYTE i) {
  ActivateActor_b(i);
}

void DeactivateActor(UBYTE i) {
  DeactivateActor_b(i);
}

void DeactivateActiveActor(UBYTE i) {
  if(UBYTE_LESS_THAN(i, actors_active_size)) {
    UBYTE a = actors_active[i];
    if (a == 0) {
      // Don't delete player
      return;
    }
    SpritePoolReturn(actors[a].sprite_index);
    actors[a].sprite_index = 0;
    if (actors[a].movement_ctx) {
      ScriptCtxPoolReturn(actors[a].movement_ctx, a);
    }
    actors_active[i] = actors_active[--actors_active_size];     
  }
}

UBYTE ActorAtTile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  return ActorAtTile_b(tx, ty, inc_noclip);
}

UBYTE ActorAt1x2Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  return ActorAt1x2Tile_b(tx, ty, inc_noclip);
}

UBYTE ActorAt1x3Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  return ActorAt1x3Tile_b(tx, ty, inc_noclip);
}

UBYTE ActorAt3x1Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  return ActorAt3x1Tile_b(tx, ty, inc_noclip);
}

UBYTE ActorAt2x3Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  return ActorAt2x3Tile_b(tx, ty, inc_noclip);
}

UBYTE ActorAt3x3Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  return ActorAt3x3Tile_b(tx, ty, inc_noclip);
}

UBYTE ActorOverlapsPlayer(UBYTE inc_noclip) {
  return ActorOverlapsPlayer_b(inc_noclip);
}

UBYTE ActorInFrontOfPlayer(UBYTE grid_size, UBYTE inc_noclip) {
  return ActorInFrontOfPlayer_b(grid_size, inc_noclip);
}

UBYTE ActorInFrontOfActor(UBYTE i) {
  return ActorInFrontOfActor_b(i);
}

UBYTE CheckCollisionInDirection(UBYTE start_x, UBYTE start_y, UBYTE end_tile, COL_CHECK_DIR check_dir) {
  return CheckCollisionInDirection_b(start_x, start_y, end_tile, check_dir);
}

void InitPlayer() {
  InitPlayer_b();
}

void ActorRunScript(UBYTE i) {
  script_main_ctx_actor = i;
  actors[i].moving = FALSE;
  ScriptStart(&actors[i].events_ptr);
}

void ActorRunCollisionScripts() {
  ActorRunCollisionScripts_b();
}
