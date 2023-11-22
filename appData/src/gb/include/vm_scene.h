#ifndef _VM_SCENE_H_INCLUDE
#define _VM_SCENE_H_INCLUDE

#include <gbdk/platform.h>

#include "vm.h"

BANKREF_EXTERN(VM_SCENE)

void vm_scene_push(void) OLDCALL BANKED;
void vm_scene_pop(void) OLDCALL BANKED;
void vm_scene_pop_all(void) OLDCALL BANKED;
void vm_scene_stack_reset(void) OLDCALL BANKED;

#endif