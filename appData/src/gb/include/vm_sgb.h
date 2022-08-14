#ifndef _VM_SGB_H_INCLUDE
#define _VM_SGB_H_INCLUDE

#include <gb/gb.h>
#include <gb/sgb.h>

#include "vm.h"

BANKREF_EXTERN(VM_SGB)

void vm_sgb_transfer(DUMMY0_t dummy0, DUMMY1_t dummy1, SCRIPT_CTX * THIS) OLDCALL NONBANKED;

#endif