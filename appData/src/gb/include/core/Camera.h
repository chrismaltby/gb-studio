#ifndef CAMERA_H
#define CAMERA_H

#include <gb/gb.h>
#include <gbdkjs.h>

#include "Math.h"

#define SCREEN_WIDTH 160
#define SCREEN_HEIGHT 144
#define SCREEN_WIDTH_HALF 80
#define SCREEN_HEIGHT_HALF 72

#define CAMERA_LOCK_FLAG 0x10
#define CAMERA_TRANSITION_FLAG 0x20
#define CAMERA_SPEED_MASK 0xF

extern Pos camera_pos;
extern Pos camera_dest;
extern Pos *camera_target;
extern Pos camera_offset;
extern UBYTE camera_settings;
extern UBYTE camera_speed;

void UpdateCamera();

#endif
