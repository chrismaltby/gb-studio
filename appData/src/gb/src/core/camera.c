#pragma bank 1

#include "camera.h"

#include "actor.h"

INT16 camera_x = 0;
INT16 camera_y = 0;
BYTE camera_offset_x = 0;
BYTE camera_offset_y = 0;
BYTE camera_deadzone_x = 0;
BYTE camera_deadzone_y = 0;
UBYTE camera_settings = 0;

void camera_init() __banked {
    camera_settings = CAMERA_LOCK_FLAG;
    camera_deadzone_x = 0;
    camera_deadzone_y = 0;
}

void camera_update() __nonbanked {
    if (camera_settings & CAMERA_LOCK_FLAG) {
        // Camera locked to player
        actor_t * actor = &PLAYER;

        UWORD a_x = actor->pos.x >> 4;
        UWORD a_y = actor->pos.y >> 4;

        // Horizontal lock
        if (camera_x < a_x - camera_deadzone_x - camera_offset_x) { 
            camera_x = a_x - camera_deadzone_x - camera_offset_x;
        } else if (camera_x > a_x + camera_deadzone_x - camera_offset_x) { 
            camera_x = a_x + camera_deadzone_x - camera_offset_x;
        }

        // Vertical lock
        if (camera_y < a_y - camera_deadzone_y - camera_offset_y) { 
            camera_y = a_y - camera_deadzone_y - camera_offset_y;
        } else if (camera_y > a_y + camera_deadzone_y - camera_offset_y) { 
            camera_y = a_y + camera_deadzone_y - camera_offset_y;
        }
    }
}
