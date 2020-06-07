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

Actor actors[MAX_ACTORS];
UBYTE actors_active[MAX_ACTIVE_ACTORS];
UBYTE actors_active_size = 0;
UBYTE actor_move_settings;

Pos map_next_pos;
Vector2D map_next_dir;
UWORD map_next_sprite = 0;

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
  UBYTE i;

  for (i = actors_active_size - 1; i != 0xFF; i--) {
    UBYTE a = actors_active[i];
    UBYTE a_tx, a_ty;

    if (!actors[a].enabled || (!inc_noclip && !actors[a].collisionsEnabled)) {
      continue;
    }

    a_tx = DIV_8(actors[a].pos.x);
    a_ty = DIV_8(actors[a].pos.y);

    if ((ty == a_ty || ty == a_ty + 1) && (tx == a_tx || tx == a_tx + 1 || tx == a_tx - 1)) {
      return a;
    }
  }
  return NO_ACTOR_COLLISON;
}

UBYTE ActorAt1x2Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0xFF; i--) {
    UBYTE a = actors_active[i];
    UBYTE a_tx, a_ty;

    if (!actors[a].enabled || (!inc_noclip && !actors[a].collisionsEnabled)) {
      continue;
    }

    a_tx = DIV_8(actors[a].pos.x);
    a_ty = DIV_8(actors[a].pos.y);

    if ((ty == a_ty || ty == a_ty - 1) && (tx == a_tx)) {
      return a;
    }
  }
  return NO_ACTOR_COLLISON;
}

UBYTE ActorAt1x3Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0xFF; i--) {
    UBYTE a = actors_active[i];
    UBYTE a_tx, a_ty;

    if (!actors[a].enabled || (!inc_noclip && !actors[a].collisionsEnabled)) {
      continue;
    }

    a_tx = DIV_8(actors[a].pos.x);
    a_ty = DIV_8(actors[a].pos.y);

    if ((ty == a_ty || ty == a_ty - 1 || ty == a_ty - 2) && (tx == a_tx)) {
      return a;
    }
  }
  return NO_ACTOR_COLLISON;
}

UBYTE ActorAt3x1Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  UBYTE i;

  LOG("ActorAt3x1Tile [%u, %u] - %u\n", tx, ty, inc_noclip);
  for (i = actors_active_size - 1; i != 0xFF; i--) {
    UBYTE a = actors_active[i];
    UBYTE a_tx, a_ty;
    LOG("ActorAt3x1Tile:1 %u %u\n", i, a);

    if (!actors[a].enabled || (!inc_noclip && !actors[a].collisionsEnabled)) {
      continue;
    }

    LOG("ActorAt3x1Tile:2 %u %u\n", i, a);

    a_tx = DIV_8(actors[a].pos.x);
    a_ty = DIV_8(actors[a].pos.y);

    LOG("ty=%u a_ty=%u tx=%u a_tx=%u\n", ty, a_ty, tx, a_tx);

    if ((ty == a_ty) && (tx == a_tx || tx == a_tx - 1 || tx == a_tx - 2)) {
      LOG("ActorAt3x1Tile:3 %u %u\n", i, a);
      return a;
    }
  }
  LOG("ActorAt3x1Tile:4 %u %u\n", i);

  return NO_ACTOR_COLLISON;
}

UBYTE ActorOverlapsActorTile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0xFF; i--) {
    UBYTE a = actors_active[i];
    UBYTE a_tx, a_ty;

    if (!actors[a].enabled || (!inc_noclip && !actors[a].collisionsEnabled)) {
      continue;
    }

    a_tx = DIV_8(actors[a].pos.x);
    a_ty = DIV_8(actors[a].pos.y);

    if ((ty == a_ty || ty == a_ty - 1) && (tx == a_tx || tx == a_tx + 1 || tx + 1 == a_tx)) {
      return a;
    }
  }
  return NO_ACTOR_COLLISON;
}

UBYTE ActorOverlapsPlayer(UBYTE inc_noclip) {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0; i--) {
    UBYTE a = actors_active[i];

    if (!actors[a].enabled || (!inc_noclip && !actors[a].collisionsEnabled)) {
      continue;
    }

    if ((player.pos.x + 16 >= actors[a].pos.x) && (player.pos.x <= actors[a].pos.x + 16) &&
        (player.pos.y + 8 >= actors[a].pos.y) && (player.pos.y <= actors[a].pos.y + 8)) {
      return a;
    }
  }
  return NO_ACTOR_COLLISON;
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
