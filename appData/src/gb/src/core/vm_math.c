#pragma bank 2

#include "vm_math.h"

#include "vm.h"

#include "math.h"

void vm_sin_scale(SCRIPT_CTX * THIS, INT16 idx, INT16 idx_angle, UBYTE accuracy) __banked {
    INT16 * res, * angle;
    if (idx < 0) res = THIS->stack_ptr + idx; else res = script_memory + idx;
    if (idx_angle < 0) angle = THIS->stack_ptr + idx_angle; else angle = script_memory + idx_angle;
    *res = (*res * (SIN(*angle) >> (7 - accuracy))) >> accuracy;
}

void vm_cos_scale(SCRIPT_CTX * THIS, INT16 idx, INT16 idx_angle, UBYTE accuracy) __banked {
    INT16 * res, * angle;
    if (idx < 0) res = THIS->stack_ptr + idx; else res = script_memory + idx;
    if (idx_angle < 0) angle = THIS->stack_ptr + idx_angle; else angle = script_memory + idx_angle;
    *res = (*res * (COS(*angle) >> (7 - accuracy))) >> accuracy;
}
