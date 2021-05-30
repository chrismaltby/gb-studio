#pragma bank 1

#include "Actor.h"
#include "Sprite.h"
#include "Scroll.h"
#include "Math.h"
#include "GameTime.h"
#include "UI.h"
#include "ScriptRunner.h"
#include "Collision.h"
#include "DataManager.h"
#include "Palette.h"

#define SCREENWIDTH_PLUS_64 224   // 160 + 64
#define SCREENHEIGHT_PLUS_64 208  // 144 + 64

UBYTE actors_active_delete[MAX_ACTIVE_ACTORS];
UBYTE actors_active_delete_count = 0;

void ActivateActor_b(UBYTE i) __banked {
  UBYTE j;

  if (actors_active_size == MAX_ACTIVE_ACTORS) {
    return;
  }

  // If actor is disabled don't activate it
  if (!actors[i].enabled) {
    return;
  }

  // Stop if actor already active
  for (j = 0; j != actors_active_size; j++) {
    if (actors_active[j] == i) {
      return;
    }
  }

  actors_active[actors_active_size++] = i;
  actors[i].sprite_index = SpritePoolNext();
  actors[i].frame_offset = 0;
  actors[i].rerender = TRUE;
  actors[i].moving = FALSE;
  actors[i].script_control = FALSE;

  if (actors[i].movement_ptr.bank && actors[i].enabled) {
    actors[i].movement_ctx = ScriptStartBg(&actors[i].movement_ptr, i);
  } else {
    actors[i].movement_ctx = 0;
  }
}

void DeactivateActor_b(UBYTE i) __banked {
  UBYTE j, a;

  a = 0;  // Required to fix GBDK bug

  for (j = 0; j != actors_active_size; j++) {
    if (actors_active[j] == i) {
      a = j;
      break;
    }
  }

  if (a) {
    SpritePoolReturn(actors[i].sprite_index);
    actors[i].sprite_index = 0;
    if (actors[i].movement_ctx) {
      ScriptCtxPoolReturn(actors[i].movement_ctx, i);
    }
    actors_active[a] = actors_active[--actors_active_size];
  }
}

UBYTE ActorInFrontOfPlayer_b(UBYTE grid_size, UBYTE inc_noclip) __banked {
  UBYTE tile_x, tile_y;
  UBYTE hit_actor = 0;

  tile_x = player.pos.x >> 3;
  tile_y = player.pos.y >> 3;

  if (grid_size == 16) {
    if (player.dir.y == -1) {
      hit_actor = ActorAt3x3Tile(tile_x - 1, tile_y - 3, inc_noclip);
    } else if (player.dir.y == 1) {
      hit_actor = ActorAt3x3Tile(tile_x - 1, tile_y + 1, inc_noclip);
    } else {
      if (player.dir.x == -1) {
        hit_actor = ActorAt3x3Tile(tile_x - 3, tile_y - 1, inc_noclip);
      } else if (player.dir.x == 1) {
        hit_actor = ActorAt3x3Tile(tile_x + 1, tile_y - 1, inc_noclip);
      }
    }      
  } else {
    if (player.dir.y == -1) {
      hit_actor = ActorAt3x1Tile(tile_x, tile_y - 1, inc_noclip);
    } else if (player.dir.y == 1) {
      hit_actor = ActorAt3x1Tile(tile_x, tile_y + 2, inc_noclip);
    } else {
      if (player.dir.x == -1) {
        hit_actor = ActorAt1x2Tile(tile_x - 2, tile_y, inc_noclip);
      } else if (player.dir.x == 1) {
        hit_actor = ActorAt1x2Tile(tile_x + 2, tile_y, inc_noclip);
      }
    }
  }
  if (hit_actor == 0) {
    hit_actor = NO_ACTOR_COLLISON;
  }

  return hit_actor;
}


