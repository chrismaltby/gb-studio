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
    WORD diff_x = camera_pos.x - (camera_target->x - camera_offset.x);
    WORD diff_y = camera_pos.y - (camera_target->y - camera_offset.y);

    if(diff_x > camera_deadzone.x) {
      camera_pos.x = camera_target->x - camera_offset.x + camera_deadzone.x;
    } else if (diff_x < -camera_deadzone.x) {
      camera_pos.x = camera_target->x - camera_offset.x - camera_deadzone.x;
    }
    if(diff_y > camera_deadzone.y) {
      camera_pos.y = camera_target->y - camera_offset.y + camera_deadzone.y;
    } else if (diff_y < -camera_deadzone.y) {
      camera_pos.y = camera_target->y - camera_offset.y - camera_deadzone.y;
    }
  }

  // Clamp Camera X
  if (U_LESS_THAN(image_width - SCREEN_WIDTH_HALF, camera_pos.x)) {
    camera_pos.x = image_width - SCREEN_WIDTH_HALF;
  } else if (U_LESS_THAN(camera_pos.x, SCREEN_WIDTH_HALF)) {
    camera_pos.x = SCREEN_WIDTH_HALF;
  }

  // Clamp Camera Y
  if (U_LESS_THAN(image_height - SCREEN_HEIGHT_HALF, camera_pos.y)) {
    camera_pos.y = image_height - SCREEN_HEIGHT_HALF;
  } else if (U_LESS_THAN(camera_pos.y, SCREEN_HEIGHT_HALF)) {
    camera_pos.y = SCREEN_HEIGHT_HALF;
  }
}
