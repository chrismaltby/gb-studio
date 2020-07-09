#pragma bank 1

#include <stdio.h>

extern unsigned char _current_bank;

int local_bank1_proc(int param1, int param2) {
    printf("  sum: %d (bank=%d)\n", param1 + param2, (int)_current_bank);
    return (param1 + param2) << 1;
}

void some_bank1_proc0() __banked {
    printf("some_bank1_proc0\n");
}

int some_bank1_proc1(int param1, int param2) __banked {
    printf("some_bank1_proc1\n");
    return local_bank1_proc(param1, param2);
}
