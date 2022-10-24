#ifndef _VM_GBPRINTER_H_INCLUDE
#define _VM_GBPRINTER_H_INCLUDE

#include <gb/gb.h>

#include "vm.h"

BANKREF_EXTERN(VM_GBPRINTER)

void vm_print_detect(SCRIPT_CTX * THIS, INT16 idx, UBYTE delay) OLDCALL BANKED;
void vm_print_overlay(SCRIPT_CTX * THIS, INT16 idx, UBYTE start, UBYTE height, UBYTE margins) OLDCALL BANKED;

#endif