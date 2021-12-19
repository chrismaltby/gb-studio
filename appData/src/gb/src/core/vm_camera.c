#pragma bank 2

#include <rand.h>

#include "vm.h"
#include "vm_camera.h"

#include "camera.h"
#include "scroll.h"
#include "game_time.h"

typedef struct cam_move_to_t {
    INT16 X, Y;
} cam_move_to_t;

typedef struct cam_set_pos_t {
    INT16 X, Y;
} cam_set_pos_t;

void vm_camera_move_to(SCRIPT_CTX * THIS, INT16 idx, UBYTE speed, UBYTE after_lock_camera) OLDCALL BANKED {

    // indicate waitable state of context
    THIS->waitable = 1;

    cam_move_to_t * params = VM_REF_TO_PTR(idx);

    // Disable camera lock
    camera_settings &= ~(CAMERA_LOCK_FLAG);

    // Actor reached destination
    if ((camera_x == params->X) && (camera_y == params->Y)) {
        camera_settings |= (after_lock_camera & CAMERA_LOCK_FLAG);
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

void vm_camera_set_pos(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    cam_set_pos_t * params = VM_REF_TO_PTR(idx);
    camera_x = params->X;
    camera_y = params->Y;

    // Disable camera lock
    camera_settings &= ~(CAMERA_LOCK_FLAG);

    scroll_update();
    return;
}

// VM_INVOKE handler
UBYTE camera_shake_frames(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
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
