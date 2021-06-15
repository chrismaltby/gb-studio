#include <gb/gb.h>
#include <stdint.h>
#include <gb/far_ptr.h>

#include <stdio.h>

typedef int (*some_bank2_proc_t)(int, int) __banked;

// functions from bank2code.c
#define bank2code_bank 2
extern void some_bank2_proc0() __banked;
extern int some_bank2_proc1(int param1, int param2) __banked;

// compose far pointer at compile time
FAR_PTR farptr_var0 = TO_FAR_PTR(&some_bank2_proc1, bank2code_bank);
FAR_PTR farptr_var2 = TO_FAR_PTR(&some_bank2_proc0, bank2code_bank);

// another far pointer
FAR_PTR farptr_var1;

// result of a function call
int res;

void run() {
    // compose far pointer in runtime
    farptr_var1 = to_far_ptr(&some_bank2_proc1, bank2code_bank);

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
    ENABLE_RAM_MBC1;
    printf("START (bank=%d)\n", (int)_current_bank);
    run();
    printf("DONE! (bank=%d)\n", (int)_current_bank);
}