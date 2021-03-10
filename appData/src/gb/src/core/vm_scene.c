#pragma bank 2

#include "vm.h"
#include "vm_exceptions.h"
#include "actor.h"
#include "bankdata.h"
#include "data_manager.h"

void vm_scene_push() __banked {
    scene_stack_ptr->scene = current_scene;
    scene_stack_ptr->pos = PLAYER.pos;
    scene_stack_ptr->dir = PLAYER.dir;
    scene_stack_ptr++; 
}

void vm_scene_pop() __banked {
    vm_exception_code = EXCEPTION_CHANGE_SCENE;
    vm_exception_params_length = sizeof(far_ptr_t);
    scene_stack_ptr--;
    vm_exception_params_bank = 1; // any bank
    vm_exception_params_offset = &scene_stack_ptr->scene;
    PLAYER.pos = scene_stack_ptr->pos;
    PLAYER.dir = scene_stack_ptr->dir;
}
