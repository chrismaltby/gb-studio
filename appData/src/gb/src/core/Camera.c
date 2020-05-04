#include "Camera.h"

#include "BankManager.h"

Pos camera_pos;
Pos camera_dest;
Pos *camera_target = 0;
Pos camera_offset;
UBYTE camera_speed;
UBYTE camera_settings = CAMERA_LOCK_FLAG;

void UpdateCamera_b();

void UpdateCamera() {
  PUSH_BANK(CAMERA_BANK);
  UpdateCamera_b();
  POP_BANK;
}
