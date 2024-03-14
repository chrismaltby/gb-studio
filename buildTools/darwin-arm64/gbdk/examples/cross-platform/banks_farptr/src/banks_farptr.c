#include <stdint.h>
#include <stdio.h>
#include <gbdk/platform.h>
#include <gbdk/far_ptr.h>

// functions from bank2code.c
BANKREF_EXTERN(some_bank2_proc0)
extern void some_bank2_proc0(void) BANKED;

BANKREF_EXTERN(some_bank2_proc1)
extern int some_bank2_proc1(uint8_t param1, uint8_t param2) BANKED;
typedef int (*some_bank2_proc_t)(uint8_t, uint8_t) BANKED; // define type for some_bank2_proc1() function

BANKREF_EXTERN(some_bank2_proc2)
extern int some_bank2_proc2(uint8_t param1, uint8_t param2, uint8_t param3) BANKED REENTRANT;

// far pointers
FAR_PTR farptr_var0, farptr_var1, farptr_var2, farptr_var3;

// result of a function call
int res;

void run(void) {
    // compose far pointer at runtime
    farptr_var0 = to_far_ptr(some_bank2_proc1, BANK(some_bank2_proc1));
    farptr_var1 = to_far_ptr(some_bank2_proc1, BANK(some_bank2_proc1));
    farptr_var2 = to_far_ptr(some_bank2_proc0, BANK(some_bank2_proc0));
    farptr_var2 = to_far_ptr(some_bank2_proc0, BANK(some_bank2_proc0));

    // output far pointers (must be identical)
    printf("FAR PTR0: %x:%x\n", (int)FAR_SEG(farptr_var0), (int)FAR_OFS(farptr_var0));
    printf("FAR PTR1: %x:%x\n", (int)FAR_SEG(farptr_var1), (int)FAR_OFS(farptr_var1));

    // try calling far function by far pointer without params
    FAR_CALL(farptr_var2, void (*)(void));

    // try calling far function directly
    res = some_bank2_proc1(100, 50);
    printf("CALL DIR: %d\n", res);

    // try calling reentrant far function directly
    res = some_bank2_proc2(100, 50, 1);
    printf("CALL DIR (RE): %d\n", res);

    // try calling far function by far pointer
#ifdef __PORT_mos6502
    // SDCC mos6502 port does not appear to handle cast to typedef:ed function type some_bank2_proc_t correctly.
    // Address of __call__banked incorrectly evaluates to zero. Needs further investigation.
    // As a work-around, supply the function type directly for now.
    res = FAR_CALL(farptr_var1, int (*)(uint8_t, uint8_t), 100, 50);
#else
    // For other targets, just use convenience typedef some_bank2_proc_t
    res = FAR_CALL(farptr_var1, some_bank2_proc_t, 100, 50);
#endif

    printf("CALL IND: %d\n", res);
}

void main(void) {
    ENABLE_RAM;
    printf("START (bank=%d)\n", (int)CURRENT_BANK);
    run();
    printf("DONE! (bank=%d)\n", (int)CURRENT_BANK);
}