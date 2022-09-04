#pragma bank 255

#include "vm.h"
#include "vm_exceptions.h"

#include "vm_scene.h"

#include "actor.h"
#include "bankdata.h"
#include "data_manager.h"

BANKREF(VM_SCENE)

void vm_scene_push() OLDCALL BANKED {
    scene_stack_ptr->scene = current_scene;
    scene_stack_ptr->pos = PLAYER.pos;
    scene_stack_ptr->dir = PLAYER.dir;
    scene_stack_ptr++;
}

static void raise_change_scene_exception() {
    vm_exception_code = EXCEPTION_CHANGE_SCENE;
    vm_exception_params_length = sizeof(far_ptr_t);
    vm_exception_params_bank = 1; // any bank
    vm_exception_params_offset = &scene_stack_ptr->scene;
    PLAYER.pos = scene_stack_ptr->pos;
    PLAYER.dir = scene_stack_ptr->dir;
}

void vm_scene_pop() OLDCALL BANKED {
    scene_stack_ptr--;
    raise_change_scene_exception();
}

void vm_scene_pop_all() OLDCALL BANKED {
    scene_stack_ptr = scene_stack;
    raise_change_scene_exception();
}

void vm_scene_stack_reset() OLDCALL BANKED {
    scene_stack_ptr = scene_stack;
}
