#include "Actor.h"

#include "BankManager.h"
#include "GameTime.h"
#include "Scroll.h"
#include "Sprite.h"

void UpdateActors_b();
void MoveActors_b();
void ActivateActor_b(UBYTE i);
void ActivateActorColumn_b(UBYTE tx_a, UBYTE ty_a);
void DeactivateActor_b(UBYTE i);

Actor actors[MAX_ACTORS];
UBYTE actors_active[MAX_ACTIVE_ACTORS];
UBYTE actors_active_size = 0;
UBYTE actor_move_settings;

Pos map_next_pos;
Vector2D map_next_dir;
UBYTE map_next_sprite = 0;

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

UBYTE ActorAtTile(UBYTE tx, UBYTE ty) {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0; i--) {
    UBYTE a = actors_active[i];
    UBYTE a_tx, a_ty;

    a_tx = DIV_8(actors[a].pos.x);
    a_ty = DIV_8(actors[a].pos.y);

    if ((ty == a_ty || ty == a_ty + 1) && (tx == a_tx || tx == a_tx + 1 || tx == a_tx - 1)) {
      return a;
    }
  }
  return 0;
}

UBYTE ActorBaseAtTile(UBYTE tx, UBYTE ty) {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0; i--) {
    UBYTE a = actors_active[i];
    UBYTE a_tx, a_ty;

    a_tx = DIV_8(actors[a].pos.x);
    a_ty = DIV_8(actors[a].pos.y);

    if ((ty == a_ty) && (tx == a_tx || tx == a_tx + 1)) {
      return a;
    }
  }
  return 0;
}

UBYTE ActorAt1x2(UBYTE tx, UBYTE ty) {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0; i--) {
    UBYTE a = actors_active[i];
    UBYTE a_tx, a_ty;

    a_tx = DIV_8(actors[a].pos.x);
    a_ty = DIV_8(actors[a].pos.y);

    if ((ty == a_ty || ty == a_ty - 1) && (tx == a_tx)) {
      return a;
    }
  }
  return 0;
}

UBYTE ActorAt3x1(UBYTE tx, UBYTE ty) {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0; i--) {
    UBYTE a = actors_active[i];
    UBYTE a_tx, a_ty;

    a_tx = DIV_8(actors[a].pos.x);
    a_ty = DIV_8(actors[a].pos.y);

    if ((ty == a_ty) && (tx == a_tx || tx == a_tx - 1 || tx == a_tx + 1)) {
      return a;
    }
  }
  return 0;
}

UBYTE ActorOverlapsActorTile(UBYTE tx, UBYTE ty) {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0; i--) {
    UBYTE a = actors_active[i];
    UBYTE a_tx, a_ty;

    a_tx = DIV_8(actors[a].pos.x);
    a_ty = DIV_8(actors[a].pos.y);

    if ((ty == a_ty || ty == a_ty - 1) && (tx == a_tx || tx == a_tx + 1 || tx + 1 == a_tx)) {
      return a;
    }
  }
  return 0;
}

UBYTE ActorOverlapsPlayer() {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0; i--) {
    UBYTE a = actors_active[i];
    if ((player.pos.x + 16 >= actors[a].pos.x) && (player.pos.x <= actors[a].pos.x + 16) &&
        (player.pos.y + 8 >= actors[a].pos.y) && (player.pos.y <= actors[a].pos.y + 8)) {
      return a;
    }
  }
  return 0;
}
