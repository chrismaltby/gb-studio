#pragma bank 255

#include "data/states_defines.h"
#include "states/logo.h"

#include "camera.h"
#include "game_time.h"

void logo_init() BANKED {
  camera_offset_x = 0;
  camera_offset_y = 0;

  game_time = 0;
}

void logo_update() BANKED {
    return;
}
