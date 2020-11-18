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
  UBYTE pin_offset;
  UBYTE sprite;
  UBYTE palette_index;
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

/**
 * Initialise projectiles array
 */
void ProjectilesInit();

/**
 * Update all projectiles and their corresponding sprites
 */
void UpdateProjectiles();

/**
 * Same as UpdateProjectiles() but requires manually switching to bank 1 first
 */
void UpdateProjectiles_b() __banked;

/**
 * Create weapon attack projectile infront of specified actor relative to their facing direction
 * 
 * @param sprite Index of in vram of sprite to use
 * @param palette Palette index for sprite color
 * @param actor Index of actor that will attack
 * @param offset Offset in front of player to place attack sprite
 * @param col_group Collision group that attack belongs to
 * @param col_mask Collision mask to collide with
 */
void WeaponAttack(UBYTE sprite, UBYTE palette, UBYTE actor, UBYTE offset, UBYTE col_group, UBYTE col_mask);

/**
 * Launch projectile from location
 * 
 * @param sprite Index of in vram of sprite to use
 * @param palette Palette index for sprite color
 * @param x X Coordinate of launch
 * @param y Y Coordinate of launch
 * @param dir_x X direction to move projectile
 * @param dir_y Y direction to move projectile
 * @param moving Should projectile move from starting location
 * @param move_speed Speed of projectile
 * @param life_time How long projectile should exist
 * @param col_group Collision group that attack belongs to
 * @param col_mask Collision mask to collide with
 */
void ProjectileLaunch(UBYTE sprite,
                      UBYTE palette,
                      WORD x,
                      WORD y,
                      BYTE dir_x,
                      BYTE dir_y,
                      UBYTE moving,
                      UBYTE move_speed,
                      UBYTE life_time,
                      UBYTE col_group,
                      UBYTE col_mask);

#endif
