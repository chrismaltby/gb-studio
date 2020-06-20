// clang-format off
#pragma bank=1
// clang-format on

#include "Projectiles.h"

#include "GameTime.h"
#include "Scroll.h"
#include "Sprite.h"
#include "Actor.h"
#include "DataManager.h"
#include "ScriptRunner.h"

#define SCREENWIDTH_PLUS_64 224   // 160 + 64
#define SCREENHEIGHT_PLUS_64 208  // 144 + 64

#define EMOTE_SPRITE 124

Projectile projectiles[MAX_PROJECTILES];
UBYTE current_projectile = 0;

void ProjectilesInit_b() {
  UBYTE i;
  for (i = 0; i != MAX_PROJECTILES; i++) {
    projectiles[i].sprite_index = SpritePoolNext();
    LOG("MADE PROJECTILE %u WITH sprite_index=%u\n", i, projectiles[i].sprite_index);
  }
}

void ProjectileLaunch_b(UBYTE sprite, WORD x, WORD y, BYTE dir_x, BYTE dir_y, UBYTE moving,
                        UBYTE move_speed, UBYTE life_time, UBYTE col_group, UBYTE col_mask) {

  if (projectiles[current_projectile].life_time == 0) {
    set_sprite_prop(projectiles[current_projectile].sprite_index, 0);
    set_sprite_prop(projectiles[current_projectile].sprite_index + 1, 0);
    set_sprite_tile(projectiles[current_projectile].sprite_index, sprite * 4);
    set_sprite_tile(projectiles[current_projectile].sprite_index + 1, (sprite * 4) + 2);

    projectiles[current_projectile].life_time = 0;
    projectiles[current_projectile].moving = 0;
    projectiles[current_projectile].pos.x = 0;
    projectiles[current_projectile].pos.y = 0;
    projectiles[current_projectile].dir.x = 0;
    projectiles[current_projectile].dir.y = 0;
    projectiles[current_projectile].move_speed = 0;
    projectiles[current_projectile].life_time = 0;
    projectiles[current_projectile].col_group = 0;
    projectiles[current_projectile].col_mask = 0;

    projectiles[current_projectile].moving = moving;
    projectiles[current_projectile].pos.x = x;
    projectiles[current_projectile].pos.y = y;
    projectiles[current_projectile].dir.x = dir_x;
    projectiles[current_projectile].dir.y = dir_y;
    projectiles[current_projectile].move_speed = move_speed;
    projectiles[current_projectile].life_time = life_time;
    projectiles[current_projectile].col_group = col_group;
    projectiles[current_projectile].col_mask = col_mask;
  }

  current_projectile = (current_projectile + 1) % MAX_PROJECTILES;
}

void UpdateProjectiles_b() {
  UBYTE i, k, j, hit;
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

        if ((projectiles[i].pos.x + 16 >= actors[a].pos.x) &&
            (projectiles[i].pos.x <= actors[a].pos.x + 16) &&
            (projectiles[i].pos.y + 8 >= actors[a].pos.y) &&
            (projectiles[i].pos.y <= actors[a].pos.y + 8)) {
          hit = a;
        }
      }

      // If hit actor play collision event
      if (hit != NO_ACTOR_COLLISON) {
        projectiles[i].life_time = 0;
        if(projectiles[i].col_group == 2) {
          if(actors[hit].hit_1_ptr.bank) {
            ScriptStartBg(&actors[hit].hit_1_ptr, a);
          }
        } else if(projectiles[i].col_group == 4) {
          if(actors[hit].hit_2_ptr.bank) {
            ScriptStartBg(&actors[hit].hit_2_ptr, a);
          }
        } else if(projectiles[i].col_group == 8) {
          if(actors[hit].hit_3_ptr.bank) {
            ScriptStartBg(&actors[hit].hit_3_ptr, a);
          }
        }
      }

      k = projectiles[i].sprite_index;
      screen_x = 8u + projectiles[i].pos.x - scroll_x;
      screen_y = 8u + projectiles[i].pos.y - scroll_y;

      move_sprite(k, screen_x, screen_y);
      move_sprite(k + 1, screen_x + 8, screen_y);

      // Check if actor is off screen
      if (IS_FRAME_4) {
        if (((UINT16)(screen_x + 32u) >= SCREENWIDTH_PLUS_64) ||
            ((UINT16)(screen_y + 32u) >= SCREENHEIGHT_PLUS_64)) {
          // Mark off screen actor for removal
          LOG("PROJECTILE OFFSCREEN %u p_x=%d s_x=%u s_y=%u s1_x=%u s1_y=%u max_x=%u max_y=%u\n", i,
              projectiles[i].pos.x, screen_x, screen_y, (UINT16)(screen_x + 32u),
              (UINT16)(screen_y + 32u), SCREENWIDTH_PLUS_64, SCREENHEIGHT_PLUS_64);
          projectiles[i].life_time = 0;
        } else {
          projectiles[i].life_time--;
        }
      }

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
      LOG("HIDE PROJECTILE %u\n", i);
      k = projectiles[i].sprite_index;
      move_sprite(k, 0, 0);
      move_sprite(k + 1, 0, 0);
    }
  }
}
