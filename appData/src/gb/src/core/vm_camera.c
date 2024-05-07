#pragma bank 255

#include <rand.h>

#include "vm.h"
#include "vm_camera.h"

#include "camera.h"
#include "scroll.h"
#include "game_time.h"

BANKREF(VM_CAMERA)

typedef struct camera_position_t {
    INT16 X, Y;
} camera_position_t;

void vm_camera_move_to(SCRIPT_CTX * THIS, INT16 idx, UBYTE speed, UBYTE after_lock_camera) OLDCALL BANKED {

    // indicate waitable state of context
    THIS->waitable = 1;

    camera_position_t * params = VM_REF_TO_PTR(idx);

    // Disable camera lock
    camera_settings &= ~(CAMERA_LOCK_FLAG);

    // Actor reached destination
    if ((camera_x == params->X) && (camera_y == params->Y)) {
        camera_settings |= (after_lock_camera & CAMERA_LOCK_FLAG);
        return;
    }

    // Move camera towards destination
    UBYTE x_dest = FALSE;
    if (camera_x > params->X) {
        // Move left
        camera_x -= speed;
        if (camera_x <= params->X) {
            camera_x = params->X;
            x_dest = TRUE;
        }
    } else if (camera_x < params->X) {
        // Move right
        camera_x += speed;
        if (camera_x >= params->X) {
            camera_x = params->X;
            x_dest = TRUE;
        }        
    }

    if (camera_y > params->Y) {
        // Move up
        camera_y -= speed;
        if (camera_y <= params->Y) {
            camera_y = params->Y;
            if (x_dest) {
                return;
            }
        }        
    } else if (camera_y < params->Y) {
        // Move down
        camera_y += speed;
        if (camera_y >= params->Y) {
            camera_y = params->Y;
            if (x_dest) {
                return;
            }
        }      
    }

    THIS->PC -= (INSTRUCTION_SIZE + sizeof(idx) + sizeof(speed) + sizeof(after_lock_camera));
    return;
}

void vm_camera_set_pos(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    camera_position_t * params = VM_REF_TO_PTR(idx);
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
            scroll_offset_x = ((rand() * ((stack_frame[2] << 1) + 1)) >> 8) - stack_frame[2];
        }
        if (stack_frame[1] & CAMERA_SHAKE_Y) {
            scroll_offset_y = ((rand() * ((stack_frame[2] << 1) + 1)) >> 8) - stack_frame[2];
        }
        ((SCRIPT_CTX *)THIS)->waitable = TRUE;
        return FALSE;
    }
    scroll_offset_x = scroll_offset_y = 0;
    return TRUE;
}
