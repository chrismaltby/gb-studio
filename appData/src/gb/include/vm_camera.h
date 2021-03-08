#ifndef _VM_CAMERA_H_INCLUDE
#define _VM_CAMERA_H_INCLUDE

#include "vm.h"

void vm_camera_move_to(SCRIPT_CTX * THIS, INT16 idx, UBYTE speed, UBYTE after_lock_camera) __banked;
void vm_camera_set_pos(SCRIPT_CTX * THIS, INT16 idx) __banked;

#endif