UBYTE ActorInFrontOfActor_b(UBYTE i) __banked {
  UBYTE tile_x, tile_y;
  UBYTE hit_actor = 0;

  tile_x = actors[i].pos.x >> 3;
  tile_y = actors[i].pos.y >> 3;

  if (actors[i].dir.y == -1) {
    hit_actor = ActorAt3x1Tile(tile_x, tile_y - 1, TRUE);
  } else if (actors[i].dir.y == 1) {
    hit_actor = ActorAt3x1Tile(tile_x, tile_y + 2, TRUE);
  } else {
    if (actors[i].dir.x == -1) {
      hit_actor = ActorAt1x2Tile(tile_x - 2, tile_y, TRUE);
    } else if (actors[i].dir.x == 1) {
      hit_actor = ActorAt1x2Tile(tile_x + 2, tile_y, TRUE);
    }
  }

  if (hit_actor == i) {
    return NO_ACTOR_COLLISON;
  }

  return hit_actor;
}

UBYTE CheckCollisionInDirection_b(UBYTE start_x, UBYTE start_y, UBYTE end_tile, COL_CHECK_DIR check_dir) __banked {
  switch (check_dir) {
    case CHECK_DIR_LEFT:  // Check left
      while (start_x != end_tile) {
        if (TileAt2x2(start_x - 1, start_y - 1) ||                                // Tile left
            ActorAt1x3Tile(start_x - 2, start_y - 1, FALSE) != NO_ACTOR_COLLISON  // Actor left
        ) {
          return start_x;
        }
        start_x--;
      }
      return end_tile;
    case CHECK_DIR_RIGHT:  // Check right
      while (start_x != end_tile) {
        if (TileAt2x2(start_x + 1, start_y - 1) ||                                // Tile right
            ActorAt1x3Tile(start_x + 2, start_y - 1, FALSE) != NO_ACTOR_COLLISON  // Actor right
        ) {
          return start_x;
        }
        start_x++;
      }
      return end_tile;
    case CHECK_DIR_UP:  // Check up
      while (start_y != end_tile) {
        if (TileAt2x2(start_x, start_y - 2) ||                                      // Tile up
            (ActorAt3x1Tile(start_x, start_y - 2, FALSE) != NO_ACTOR_COLLISON)  // Actor up
        ) {
          return start_y;
        }
        start_y--;
      }
      return end_tile;
    case CHECK_DIR_DOWN:  // Check down
      while (start_y != end_tile) {
        if (TileAt2x2(start_x, start_y) ||  // Tile down
            ActorAt3x1Tile(start_x, start_y + 1, FALSE) !=
                NO_ACTOR_COLLISON ||  // Actor down 1 tile
            ActorAt3x1Tile(start_x, start_y + 2, FALSE) !=
                NO_ACTOR_COLLISON  // Actor down 2 tiles
        ) {
          return start_y;
        }
        start_y++;
      }
      return end_tile;
  }
  return end_tile;
}

UBYTE ActorAtTile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked {
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

UBYTE ActorAt1x2Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked {
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

UBYTE ActorAt1x3Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked {
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

UBYTE ActorAt3x1Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0xFF; i--) {
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

  return NO_ACTOR_COLLISON;
}

UBYTE ActorAt2x3Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0xFF; i--) {
    UBYTE a = actors_active[i];
    UBYTE a_tx, a_ty;

    if (!actors[a].enabled || (!inc_noclip && !actors[a].collisionsEnabled)) {
      continue;
    }

    a_tx = DIV_8(actors[a].pos.x);
    a_ty = DIV_8(actors[a].pos.y);

    if ((ty == a_ty || ty == a_ty - 1 || ty == a_ty - 2) && (tx == a_tx || tx == a_tx - 1)) {
      return a;
    }
  }

  return NO_ACTOR_COLLISON;
}

