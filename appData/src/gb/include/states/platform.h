#ifndef STATE_PLATFORM_H
#define STATE_PLATFORM_H

#include <gb/gb.h>

void platform_init();
void platform_update();

extern WORD platform_vel_x;
extern WORD platform_vel_y;
extern WORD platform_min_vel;
extern WORD platform_walk_vel;
extern WORD platform_run_vel;
extern WORD platform_climb_vel;
extern WORD platform_walk_acc;
extern WORD platform_run_acc;
extern WORD platform_dec;
extern WORD platform_jump_vel;
extern WORD platform_grav;
extern WORD platform_hold_grav;
extern WORD platform_max_fall_vel;

#endif
