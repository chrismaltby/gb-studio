#include "Camera.h"

#include "BankManager.h"

Pos camera_pos;
Pos camera_dest;
Pos* camera_target = 0;
Vector2D camera_offset;
UBYTE camera_speed;
UBYTE camera_settings = CAMERA_LOCK_FLAG;
Vector2D camera_deadzone;

void UpdateCamera_b();

void UpdateCamerac() {
  PUSH_BANK(CAMERA_BANK);
  UpdateCamera_b();
  POP_BANK;
}
