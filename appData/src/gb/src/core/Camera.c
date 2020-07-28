#include "Camera.h"

Pos camera_pos;
Pos camera_dest;
Vector2D camera_offset;
UBYTE camera_speed;
UBYTE camera_settings = CAMERA_LOCK_FLAG;
Vector2D camera_deadzone;
