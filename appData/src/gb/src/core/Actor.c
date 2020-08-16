#include "Actor.h"

#include "BankManager.h"
#include "Collision.h"
#include "GameTime.h"
#include "ScriptRunner.h"
#include "Scroll.h"
#include "Sprite.h"

void UpdateActors_b();
void ActivateActor_b(UBYTE i);
void DeactivateActor_b(UBYTE i);
UBYTE ActorInFrontOfActor_b(UBYTE i);
UBYTE CheckCollisionInDirection_b(UBYTE start_x, UBYTE start_y, UBYTE end_tile, COL_CHECK_DIR check_dir);
void InitPlayer_b();
UBYTE ActorAtTile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip);
UBYTE ActorAt1x2Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip);
UBYTE ActorAt1x3Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip);
UBYTE ActorAt3x1Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip);
UBYTE ActorOverlapsPlayer_b(UBYTE inc_noclip);
void ActorRunCollisionScripts_b();

Actor actors[MAX_ACTORS];
Actor* actor_ptrs[MAX_ACTORS];
UBYTE actors_active[MAX_ACTIVE_ACTORS];
UBYTE actors_active_size = 0;
UBYTE actor_move_settings;

Pos map_next_pos;
Vector2D map_next_dir;
UWORD map_next_sprite = 0;
UBYTE player_iframes;

void ActorsInit() {
  UBYTE i;
  for (i = 0; i != MAX_ACTORS; i++) {
    actor_ptrs[i] = &actors[i];
  }
}

void ActivateActor(UBYTE i) {
  PUSH_BANK(ACTOR_BANK);
  ActivateActor_b(i);
  POP_BANK;
}

void DeactivateActor(UBYTE i) {
  PUSH_BANK(ACTOR_BANK);
  DeactivateActor_b(i);
  POP_BANK;
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
  UBYTE hit_actor = FALSE;
  PUSH_BANK(ACTOR_BANK);
  hit_actor = ActorAtTile_b(tx, ty, inc_noclip);
  POP_BANK;
  return hit_actor;
}

UBYTE ActorAt1x2Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  UBYTE hit_actor = FALSE;
  PUSH_BANK(ACTOR_BANK);
  hit_actor = ActorAt1x2Tile_b(tx, ty, inc_noclip);
  POP_BANK;
  return hit_actor;
}

UBYTE ActorAt1x3Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  UBYTE hit_actor = FALSE;
  PUSH_BANK(ACTOR_BANK);
  hit_actor = ActorAt1x3Tile_b(tx, ty, inc_noclip);
  POP_BANK;
  return hit_actor;
}

UBYTE ActorAt3x1Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  UBYTE hit_actor = FALSE;
  PUSH_BANK(ACTOR_BANK);
  hit_actor = ActorAt3x1Tile_b(tx, ty, inc_noclip);
  POP_BANK;
  return hit_actor;
}

UBYTE ActorOverlapsPlayer(UBYTE inc_noclip) {
  UBYTE hit_actor = FALSE;
  PUSH_BANK(ACTOR_BANK);
  hit_actor = ActorOverlapsPlayer_b(inc_noclip);
  POP_BANK;
  return hit_actor;
}

UBYTE ActorInFrontOfActor(UBYTE i) {
  UBYTE hit_actor = FALSE;
  PUSH_BANK(ACTOR_BANK);
  hit_actor = ActorInFrontOfActor_b(i);
  POP_BANK;
  return hit_actor;
}

UBYTE CheckCollisionInDirection(UBYTE start_x, UBYTE start_y, UBYTE end_tile, COL_CHECK_DIR check_dir) {
  UBYTE tile;
  PUSH_BANK(ACTOR_BANK);
  tile = CheckCollisionInDirection_b(start_x, start_y, end_tile, check_dir);
  POP_BANK;
  return tile;
}

void InitPlayer() {
  PUSH_BANK(ACTOR_BANK);
  InitPlayer_b();
  POP_BANK;
}

void ActorRunScript(UBYTE i) {
  script_main_ctx_actor = i;
  actors[i].moving = FALSE;
  ScriptStart(&actors[i].events_ptr);
}

void ActorRunCollisionScripts() {
  PUSH_BANK(ACTOR_BANK);
  ActorRunCollisionScripts_b();
  POP_BANK;
}
