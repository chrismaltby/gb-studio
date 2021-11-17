#include <stdint.h>
#include <stdio.h>
#include <gbdk/platform.h>
#include <gbdk/far_ptr.h>

// functions from bank2code.c
BANKREF_EXTERN(some_bank2_proc0)
extern void some_bank2_proc0() __banked;

BANKREF_EXTERN(some_bank2_proc1)
extern int some_bank2_proc1(int param1, int param2) __banked;
typedef int (*some_bank2_proc_t)(int, int) __banked; // define type for some_bank2_proc1() function

// far pointers
FAR_PTR farptr_var0, farptr_var1, farptr_var2;

// result of a function call
int res;

void run() {
    // compose far pointer at runtime
    farptr_var0 = to_far_ptr(some_bank2_proc1, BANK(some_bank2_proc1));
    farptr_var1 = to_far_ptr(some_bank2_proc1, BANK(some_bank2_proc1));
    farptr_var2 = to_far_ptr(some_bank2_proc0, BANK(some_bank2_proc0));

    // output far pointers (must be identical)
    printf("FAR PTR0: %x:%x\n", (int)FAR_SEG(farptr_var0), (int)FAR_OFS(farptr_var0));
    printf("FAR PTR1: %x:%x\n", (int)FAR_SEG(farptr_var1), (int)FAR_OFS(farptr_var1));

    // try calling far function by far pointer without params
    FAR_CALL(farptr_var2, void (*)(void));

    // try calling far function directly
    res = some_bank2_proc1(100, 50);
    printf("CALL DIR: %d\n", res);

    // try calling far function by far pointer
    res = FAR_CALL(farptr_var1, some_bank2_proc_t, 100, 50);

    printf("CALL IND: %d\n", res);
}

void main() {
    ENABLE_RAM;
    printf("START (bank=%d)\n", (int)CURRENT_BANK);
    run();
    printf("DONE! (bank=%d)\n", (int)CURRENT_BANK);
}