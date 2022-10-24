#ifndef _VM_PROJECTILES_H_INCLUDE
#define _VM_PROJECTILES_H_INCLUDE

#include "vm.h"
#include "gbs_types.h"

BANKREF_EXTERN(VM_PROJECTILE)

void vm_projectile_launch(SCRIPT_CTX * THIS, UBYTE type, INT16 idx) OLDCALL BANKED;
void vm_projectile_load_type(SCRIPT_CTX * THIS, UBYTE type, UBYTE projectile_def_bank, const projectile_def_t * projectile_def) OLDCALL BANKED;

#endif