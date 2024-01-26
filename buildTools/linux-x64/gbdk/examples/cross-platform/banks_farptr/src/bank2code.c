#pragma bank 2

#include <gbdk/platform.h>
#include <stdint.h>
#include <stdio.h>

static int local_bank2_proc(int param1, int param2) {
    printf("  sum: %d (bank=%d)\n", param1 + param2, (int)CURRENT_BANK);
    return (param1 + param2) << 1;
}

BANKREF(some_bank2_proc0)
void some_bank2_proc0(void) BANKED {
    printf("some_bank2_proc0\n");
}

BANKREF(some_bank2_proc1)
int some_bank2_proc1(uint8_t param1, uint8_t param2) BANKED {
    printf("some_bank2_proc1\n");
    return local_bank2_proc(param1, param2);
}

BANKREF(some_bank2_proc2)
int some_bank2_proc2(uint8_t param1, uint8_t param2, uint8_t param3) BANKED REENTRANT {
    printf("some_bank2_proc2\n");
    return local_bank2_proc(param1, param2 * param3);
}
