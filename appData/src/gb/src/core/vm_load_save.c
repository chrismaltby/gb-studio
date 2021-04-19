#pragma bank 2

#include "vm.h"

#include "load_save.h"

void vm_save_clear(SCRIPT_CTX * THIS, UBYTE slot) __banked {
    data_clear(slot);
}

void vm_save_peek(SCRIPT_CTX * THIS, INT16 idxA, INT16 idxB, INT16 idxC, UBYTE count, UBYTE slot) __banked {
    INT16 * res, * dest;
    if (idxA < 0) res = THIS->stack_ptr + idxA; else res = script_memory + idxA;    // result of the operation
    if (idxB < 0) dest = THIS->stack_ptr + idxB; else dest = script_memory + idxB;  // destination for data being peeked
    if (idxC < 0) idxC = 0;                                                         // source of peek in save slot (global)
    *res = data_peek(slot, idxC, count, dest);
}
