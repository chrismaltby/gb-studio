#ifndef CAMERA_H
#define CAMERA_H

#include <gbdk/platform.h>

#define SCREEN_WIDTH 160
#define SCREEN_HEIGHT 144
#define SCREEN_WIDTH_HALF 80
#define SCREEN_HEIGHT_HALF 72

#define CAMERA_UNLOCKED 0x00
#define CAMERA_LOCK_X_FLAG 0x01
#define CAMERA_LOCK_Y_FLAG 0x02
#define CAMERA_LOCK_FLAG (CAMERA_LOCK_X_FLAG | CAMERA_LOCK_Y_FLAG)

extern INT16 camera_x;
extern INT16 camera_y;
extern BYTE camera_offset_x;
extern BYTE camera_offset_y;
extern BYTE camera_deadzone_x;
extern BYTE camera_deadzone_y;
extern UBYTE camera_settings;

void camera_init(void) BANKED;

inline void camera_reset(void) {
    camera_deadzone_x = camera_deadzone_y = 0;
}

void camera_update(void) NONBANKED;

#endif