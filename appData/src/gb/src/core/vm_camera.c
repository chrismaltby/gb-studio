#pragma bank 2

#include "vm.h"

#include "camera.h"
#include "scroll.h"
#include "game_time.h"

typedef struct cam_move_to_t {
    INT16 X, Y;
} cam_move_to_t;

typedef struct cam_set_pos_t {
    INT16 X, Y;
} cam_set_pos_t;

void vm_camera_move_to(SCRIPT_CTX * THIS, INT16 idx, UBYTE speed, UBYTE after_lock_camera) __banked {

    // indicate waitable state of context
    THIS->waitable = 1;

    cam_move_to_t * params = VM_REF_TO_PTR(idx);

    // Actor reached destination
    if ((camera_x == params->X) && (camera_y == params->Y)) {
        if (after_lock_camera) {
            camera_settings = camera_settings | CAMERA_LOCK_FLAG;
        }
        return;
    }

    // Disable camera lock
    camera_settings &= ~(CAMERA_LOCK_FLAG);

    // Move camera towards destination
    if ((game_time & speed) == 0) {
        if (camera_x > params->X) {
            camera_x--;
        } else if (camera_x < params->X) {
            camera_x++;
        }
        if (camera_y > params->Y) {
            camera_y--;
        } else if (camera_y < params->Y) {
            camera_y++;
        }
    }

    THIS->PC -= (INSTRUCTION_SIZE + sizeof(idx) + sizeof(speed) + sizeof(after_lock_camera));
    return;
}

void vm_camera_set_pos(SCRIPT_CTX * THIS, INT16 idx) __banked {
    cam_set_pos_t * params = VM_REF_TO_PTR(idx);
    camera_x = params->X;
    camera_y = params->Y;

    // Disable camera lock
    camera_settings &= ~(CAMERA_LOCK_FLAG);

    scroll_update();
    return;
}
