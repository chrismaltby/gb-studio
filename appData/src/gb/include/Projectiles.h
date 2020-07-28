#ifndef PROJECTILE_H
#define PROJECTILE_H

#include <gb/gb.h>

#include "Actor.h"
#include "BankData.h"
#include "Math.h"

#define PROJECTILE_BANK 1
#define MAX_PROJECTILES 5

typedef struct _PROJECTILE {
  Pos pos;
  Vector2D vel;
  Vector2D dir;
  UBYTE moving;
  UBYTE pin_actor;
  UBYTE sprite;
  SPRITE_TYPE sprite_type;
  UBYTE frame;
  UBYTE frames_len;
  UBYTE animate;
  UBYTE move_speed;
  UBYTE sprite_index;
  UBYTE time;
  UBYTE life_time;
  UBYTE col_group;
  UBYTE col_mask;
} Projectile;

extern Projectile projectiles[MAX_PROJECTILES];

void ProjectilesInit();
void WeaponAttack(UBYTE sprite, UBYTE actor, UBYTE col_group, UBYTE col_mask);
void ProjectileLaunch(UBYTE sprite,
                      WORD x,
                      WORD y,
                      BYTE dir_x,
                      BYTE dir_y,
                      UBYTE moving,
                      UBYTE move_speed,
                      UBYTE life_time,
                      UBYTE col_group,
                      UBYTE col_mask);
void UpdateProjectiles();

#endif
