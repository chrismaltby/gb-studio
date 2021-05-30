#ifndef CAMERA_H
#define CAMERA_H

#include <gb/gb.h>

#include "Math.h"

#define CAMERA_BANK 1

#define SCREEN_WIDTH 160
#define SCREEN_HEIGHT 144
#define SCREEN_WIDTH_HALF 80
#define SCREEN_HEIGHT_HALF 72

#define CAMERA_LOCK_FLAG 0x10
#define CAMERA_TRANSITION_FLAG 0x20
#define CAMERA_SPEED_MASK 0xF

extern Pos camera_pos;
extern Pos camera_dest;
extern Vector2D camera_offset;
extern Vector2D camera_deadzone;
extern UBYTE camera_settings;
extern UBYTE camera_speed;

/**
 * Update camera position based on scroll target and deadzone settings
 */
void UpdateCamera();

#endif
