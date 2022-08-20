#pragma bank 255

#include "vm_rtc.h"

#include "vm.h"

#include "rtc.h"

BANKREF(VM_RTC)

void vm_rtc_latch() OLDCALL BANKED {
    RTC_LATCH();
}

void vm_rtc_get(SCRIPT_CTX * THIS, INT16 idx, UBYTE what) OLDCALL BANKED {
    INT16 * res = VM_REF_TO_PTR(idx);
    *res = RTC_GET((rtc_dateparts_e)((what & 0x03) + RTC_VALUE_SEC));
}

void vm_rtc_set(SCRIPT_CTX * THIS, INT16 idx, UBYTE what) OLDCALL BANKED {
    INT16 * res = VM_REF_TO_PTR(idx);
    RTC_SET((rtc_dateparts_e)((what & 0x03) + RTC_VALUE_SEC), (UWORD)*res);
}

void vm_rtc_start(SCRIPT_CTX * THIS, UBYTE start) OLDCALL BANKED {
    THIS;
    RTC_START(start);
}
