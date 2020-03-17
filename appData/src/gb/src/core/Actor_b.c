// clang-format off
#pragma bank=1
// clang-format on

#include "Actor.h"
#include "Sprite.h"
#include "Scroll.h"
#include "GameTime.h"

#define SCREENWIDTH_PLUS_64 224   // 160 + 64
#define SCREENHEIGHT_PLUS_64 208  // 144 + 64

UBYTE actors_active_delete[MAX_ACTIVE_ACTORS];

void MoveActors_b() {
  UBYTE i, a;

  for (i = 0; i != actors_active_size; i++) {
    a = actors_active[i];

    actors[a].pos.x = (WORD)actors[a].pos.x + (BYTE)actors[a].vel.x;
    actors[a].pos.y = (WORD)actors[a].pos.y + (BYTE)actors[a].vel.y;
  }
}

void UpdateActors_b() {
  UBYTE i, k, a, flip, fo;
  UINT16 screen_x;
  UINT16 screen_y;
  UBYTE del_count = 0;
  Actor *actor;

  k = 0;

  for (i = 0; i != actors_active_size; i++) {
    a = actors_active[i];
    actor = &actors[a];
    k = actors[a].sprite_index;
    flip = FALSE;
    fo = 0;

    if (!actor->enabled) {
      sprites[k].pos.x = -8;
      sprites[k].pos.y = -8;
      continue;
    }

    screen_x = 8u + actor->pos.x - scroll_x;
    screen_y = 8u + actor->pos.y - scroll_y;

    sprites[k].pos.x = screen_x;
    sprites[k].pos.y = screen_y;

    if (IS_FRAME_8 && (((actors[a].vel.x != 0 || actors[a].vel.y != 0) &&
                        actors[a].sprite_type != SPRITE_STATIC) ||
                       actors[a].animate)) {
      actors[a].frame++;
      if (actors[a].frame == actors[a].frames_len) {
        actors[a].frame = 0;
      }

      sprites[actors[a].sprite_index].frame = actors[a].frame;
      sprites[actors[a].sprite_index].rerender = TRUE;
    }

    if (actor->sprite_type != SPRITE_STATIC) {
      // Increase frame based on facing direction
      if (IS_NEG(actor->dir.y)) {
        fo = 1 + (actor->sprite_type == SPRITE_ACTOR_ANIMATED);
        if (sprites[k].frame_offset != fo) {
          sprites[k].frame_offset = fo;
          sprites[k].flip = FALSE;
          sprites[k].rerender = TRUE;
        }
      } else if (actor->dir.x != 0) {
        fo = 2 + MUL_2(actor->sprite_type == SPRITE_ACTOR_ANIMATED);
        if (sprites[k].frame_offset != fo) {
          sprites[k].frame_offset = fo;
          sprites[k].rerender = TRUE;
        }
        // Facing left so flip sprite
        if (IS_NEG(actor->dir.x)) {
          flip = TRUE;
          if (!sprites[k].flip) {
            sprites[k].flip = TRUE;
            sprites[k].rerender = TRUE;
          }
        } else  // Facing right
        {
          if (sprites[k].flip) {
            sprites[k].flip = FALSE;
            sprites[k].rerender = TRUE;
          }
        }
      } else {
        fo = 0;
        if (sprites[k].frame_offset != fo) {
          sprites[k].frame_offset = fo;
          sprites[k].flip = FALSE;
          sprites[k].rerender = TRUE;
        }
      }
    }

    // Check if actor is off screen
    if (((UINT16)(screen_x + 32u) >= SCREENWIDTH_PLUS_64) ||
        ((UINT16)(screen_y + 32u) >= SCREENHEIGHT_PLUS_64)) {
      // Mark off screen actor for removal
      actors_active_delete[del_count] = a;
      del_count++;
    }
  }

  // Remove all offscreen actors
  for (i = 0; i != del_count; i++) {
    a = actors_active_delete[i];
    DeactivateActor(a);
  }
}

void ActivateActor_b(UBYTE i) {
  UBYTE j;

  if (actors_active_size == MAX_ACTIVE_ACTORS) {
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
  sprites[actors[i].sprite_index].frame = actors[i].sprite;
  sprites[actors[i].sprite_index].frame_offset = 0;
  sprites[actors[i].sprite_index].rerender = TRUE;
}

void ActivateActorColumn_b(UBYTE tx_a, UBYTE ty_a) {
  UBYTE i;

  for (i = MAX_ACTORS - 1; i != 0; i--) {
    UBYTE tx_b, ty_b;

    tx_b = DIV_8(actors[i].pos.x);
    ty_b = DIV_8(actors[i].pos.y);

    if ((ty_a <= ty_b && ty_a + 20 >= ty_b) && (tx_a == tx_b || tx_a == tx_b + 1)) {
      ActivateActor_b(i);
    }
  }
}

void DeactivateActor_b(UBYTE i) {
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
    actors_active[a] = actors_active[--actors_active_size];
  }
}
