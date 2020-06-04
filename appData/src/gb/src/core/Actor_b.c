// clang-format off
#pragma bank=1
// clang-format on

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

void MoveActors_b() {
  UBYTE i, a;
  UBYTE actor_time;

  actor_time = game_time >> 2;

  for (i = 0; i != actors_active_size; i++) {
    a = actors_active[i];

    // if ((actor_time & 0xF) == i) {
    //   // Time to run this actor's movement script
    //   if(actors[a].movement_ptr.bank) {
    //     ScriptStart(&actors[a].movement_ptr);
    //   }
    // }

    if (actors[a].moving) {
      if (actors[a].move_speed == 0) {
        // Half speed only move every other frame
        if (IS_FRAME_2) {
          actors[a].pos.x += actors[a].dir.x;
          actors[a].pos.y += actors[a].dir.y;
        }
      } else {
        actors[a].pos.x += actors[a].dir.x * actors[a].move_speed;
        actors[a].pos.y += actors[a].dir.y * actors[a].move_speed;
      }
    }
  }
}

void UpdateActors_b() {
  UBYTE i, k, a, flip, frame;
  UBYTE fo = 0;
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
      move_sprite(k, 0, 0);
      move_sprite(k + 1, 0, 0);
      continue;
    }

    if(actor->pinned) {
      screen_x = 8u + actor->pos.x;
      screen_y = 8u + actor->pos.y;
    } else {
      screen_x = 8u + actor->pos.x - scroll_x;
      screen_y = 8u + actor->pos.y - scroll_y;
    }

    // Update animation frames
    if (IS_FRAME_8 &&
        (((actors[a].moving) && actors[a].sprite_type != SPRITE_STATIC) || actors[a].animate)) {
      if (actors[a].anim_speed == 4 || (actors[a].anim_speed == 3 && IS_FRAME_16) ||
          (actors[a].anim_speed == 2 && IS_FRAME_32) ||
          (actors[a].anim_speed == 1 && IS_FRAME_64) ||
          (actors[a].anim_speed == 0 && IS_FRAME_128)) {
        actors[a].frame++;
      }
      if (actors[a].frame == actors[a].frames_len) {
        actors[a].frame = 0;
      }

      actor->rerender = TRUE;
    }

    // Rerender actors
    if (actor->rerender) {
      if (actor->sprite_type != SPRITE_STATIC) {
        // Increase frame based on facing direction
        if (IS_NEG(actor->dir.y)) {
          fo = 1 + (actor->sprite_type == SPRITE_ACTOR_ANIMATED);
        } else if (actor->dir.y == 0 && actor->dir.x != 0) {
          fo = 2 + MUL_2(actor->sprite_type == SPRITE_ACTOR_ANIMATED);
        }
        // Facing left so flip sprite
        if (IS_NEG(actor->dir.x)) {
          LOG("AUR FLIP DIR X0\n");
          flip = TRUE;
        }
      }

      LOG("RERENDER actor a=%u\n", a);

      frame = MUL_4(actor->sprite + actor->frame + fo);
      LOG("RERENDER actor a=%u with FRAME %u  [ %u + %u ] \n", a, frame, actor->sprite,
          actor->frame_offset);

      if (flip) {
        #ifdef CGB
          set_sprite_prop(k, actor->palette_index | S_FLIPX);
          set_sprite_prop(k + 1, actor->palette_index | S_FLIPX);
        #else
          set_sprite_prop(k, S_FLIPX);
          set_sprite_prop(k + 1, S_FLIPX);        
        #endif
        set_sprite_tile(k, frame + 2);
        set_sprite_tile(k + 1, frame);
      } else {
        #ifdef CGB
          set_sprite_prop(k, actor->palette_index);
          set_sprite_prop(k + 1, actor->palette_index);
        #else
          set_sprite_prop(k, 0);
          set_sprite_prop(k + 1, 0);        
        #endif
        set_sprite_tile(k, frame);
        set_sprite_tile(k + 1, frame + 2);
      }

      actor->rerender = FALSE;
    }

    /*
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
    */

    // LOG("SPRITE MOVE %u %u\n", i, s);

    if (!hide_sprites_under_win && screen_x > WX_REG && screen_y - 8 > WY_REG) {
      move_sprite(k, 0, 0);
      move_sprite(k + 1, 0, 0);
    } else {
      move_sprite(k, screen_x, screen_y);
      move_sprite(k + 1, screen_x + 8, screen_y);
    }

    // Check if actor is off screen
    if (IS_FRAME_4 && (a != script_ctxs[0].script_actor)) {
      if (((UINT16)(screen_x + 32u) >= SCREENWIDTH_PLUS_64) ||
          ((UINT16)(screen_y + 32u) >= SCREENHEIGHT_PLUS_64)) {
        // Mark off screen actor for removal
        actors_active_delete[del_count] = a;
        del_count++;
      }
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
  actors[i].frame_offset = 0;
  actors[i].rerender = TRUE;

  if(actors[i].movement_ptr.bank) {
    // ScriptStartBg(&actors[i].movement_ptr);
    actors[i].movement_ctx = ScriptStartBg(&actors[i].movement_ptr, i);
    LOG("BG_SCRIPT START owner=%u ctx=%u\n", i, actors[i].movement_ctx);
  } else {
    actors[i].movement_ctx = 0;
  }
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
    if(actors[i].movement_ctx) {
      LOG("BG_SCRIPT STOP owner=%u ctx=%u\n", i, actors[i].movement_ctx);
      ScriptCtxPoolReturn(actors[i].movement_ctx, i);
    }
    actors_active[a] = actors_active[--actors_active_size];
  }
}

