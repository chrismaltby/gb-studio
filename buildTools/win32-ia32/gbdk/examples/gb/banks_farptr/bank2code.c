#pragma bank 2

#include <gb/gb.h>
#include <stdio.h>

int local_bank2_proc(int param1, int param2) {
    printf("  sum: %d (bank=%d)\n", param1 + param2, (int)_current_bank);
    return (param1 + param2) << 1;
}

void some_bank2_proc0() __banked {
    printf("some_bank2_proc0\n");
}

int some_bank2_proc1(int param1, int param2) __banked {
    printf("some_bank2_proc1\n");
    return local_bank2_proc(param1, param2);
}
