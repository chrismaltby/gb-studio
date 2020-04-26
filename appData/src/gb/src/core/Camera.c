#include "Camera.h"

#include "Actor.h"
#include "GameTime.h"

Pos camera_pos;
Pos *camera_target = 0;
Pos camera_offset;
UBYTE camera_speed;
UBYTE camera_settings = CAMERA_LOCK_FLAG;

void UpdateCamera() {
  if ((camera_settings & CAMERA_LOCK_FLAG) == CAMERA_LOCK_FLAG) {
    camera_pos.x = camera_target->x - camera_offset.x;
    camera_pos.y = camera_target->y - camera_offset.y;
  }
}
