#pragma bank 1

#include "Projectiles.h"

#include "GameTime.h"
#include "Scroll.h"
#include "Sprite.h"
#include "Actor.h"
#include "DataManager.h"
#include "ScriptRunner.h"
#include "Math.h"

#define SCREENWIDTH_PLUS_64 224   // 160 + 64
#define SCREENHEIGHT_PLUS_64 208  // 144 + 64
#define NO_ACTOR_PINNED 255

Projectile projectiles[MAX_PROJECTILES];
UBYTE current_projectile = 0;

void ProjectilesInit_b() __banked {
  UBYTE i;
  for (i = 0; i != MAX_PROJECTILES; i++) {
    projectiles[i].sprite_index = SpritePoolNext();
    projectiles[i].life_time = 0;
  }
}

void WeaponAttack_b(UBYTE sprite, UBYTE palette, UBYTE actor, UBYTE offset, UBYTE col_group, UBYTE col_mask) __banked {
  if (projectiles[current_projectile].life_time == 0) {
    projectiles[current_projectile].moving = FALSE;
    projectiles[current_projectile].dir.x = actors[actor].dir.x;
    projectiles[current_projectile].dir.y = actors[actor].dir.y;
    projectiles[current_projectile].pin_actor = actor;
    projectiles[current_projectile].pin_offset = offset;

    if (actors[projectiles[current_projectile].pin_actor].dir.y == 0) {
      projectiles[current_projectile].pos.x =
          actors[projectiles[current_projectile].pin_actor].pos.x +
          (offset * actors[projectiles[current_projectile].pin_actor].dir.x);
      projectiles[current_projectile].pos.y =
          actors[projectiles[current_projectile].pin_actor].pos.y;
    } else {
      projectiles[current_projectile].pos.x =
          actors[projectiles[current_projectile].pin_actor].pos.x;
      projectiles[current_projectile].pos.y =
          actors[projectiles[current_projectile].pin_actor].pos.y +
          (offset * actors[projectiles[current_projectile].pin_actor].dir.y);
    }

    projectiles[current_projectile].move_speed = 0;
    projectiles[current_projectile].life_time = 30;
    projectiles[current_projectile].col_group = col_group;
    projectiles[current_projectile].col_mask = col_mask;
    projectiles[current_projectile].time = 1;
    projectiles[current_projectile].frame = 0;
    projectiles[current_projectile].palette_index = palette;
    projectiles[current_projectile].sprite = sprites_info[sprite].sprite_offset;
    projectiles[current_projectile].sprite_type = sprites_info[sprite].sprite_type;
    projectiles[current_projectile].frames_len = sprites_info[sprite].frames_len;
  }

  current_projectile = (current_projectile + 1) % MAX_PROJECTILES;
}

void ProjectileLaunch_b(UBYTE sprite,
                        UBYTE palette,
                        WORD x,
                        WORD y,
                        BYTE dir_x,
                        BYTE dir_y,
                        UBYTE moving,
                        UBYTE move_speed,
                        UBYTE life_time,
                        UBYTE col_group,
                        UBYTE col_mask) __banked {
  if (projectiles[current_projectile].life_time == 0) {
    projectiles[current_projectile].pin_actor = NO_ACTOR_PINNED;
    projectiles[current_projectile].moving = moving;
    projectiles[current_projectile].pos.x = x;
    projectiles[current_projectile].pos.y = y;
    projectiles[current_projectile].dir.x = dir_x;
    projectiles[current_projectile].dir.y = dir_y;
    projectiles[current_projectile].move_speed = move_speed;
    projectiles[current_projectile].life_time = life_time;
    projectiles[current_projectile].col_group = col_group;
    projectiles[current_projectile].col_mask = col_mask;
    projectiles[current_projectile].sprite_type = SPRITE_ACTOR_ANIMATED;
    projectiles[current_projectile].time = 1;
    projectiles[current_projectile].frame = 0;
    projectiles[current_projectile].frames_len = 2;
    projectiles[current_projectile].palette_index = palette;
    projectiles[current_projectile].sprite = sprites_info[sprite].sprite_offset;
    projectiles[current_projectile].sprite_type = sprites_info[sprite].sprite_type;
    projectiles[current_projectile].frames_len = sprites_info[sprite].frames_len;
  }

  current_projectile = (current_projectile + 1) % MAX_PROJECTILES;
}

