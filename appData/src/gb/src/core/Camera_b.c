// clang-format off
#pragma bank 1
// clang-format on

#include "Actor.h"
#include "Camera.h"
#include "DataManager.h"
#include "GameTime.h"

void UpdateCamera_b() {
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