void ActorsUnstick_b() {
  UBYTE i, a;
  // Fix stuck actors
  for (i = 0; i != actors_active_size; i++) {
    a = actors_active[i];
    if (!actors[a].moving && !ActorOnTile(a)) {
      actors[a].moving = TRUE;
    }
  }
}

void ActorSetMovement_b(UBYTE i, BYTE dir_x, BYTE dir_y) {
  UBYTE tile_x, tile_y, hit_actor;

  tile_x = actors[i].pos.x >> 3;
  tile_y = actors[i].pos.y >> 3;

  actors[i].dir.x = 0;
  actors[i].dir.y = 0;
  actors[i].dir.x = dir_x;
  actors[i].dir.y = dir_y;
  actors[i].rerender = TRUE;
  actors[i].moving = FALSE;

  if (actors[i].collisionsEnabled) {
    // Move left
    if (dir_x == -1) {
      UBYTE tile_left = tile_x - 1;
#ifdef COLS_16
      hit_actor = ActorAt1x3Tile(tile_left - 1, tile_y - 1, FALSE);
      if (!TileAt2x2(tile_left, tile_y - 1) && (hit_actor == NO_ACTOR_COLLISON || hit_actor == i)) {
        actors[i].moving = TRUE;
      }
#else
      hit_actor = ActorAt1x2Tile(tile_left - 1, tile_y, FALSE);
      if (!TileAt2x1(tile_left, tile_y) && (hit_actor == NO_ACTOR_COLLISON || hit_actor == i)) {
        actors[i].moving = TRUE;
      }
#endif
      // Move right
    } else if (dir_x == 1) {
      UBYTE tile_right = tile_x + 1;
#ifdef COLS_16
      hit_actor = ActorAt1x3Tile(tile_right + 1, tile_y - 1, FALSE);
      if (!TileAt2x2(tile_right, tile_y - 1) &&
          (hit_actor == NO_ACTOR_COLLISON || hit_actor == i)) {
        actors[i].moving = TRUE;
      }
#else
      hit_actor = ActorAt1x2Tile(tile_right + 1, tile_y, FALSE);
      if (!TileAt2x1(tile_right, tile_y) && (hit_actor == NO_ACTOR_COLLISON || hit_actor == i)) {
        actors[i].moving = TRUE;
      }
#endif
    }
    // Move up
    if (dir_y == -1) {
#ifdef COLS_16
      UBYTE tile_up = tile_y - 2;
      hit_actor = ActorAt3x1Tile(tile_x - 1, tile_up, FALSE);
      if (!TileAt2x2(tile_x, tile_up) && (hit_actor == NO_ACTOR_COLLISON || hit_actor == i)) {
        actors[i].moving = TRUE;
      }
#else
      UBYTE tile_up = tile_y - 1;
      hit_actor = ActorAt3x1Tile(tile_x - 1, tile_up, FALSE);
      if (!TileAt2x1(tile_x, tile_up) && (hit_actor == NO_ACTOR_COLLISON || hit_actor == i)) {
        actors[i].moving = TRUE;
      }
#endif
      // Move down
    } else if (dir_y == 1) {
      UBYTE tile_down = tile_y + 1;
      hit_actor = ActorAt3x1Tile(tile_x - 1, tile_down + 1, FALSE);
      LOG("DIR DOWN %u [%u, %u]\n", hit_actor, tile_x, tile_down + 1);
      if (!TileAt2x2(tile_x, tile_down - 1) && (hit_actor == NO_ACTOR_COLLISON || hit_actor == i)) {
        hit_actor = ActorAt3x1Tile(tile_x - 1, tile_down, FALSE);
        if (hit_actor == NO_ACTOR_COLLISON || hit_actor == i) {
          actors[i].moving = TRUE;
        }
      }
    }
  } else {
    actors[i].moving = TRUE;
  }
}

