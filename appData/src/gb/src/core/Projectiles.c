#include "Projectiles.h"

#include "BankManager.h"

void ProjectilesInit_b();
void ProjectileLaunch_b(UBYTE sprite, WORD x, WORD y, BYTE dir_x, BYTE dir_y, UBYTE moving,
                        UBYTE move_speed, UBYTE life_time, UBYTE col_mask);
void UpdateProjectiles_b();

void ProjectilesInit() {
  PUSH_BANK(PROJECTILE_BANK);
  ProjectilesInit_b();
  POP_BANK;
}

void ProjectileLaunch(UBYTE sprite, WORD x, WORD y, BYTE dir_x, BYTE dir_y, UBYTE moving,
                      UBYTE move_speed, UBYTE life_time, UBYTE col_mask) {
  PUSH_BANK(PROJECTILE_BANK);
  ProjectileLaunch_b(sprite, x, y, dir_x, dir_y, moving, move_speed, life_time, col_mask);
  POP_BANK;
}

void UpdateProjectiles() {
  PUSH_BANK(PROJECTILE_BANK);
  UpdateProjectiles_b();
  POP_BANK;
}
