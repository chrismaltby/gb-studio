#include "Actor.h"

#include "BankManager.h"
#include "Collision.h"
#include "GameTime.h"
#include "Scroll.h"
#include "Sprite.h"

void UpdateActors_b();
void MoveActors_b();
void ActivateActor_b(UBYTE i);
void ActivateActorColumn_b(UBYTE tx_a, UBYTE ty_a);
void DeactivateActor_b(UBYTE i);
void ActorsUnstick_b();

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

UBYTE ActorAtTile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0; i--) {
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
  return 0;
}

UBYTE ActorAt1x2Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0; i--) {
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
  return 0;
}

UBYTE ActorAt3x1Tile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0; i--) {
    UBYTE a = actors_active[i];
    UBYTE a_tx, a_ty;

    if (!actors[a].enabled || (!inc_noclip && !actors[a].collisionsEnabled)) {
      continue;
    }

    a_tx = DIV_8(actors[a].pos.x);
    a_ty = DIV_8(actors[a].pos.y);

    if ((ty == a_ty) && (tx == a_tx || tx == a_tx - 1 || tx == a_tx + 1)) {
      return a;
    }
  }
  return 0;
}

UBYTE ActorOverlapsActorTile(UBYTE tx, UBYTE ty, UBYTE inc_noclip) {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0; i--) {
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
  return 0;
}

UBYTE ActorOverlapsPlayer(UBYTE inc_noclip) {
  /*
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
  */
  return 0;
}

void ActorSetMovement(UBYTE i, BYTE dir_x, BYTE dir_y) {
  UBYTE tile_x, tile_y;

  tile_x = actors[i].pos.x >> 3;
  tile_y = actors[i].pos.y >> 3;

  actors[i].dir.x = 0;
  actors[i].dir.y = 0;
  actors[i].vel.x = 0;
  actors[i].vel.y = 0;
  actors[i].dir.x = dir_x;
  actors[i].dir.y = dir_y;
  actors[i].rerender = TRUE;

  if (actors[i].collisionsEnabled) {
    // Move left
    if (dir_x == -1) {
      UBYTE tile_left = tile_x - 1;
      if (!TileAt(tile_left, tile_y) && !ActorAt1x2Tile(tile_left - 1, tile_y, FALSE)) {
        actors[i].vel.x = dir_x;
        actors[i].vel.y = dir_y;
        actors[i].moving = TRUE;
      }
      // Move right
    } else if (dir_x == 1) {
      UBYTE tile_right = tile_x + 2;
      if (!TileAt(tile_right, tile_y) && !ActorAt1x2Tile(tile_right, tile_y, FALSE)) {
        actors[i].vel.x = dir_x;
        actors[i].vel.y = dir_y;
        actors[i].moving = TRUE;
      }
    }
    // Move up
    if (dir_y == -1) {
      UBYTE tile_up = tile_y - 1;
      if (!TileAt(tile_x, tile_up) && !TileAt(tile_x + 1, tile_up) &&
          !ActorAt3x1Tile(tile_x, tile_up, FALSE)) {
        actors[i].vel.x = dir_x;
        actors[i].vel.y = dir_y;
        actors[i].moving = TRUE;
      }
      // Move down
    } else if (dir_y == 1) {
      UBYTE tile_down = tile_y + 1;
      if (!TileAt(tile_x, tile_down) && !TileAt(tile_x + 1, tile_down) &&
          !ActorAt3x1Tile(tile_x, tile_down + 1, FALSE)) {
        actors[i].vel.x = dir_x;
        actors[i].vel.y = dir_y;
        actors[i].moving = TRUE;
      }
    }
  } else {
    actors[i].vel.x = dir_x;
    actors[i].vel.y = dir_y;
    actors[i].moving = TRUE;
  }
}

void ActorStopMovement(UBYTE i) { actors[i].moving = FALSE; }

UBYTE ActorInFrontOfActor(UBYTE i) {
  UBYTE tile_x, tile_y;
  UBYTE hit_actor = 0;

  tile_x = actors[i].pos.x >> 3;
  tile_y = actors[i].pos.y >> 3;

  if (actors[i].dir.y == -1) {
    LOG("CHECK HIT UP\n");
    LOG_VALUE("check_x", tile_x);
    LOG_VALUE("check_y", tile_y - 1);
    hit_actor = ActorAt3x1Tile(tile_x, tile_y - 1, TRUE);
  } else if (actors[i].dir.y == 1) {
    LOG("CHECK HIT DOWN\n");
    LOG_VALUE("check_x", tile_x);
    LOG_VALUE("check_y", tile_y + 2);
    hit_actor = ActorAt3x1Tile(tile_x, tile_y + 2, TRUE);
  } else {
    if (actors[i].dir.x == -1) {
      LOG("CHECK HIT LEFT\n");
      LOG_VALUE("check_x", tile_x - 1);
      LOG_VALUE("check_y", tile_y);
      hit_actor = ActorAt1x2Tile(tile_x - 2, tile_y, TRUE);
    } else if (actors[i].dir.x == 1) {
      LOG("CHECK HIT RIGHT\n");
      LOG_VALUE("check_x", tile_x + 2);
      LOG_VALUE("check_y", tile_y);
      hit_actor = ActorAt1x2Tile(tile_x + 2, tile_y, TRUE);
    }
  }

  return hit_actor;
}

void ActorsUnstick() {
  PUSH_BANK(ACTOR_BANK);
  ActorsUnstick_b();
  POP_BANK;
}