UBYTE ActorInFrontOfActor_b(UBYTE i) {
  UBYTE tile_x, tile_y;
  UBYTE hit_actor = 0;

  tile_x = actors[i].pos.x >> 3;
  tile_y = actors[i].pos.y >> 3;

  if (actors[i].dir.y == -1) {
    LOG("CHECK HIT UP\n");
    LOG_VALUE("check_x", tile_x);
    LOG_VALUE("check_y", tile_y - 1);
#ifdef COLS_16
    hit_actor = ActorAt3x1Tile(tile_x - 1, tile_y - 2, TRUE);
#else
    hit_actor = ActorAt3x1Tile(tile_x - 1, tile_y - 1, TRUE);
#endif
  } else if (actors[i].dir.y == 1) {
    LOG("CHECK HIT DOWN\n");
    LOG_VALUE("check_x", tile_x);
    LOG_VALUE("check_y", tile_y + 2);
    hit_actor = ActorAt3x1Tile(tile_x - 1, tile_y + 2, TRUE);
  } else {
    if (actors[i].dir.x == -1) {
      LOG("CHECK HIT LEFT\n");
      LOG_VALUE("check_x", tile_x - 1);
      LOG_VALUE("check_y", tile_y);
#ifdef COLS_16
      hit_actor = ActorAt1x3Tile(tile_x - 2, tile_y - 1, TRUE);
#else
      hit_actor = ActorAt1x2Tile(tile_x - 2, tile_y, TRUE);
#endif
    } else if (actors[i].dir.x == 1) {
      LOG("CHECK HIT RIGHT\n");
      LOG_VALUE("check_x", tile_x + 2);
      LOG_VALUE("check_y", tile_y);
#ifdef COLS_16
      hit_actor = ActorAt1x3Tile(tile_x + 2, tile_y - 1, TRUE);
#else
      hit_actor = ActorAt1x2Tile(tile_x + 2, tile_y, TRUE);
#endif
    }
  }

  if (hit_actor == i) {
    return NO_ACTOR_COLLISON;
  }

  return hit_actor;
}

void InitPlayer_b() {
  UBYTE sprite_frames;

  sprite_frames = DIV_4(LoadSprite(map_next_sprite, 0));
  player.enabled = TRUE;
  player.moving = FALSE;
  player.palette_index = PLAYER_PALETTE;
  player.collisionsEnabled = TRUE;
  player.pos.x = map_next_pos.x;
  player.pos.y = map_next_pos.y;
  player.start_pos.x = player.pos.x;
  player.start_pos.y = player.pos.y;
  player.dir.x = map_next_dir.x;
  player.dir.y = map_next_dir.y;
  player.sprite_type = sprite_frames == 6 ? SPRITE_ACTOR_ANIMATED
                                          : sprite_frames == 3 ? SPRITE_ACTOR : SPRITE_STATIC;
  player.frames_len = sprite_frames == 6 ? 2 : sprite_frames == 3 ? 1 : sprite_frames;
  player.sprite_index = SpritePoolNext();
  player.rerender = TRUE;
  player.moving = FALSE;
  player.animate = FALSE;
}
