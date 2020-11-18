#include "Projectiles.h"

#include "BankManager.h"

void ProjectilesInit_b() __banked;
void WeaponAttack_b(UBYTE sprite, UBYTE palette, UBYTE actor, UBYTE offset, UBYTE col_group, UBYTE col_mask) __banked;
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
                        UBYTE col_mask) __banked;
void UpdateProjectiles_b() __banked;

void ProjectilesInit() {
  ProjectilesInit_b();
}

void WeaponAttack(UBYTE sprite, UBYTE palette, UBYTE actor, UBYTE offset, UBYTE col_group, UBYTE col_mask) {
  WeaponAttack_b(sprite, palette, actor, offset, col_group, col_mask);
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
  ProjectileLaunch_b(sprite, palette, x, y, dir_x, dir_y, moving, move_speed, life_time, col_group,
                     col_mask);
}

void UpdateProjectiles() {
  UpdateProjectiles_b();
}
