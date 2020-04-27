#include "Camera.h"

#include "Actor.h"
#include "DataManager.h"
#include "GameTime.h"

Pos camera_pos;
Pos camera_dest;
Pos *camera_target = 0;
Pos camera_offset;
UBYTE camera_speed;
UBYTE camera_settings = CAMERA_LOCK_FLAG;

void UpdateCamera() {
  // Lock Camera to Target
  if ((camera_settings & CAMERA_LOCK_FLAG) == CAMERA_LOCK_FLAG) {
    camera_pos.x = camera_target->x - camera_offset.x;
    camera_pos.y = camera_target->y - camera_offset.y;
  }

  // Clamp Camera X
  if (camera_pos.x > image_width - SCREEN_WIDTH_HALF) {
    camera_pos.x = image_width - SCREEN_WIDTH_HALF;
  } else if (camera_pos.x < SCREEN_WIDTH_HALF) {
    camera_pos.x = SCREEN_WIDTH_HALF;
  }

  // Clamp Camera Y
  if (camera_pos.y > image_height - SCREEN_HEIGHT_HALF) {
    camera_pos.y = image_height - SCREEN_HEIGHT_HALF;
  } else if (camera_pos.y < SCREEN_HEIGHT_HALF) {
    camera_pos.y = SCREEN_HEIGHT_HALF;
  }
}