void UpdateProjectiles_b() __banked {
  UBYTE i, k, j, hit, frame, flip, fo;
  UINT16 screen_x;
  UINT16 screen_y;

  for (i = 0; i != MAX_PROJECTILES; i++) {

    if (projectiles[i].life_time != 0) {
      // Determine if projectile hit any actors
      hit = NO_ACTOR_COLLISON;
      for (j = 0; j != actors_active_size; j++) {
        UBYTE a = actors_active[j];

        if (!actors[a].enabled || !actors[a].collisionsEnabled) {
          continue;
        }

        if (!(actors[a].collision_group & projectiles[i].col_mask)) {
          continue;
        }

        if ((projectiles[i].pos.x + 12 >= actors[a].pos.x) &&
            (projectiles[i].pos.x <= actors[a].pos.x + 12) &&
            (projectiles[i].pos.y + 8 >= actors[a].pos.y) &&
            (projectiles[i].pos.y <= actors[a].pos.y + 8)) {
          hit = a;
        }
      }

      // If hit actor play collision event
      if (hit != NO_ACTOR_COLLISON) {
        if (projectiles[i].pin_actor == NO_ACTOR_PINNED) {
          projectiles[i].life_time = 0;
        }
        if (projectiles[i].col_group == 2) {
          if (actors[hit].hit_1_ptr.bank) {
            projectiles[i].col_group = 0;
            ScriptStartBg(&actors[hit].hit_1_ptr, hit);
          }
        } else if (projectiles[i].col_group == 4) {
          if (actors[hit].hit_2_ptr.bank) {
            projectiles[i].col_group = 0;
            ScriptStartBg(&actors[hit].hit_2_ptr, hit);
          }
        } else if (projectiles[i].col_group == 8) {
          if (actors[hit].hit_3_ptr.bank) {
            projectiles[i].col_group = 0;
            ScriptStartBg(&actors[hit].hit_3_ptr, hit);
          }
        }
      }

      k = projectiles[i].sprite_index;

      // Projectile frame update
      fo = 0;
      flip = FALSE;
      if ((projectiles[i].time & 0x3) == 0) {
        projectiles[i].frame++;
      }
      if (projectiles[i].frame == projectiles[i].frames_len) {
        if (projectiles[i].pin_actor == NO_ACTOR_PINNED) {
          projectiles[i].frame = 0;
        } else {
          projectiles[i].life_time = 1;
          projectiles[i].frame--;
        }
      }

      if (projectiles[i].sprite_type != SPRITE_STATIC) {
        // Increase frame based on facing direction
        if (IS_NEG(projectiles[i].dir.y)) {
          fo = 1 + (projectiles[i].sprite_type == SPRITE_ACTOR_ANIMATED);
        } else if (projectiles[i].dir.y == 0 && projectiles[i].dir.x != 0) {
          fo = 2 + MUL_2(projectiles[i].sprite_type == SPRITE_ACTOR_ANIMATED);
        }
      }
      // Facing left so flip sprite
      if (IS_NEG(projectiles[i].dir.x)) {
        flip = TRUE;
      }      
      frame = MUL_4(projectiles[i].sprite + projectiles[i].frame + fo);

      // Update GB Sprite tile and props
      if (flip) {
#ifdef CGB        
        set_sprite_prop(k, projectiles[i].palette_index | S_FLIPX);
        set_sprite_prop(k + 1, projectiles[i].palette_index | S_FLIPX);
#else
        set_sprite_prop(k, S_FLIPX);
        set_sprite_prop(k + 1, S_FLIPX);
#endif
        set_sprite_tile(k, frame + 2);
        set_sprite_tile(k + 1, frame);
      } else {
#ifdef CGB        
        set_sprite_prop(k, projectiles[i].palette_index);
        set_sprite_prop(k + 1, projectiles[i].palette_index);
#else
        set_sprite_prop(k, 0);
        set_sprite_prop(k + 1, 0);
#endif
        set_sprite_tile(k, frame);
        set_sprite_tile(k + 1, frame + 2);
      }

      // Reposition GB Sprite
      screen_x = 8u + projectiles[i].pos.x - scroll_x;
      screen_y = 8u + projectiles[i].pos.y - scroll_y;

      move_sprite(k, screen_x, screen_y);
      move_sprite(k + 1, screen_x + 8, screen_y);

      // Check if actor is off screen
      if (IS_FRAME_4) {
        if (((UINT16)(screen_x + 32u) >= SCREENWIDTH_PLUS_64) ||
            ((UINT16)(screen_y + 32u) >= SCREENHEIGHT_PLUS_64)) {
          // Mark off screen projectile for removal
          projectiles[i].life_time = 0;
        } else {
          projectiles[i].life_time--;
        }
      }

      if (projectiles[i].pin_actor == NO_ACTOR_PINNED) {
        // If launched projectile continue movement in current direction
        if (projectiles[i].moving) {
          if (projectiles[i].move_speed == 0) {
            // Half speed only move every other frame
            if (IS_FRAME_2) {
              projectiles[i].pos.x += projectiles[i].dir.x;
              projectiles[i].pos.y += projectiles[i].dir.y;
            }
          } else {
            projectiles[i].pos.x += projectiles[i].dir.x * projectiles[i].move_speed;
            projectiles[i].pos.y += projectiles[i].dir.y * projectiles[i].move_speed;
          }
        }
      } else {
        // If pinned projectile reposition based on parent actor pos/dir
        if ((actors[projectiles[i].pin_actor].dir.x != projectiles[i].dir.x) ||
            (actors[projectiles[i].pin_actor].dir.y != projectiles[i].dir.y)) {
          projectiles[i].life_time = 0;
        } else {
          if (actors[projectiles[i].pin_actor].dir.y == 0) {
            projectiles[i].pos.x = actors[projectiles[i].pin_actor].pos.x +
                                   (projectiles[i].pin_offset * actors[projectiles[i].pin_actor].dir.x);
            projectiles[i].pos.y = actors[projectiles[i].pin_actor].pos.y;
          } else {
            projectiles[i].pos.x = actors[projectiles[i].pin_actor].pos.x;
            projectiles[i].pos.y = actors[projectiles[i].pin_actor].pos.y +
                                   (projectiles[i].pin_offset * actors[projectiles[i].pin_actor].dir.y);
          }
        }
      }

      projectiles[i].time++;

    } else {
      k = projectiles[i].sprite_index;
      move_sprite(k, 0, 0);
      move_sprite(k + 1, 0, 0);
    }
  }
}
