#ifndef STATE_PLATFORM_H
#define STATE_PLATFORM_H

#include <gbdk/platform.h>

void platform_init(void) BANKED;
void platform_update(void) BANKED;

extern WORD pl_vel_x;
extern WORD pl_vel_y;
extern WORD plat_min_vel;
extern WORD plat_walk_vel;
extern WORD plat_run_vel;
extern WORD plat_climb_vel;
extern WORD plat_walk_acc;
extern WORD plat_run_acc;
extern WORD plat_dec;
extern WORD plat_jump_vel;
extern WORD plat_grav;
extern WORD plat_hold_grav;
extern WORD plat_max_fall_vel;

#endif
