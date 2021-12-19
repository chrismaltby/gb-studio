#ifndef _VM_SCENE_H_INCLUDE
#define _VM_SCENE_H_INCLUDE

#include <gb/gb.h>

#include "vm.h"

void vm_scene_push() OLDCALL BANKED;
void vm_scene_pop() OLDCALL BANKED;
void vm_scene_pop_all() OLDCALL BANKED;
void vm_scene_stack_reset() OLDCALL BANKED;

#endif