#include "Actor.h"

#include "BankManager.h"
#include "Collision.h"
#include "GameTime.h"
#include "Scroll.h"
#include "Sprite.h"
#include "ScriptRunner.h"

void UpdateActors_b();
void MoveActors_b();
void ActivateActor_b(UBYTE i);
void ActivateActorColumn_b(UBYTE tx_a, UBYTE ty_a);
void DeactivateActor_b(UBYTE i);
void ActorsUnstick_b();
void ActorSetMovement_b(UBYTE i, BYTE dir_x, BYTE dir_y);
UBYTE ActorInFrontOfActor_b(UBYTE i);
UBYTE CheckCollisionInDirection_b(UBYTE start_x, UBYTE start_y, UBYTE end_tile, UBYTE check_dir);
void InitPlayer_b();
UBYTE ActorAtTile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip);
UBYTE ActorAt1x2Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip);
UBYTE ActorAt1x3Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip);
UBYTE ActorAt3x1Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip);
void ActorRunCollisionScripts_b();

Actor actors[MAX_ACTORS];
UBYTE actors_active[MAX_ACTIVE_ACTORS];
UBYTE actors_active_size = 0;
UBYTE actor_move_settings;

Pos map_next_pos;
Vector2D map_next_dir;
UWORD map_next_sprite = 0;
UBYTE player_iframes;

void MoveActors() {
  PUSH_BANK(ACTOR_BANK);
  MoveActors_b();
  POP_BANK;
}

void UpdateActors() {
  PUSH_BANK(ACTOR_BANK);
  UpdateActors_b();
  POP_BANK;
}

void ActivateActor(UBYTE i) {
  PUSH_BANK(ACTOR_BANK);
  ActivateActor_b(i);
  POP_BANK;
}

void ActivateActorColumn(UBYTE tx, UBYTE ty) {
  PUSH_BANK(ACTOR_BANK);
  ActivateActorColumn_b(tx, ty);
  POP_BANK;
}

void DeactivateActor(UBYTE i) {
  PUSH_BANK(ACTOR_BANK);
  DeactivateActor_b(i);
  POP_BANK;
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

void ActorSetMovement(UBYTE i, BYTE dir_x, BYTE dir_y) {
  PUSH_BANK(ACTOR_BANK);
  ActorSetMovement_b(i, dir_x, dir_y);
  POP_BANK;
}

void ActorStopMovement(UBYTE i) { actors[i].moving = FALSE; }

UBYTE ActorInFrontOfActor(UBYTE i) {
  UBYTE hit_actor = FALSE;
  PUSH_BANK(ACTOR_BANK);
  hit_actor = ActorInFrontOfActor_b(i);
  POP_BANK;
  return hit_actor;
}

UBYTE CheckCollisionInDirection(UBYTE start_x, UBYTE start_y, UBYTE end_tile, UBYTE check_dir) {
  UBYTE tile;
  PUSH_BANK(ACTOR_BANK);
  tile = CheckCollisionInDirection_b(start_x, start_y, end_tile, check_dir);
  POP_BANK;  
  return tile;
}

void ActorsUnstick() {
  PUSH_BANK(ACTOR_BANK);
  ActorsUnstick_b();
  POP_BANK;
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
