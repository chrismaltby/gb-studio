#include "Projectiles.h"

#include "BankManager.h"

void ProjectilesInit_b();
void WeaponAttack_b(UBYTE sprite, UBYTE palette, UBYTE actor, UBYTE col_group, UBYTE col_mask);
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
                        UBYTE col_mask);
void UpdateProjectiles_b();

void ProjectilesInit() {
  PUSH_BANK(PROJECTILE_BANK);
  ProjectilesInit_b();
  POP_BANK;
}

void WeaponAttack(UBYTE sprite, UBYTE palette, UBYTE actor, UBYTE col_group, UBYTE col_mask) {
  PUSH_BANK(PROJECTILE_BANK);
  WeaponAttack_b(sprite, palette, actor, col_group, col_mask);
  POP_BANK;
}

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
                      UBYTE col_mask) {
  PUSH_BANK(PROJECTILE_BANK);
  ProjectileLaunch_b(sprite, palette, x, y, dir_x, dir_y, moving, move_speed, life_time, col_group,
                     col_mask);
  POP_BANK;
}

void UpdateProjectiles() {
  PUSH_BANK(PROJECTILE_BANK);
  UpdateProjectiles_b();
  POP_BANK;
}
