#pragma bank 2

#include "vm_math.h"

#include "vm.h"

#include "rtc.h"

void vm_rtc_latch() __banked {
    RTC_LATCH();
}

void vm_rtc_get(SCRIPT_CTX * THIS, INT16 idx, UBYTE what) __banked {
    INT16 * res;
    if (idx < 0) res = THIS->stack_ptr + idx; else res = script_memory + idx;
    *res = RTC_GET((rtc_dateparts_e)((what & 0x03) + RTC_VALUE_SEC));
}

void vm_rtc_set(SCRIPT_CTX * THIS, INT16 idx, UBYTE what) __banked {
    INT16 * res;
    if (idx < 0) res = THIS->stack_ptr + idx; else res = script_memory + idx;
    RTC_SET((rtc_dateparts_e)((what & 0x03) + RTC_VALUE_SEC), (UWORD)*res);
}

void vm_rtc_start(SCRIPT_CTX * THIS, UBYTE start) __banked {
    THIS;
    RTC_START(start);
}
