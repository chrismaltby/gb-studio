#ifndef CAMERA_H
#define CAMERA_H

#include <gb/gb.h>

#define SCREEN_WIDTH 160
#define SCREEN_HEIGHT 144
#define SCREEN_WIDTH_HALF 80
#define SCREEN_HEIGHT_HALF 72

#define CAMERA_LOCK_FLAG 0x03
#define CAMERA_LOCK_X_FLAG 0x01
#define CAMERA_LOCK_Y_FLAG 0x02
#define CAMERA_UNLOCKED 0x00

extern INT16 camera_x;
extern INT16 camera_y;
extern BYTE camera_offset_x;
extern BYTE camera_offset_y;
extern BYTE camera_deadzone_x;
extern BYTE camera_deadzone_y;
extern UBYTE camera_settings;

void camera_init() BANKED;
void camera_reset() BANKED;
void camera_update() NONBANKED;

#endif