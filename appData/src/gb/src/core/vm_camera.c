#pragma bank 2

#include <rand.h>

#include "vm.h"
#include "vm_camera.h"

#include "camera.h"
#include "scroll.h"
#include "game_time.h"

#define CAMERA_MOVE_INACTIVE        0
#define CAMERA_MOVE_ACTIVE          1

typedef struct cam_move_to_t {
    INT16 X, Y;
} cam_move_to_t;

typedef struct cam_set_pos_t {
    INT16 X, Y;
} cam_set_pos_t;

void vm_camera_move_to(SCRIPT_CTX * THIS, INT16 idx, UBYTE speed, UBYTE after_lock_camera) OLDCALL __banked {

    // indicate waitable state of context
    THIS->waitable = 1;

    cam_move_to_t * params = VM_REF_TO_PTR(idx);

    if (THIS->flags == CAMERA_MOVE_INACTIVE) {
        THIS->flags = CAMERA_MOVE_ACTIVE;

        // Disable camera lock
        camera_settings &= ~(CAMERA_LOCK_FLAG);

        // If locking to player only move in locked axis
        if (after_lock_camera & CAMERA_LOCK_FLAG) {
            if (!(after_lock_camera & CAMERA_LOCK_X_FLAG)) {
                params->X = camera_x;
            }
            if (!(after_lock_camera & CAMERA_LOCK_Y_FLAG)) {
                params->Y = camera_y;
            }
        }
    }

    // Actor reached destination
    if ((camera_x == params->X) && (camera_y == params->Y)) {
        camera_settings |= (after_lock_camera & CAMERA_LOCK_FLAG);
        THIS->flags = CAMERA_MOVE_INACTIVE;
        return;
    }

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

void vm_camera_set_pos(SCRIPT_CTX * THIS, INT16 idx, UBYTE after_lock_camera) OLDCALL __banked {
    cam_set_pos_t * params = VM_REF_TO_PTR(idx);

    // If locking to player only move in lock axis
    if (after_lock_camera & CAMERA_LOCK_FLAG) {
        if ((after_lock_camera & CAMERA_LOCK_X_FLAG)) {
            camera_x = params->X;
        }
        if ((after_lock_camera & CAMERA_LOCK_Y_FLAG)) {
            camera_y = params->Y;
        }
    } else {
        camera_x = params->X;
        camera_y = params->Y;
    }

    scroll_update();

    camera_settings |= (after_lock_camera & CAMERA_LOCK_FLAG);

    return;
}

// VM_INVOKE handler
UBYTE camera_shake_frames(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL __banked {
    if (start) *((SCRIPT_CTX *)THIS)->stack_ptr = sys_time;
    if (((UWORD)sys_time - *((SCRIPT_CTX *)THIS)->stack_ptr) < stack_frame[0]) {
        if (stack_frame[1] & CAMERA_SHAKE_X) {
            BYTE value = rand() & 0x0f;
            if (value > 10) value -= 10;
            scroll_offset_x = value - 5;
        }
        if (stack_frame[1] & CAMERA_SHAKE_Y) {
            BYTE value = rand() & 0x0f;
            if (value > 10) value -= 10;
            scroll_offset_y = value - 5;
        }
        ((SCRIPT_CTX *)THIS)->waitable = TRUE; 
        return FALSE;
    }
    scroll_offset_x = scroll_offset_y = 0; 
    return TRUE;
}
