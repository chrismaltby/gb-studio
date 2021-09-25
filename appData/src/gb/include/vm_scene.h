#ifndef _VM_SCENE_H_INCLUDE
#define _VM_SCENE_H_INCLUDE

#include <gb/gb.h>

#include "vm.h"

void vm_scene_push() OLDCALL __banked;
void vm_scene_pop() OLDCALL __banked;
void vm_scene_pop_all() OLDCALL __banked;
void vm_scene_stack_reset() OLDCALL __banked;

#endif