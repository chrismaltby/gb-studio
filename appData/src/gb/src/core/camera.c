#pragma bank 255

#include "camera.h"

#include "actor.h"

INT16 camera_x;
INT16 camera_y;
BYTE camera_offset_x;
BYTE camera_offset_y;
BYTE camera_deadzone_x;
BYTE camera_deadzone_y;
UBYTE camera_settings;

void camera_init() BANKED {
    camera_x = camera_y = 0;
    camera_offset_x = camera_offset_y = 0;
    camera_reset();
}

void camera_reset() BANKED {
    camera_deadzone_x = camera_deadzone_y = 0;
    camera_settings = CAMERA_LOCK_FLAG;
}

void camera_update() NONBANKED {
    if ((camera_settings & CAMERA_LOCK_X_FLAG)) {
        UWORD a_x = (PLAYER.pos.x >> 4) + 8;
        // Horizontal lock
        if (camera_x < a_x - camera_deadzone_x - camera_offset_x) { 
            camera_x = a_x - camera_deadzone_x - camera_offset_x;
        } else if (camera_x > a_x + camera_deadzone_x - camera_offset_x) { 
            camera_x = a_x + camera_deadzone_x - camera_offset_x;
        }
    }

    if ((camera_settings & CAMERA_LOCK_Y_FLAG)) {
        UWORD a_y = (PLAYER.pos.y >> 4) + 8;
        // Vertical lock
        if (camera_y < a_y - camera_deadzone_y - camera_offset_y) { 
            camera_y = a_y - camera_deadzone_y - camera_offset_y;
        } else if (camera_y > a_y + camera_deadzone_y - camera_offset_y) { 
            camera_y = a_y + camera_deadzone_y - camera_offset_y;
        }
    }
}