UBYTE ActorAt3x3Tile_b(UBYTE tx, UBYTE ty, UBYTE inc_noclip) __banked {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0xFF; i--) {
    UBYTE a = actors_active[i];
    UBYTE a_tx, a_ty;

    if (!actors[a].enabled || (!inc_noclip && !actors[a].collisionsEnabled)) {
      continue;
    }

    a_tx = DIV_8(actors[a].pos.x);
    a_ty = DIV_8(actors[a].pos.y);

    if ((ty == a_ty || ty == a_ty - 1 || ty == a_ty - 2) && (tx == a_tx || tx == a_tx - 1 || tx == a_tx - 2)) {
      return a;
    }
  }

  return NO_ACTOR_COLLISON;
}

UBYTE ActorOverlapsPlayer_b(UBYTE inc_noclip) __banked {
  UBYTE i;

  for (i = actors_active_size - 1; i != 0xFF; i--) {
    UBYTE a = actors_active[i];

    if (!actors[a].enabled || (!inc_noclip && !actors[a].collisionsEnabled)) {
      continue;
    }

    if ((player.pos.x + 15 >= actors[a].pos.x) && (player.pos.x <= actors[a].pos.x + 15) &&
        (player.pos.y + 7 >= actors[a].pos.y) && (player.pos.y <= actors[a].pos.y + 7)) {
      return a;
    }
  }

  return NO_ACTOR_COLLISON;
}

void InitPlayer_b() __banked {
  UBYTE sprite_frames;

  sprite_frames = DIV_4(LoadSprite(map_next_sprite, 0));
  player.enabled = TRUE;
  player.moving = FALSE;
  player.palette_index = PLAYER_PALETTE;
  player.collisionsEnabled = TRUE;
  player.collision_group = 1;
  player.pos.x = map_next_pos.x;
  player.pos.y = map_next_pos.y;
  player.start_pos.x = player.pos.x;
  player.start_pos.y = player.pos.y;
  player.dir.x = map_next_dir.x;
  player.dir.y = map_next_dir.y;
  if (sprite_frames > 6) {
    // Limit player to 6 frames to prevent overflow into scene actor vram
    player.sprite_type = SPRITE_STATIC;
    player.frames_len = 6;
  } else if (sprite_frames == 6) {
    player.sprite_type = SPRITE_ACTOR_ANIMATED;
    player.frames_len = 2;
  } else if (sprite_frames == 3) {
    player.sprite_type = SPRITE_ACTOR;
    player.frames_len = 1;    
  } else {
    player.sprite_type = SPRITE_STATIC;
    player.frames_len = sprite_frames;    
  }
  player.sprite_index = SpritePoolNext();
  player.rerender = TRUE;
  player.moving = FALSE;
  player.animate = FALSE;
  player.hit_actor = NO_ACTOR_COLLISON;
  player.script_control = FALSE;
}

void ActorRunCollisionScripts_b() __banked {
  Actor* actor;

  if (player_iframes == 0 && player.hit_actor != NO_ACTOR_COLLISON) {
    actor = &actors[player.hit_actor];

    if (actor->collision_group) {
      if (actor->collision_group == 2) {
        if (player.hit_1_ptr.bank) {
          ScriptStartBg(&player.hit_1_ptr, 0);
        }
        if (actor->events_ptr.bank) {
          ScriptStartBg(&actor->events_ptr, player.hit_actor);
        }
      } else if (actor->collision_group == 4) {
        if (player.hit_2_ptr.bank) {
          ScriptStartBg(&player.hit_2_ptr, 0);
        }
        if (actor->events_ptr.bank) {
          ScriptStartBg(&actor->events_ptr, player.hit_actor);
        }
      } else if (actor->collision_group == 8) {
        if (player.hit_3_ptr.bank) {
          ScriptStartBg(&player.hit_3_ptr, 0);
        }
        if (actor->events_ptr.bank) {
          ScriptStartBg(&actor->events_ptr, player.hit_actor);
        }
      }
      player_iframes = 10;
      player.hit_actor = NO_ACTOR_COLLISON;
    }
  } else if (player_iframes != 0) {
    player_iframes--;
  }
}
