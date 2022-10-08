#pragma bank 255

#include "vm_math.h"

#include "vm.h"

#include "math.h"

BANKREF(VM_MATH)

void vm_sin_scale(SCRIPT_CTX * THIS, INT16 idx, INT16 idx_angle, UBYTE accuracy) OLDCALL BANKED {
    INT16 * res = VM_REF_TO_PTR(idx);
    INT16 * angle = VM_REF_TO_PTR(idx_angle);
    *res = (*res * (SIN(*angle) >> (7 - accuracy))) >> accuracy;
}

void vm_cos_scale(SCRIPT_CTX * THIS, INT16 idx, INT16 idx_angle, UBYTE accuracy) OLDCALL BANKED {
    INT16 * res = VM_REF_TO_PTR(idx);
    INT16 * angle = VM_REF_TO_PTR(idx_angle);
    *res = (*res * (COS(*angle) >> (7 - accuracy))) >> accuracy;
}
