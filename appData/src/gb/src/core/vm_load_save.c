#pragma bank 255

#include "vm.h"

#include "load_save.h"

BANKREF(VM_LOAD_SAVE)

void vm_save_clear(SCRIPT_CTX * THIS, UBYTE slot) OLDCALL BANKED {
    THIS;
    data_clear(slot);
}

void vm_save_peek(SCRIPT_CTX * THIS, INT16 idxA, INT16 idxB, INT16 idxC, UWORD count, UBYTE slot) OLDCALL BANKED {
    INT16 * res = VM_REF_TO_PTR(idxA);      // result of the operation
    INT16 * dest = VM_REF_TO_PTR(idxB);     // destination for data being peeked
    if (idxC < 0) idxC = 0;                 // source of peek in save slot (global)
    *res = data_peek(slot, idxC, count, dest);
}
