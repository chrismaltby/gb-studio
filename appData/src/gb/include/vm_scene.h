#ifndef _VM_SCENE_H_INCLUDE
#define _VM_SCENE_H_INCLUDE

#include <gb/gb.h>

#include "vm.h"

BANKREF_EXTERN(VM_SCENE)

void vm_scene_push() OLDCALL BANKED;
void vm_scene_pop() OLDCALL BANKED;
void vm_scene_pop_all() OLDCALL BANKED;
void vm_scene_stack_reset() OLDCALL BANKED;

#endif